#!/usr/bin/env python3
"""AgentFlow 统一后端 — 异步执行引擎 + ThreadingHTTPServer + SQLite 持久化"""
import http.server
import json
import os
import shutil
import sys
import tempfile
import threading
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from queue import Queue
from urllib.parse import urlparse

from agent_runner import AgentRunner
from agentflow_schema import (
    NodeDef,
    WorkflowJSON,
    validate_workflow,
)
from artifact_broker import get_broker
from prompt_compiler import PromptCompiler
from provider_registry import get_registry
from run_event_bus import RunEventBus
from evolution_engine import EvolutionEngine
from run_store import extract_json, get_store, startup_scan
from supervisor import Supervisor
from upgrade_gate import ProposalExecutor, UpgradeGate
from template_promoter import TemplatePromoter
from evolution_ledger import EvolutionLedger

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 9600
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(SCRIPT_DIR, "frontend")
STATIC_DIR = os.environ.get("AGENTFLOW_STATIC_DIR",
    FRONTEND_DIR if os.path.isfile(os.path.join(FRONTEND_DIR, "index.html"))
    else SCRIPT_DIR)
TEMPLATE_DIR = os.environ.get("AGENTFLOW_TEMPLATE_DIR",
    os.path.join(STATIC_DIR, "templates") if os.path.isdir(os.path.join(STATIC_DIR, "templates"))
    else os.path.join(SCRIPT_DIR, "templates"))
DEFAULT_AGENT_MODEL = os.environ.get("AGENT_MODEL", "deepseek-v4-flash")

# 服务监听地址
HOST = os.environ.get("AGENTFLOW_HOST", "127.0.0.1")

# 全局并发控制
MAX_CONCURRENT_AGENTS = int(os.environ.get("AGENTFLOW_MAX_CONCURRENT", "10"))
MAX_BODY_SIZE = int(os.environ.get("AGENTFLOW_MAX_BODY_SIZE", str(512 * 1024)))
_global_semaphore = threading.Semaphore(MAX_CONCURRENT_AGENTS)

# API 鉴权
AGENTFLOW_API_TOKEN = os.environ.get("AGENTFLOW_API_TOKEN", "")

# ── 静态文件安全白名单 ──────────────────────────────
SAFE_EXTENSIONS = frozenset({
    ".html", ".js", ".css", ".png", ".jpg", ".jpeg",
    ".svg", ".json", ".ico", ".txt", ".md", ".pdf",
    ".webp", ".gif", ".woff", ".woff2",
})

# ── 后台执行引擎 ────────────────────────────────────
_executor_queue: Queue = Queue()
_store = get_store()
_supervisor = Supervisor()
_event_bus = RunEventBus()
_evolution_engine = EvolutionEngine(store=_store)
_upgrade_gate = UpgradeGate(
    executor=ProposalExecutor(template_dir=TEMPLATE_DIR),
)
_template_promoter = TemplatePromoter(template_dir=TEMPLATE_DIR)
_evolution_ledger = EvolutionLedger(
    data_dir=os.path.join(SCRIPT_DIR, ".agentflow", "evolution")
)


def _publish_event(run_id, event_type, node_id=None, tool_call_id=None, payload=None):
    """发布事件到事件总线并持久化到 Store。

    Trace persistence is part of the closed-loop control surface. If it fails,
    fail loudly instead of silently losing evidence that self-evolution depends on.
    """
    ev = _event_bus.publish(run_id, event_type, node_id=node_id,
                            tool_call_id=tool_call_id, payload=payload)
    try:
        _store.append_event(ev)
    except Exception as exc:
        print(
            f"[RunEventPersistence] failed run={run_id} type={event_type}: {exc}",
            file=sys.stderr,
        )
        traceback.print_exc(file=sys.stderr)
        raise
    return ev


def _run_workspace(run_id: str) -> str:
    """Return durable per-run workspace path. Never use ephemeral /tmp for run artifacts."""
    path = os.path.join(SCRIPT_DIR, ".agentflow", "workspaces", run_id)
    os.makedirs(path, exist_ok=True)
    return path


def _copy_tree_contents(src: str, dst: str):
    """Copy all files/dirs from src into dst, skipping recursive input folders."""
    if not os.path.isdir(src):
        return
    os.makedirs(dst, exist_ok=True)
    for name in os.listdir(src):
        if name == "input":
            continue
        s = os.path.join(src, name)
        d = os.path.join(dst, name)
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
        elif os.path.isfile(s):
            os.makedirs(os.path.dirname(d), exist_ok=True)
            shutil.copy2(s, d)


def _materialize_upstream_artifacts(store, run_id: str, node_id: str, run_workspace: str, node_dir: str):
    """Materialize upstream node files into the current node workspace.

    Downstream agents receive both an exact namespaced copy under input/<upstream_id>/
    and a merged working-copy overlay at the node root, so they can extend prior code
    instead of recreating it from textual summaries.
    """
    for upstream_id in store.get_upstream(run_id, node_id):
        upstream_dir = os.path.join(run_workspace, f"node_{upstream_id}")
        _copy_tree_contents(upstream_dir, os.path.join(node_dir, "input", f"node_{upstream_id}"))
        _copy_tree_contents(upstream_dir, node_dir)


def _publish_node_artifacts(run_id: str, node_id: str, node_dir: str):
    """Persist a manifest of files produced by a node for inspection and downstream use."""
    manifest = []
    for root, dirs, files in os.walk(node_dir):
        dirs[:] = [d for d in dirs if d != "__pycache__"]
        for fname in files:
            if fname.endswith((".pyc", ".pyo")):
                continue
            fp = os.path.join(root, fname)
            rel = os.path.relpath(fp, node_dir)
            try:
                manifest.append({"path": rel, "size": os.path.getsize(fp)})
            except OSError:
                continue
    _publish_event(run_id, "artifact_manifest", node_id=node_id,
                   payload={"workspace": node_dir, "files": sorted(manifest, key=lambda x: x["path"])})
    return manifest


def _background_worker():
    """后台工作线程：消费队列里的 run_id，异步执行 DAG。"""
    # 启动时扫描残留状态
    try:
        scan_result = startup_scan()
        if scan_result["pending_resumed"]:
            print(f"[StartupScan] 发现 {len(scan_result['pending_resumed'])} 个 pending run",
                  file=sys.stderr)
            for rid in scan_result["pending_resumed"]:
                _executor_queue.put(rid)
        if scan_result["stale_marked"]:
            print(f"[StartupScan] 标记 {len(scan_result['stale_marked'])} 个 stale run 为 failed",
                  file=sys.stderr)
    except Exception as e:
        print(f"[StartupScan] 异常: {e}", file=sys.stderr)

    while True:
        run_id = _executor_queue.get()
        try:
            _execute_run(run_id)
        except Exception as e:
            _store.update_run_status(run_id, "failed", str(e)[:500])
            print(f"[BackgroundWorker] Run {run_id} failed: {e}", file=sys.stderr)
        finally:
            _executor_queue.task_done()


def _execute_run(run_id: str):
    """执行一个 run 的完整 DAG（在后台线程中运行）。"""
    run = _store.get_run(run_id)
    if not run:
        return
    store = _store
    store.update_run_status(run_id, "running")
    _publish_event(run_id, "run_start", payload={"requirement": run.get("requirement", "")[:200]})

    # 构建 NodeDef 列表
    nodes_data = run["nodes"]
    node_map = {n["node_id"]: n for n in nodes_data}
    node_defs = []
    for n in nodes_data:
        nd = NodeDef(
            id=n["node_id"],
            icon=n.get("icon", ""),
            label=n.get("label", ""),
            desc=n.get("description", ""),
            color=n.get("color", ""),
            profile=n.get("profile", "dev"),
            params=n.get("params", {}) or {},
        )
        node_defs.append(nd)

    requirement = run["requirement"]
    edges_real = store.get_run_edges(run_id)
    work_dir = _run_workspace(run_id)
    store.set_run_workspace(run_id, work_dir)
    compiler = PromptCompiler(TEMPLATE_DIR)
    broker = get_broker()
    total_cost = 0.0
    total_dur = 0.0
    upstream_summaries: dict[str, str] = {}

    # 为 ArtifactBroker 注入下游关系缓存
    for n in nodes_data:
        nid = n["node_id"]
        downstream_ids = set(store.get_dependents(run_id, nid))
        broker.set_downstream_cache(run_id, nid, downstream_ids)

    try:
        dag_version = store.get_dag_version(run_id)
        while not store.all_nodes_done(run_id):
            # 检查 DAG 版本变更 → 刷新 ready 列表 + 重建 node_map
            current_dag_version = store.get_dag_version(run_id)
            if current_dag_version > dag_version:
                dag_version = current_dag_version
                # Bug #1 FIX: rebuild node_map and edges when DAG mutates
                fresh_run = store.get_run(run_id) or {}
                nodes_data = fresh_run.get("nodes", nodes_data)
                node_map = {n["node_id"]: n for n in nodes_data}
                node_defs = []
                for n in nodes_data:
                    nd = NodeDef(
                        id=n["node_id"],
                        icon=n.get("icon", ""),
                        label=n.get("label", ""),
                        desc=n.get("description", ""),
                        color=n.get("color", ""),
                        profile=n.get("profile", "dev"),
                        params=n.get("params", {}) or {},
                    )
                    node_defs.append(nd)
                edges_real = store.get_run_edges(run_id)
                for n in nodes_data:
                    nid = n["node_id"]
                    downstream_ids = set(store.get_dependents(run_id, nid))
                    broker.set_downstream_cache(run_id, nid, downstream_ids)
                _publish_event(run_id, "dag_mutation",
                    payload={"dag_version": dag_version, "message": "DAG 已被 Agent 动态调整，重新评估 ready 节点"})
                continue  # 重新进入 while 循环，刷新 ready

            ready = store.get_pending_nodes(run_id)
            if not ready:
                # 检查是否有 failed/skipped 节点需要跳过其下游
                has_failure = store.count_status(run_id).get("failed", 0) > 0
                if not has_failure:
                    has_failure = store.count_status(run_id).get("skipped", 0) > 0
                if has_failure:
                    # 递归标记所有 downstream 为 skipped
                    changed = True
                    while changed:
                        changed = False
                        current_nodes = store.get_run(run_id).get("nodes", [])
                        for n in current_nodes:
                            if n.get("status") == "pending":
                                upstream_ids = store.get_upstream(run_id, n["node_id"])
                                if upstream_ids:
                                    for uid in upstream_ids:
                                        un = next((nn for nn in current_nodes
                                                    if nn["node_id"] == uid), None)
                                        if un and un.get("status") in ("failed", "skipped"):
                                            store.update_node(run_id, n["node_id"],
                                                status="skipped",
                                                result=f"上游节点 {uid} {un['status']}，跳过")
                                            changed = True
                                            break
                    # 再检查一次
                    ready = store.get_pending_nodes(run_id)
                if not ready:
                    counts_now = store.count_status(run_id)
                    if counts_now.get("pending", 0) > 0 or counts_now.get("running", 0) > 0:
                        _fail_unready_pending_nodes(
                            store,
                            run_id,
                            "no ready nodes while workflow still has unfinished nodes",
                        )
                    break  # 死锁或全部完成

            # P0 修复：ready 节点按确定性顺序串行执行。
            # 原 ThreadPoolExecutor 会让同层 dev/test/doc 节点同时物化/写入 workspace，
            # 在真实 app 生成任务里造成 workspace/event 串扰。先牺牲并发换取可验证闭环；
            # 后续可在 RunStore + ArtifactBroker 加 per-node isolation lock 后再恢复并发。
            for rn in sorted(ready, key=lambda n: str(n.get("node_id", ""))):
                nid = rn["node_id"]
                nd = node_map.get(nid)
                if not nd:
                    continue
                node_dir = os.path.join(work_dir, f"node_{nid}")
                os.makedirs(node_dir, exist_ok=True)
                _materialize_upstream_artifacts(store, run_id, nid, work_dir, node_dir)

                # 标记节点为运行中
                store.update_node(run_id, nid, status="running")
                _publish_event(run_id, "node_start",
                    node_id=nid,
                    payload={
                        "label": nd.get("label", ""),
                        "profile": nd.get("profile", "dev"),
                    })

                # 编译当前节点的任务
                from agentflow_schema import EdgeDef
                edge_objs = [EdgeDef(source=str(e.get("source","")), target=str(e.get("target","")))
                             for e in edges_real]
                wf = WorkflowJSON(
                    workflow_id=run_id,
                    name=requirement[:100],
                    global_context={
                        "goal": requirement,
                        "language": "zh-CN",
                        "constraints": [],
                    },
                    nodes=node_defs,
                    edges=edge_objs,
                )
                layer_tasks = compiler.compile(wf, upstream_results=upstream_summaries)
                task = next((t for t in layer_tasks if t.node_id == nid), None)
                if not task:
                    continue
                current_run_for_params = store.get_run(run_id) or {}
                current_node_for_params = next(
                    (x for x in current_run_for_params.get("nodes", []) if x.get("node_id") == nid),
                    node_map.get(nid) or {},
                )
                node_params = current_node_for_params.get("params", {}) or {}
                task.prompt = _append_feedback_to_prompt(task.prompt, node_params)
                # 合并 agent_type 和 max_budget 到 node_row 中（给 CC Agent Runner 使用）
                rn["agent_type"] = node_params.get("agent_type", "standard")
                rn["max_budget"] = node_params.get("max_budget", 0.5)

                try:
                    result = _execute_one_node(rn, task, node_dir, DEFAULT_AGENT_MODEL, run_id)
                except Exception as e:
                    result = {
                        "status": "error",
                        "result": f"执行异常: {e}",
                        "cost": 0, "duration_ms": 0, "turns": 0,
                        "model": DEFAULT_AGENT_MODEL, "provider": "",
                    }

                # QualityGate 检查 + Retry
                from quality_gate import QualityGate
                qgate = QualityGate()
                max_attempts = 2
                attempt = 0
                while True:
                    attempt += 1
                    status_raw = result.get("status", "error")
                    status = "completed" if status_raw == "ok" else \
                             "failed" if status_raw in ("error", "timeout") else \
                             status_raw

                    # 质量门控
                    _publish_event(run_id, "quality_start",
                        node_id=nid,
                        payload={"attempt": attempt, "max_attempts": max_attempts})
                    current_run_for_gate = store.get_run(run_id) or {}
                    current_node_for_gate = next(
                        (x for x in current_run_for_gate.get("nodes", []) if x.get("node_id") == nid),
                        node_map.get(nid) or {},
                    )
                    node_params = current_node_for_gate.get("params", {}) or {}
                    qr = qgate.evaluate(
                        result,
                        task=node_params,
                        node_dir=node_dir,
                        expected_files=node_params.get("expected_files", []),
                        validation_commands=node_params.get("validation_commands", []),
                    )
                    if qr.passed:
                        _publish_event(run_id, "quality_pass",
                            node_id=nid,
                            payload={"score": qr.score, "reason": qr.reason,
                                     "checks": qr.checks})
                        break

                    _publish_event(run_id, "quality_fail",
                        node_id=nid,
                        payload={"score": qr.score, "reason": qr.reason,
                                 "checks": qr.checks, "attempt": attempt})
                    if attempt >= max_attempts or not qr.retryable:
                        break

                    # Retry
                    _publish_event(run_id, "retry_scheduled",
                        node_id=nid,
                        payload={"attempt": attempt, "reason": qr.reason})
                    store.update_node(run_id, nid, status="pending", attempt=attempt)
                    repair_task = _build_repair_task(task, qr.reason, qr.checks, node_dir)
                    result = _execute_one_node(
                        {"node_id": nid, "profile": (node_map.get(nid) or {}).get("profile", "dev"), "model": DEFAULT_AGENT_MODEL},
                        repair_task, node_dir, DEFAULT_AGENT_MODEL, run_id
                    )
                    print(f"[AsyncExec] Node {nid} retry {attempt}/{max_attempts}: {qr.reason}",
                          file=sys.stderr)

                cost = result.get("cost", 0)
                dur = result.get("duration_ms", 0)
                if not qr.passed:
                    loop_scheduled = _schedule_feedback_loop(
                        store=store,
                        run_id=run_id,
                        source_node_id=nid,
                        source_params=node_params,
                        quality_reason=qr.reason,
                        checks=qr.checks,
                    )
                    if loop_scheduled:
                        upstream_summaries.pop(nid, None)
                        print(f"[AsyncExec] Node {nid}: workflow feedback loop scheduled -> {node_params.get('loop_to')}",
                              file=sys.stderr)
                        continue
                    status = "failed"
                    result["error"] = qr.reason
                    if not result.get("result"):
                        result["result"] = qr.reason
                total_cost += cost
                total_dur += dur

                store.update_node(run_id, nid,
                    status=status,
                    result=result.get("result", "")[:5000],
                    output=result.get("output", "")[:20000],
                    cost=cost,
                    duration_ms=dur,
                    turns=result.get("turns", 0),
                    model=result.get("model", DEFAULT_AGENT_MODEL),
                    provider=result.get("provider", ""),
                    error=result.get("error", ""),
                )

                _publish_event(run_id,
                    "node_complete" if status == "completed" else "node_failed",
                    node_id=nid,
                    payload={
                        "status": status,
                        "cost": cost,
                        "duration_ms": dur,
                        "turns": result.get("turns", 0),
                        "result": result.get("result", "")[:500],
                    })

                _publish_node_artifacts(run_id, nid, node_dir)

                # 通过 ArtifactBroker 发布产物
                # Bug #20 FIX: use os.path.dirname instead of fragile str.replace
                output_dir = os.path.dirname(store.envelopes_dir(run_id))
                os.makedirs(output_dir, exist_ok=True)
                full_output = result.get("output", "") or result.get("result", "")
                output_path = os.path.join(output_dir, f"{nid}.txt")
                with open(output_path, "w", encoding="utf-8") as f:
                    f.write(full_output)

                # 发布 artifact（受控引用替代直接文件路径）
                try:
                    art_ref = broker.publish(
                        source_run=run_id, source_node=nid,
                        file_path=output_path,
                        name=f"{nid}.txt",
                        mime_type="text/plain",
                    )
                    summary = (full_output[:500] + "...") if len(full_output) > 500 else full_output
                    upstream_summaries[nid] = json.dumps({
                        "summary": summary,
                        "artifact": art_ref.to_dict(),
                    }, ensure_ascii=False)
                except Exception:
                    # fallback: 仍用文件路径
                    summary = (full_output[:500] + "...") if len(full_output) > 500 else full_output
                    upstream_summaries[nid] = json.dumps({
                        "summary": summary,
                        "artifact": output_path,
                    }, ensure_ascii=False)

                # 失败传播
                if status == "failed":
                    deps = store.get_dependents(run_id, nid)
                    for dep_id in deps:
                        store.update_node(run_id, dep_id,
                            status="skipped",
                            result=f"上游节点 {nid} 失败 ({status})，跳过")

                print(f"[AsyncExec] Node {nid}: {status} ${cost:.6f} {dur}ms",
                      file=sys.stderr)

                # 检查 DAG 是否被 Agent 在运行中修改过
                if store.get_dag_version(run_id) > dag_version:
                    dag_version = store.get_dag_version(run_id)
                    print(f"[AsyncExec] DAG version bumped to {dag_version} — re-evaluating", file=sys.stderr)
                    break  # 跳出 for 循环，外层 while 重新准备 ready
        # 结算
        final_status = "completed"
        counts = store.count_status(run_id)
        if counts.get("failed", 0) > 0 or counts.get("timed_out", 0) > 0:
            final_status = "failed"
        # Bug #14 FIX: detect orphaned running/pending nodes
        elif counts.get("running", 0) > 0 or counts.get("pending", 0) > 0:
            final_status = "failed"
        store.update_run_totals(run_id, total_cost, total_dur)
        store.update_run_status(run_id, final_status)
        _publish_event(run_id,
            "run_done" if final_status == "completed" else "run_failed",
            payload={"status": final_status, "total_cost": total_cost, "total_dur": total_dur})

        # Phase 2A: Auto-trigger evolution analysis on failed runs
        if final_status != "completed":
            try:
                _run_evolution_analysis(run_id)
            except Exception as ev_err:
                print(f"[Evolution] Auto-analysis failed for {run_id}: {ev_err}", file=sys.stderr)

    except Exception as e:
        store.update_run_status(run_id, "failed", str(e)[:500])
        print(f"[AsyncExec] Run {run_id} error: {e}", file=sys.stderr)


def _run_evolution_analysis(run_id: str) -> dict:
    """Run evolution analysis on a completed/failed run and persist the report.

    Returns the evolution report dict. Called automatically after run failure
    and can be triggered manually via POST /api/runs/{rid}/evolve.
    """
    report = _evolution_engine.analyze_run(run_id)
    report_dict = report.to_dict()
    version = _store.save_evolution_report(run_id, report_dict)
    report_dict["_version"] = version
    _publish_event(run_id, "evolution_analysis",
        payload={"version": version,
                 "attribution_count": len(report_dict.get("attributions", [])),
                 "proposal_count": len(report_dict.get("proposals", []))})
    # Record to cross-run ledger
    try:
        _evolution_ledger.record_analysis(run_id, report_dict)
    except Exception:
        pass
    print(f"[Evolution] Run {run_id}: {len(report_dict.get('attributions', []))} attributions, "
          f"{len(report_dict.get('proposals', []))} proposals (v{version})", file=sys.stderr)
    return report_dict


def _fail_unready_pending_nodes(store, run_id: str, reason: str) -> bool:
    """Fail pending nodes when the scheduler cannot make progress.

    A closed-loop workflow must have a hard stopping condition. If no node is
    ready but some nodes remain pending (for example after loop saturation or
    an invalid dependency state), keep the run from staying in running forever.
    """
    run = store.get_run(run_id) or {}
    pending = [n for n in run.get("nodes", []) if n.get("status") == "pending"]
    changed = False
    for n in pending:
        node_id = n.get("node_id")
        upstream = store.get_upstream(run_id, node_id) if hasattr(store, "get_upstream") else []
        upstream_states = []
        for uid in upstream:
            up_node = next((x for x in run.get("nodes", []) if x.get("node_id") == uid), None)
            upstream_states.append({"node_id": uid, "status": (up_node or {}).get("status", "missing")})
        store.update_node(
            run_id,
            node_id,
            status="failed",
            error=reason,
            result=f"调度器无法继续推进 pending 节点；{reason}; upstream={upstream_states}",
        )
        _publish_event(
            run_id,
            "node_failed",
            node_id=node_id,
            payload={"status": "failed", "reason": reason, "upstream": upstream_states},
        )
        changed = True
    return changed


def _append_feedback_to_prompt(prompt: str, node_params: dict | None) -> str:
    """Append workflow-level feedback history to a node prompt.

    This is different from node-local retry: feedback_history is written by a
    downstream reviewer/test node back to an upstream node, then the upstream
    node is re-queued and sees concrete failure evidence in its next execution.
    """
    node_params = node_params or {}
    feedback_history = node_params.get("feedback_history") or []
    if not feedback_history:
        return prompt
    return (
        f"{prompt}\n\n"
        "# 闭环反馈输入\n"
        "下游验证/审查节点要求你基于以下反馈进行返修。不要重做无关内容；"
        "必须读取当前工作目录和 input/ 上游文件，针对失败证据修复。\n"
        f"{json.dumps(feedback_history, ensure_ascii=False, indent=2)}\n"
    )


def _collect_downstream_nodes(store, run_id: str, node_id: str, include_self: bool = True) -> list[str]:
    """Collect transitive downstream node ids in deterministic breadth-first order."""
    seen: set[str] = set()
    ordered: list[str] = []
    queue = [node_id] if include_self else list(store.get_dependents(run_id, node_id))
    while queue:
        cur = queue.pop(0)
        if cur in seen:
            continue
        seen.add(cur)
        ordered.append(cur)
        for dep in sorted(store.get_dependents(run_id, cur)):
            if dep not in seen:
                queue.append(dep)
    return ordered


def _update_node_params_json(store, run_id: str, node_id: str, params: dict):
    store.update_node(
        run_id,
        node_id,
        params_json=json.dumps(params or {}, ensure_ascii=False),
    )


def _schedule_feedback_loop(
    store,
    run_id: str,
    source_node_id: str,
    source_params: dict | None,
    quality_reason: str,
    checks: dict,
    publish_event=_publish_event,
) -> bool:
    """Schedule a workflow-level feedback loop.

    A node declares feedback semantics via params:
      - loop_to: upstream node id to re-run when this node fails QualityGate
      - max_loop_iterations: maximum workflow-level feedback cycles

    On failure, this function writes feedback evidence into the target node's
    params.feedback_history, increments source params._loop_iterations, and
    resets target + downstream nodes to pending. It returns True if a loop was
    scheduled and the caller should not mark the source node failed yet.
    """
    source_params = dict(source_params or {})
    loop_to = source_params.get("loop_to")
    if not loop_to:
        return False
    max_iterations = int(source_params.get("max_loop_iterations", 1) or 1)
    iterations = int(source_params.get("_loop_iterations", 0) or 0)
    if iterations >= max_iterations:
        return False

    run = store.get_run(run_id) if hasattr(store, "get_run") else None
    node_rows = (run or {}).get("nodes", []) if run else list(getattr(store, "nodes", {}).values())
    target = next((n for n in node_rows if n.get("node_id") == loop_to), None)
    if not target:
        return False

    target_params = dict(target.get("params") or {})
    feedback_history = list(target_params.get("feedback_history") or [])
    feedback_history.append({
        "from_node": source_node_id,
        "reason": quality_reason,
        "checks": checks,
        "iteration": iterations + 1,
    })
    target_params["feedback_history"] = feedback_history
    _update_node_params_json(store, run_id, loop_to, target_params)

    source_params["_loop_iterations"] = iterations + 1
    _update_node_params_json(store, run_id, source_node_id, source_params)

    # Reset loop target and all of its downstream nodes, including the failing
    # source node, so the DAG naturally re-executes target -> ... -> source.
    for nid in _collect_downstream_nodes(store, run_id, loop_to, include_self=True):
        store.update_node(
            run_id,
            nid,
            status="pending",
            result="",
            output="",
            error="",
        )

    publish_event(
        run_id,
        "workflow_feedback",
        node_id=source_node_id,
        payload={
            "from_node": source_node_id,
            "to_node": loop_to,
            "iteration": iterations + 1,
            "max_iterations": max_iterations,
            "reason": quality_reason,
            "checks": checks,
        },
    )
    return True


def _workspace_file_snapshot(node_dir: str, limit: int = 80) -> list[str]:
    """Return a bounded relative-file snapshot for repair prompts and debugging."""
    files: list[str] = []
    try:
        for root, dirs, names in os.walk(node_dir):
            dirs[:] = [d for d in dirs if d not in {"__pycache__", ".git", ".venv", "venv", "node_modules"}]
            for name in sorted(names):
                rel = os.path.relpath(os.path.join(root, name), node_dir)
                files.append(rel)
                if len(files) >= limit:
                    return files
    except Exception:
        return files
    return files


def _build_repair_task(task, quality_reason: str, checks: dict, node_dir: str):
    """Clone a PromptTask-like object with a repair-focused prompt.

    Quality retries must not replay the same prompt blindly; they need the exact
    gate failure, validation checks, and current workspace inventory.
    """
    import copy
    repair_task = copy.copy(task)
    files = _workspace_file_snapshot(node_dir)
    repair_task.prompt = (
        f"{getattr(task, 'prompt', '')}\n\n"
        "# 质量门控失败后的定向返修任务\n"
        "上一次执行没有通过 AgentFlow QualityGate。你必须在当前工作目录中直接修复文件，"
        "不要只写解释，不要创建无关目录。\n\n"
        f"## 失败原因\n{quality_reason}\n\n"
        f"## 检查结果 JSON\n{json.dumps(checks, ensure_ascii=False, indent=2)}\n\n"
        f"## 当前工作目录文件\n{json.dumps(files, ensure_ascii=False, indent=2)}\n\n"
        "## 返修要求\n"
        "1. 先读取现有文件，定位缺失/错误点。\n"
        "2. 直接修改或补齐 expected_files / validation_commands 要求的内容。\n"
        "3. 重新运行验证命令；GUI 程序必须使用 QT_QPA_PLATFORM=offscreen 或仅做 import/static smoke test，禁止阻塞弹窗。\n"
        "4. 最后用中文输出修复摘要、修改文件和验证结果。\n"
    )
    repair_task.max_turns = max(getattr(task, "max_turns", 10), 8)
    repair_task.timeout_s = max(getattr(task, "timeout_s", 120), 180)
    return repair_task


def _execute_one_node(node_row: dict, task, node_dir: str, default_model: str,
                       run_id: str = None) -> dict:
    """执行单个节点 — 通过 stream_execute() 发布中间事件到事件总线。

    保留原有函数签名兼容 ThreadPoolExecutor 调度。
    额外 run_id 参数：传入时通过 _event_bus 发布 tool/delta 级事件。
    """
    with _global_semaphore:
        agent_model = node_row.get("model") or default_model
        agent_type = node_row.get("agent_type", "standard")

        # 注入 AgentFlow 自编排环境变量
        run_id_for_env = run_id or ""
        node_id_for_env = node_row.get("node_id", "")
        # 获取节点 scope
        node_params_raw = node_row.get("params", {}) or {}
        agent_scope = node_params_raw.get("scope", "self")
        os.environ["AGENTFLOW_API_URL"] = f"http://{HOST}:{PORT}"
        os.environ["AGENTFLOW_RUN_ID"] = run_id_for_env
        os.environ["AGENTFLOW_NODE_ID"] = node_id_for_env
        os.environ["AGENTFLOW_DAG_VERSION"] = str(get_store().get_dag_version(run_id_for_env))
        os.environ["AGENTFLOW_AGENT_SCOPE"] = agent_scope

        if agent_type == "claude-code":
            from cc_agent_runner import CCAgentRunner
            agent = CCAgentRunner(max_budget_usd=float(node_row.get("max_budget", 0.5)))
        else:
            agent = AgentRunner(model=agent_model)

    prompt = getattr(task, "prompt", "") or node_row.get("description", "") or "请完成分配的工作。"
    all_output = []
    total_cost = 0.0
    status = "error"
    result_text = ""
    total_turns = 0
    start_time = time.time()

    try:
        for event in agent.stream_execute(
            prompt=prompt,
            work_dir=node_dir,
            profile=node_row.get("profile", "dev"),
            tools_enabled=True,
            max_turns=getattr(task, "max_turns", 15),
            timeout=getattr(task, "timeout_s", 180),
        ):
            if run_id and event["type"] in ("tool_start", "tool_end"):
                _publish_event(
                    run_id, event["type"],
                    node_id=node_row.get("node_id"),
                    tool_call_id=event.get("tool_call_id"),
                    payload=event.get("payload", {}),
                )
            elif event["type"] == "node_delta":
                all_output.append(event["payload"].get("content", ""))
            elif event["type"] == "node_complete":
                status = "ok"
                result_text = event["payload"].get("result", "")
                total_cost = event["payload"].get("cost", 0)
                total_turns = event["payload"].get("turns", 0)
            elif event["type"] == "node_failed":
                status = event["payload"].get("status", "error")
                result_text = event["payload"].get("error", "未知错误")
                total_cost = event["payload"].get("cost", 0)

        full_output = "\n".join(all_output)
        return {
            "result": result_text,
            "output": full_output,
            "cost": total_cost,
            "duration_ms": int((time.time() - start_time) * 1000),
            "status": status,
            "turns": total_turns,
            "model": agent_model,
            "provider": agent.provider_name,
        }
    except Exception as e:
        return {
            "status": "error",
            "result": str(e)[:500],
            "cost": total_cost, "duration_ms": int((time.time() - start_time) * 1000), "turns": total_turns,
            "model": agent_model, "provider": "",
        }


def _check_scope(run_id: str, caller_node_id: str | None,
                  target_node_id: str, caller_scope: str = "self") -> tuple[bool, str]:
    """检查 caller 是否有权限操作 target 节点。
    
    scope 三级: self(默认) / downstream / run
    返回 (allowed, reason)
    """
    if caller_node_id is None:
        return True, ""  # 外部 API 调用（非 Agent 内调用）
    if caller_scope == "run":
        return True, ""
    if caller_scope == "self":
        if caller_node_id == target_node_id:
            return True, ""
        return False, f"scope_denied: 权限 self 只能修改本节点 ({caller_node_id})，不能修改 {target_node_id}"
    if caller_scope == "downstream":
        # 检查 target 是否是 caller 的下游
        store = get_store()
        visited = set()
        queue = list(store.get_dependents(run_id, caller_node_id))
        while queue:
            nid = queue.pop(0)
            if nid in visited:
                continue
            visited.add(nid)
            if nid == target_node_id:
                return True, ""
            for dep in store.get_dependents(run_id, nid):
                if dep not in visited:
                    queue.append(dep)
        return False, f"scope_denied: 权限 downstream 只能修改下游节点，{target_node_id} 不是 {caller_node_id} 的下游"
    return False, f"scope_denied: 未知 scope '{caller_scope}'"


def _get_agent_scope(node_params: dict | None) -> str:
    """从节点 params 提取 scope，默认 self。"""
    params = node_params or {}
    return params.get("scope", "self")


def _runtime_status() -> dict:
    """返回当前运行时配置（供前端检测 API Key 是否就绪）。"""
    agent = AgentRunner(model=DEFAULT_AGENT_MODEL)
    provider = agent.provider_name
    if not isinstance(provider, str):
        provider = "deepseek"
    config = AgentRunner.PROVIDER_CONFIGS.get(provider, {})
    key_env = config.get("key_env", "OPENAI_API_KEY")
    api_key = getattr(agent, "api_key", "") or ""
    configured = bool(api_key.strip()) if isinstance(api_key, str) else False
    hint = ""
    if not configured:
        hint = f"请在 .env 中设置 {key_env} 后重启服务"
    return {
        "api_key_configured": configured,
        "model": DEFAULT_AGENT_MODEL,
        "provider": provider,
        "key_env": key_env,
        "hint": hint,
    }


def _api_path(raw_path: str) -> str:
    return urlparse(raw_path).path.rstrip("/") or "/"


def _apply_edges_to_nodes(nodes: list, edges: list | None) -> list:
    dep_map: dict[str, list[str]] = {}
    for e in edges or []:
        src, tgt = e.get("source"), e.get("target")
        if src and tgt:
            dep_map.setdefault(tgt, []).append(src)
    prepared = []
    for n in nodes:
        nd = dict(n)
        nid = nd.get("id", "")
        nd["depends_on"] = dep_map.get(nid, nd.get("depends_on", []))
        prepared.append(nd)
    return prepared


def _submit_run(
    requirement: str, nodes: list, edges: list | None = None, workflow_id: str = ""
) -> str:
    prepared = _apply_edges_to_nodes(nodes, edges)
    store = get_store()
    run_id = store.create_run(requirement, prepared, edges, workflow_id=workflow_id)
    _executor_queue.put(run_id)
    return run_id


def _build_workflow_edges(nodes_data: list) -> list:
    """从节点定义（含 depends_on）构建 EdgeDef 列表。

    Args:
        nodes_data: [{"node_id": "a1", "depends_on": ""},
                     {"node_id": "a2", "depends_on": "a1"},
                     {"node_id": "a3", "depends_on": "a1,a2"}]

    Returns:
        [EdgeDef(source="a1", target="a2"), EdgeDef(source="a1", target="a3"), ...]
    """
    from agentflow_schema import EdgeDef

    edges = []
    for node in nodes_data:
        nid = node.get("node_id", "")
        deps = node.get("depends_on", "")
        if deps:
            for dep in deps.split(","):
                dep = dep.strip()
                if dep:
                    edges.append(EdgeDef(source=dep, target=nid))
    return edges


# ── HTTP Handler ──────────────────────────────────
class AgentFlowHandler(http.server.BaseHTTPRequestHandler):
    server_version = "AgentFlow/3"

    def _cors_headers(self, origin: str = "") -> dict:
        allowed = os.environ.get("AGENTFLOW_ALLOWED_ORIGIN", "")
        if allowed and origin and origin == allowed:
            origin_val = origin
        elif allowed and origin and allowed == "*":
            origin_val = origin
        else:
            origin_val = origin if origin in (
                "http://localhost", f"http://localhost:{PORT}",
                "http://127.0.0.1", f"http://127.0.0.1:{PORT}",
            ) else "http://localhost"
        return {
            "Access-Control-Allow-Origin": origin_val,
            "Access-Control-Allow-Methods": "POST, GET, HEAD, OPTIONS, PATCH, DELETE",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }

    def _require_auth(self) -> bool:
        if not AGENTFLOW_API_TOKEN:
            return True
        auth = self.headers.get("Authorization", "")
        if auth == f"Bearer {AGENTFLOW_API_TOKEN}":
            return True
        if self.headers.get("X-API-Key", "") == AGENTFLOW_API_TOKEN:
            return True
        return False

    def do_OPTIONS(self):
        origin = self.headers.get("Origin", "")
        cors = self._cors_headers(origin)
        self.send_response(204)
        for k, v in cors.items():
            self.send_header(k, v)
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def _serve_static(self, send_body: bool = True):
        # 静态文件
        url = self.path
        if url == "/" or url == "":
            # 默认入口：优先 React Flow 构建产物，回退到 canvas-demo.html
            dist_path = os.path.join(SCRIPT_DIR, "frontend", "dist", "index.html")
            cd_path = os.path.join(SCRIPT_DIR, "canvas-demo.html")
            fe_path = os.path.join(STATIC_DIR, "index.html")
            if os.path.isfile(dist_path):
                url = "/frontend/dist/index.html"
            elif os.path.isfile(cd_path):
                url = "/canvas-demo.html"
            elif os.path.isfile(fe_path):
                url = "/index.html"
            else:
                url = "/index.html"  # 兜底
        filepath = os.path.normpath(os.path.join(STATIC_DIR, url.lstrip("/")))
        # 如果在 STATIC_DIR 找不到，回退到 SCRIPT_DIR
        if not os.path.isfile(filepath):
            alt = os.path.normpath(os.path.join(SCRIPT_DIR, url.lstrip("/")))
            if os.path.isfile(alt):
                filepath = alt
        # 如果是前端构建产物（assets/*），回退到 frontend/dist/
        if not os.path.isfile(filepath):
            dist_alt = os.path.normpath(os.path.join(SCRIPT_DIR, "frontend", "dist", url.lstrip("/")))
            if os.path.isfile(dist_alt):
                filepath = dist_alt
        allowed_prefix = os.path.normpath(STATIC_DIR) + os.sep
        script_prefix = os.path.normpath(SCRIPT_DIR) + os.sep
        if not (filepath.startswith(allowed_prefix) or filepath == os.path.normpath(STATIC_DIR) or
                filepath.startswith(script_prefix)):
            self.send_error(403, "Forbidden")
            return

        # 扩展名白名单
        ext = os.path.splitext(filepath)[1].lower()
        if ext not in SAFE_EXTENSIONS:
            self.send_error(403, f"File type '{ext}' not allowed")
            return

        if not os.path.isfile(filepath):
            filepath = os.path.join(STATIC_DIR, "canvas-demo.html")
        try:
            with open(filepath, "rb") as f:
                content = f.read()
            mime = {
                "html": "text/html", "js": "text/javascript", "css": "text/css",
                "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
                "svg": "image/svg+xml", "json": "application/json",
                "ico": "image/x-icon", "txt": "text/plain",
                "md": "text/markdown", "webp": "image/webp",
                "gif": "image/gif", "pdf": "application/pdf",
            }.get(ext.lstrip("."), "application/octet-stream")
            self.send_response(200)
            self.send_header("Content-Type", mime + "; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            origin = self.headers.get("Origin", "")
            for k, v in self._cors_headers(origin).items():
                self.send_header(k, v)
            self.end_headers()
            if send_body:
                self.wfile.write(content)
        except OSError as e:
            self.send_error(404, str(e))

    def do_HEAD(self):
        path = _api_path(self.path)
        if path.startswith("/api/"):
            self.send_error(405, "Method Not Allowed")
            return
        self._serve_static(send_body=False)

    def do_GET(self):
        path = _api_path(self.path)

        if path == "/api/runs":
            self._handle_list_runs()
            return
        if path == "/api/status":
            self._handle_status()
            return
        if path == "/api/providers":
            self._handle_list_providers()
            return
        if path == "/api/evolution/stats":
            self._handle_evolution_stats()
            return
        if path == "/api/evolution/history":
            self._handle_evolution_history()
            return
        if path == "/api/workflows":
            self._handle_list_workflows()
            return
        if path.startswith("/api/workflows/"):
            wf_id = path.split("/")[-1]
            self._handle_get_workflow(wf_id)
            return
        if path.startswith("/api/runs/"):
            parts = path.strip("/").split("/")
            if len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "events":
                self._handle_run_events(parts[2])
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "nodes":
                self._handle_get_run_nodes(parts[2])
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "edges":
                self._handle_get_run_edges(parts[2])
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "evolution":
                self._handle_get_evolution(parts[2])
            elif len(parts) == 5 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "nodes":
                self._handle_get_run_node(parts[2], parts[4])
            elif len(parts) == 3 and parts[0] == "api" and parts[1] == "runs":
                self._handle_get_run(parts[2])
            else:
                self.send_error(404)
            return

        self._serve_static(send_body=True)

    def do_POST(self):
        path = _api_path(self.path)
        if path == "/api/decompose":
            self.handle_decompose()
        elif path == "/api/supervisor":
            self.handle_supervisor()
        elif path in ("/api/execute", "/api/runs"):
            self.handle_execute()
        elif path == "/api/execute/stream":
            self.handle_execute_stream()
        elif path == "/api/workflows":
            self._handle_create_workflow()
        elif path.startswith("/api/hook/"):
            token = path.split("/")[-1]
            self._handle_webhook_trigger(token)
        else:
            parts = path.strip("/").split("/")
            # POST /api/runs/{rid}/nodes — 新增节点
            if len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "nodes":
                self._handle_add_node(parts[2])
            # POST /api/runs/{rid}/edges — 新增边
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "edges":
                self._handle_add_edge(parts[2])
            # POST /api/runs/{rid}/nodes/{nid}/retry — 重置重跑
            elif len(parts) == 6 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "nodes" and parts[5] == "retry":
                self._handle_retry_node(parts[2], parts[4])
            # POST /api/runs/{rid}/feedback — 提反馈
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "feedback":
                self._handle_feedback(parts[2])
            # POST /api/runs/{rid}/reroute — 批量调整
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "reroute":
                self._handle_reroute(parts[2])
            # POST /api/runs/{rid}/evolve — 手动触发进化分析
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "evolve":
                self._handle_evolve(parts[2])
            # POST /api/runs/{rid}/upgrade — 执行升级门控全流程
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "upgrade":
                self._handle_upgrade(parts[2])
            else:
                self.send_error(404)

    def do_PUT(self):
        path = _api_path(self.path)
        if path.startswith("/api/workflows/"):
            wf_id = path.split("/")[-1]
            self._handle_update_workflow(wf_id)
        else:
            self.send_error(404)

    def do_PATCH(self):
        path = _api_path(self.path)
        # PATCH /api/runs/{rid}/nodes/{nid}
        parts = path.strip("/").split("/")
        if len(parts) == 5 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "nodes":
            self._handle_patch_node(parts[2], parts[4])
        else:
            self.send_error(404)

    def do_DELETE(self):
        path = _api_path(self.path)
        if path.startswith("/api/workflows/"):
            wf_id = path.split("/")[-1]
            self._handle_delete_workflow(wf_id)
        else:
            parts = path.strip("/").split("/")
            # DELETE /api/runs/{rid}/nodes/{nid} — 删除节点
            if len(parts) == 5 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "nodes":
                self._handle_delete_node(parts[2], parts[4])
            # DELETE /api/runs/{rid}/edges — 删除边（body 中传 source/target）
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "edges":
                self._handle_remove_edge(parts[2])
            else:
                self.send_error(404)

    def _read_json_body(self) -> tuple[dict | None, str | None]:
        try:
            length = int(self.headers.get("Content-Length", 0))
            # Bug #30 FIX: guard against negative Content-Length
            if length < 0:
                return None, "Invalid Content-Length"
            if length > MAX_BODY_SIZE:
                return None, f"Request too large ({length} > {MAX_BODY_SIZE})"
            if length == 0:
                return {}, None
            return json.loads(self.rfile.read(length)), None
        except (json.JSONDecodeError, ValueError, TypeError):
            return None, "Invalid request"

    def _webhook_url(self, token: str) -> str:
        host = self.headers.get("Host", f"localhost:{PORT}")
        return f"http://{host}/api/hook/{token}"

    # ── 编排（分解大需求为 DAG） ─────────────────────

    def handle_decompose(self):
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length > MAX_BODY_SIZE:
                self._send_json(413, {"error": f"Request too large ({length} > {MAX_BODY_SIZE})"})
                return
            body = json.loads(self.rfile.read(length))
            requirement = body.get("requirement", "")
            count = max(1, min(int(body.get("count", 5)), 100))
        except (json.JSONDecodeError, ValueError, TypeError):
            self._send_json(400, {"error": "Invalid request"})
            return

        if not requirement:
            self._send_json(400, {"error": "Requirement is empty"})
            return

        # 尝试用 LLM 分解，无 key 则 fallback
        model = os.environ.get("AGENT_MODEL", DEFAULT_AGENT_MODEL)
        try:
            agent = AgentRunner(model=model)
            if not agent.api_key:
                nodes = self._fallback_template(requirement, count)
            else:
                prompt = f"""你是一个工作流编排专家。将以下需求拆解为 {count} 个子任务。

需求: {requirement}
Agent数量: {count}

返回格式: **纯 JSON 数组，不要其他文字，不要 markdown 代码块**
每个元素包含: id, icon, label, desc, color, profile, depends_on (数组)
profile 必须是: analysis/design/dev/test/doc/deploy 之一
depends_on 列出此节点依赖的上游节点 id（首个节点为空数组）

返回的数组长度必须 = {count}"""
                result = agent.execute(
                    prompt=prompt,
                    tools_enabled=False,
                    max_turns=1,
                    timeout=45,
                )
                content = result.get("output", "[]").strip()
                extracted = extract_json(content)
                try:
                    nodes = json.loads(extracted)
                    if isinstance(nodes, dict) and "nodes" in nodes:
                        nodes = nodes["nodes"]
                    if isinstance(nodes, list):
                        nodes = self._adjust_nodes(nodes, count)
                    else:
                        nodes = self._fallback_template(requirement, count)
                except json.JSONDecodeError:
                    nodes = self._fallback_template(requirement, count)
        except Exception:
            nodes = self._fallback_template(requirement, count)

        # 归一化：确保所有 id/depends_on 为字符串
        def _normalize_node(n):
            n["id"] = str(n.get("id", ""))
            n["depends_on"] = [str(d) for d in n.get("depends_on", [])]
            return n
        nodes = [_normalize_node(n) for n in nodes]

        # 生成边
        edges = self._generate_edges(nodes)
        self._send_json(200, {"nodes": nodes, "edges": edges, "count": len(nodes)})

    def _generate_edges(self, nodes):
        """根据节点的 depends_on 字段生成边。"""
        edges = []
        for n in nodes:
            deps = n.get("depends_on", [])
            if not deps:
                continue
            for dep in deps:
                edges.append({"source": dep, "target": n["id"]})
        if not edges and len(nodes) > 1:
            # fallback: 线性串联
            for i in range(len(nodes) - 1):
                edges.append({"source": nodes[i]["id"], "target": nodes[i + 1]["id"]})
        return edges

    def _adjust_nodes(self, nodes, target):
        # 不再强制把最后一个节点改成 doc：LLM 分解出的“测试验证”必须保持 test，
        # 否则质量门控和 validation_commands 会被文档模板绕过。
        while len(nodes) < target:
            copy = nodes[-1].copy()
            copy["id"] = f"n{len(nodes) + 1}"
            nodes.append(copy)
        return nodes[:target]

    def _fallback_template(self, requirement, count):
        """无 API key 时的兜底模板。所有 result 标记为'未执行'。"""
        t = requirement.lower()
        if any(kw in t for kw in ["pid", "控制器", "四旋翼", "无人机"]):
            base = [
                {"id": "a1", "icon": "📋", "label": "需求分析", "desc": "解析需求→确定控制目标",
                 "color": "blue", "profile": "analysis", "depends_on": [],
                 "result": "⚠️ 未执行（无 API Key）"},
                {"id": "a2", "icon": "🧮", "label": "系统建模", "desc": "四旋翼动力学模型",
                 "color": "blue", "profile": "design", "depends_on": ["a1"],
                 "result": "⚠️ 未执行（无 API Key）"},
                {"id": "a3", "icon": "💻", "label": "代码生成", "desc": "控制器代码实现",
                 "color": "green", "profile": "dev", "depends_on": ["a2"],
                 "result": "⚠️ 未执行（无 API Key）"},
                {"id": "a4", "icon": "🧪", "label": "测试验证", "desc": "编译+单元测试",
                 "color": "purple", "profile": "test", "depends_on": ["a3"],
                 "result": "⚠️ 未执行（无 API Key）"},
                {"id": "a5", "icon": "📝", "label": "输出报告", "desc": "交付文档",
                 "color": "orange", "profile": "doc", "depends_on": ["a4"],
                 "result": "⚠️ 未执行（无 API Key）"},
            ]
        elif any(kw in t for kw in ["网站", "web", "前端", "后端"]):
            base = [
                {"id": "b1", "icon": "📋", "label": "需求分析", "desc": "功能需求→技术选型",
                 "color": "blue", "profile": "analysis", "depends_on": [],
                 "result": "⚠️ 未执行（无 API Key）"},
                {"id": "b2", "icon": "💻", "label": "后端开发", "desc": "API 实现",
                 "color": "green", "profile": "dev", "depends_on": ["b1"],
                 "result": "⚠️ 未执行（无 API Key）"},
                {"id": "b3", "icon": "💻", "label": "前端开发", "desc": "UI 实现",
                 "color": "green", "profile": "dev", "depends_on": ["b1"],
                 "result": "⚠️ 未执行（无 API Key）"},
                {"id": "b4", "icon": "🧪", "label": "集成测试", "desc": "前后端联调",
                 "color": "purple", "profile": "test", "depends_on": ["b2", "b3"],
                 "result": "⚠️ 未执行（无 API Key）"},
                {"id": "b5", "icon": "📝", "label": "文档输出", "desc": "使用说明",
                 "color": "orange", "profile": "doc", "depends_on": ["b4"],
                 "result": "⚠️ 未执行（无 API Key）"},
            ]
        else:
            base = [
                {"id": "g1", "icon": "📋", "label": "需求分析", "desc": "解析用户需求",
                 "color": "blue", "profile": "analysis", "depends_on": [],
                 "result": "⚠️ 未执行（无 API Key）"},
                {"id": "g2", "icon": "💻", "label": "开发实现", "desc": "编码实现",
                 "color": "green", "profile": "dev", "depends_on": ["g1"],
                 "result": "⚠️ 未执行（无 API Key）"},
                {"id": "g3", "icon": "🧪", "label": "测试验证", "desc": "测试验证",
                 "color": "purple", "profile": "test", "depends_on": ["g2"],
                 "result": "⚠️ 未执行（无 API Key）"},
                {"id": "g4", "icon": "📝", "label": "文档输出", "desc": "交付文档",
                 "color": "orange", "profile": "doc", "depends_on": ["g3"],
                 "result": "⚠️ 未执行（无 API Key）"},
            ]
        repeats = (count + len(base) - 1) // len(base)
        expanded = []
        for idx, node in enumerate((base * repeats)[:count], start=1):
            copy = node.copy()
            copy["id"] = f"{node['id']}_{idx}"
            copy["depends_on"] = [] if idx == 1 else [expanded[-1]["id"]]
            expanded.append(copy)
        return expanded

    # ── 异步执行（提交即返回 run_id） ────────────────

    def handle_execute(self):
        """提交执行任务，立即返回 run_id。实际执行由后台 worker 完成。"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length > MAX_BODY_SIZE:
                self.send_error(413, f"Request too large ({length} > {MAX_BODY_SIZE})")
                return
            body = json.loads(self.rfile.read(length))
            nodes = body.get("nodes", [])
            edges = body.get("edges", [])
            requirement = body.get("requirement", "")
        except (json.JSONDecodeError, ValueError, TypeError):
            self._send_json(400, {"error": "Invalid request"})
            return
        if not nodes:
            self._send_json(400, {"error": "No nodes"})
            return

        # DAG 校验
        from agentflow_schema import EdgeDef
        edge_objs = []
        for e in edges:
            if isinstance(e, dict):
                edge_objs.append(EdgeDef(source=str(e.get("source","")), target=str(e.get("target",""))))
            elif hasattr(e, 'source'):
                edge_objs.append(e)
        wf_check = WorkflowJSON(
            workflow_id="validate",
            name=requirement[:100],
            global_context={"goal": requirement, "language": "zh-CN", "constraints": []},
            nodes=[NodeDef(id=str(n.get("id","")), icon=n.get("icon",""), label=n.get("label",""),
                           desc=n.get("desc",""), color=n.get("color",""), profile=n.get("profile","dev"),
                           params=n.get("params", {}) or {})
                   for n in nodes],
            edges=edge_objs,
        )
        validation_errors = validate_workflow(wf_check)
        if validation_errors:
            self._send_json(422, {"error": "invalid_workflow", "details": validation_errors})
            return

        workflow_id = body.get("workflow_id", "")
        run_id = _submit_run(requirement, nodes, edges, workflow_id=workflow_id)

        print(f"[Execute] Submitted {run_id}: {len(nodes)} nodes", file=sys.stderr)
        self._send_json(202, {
            "run_id": run_id,
            "status": "pending",
            "node_count": len(nodes),
            "message": "任务已提交，后台异步执行中",
        })

    # ── SSE 流式执行 ────────────────────────────────

    def handle_execute_stream(self):
        """SSE 流式端点：提交后实时推送节点状态变更。"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            nodes = body.get("nodes", [])
            edges = body.get("edges", [])
            requirement = body.get("requirement", "")
        except (json.JSONDecodeError, ValueError, TypeError):
            self._send_json(400, {"error": "Invalid request"})
            return
        if not nodes:
            self._send_json(400, {"error": "No nodes"})
            return

        workflow_id = body.get("workflow_id", "")
        prepared = _apply_edges_to_nodes(nodes, edges)
        store = get_store()
        run_id = store.create_run(
            requirement, prepared, edges, workflow_id=workflow_id or ""
        )
        total_nodes = len(prepared)
        groups = self._compute_groups(prepared, edges)

        # 发送 SSE 头
        self._send_sse_headers()

        # 先发 workflow_start
        self._stream_send("workflow_start", {
            "run_id": run_id, "total_nodes": total_nodes, "total_groups": len(groups),
        })

        # 入队
        _executor_queue.put(run_id)

        # 轮询状态变更
        last_states: dict[str, str] = {}
        poll_interval = 1.0  # 1s 轮询
        max_wait = 600  # 最多等 10 分钟
        waited = 0

        try:
            while waited < max_wait:
                run = store.get_run(run_id)
                if not run:
                    break

                # 检查节点状态变更
                for node in run["nodes"]:
                    nid = node["node_id"]
                    new_status = node["status"]
                    old_status = last_states.get(nid)
                    if new_status != old_status:
                        last_states[nid] = new_status
                        if new_status == "running":
                            self._stream_send("node_start", {
                                "node_id": nid,
                                "label": node.get("label", ""),
                                "profile": node.get("profile", ""),
                                "group_idx": 0,
                            })
                        elif new_status in ("completed", "failed", "skipped", "timed_out"):
                            self._stream_send("node_complete", {
                                "node_id": nid,
                                "label": node.get("label", ""),
                                "status": new_status,
                                "result": (node.get("result") or "")[:200],
                                "cost": node.get("cost", 0),
                                "duration_ms": node.get("duration_ms", 0),
                                "turns": node.get("turns", 0),
                                "model": node.get("model", ""),
                                "provider": node.get("provider", ""),
                            })

                # 检查是否完成
                if run["status"] in ("completed", "failed"):
                    break

                time.sleep(poll_interval)
                waited += poll_interval

            # 回执最终结果
            final = store.get_run(run_id)
            if final:
                self._stream_send("workflow_done", {
                    "run_id": run_id,
                    "status": final["status"],
                    "total_cost": final["total_cost"],
                    "total_duration": final["total_dur"],
                    "nodes": final["nodes"],
                })
            else:
                self._stream_send("workflow_done", {"run_id": run_id, "status": "unknown"})
        except BrokenPipeError:
            pass  # 客户端断连，正常

    def _compute_groups(self, nodes, edges):
        """近似计算 DAG 的层级分组（用于 SSE group_start 事件）。"""
        if not edges or len(nodes) <= 1:
            return [[n["id"] for n in nodes]]
        in_degree = {n["id"]: 0 for n in nodes}
        adj = {n["id"]: [] for n in nodes}
        for e in edges:
            adj.setdefault(e["source"], []).append(e["target"])
            in_degree[e["target"]] = in_degree.get(e["target"], 0) + 1
        groups = []
        while in_degree:
            layer = [nid for nid, deg in in_degree.items() if deg == 0]
            if not layer:
                break
            groups.append(layer)
            for nid in layer:
                del in_degree[nid]
                for tgt in adj.get(nid, []):
                    if tgt in in_degree:
                        in_degree[tgt] -= 1
        return groups

    def _send_sse_headers(self):
        self.send_response(200)
        origin = self.headers.get("Origin", "")
        for k, v in self._cors_headers(origin).items():
            self.send_header(k, v)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("X-Accel-Buffering", "no")  # nginx proxy
        self.end_headers()
        self.wfile.flush()

    def _stream_send(self, event: str, data: dict):
        payload = f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
        try:
            self.wfile.write(payload.encode())
            self.wfile.flush()
        except (BrokenPipeError, OSError):
            pass

    # ── Run 状态 SSE 事件流 ────────────────────────

    def _handle_run_events(self, run_id: str):
        """SSE 端点：使用 RunEventBus 实时推送事件。"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        run = get_store().get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return

        # 读取 Last-Event-ID 头（浏览器自动发送）
        last_id = self.headers.get("Last-Event-ID")
        after_sequence = int(last_id) if (last_id and last_id.isdigit()) else -1

        self._send_sse_headers()

        # Step 1: replay 已持久化事件
        store = get_store()
        persisted = store.list_events(run_id, after_sequence=after_sequence)
        for ev in persisted:
            seq = ev.get("sequence", 0)
            self._stream_send(ev["type"], ev)
            after_sequence = seq

        # Step 2: 订阅 RunEventBus 实时事件
        for ev_obj in _event_bus.subscribe(run_id, after_sequence=after_sequence, timeout_s=600):
            d = ev_obj.to_dict()
            seq = d["sequence"]
            self._stream_send(d["type"], d)

    # ── Run 历史 API ───────────────────────────────

    # ── Run 历史 API ───────────────────────────────

    def _handle_status(self):
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        self._send_json(200, _runtime_status())

    def _handle_list_runs(self):
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        runs = get_store().list_runs()
        self._send_json(200, {"runs": runs, "count": len(runs)})

    def _handle_get_run(self, run_id: str):
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        run = get_store().get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return
        run["dag_version"] = get_store().get_dag_version(run_id)
        run["edges"] = get_store().get_run_edges(run_id)
        self._send_json(200, run)

    # ── 新: Self-Orchestration API 端点 ─────────────────

    def _handle_get_run_nodes(self, run_id: str):
        """GET /api/runs/{rid}/nodes — 获取所有节点及上下游"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        run = get_store().get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return
        nodes = run.get("nodes", [])
        edges = get_store().get_run_edges(run_id)
        # 为每个节点附加上下游信息
        edge_src_map = {}
        edge_tgt_map = {}
        for e in edges:
            edge_tgt_map.setdefault(e["target"], []).append(e["source"])
            edge_src_map.setdefault(e["source"], []).append(e["target"])
        enriched = []
        for n in nodes:
            nid = n.get("node_id", "")
            enriched.append({
                **n,
                "upstream": edge_tgt_map.get(nid, []),
                "downstream": edge_src_map.get(nid, []),
            })
        self._send_json(200, {
            "nodes": enriched,
            "count": len(enriched),
            "dag_version": get_store().get_dag_version(run_id),
        })

    def _handle_get_run_node(self, run_id: str, node_id: str):
        """GET /api/runs/{rid}/nodes/{nid} — 单个节点详情"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        run = get_store().get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return
        node = next((n for n in run.get("nodes", []) if n.get("node_id") == node_id), None)
        if not node:
            self._send_json(404, {"error": f"Node {node_id} not found in run {run_id}"})
            return
        edges = get_store().get_run_edges(run_id)
        upstream = [e["source"] for e in edges if e["target"] == node_id]
        downstream = [e["target"] for e in edges if e["source"] == node_id]
        self._send_json(200, {
            **node,
            "upstream": upstream,
            "downstream": downstream,
        })

    def _handle_get_run_edges(self, run_id: str):
        """GET /api/runs/{rid}/edges — DAG 边列表"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        run = get_store().get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return
        edges = get_store().get_run_edges(run_id)
        self._send_json(200, {
            "edges": edges,
            "count": len(edges),
            "dag_version": get_store().get_dag_version(run_id),
        })

    def _handle_add_node(self, run_id: str):
        """POST /api/runs/{rid}/nodes — 动态新增节点"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        body, err = self._read_json_body()
        if err:
            self._send_json(400, {"error": err})
            return
        body = body or {}
        store = get_store()
        run = store.get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return

        # scope 检查
        caller_node_id = body.get("x_agent_node_id")
        caller_scope = body.get("x_agent_scope", "self")
        target_id = body.get("id", "")
        allowed, reason = _check_scope(run_id, caller_node_id, target_id, caller_scope)
        if not allowed:
            self._send_json(403, {"ok": False, "error": reason, "code": "SCOPE_DENIED"})
            return

        if not target_id:
            self._send_json(400, {"error": "Node id is required"})
            return
        if store.add_node(run_id, body):
            _publish_event(run_id, "node_added",
                node_id=target_id,
                payload={"node_id": target_id, "label": body.get("label", "")})
            self._send_json(201, {
                "ok": True,
                "data": {"node_id": target_id, "label": body.get("label", "")},
                "dag_version": store.get_dag_version(run_id),
            })
        else:
            self._send_json(409, {"error": f"Node {target_id} already exists or invalid"})

    def _handle_patch_node(self, run_id: str, node_id: str):
        """PATCH /api/runs/{rid}/nodes/{nid} — 修改节点"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        body, err = self._read_json_body()
        if err:
            self._send_json(400, {"error": err})
            return
        body = body or {}
        store = get_store()
        run = store.get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return

        # scope 检查
        caller_node_id = body.get("x_agent_node_id")
        caller_scope = body.get("x_agent_scope", "self")
        allowed, reason = _check_scope(run_id, caller_node_id, node_id, caller_scope)
        if not allowed:
            self._send_json(403, {"ok": False, "error": reason, "code": "SCOPE_DENIED"})
            return

        # 构建可更新的字段
        updates = {}
        for k in ("label", "description", "color", "profile", "icon"):
            if k in body:
                updates[k] = body[k]
        if "params" in body:
            updates["params_json"] = json.dumps(body["params"], ensure_ascii=False)
        if updates:
            store.update_node(run_id, node_id, **updates)
            store.increment_dag_version(run_id)
        _publish_event(run_id, "node_updated",
            node_id=node_id,
            payload={"node_id": node_id, "changes": list(updates.keys())})
        self._send_json(200, {
            "ok": True,
            "data": {"node_id": node_id, "updated_fields": list(updates.keys())},
            "dag_version": store.get_dag_version(run_id),
        })

    def _handle_delete_node(self, run_id: str, node_id: str):
        """DELETE /api/runs/{rid}/nodes/{nid} — 删除节点"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        store = get_store()
        run = store.get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return

        # 从查询参数获取 caller info（因为 DELETE 无 body）
        from urllib.parse import parse_qs
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        caller_node_id = qs.get("x_agent_node_id", [None])[0]
        caller_scope = qs.get("x_agent_scope", ["self"])[0]
        allowed, reason = _check_scope(run_id, caller_node_id, node_id, caller_scope)
        if not allowed:
            self._send_json(403, {"ok": False, "error": reason, "code": "SCOPE_DENIED"})
            return

        if store.remove_node(run_id, node_id):
            _publish_event(run_id, "node_deleted",
                node_id=node_id,
                payload={"node_id": node_id})
            self._send_json(200, {
                "ok": True,
                "data": {"deleted_node_id": node_id},
                "dag_version": store.get_dag_version(run_id),
            })
        else:
            self._send_json(404, {"error": f"Node {node_id} not found"})

    def _handle_add_edge(self, run_id: str):
        """POST /api/runs/{rid}/edges — 新增依赖边"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        body, err = self._read_json_body()
        if err:
            self._send_json(400, {"error": err})
            return
        body = body or {}
        store = get_store()
        source = body.get("source", "")
        target = body.get("target", "")
        if not source or not target:
            self._send_json(400, {"error": "source and target are required"})
            return

        # scope 检查
        caller_node_id = body.get("x_agent_node_id")
        caller_scope = body.get("x_agent_scope", "self")
        # 检查涉及的两个节点
        for nid in (source, target):
            allowed, reason = _check_scope(run_id, caller_node_id, nid, caller_scope)
            if not allowed:
                self._send_json(403, {"ok": False, "error": reason, "code": "SCOPE_DENIED"})
                return

        if store.add_edge(run_id, source, target):
            _publish_event(run_id, "edge_added",
                payload={"source": source, "target": target})
            self._send_json(201, {
                "ok": True,
                "data": {"source": source, "target": target},
                "dag_version": store.get_dag_version(run_id),
            })
        else:
            self._send_json(409, {"error": "Edge already exists or invalid nodes"})

    def _handle_remove_edge(self, run_id: str):
        """DELETE /api/runs/{rid}/edges — 删除依赖边"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        store = get_store()
        # 从 body 或 query params 获取 source/target
        if self.command == "DELETE":
            body, err = self._read_json_body()
            body = body or {}
            source = body.get("source", "")
            target = body.get("target", "")
            caller_node_id = body.get("x_agent_node_id")
            caller_scope = body.get("x_agent_scope", "self")
        else:
            from urllib.parse import parse_qs
            parsed = urlparse(self.path)
            qs = parse_qs(parsed.query)
            source = qs.get("source", [""])[0]
            target = qs.get("target", [""])[0]
            caller_node_id = qs.get("x_agent_node_id", [None])[0]
            caller_scope = qs.get("x_agent_scope", ["self"])[0]

        if not source or not target:
            self._send_json(400, {"error": "source and target are required"})
            return

        # scope 检查
        for nid in (source, target):
            allowed, reason = _check_scope(run_id, caller_node_id, nid, caller_scope)
            if not allowed:
                self._send_json(403, {"ok": False, "error": reason, "code": "SCOPE_DENIED"})
                return

        if store.remove_edge(run_id, source, target):
            _publish_event(run_id, "edge_removed",
                payload={"source": source, "target": target})
            self._send_json(200, {
                "ok": True,
                "data": {"removed_source": source, "removed_target": target},
                "dag_version": store.get_dag_version(run_id),
            })
        else:
            self._send_json(404, {"error": "Edge not found"})

    def _handle_retry_node(self, run_id: str, node_id: str):
        """POST /api/runs/{rid}/nodes/{nid}/retry — 重置节点重跑"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        body, err = self._read_json_body()
        body = body or {}

        store = get_store()
        run = store.get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return

        # scope 检查
        caller_node_id = body.get("x_agent_node_id")
        caller_scope = body.get("x_agent_scope", "self")
        allowed, reason = _check_scope(run_id, caller_node_id, node_id, caller_scope)
        if not allowed:
            self._send_json(403, {"ok": False, "error": reason, "code": "SCOPE_DENIED"})
            return

        modify_desc = body.get("modify_desc")
        modify_params = body.get("modify_params")
        if store.retry_node(run_id, node_id,
                            modify_desc=modify_desc,
                            modify_params=modify_params):
            # 同时重置下游节点状态
            downstream = store.get_dependents(run_id, node_id)
            for dep_id in downstream:
                store.retry_node(run_id, dep_id)
            _publish_event(run_id, "node_retry",
                node_id=node_id,
                payload={
                    "node_id": node_id,
                    "reset_downstream": downstream,
                    "modify_desc": modify_desc is not None,
                })
            self._send_json(200, {
                "ok": True,
                "data": {"node_id": node_id, "reset_downstream": downstream},
                "dag_version": store.get_dag_version(run_id),
            })
        else:
            self._send_json(404, {"error": f"Node {node_id} not found"})

    def _handle_reroute(self, run_id: str):
        """POST /api/runs/{rid}/reroute — 批量调整 DAG"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        body, err = self._read_json_body()
        if err:
            self._send_json(400, {"error": err})
            return
        body = body or {}
        store = get_store()
        run = store.get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return

        caller_node_id = body.get("x_agent_node_id")
        caller_scope = body.get("x_agent_scope", "self")

        add_nodes = body.get("add_nodes", [])
        remove_nodes = body.get("remove_nodes", [])
        add_edges = body.get("add_edges", [])
        remove_edges = body.get("remove_edges", [])

        results = {"nodes_added": [], "nodes_removed": [],
                    "edges_added": [], "edges_removed": []}

        # 1. 删除节点
        for nid in remove_nodes:
            allowed, reason = _check_scope(run_id, caller_node_id, nid, caller_scope)
            if not allowed:
                continue
            if store.remove_node(run_id, nid):
                results["nodes_removed"].append(nid)

        # 2. 新增节点
        for nd in add_nodes:
            target_id = nd.get("id", "")
            if not target_id:
                continue
            allowed, reason = _check_scope(run_id, caller_node_id, target_id, caller_scope)
            if not allowed:
                continue
            if store.add_node(run_id, nd):
                results["nodes_added"].append(target_id)

        # 3. 删除边
        for e in remove_edges:
            src, tgt = e.get("source", ""), e.get("target", "")
            if store.remove_edge(run_id, src, tgt):
                results["edges_removed"].append(f"{src}→{tgt}")

        # 4. 新增边
        for e in add_edges:
            src, tgt = e.get("source", ""), e.get("target", "")
            if store.add_edge(run_id, src, tgt):
                results["edges_added"].append(f"{src}→{tgt}")

        _publish_event(run_id, "reroute",
            payload=results)
        self._send_json(200, {
            "ok": True,
            "data": results,
            "dag_version": store.get_dag_version(run_id),
        })

    def _handle_feedback(self, run_id: str):
        """POST /api/runs/{rid}/feedback — Agent 提反馈"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        body, err = self._read_json_body()
        if err:
            self._send_json(400, {"error": err})
            return
        body = body or {}
        store = get_store()
        run = store.get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return

        # 校验必填字段
        from_node = body.get("from_node", "")
        feedback_type = body.get("type", "general")
        message = body.get("message", "")
        if not from_node or not message:
            self._send_json(400, {"error": "from_node and message are required"})
            return

        # 持久化 feedback 到 run_events
        feedback_data = {
            "from_node": from_node,
            "type": feedback_type,
            "message": message,
            "suggested_action": body.get("suggested_action"),
            "target_nodes": body.get("target_nodes", []),
            "dag_version": store.get_dag_version(run_id),
        }
        sequence = store.append_feedback(run_id, feedback_data)
        _publish_event(run_id, "agent_feedback",
            node_id=from_node,
            payload=feedback_data)
        self._send_json(200, {
            "ok": True,
            "data": feedback_data,
            "event_sequence": sequence,
        })

    # ── Evolution: self-evolution analysis (Phase 2A) ─────────────

    def _handle_evolve(self, run_id: str):
        """POST /api/runs/{rid}/evolve — manually trigger evolution analysis."""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        store = get_store()
        run = store.get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return
        try:
            report = _run_evolution_analysis(run_id)
        except Exception as e:
            self._send_json(500, {"error": f"Evolution analysis failed: {e}"})
            return
        self._send_json(200, {"ok": True, "report": report})

    def _handle_get_evolution(self, run_id: str):
        """GET /api/runs/{rid}/evolution — get latest (or ?version=N) report."""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        store = get_store()
        run = store.get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return

        # Parse optional ?version=N
        parsed = urlparse(self.path)
        query = parsed.query
        version = None
        if "version=" in query:
            try:
                version = int(query.split("version=")[1].split("&")[0])
            except ValueError:
                pass

        row = store.get_evolution_report(run_id, version=version)
        if not row:
            self._send_json(404, {"error": "No evolution report found for this run"})
            return
        self._send_json(200, {"ok": True, "report": row.get("report", {}), "version": row.get("version")})

    def _handle_upgrade(self, run_id: str):
        """POST /api/runs/{rid}/upgrade — full upgrade pipeline for all proposals.

        Runs: evolution analysis → for each proposal → prepare candidate → eval → decide.
        Returns all upgrade decisions.
        """
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        store = get_store()
        run = store.get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return

        # 1. Run evolution analysis if no report exists yet
        existing = store.get_evolution_report(run_id)
        if not existing:
            try:
                report_dict = _run_evolution_analysis(run_id)
            except Exception as e:
                self._send_json(500, {"error": f"Evolution analysis failed: {e}"})
                return
        else:
            report_dict = existing.get("report", {})

        proposals = report_dict.get("proposals", [])
        if not proposals:
            self._send_json(200, {"ok": True, "decisions": [],
                                  "message": "No proposals to evaluate"})
            return

        # 2. Run upgrade gate for each proposal
        from dataclasses import asdict as _asdict
        from evolution_engine import EvolutionProposal as _EP
        events = store.list_events(run_id)
        decisions = []
        for prop_dict in proposals:
            try:
                proposal = _EP(
                    proposal_id=prop_dict["proposal_id"],
                    target=prop_dict["target"],
                    title=prop_dict["title"],
                    rationale=prop_dict["rationale"],
                    expected_benefit=prop_dict["expected_benefit"],
                    risk=prop_dict["risk"],
                    affected_files=prop_dict.get("affected_files", []),
                    validation_commands=prop_dict.get("validation_commands", []),
                    rollback=prop_dict.get("rollback", ""),
                )
                decision = _upgrade_gate.full_pipeline(proposal, run, events, mode="simulated")
                decisions.append(decision.to_dict())
            except Exception as e:
                decisions.append({
                    "action": "rejected",
                    "reason": f"Pipeline error: {e}",
                    "proposal": prop_dict,
                })

        # 3. Publish event
        accepted = sum(1 for d in decisions if d.get("action") in ("auto_accept", "conditional"))
        _publish_event(run_id, "upgrade_decisions",
            payload={"total": len(decisions), "accepted": accepted})

        # 4. Auto-promote accepted template proposals
        promotions = []
        for d in decisions:
            if d.get("action") in ("auto_accept", "conditional"):
                try:
                    promo_records = _template_promoter.promote_from_decision(d, run_id=run_id)
                    for r in promo_records:
                        promotions.append(r.to_dict())
                        _evolution_ledger.record_promotion(r.to_dict())
                except Exception as e:
                    print(f"[Promotion] Failed: {e}", file=sys.stderr)

        self._send_json(200, {
            "ok": True,
            "run_id": run_id,
            "decisions": decisions,
            "promotions": promotions,
            "summary": {
                "total": len(decisions),
                "accepted": accepted,
                "rejected": sum(1 for d in decisions if d.get("action") == "rejected"),
                "pending_review": sum(1 for d in decisions if d.get("action") == "pending_human_review"),
                "promoted": len(promotions),
            },
        })

    # ── Evolution: cross-run knowledge (Phase 3D) ──────────────────

    def _handle_evolution_stats(self):
        """GET /api/evolution/stats — aggregate evolution statistics."""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        from dataclasses import asdict as _asdict
        stats = _evolution_ledger.get_stats()
        self._send_json(200, {"ok": True, "stats": _asdict(stats)})

    def _handle_evolution_history(self):
        """GET /api/evolution/history — recent ledger entries."""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        parsed = urlparse(self.path)
        query = parsed.query
        limit = 50
        if "limit=" in query:
            try:
                limit = int(query.split("limit=")[1].split("&")[0])
            except ValueError:
                pass
        history = _evolution_ledger.get_history(limit=limit)
        self._send_json(200, {"ok": True, "history": history, "count": len(history)})

    # ── Workflow CRUD + Webhook ─────────────────────

    def _handle_list_workflows(self):
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        workflows = get_store().list_workflows()
        for wf in workflows:
            wf["webhook_url"] = self._webhook_url(wf["webhook_token"])
        self._send_json(200, {"workflows": workflows, "count": len(workflows)})

    def _handle_get_workflow(self, workflow_id: str):
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        wf = get_store().get_workflow(workflow_id)
        if not wf:
            self._send_json(404, {"error": f"Workflow {workflow_id} not found"})
            return
        wf["webhook_url"] = self._webhook_url(wf["webhook_token"])
        self._send_json(200, wf)

    def _handle_create_workflow(self):
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        body, err = self._read_json_body()
        if err:
            code = 413 if "too large" in err.lower() else 400
            self._send_json(code, {"error": err})
            return
        nodes = (body or {}).get("nodes", [])
        if not nodes:
            self._send_json(400, {"error": "No nodes"})
            return
        wf = get_store().create_workflow(
            name=(body or {}).get("name", ""),
            requirement=(body or {}).get("requirement", ""),
            nodes=nodes,
            edges=(body or {}).get("edges", []),
        )
        wf["webhook_url"] = self._webhook_url(wf["webhook_token"])
        self._send_json(201, wf)

    def _handle_update_workflow(self, workflow_id: str):
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        body, err = self._read_json_body()
        if err:
            code = 413 if "too large" in err.lower() else 400
            self._send_json(code, {"error": err})
            return
        body = body or {}
        kwargs = {}
        for key in ("name", "requirement", "nodes", "edges"):
            if key in body:
                kwargs[key] = body[key]
        if "nodes" in kwargs and not kwargs["nodes"]:
            self._send_json(400, {"error": "No nodes"})
            return
        wf = get_store().update_workflow(workflow_id, **kwargs)
        if not wf:
            self._send_json(404, {"error": f"Workflow {workflow_id} not found"})
            return
        wf["webhook_url"] = self._webhook_url(wf["webhook_token"])
        self._send_json(200, wf)

    def _handle_delete_workflow(self, workflow_id: str):
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        if get_store().delete_workflow(workflow_id):
            self._send_json(200, {"deleted": True, "workflow_id": workflow_id})
        else:
            self._send_json(404, {"error": f"Workflow {workflow_id} not found"})

    def _handle_webhook_trigger(self, token: str):
        """Webhook 触发：URL token 即鉴权，无需 Bearer。"""
        wf = get_store().get_workflow_by_token(token)
        if not wf:
            self._send_json(404, {"error": "Workflow not found"})
            return
        body, err = self._read_json_body()
        if err:
            code = 413 if "too large" in err.lower() else 400
            self._send_json(code, {"error": err})
            return
        body = body or {}
        requirement = body.get("requirement") or wf["requirement"]
        run_id = _submit_run(
            requirement, wf["nodes"], wf["edges"], workflow_id=wf["workflow_id"]
        )
        print(f"[Webhook] Triggered {wf['workflow_id']} -> {run_id}", file=sys.stderr)
        self._send_json(202, {
            "run_id": run_id,
            "workflow_id": wf["workflow_id"],
            "status": "pending",
            "message": "Webhook triggered execution",
        })

    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        origin = self.headers.get("Origin", "")
        for k, v in self._cors_headers(origin).items():
            self.send_header(k, v)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    # ── Supervisor 多 Agent 路由 ────────────────────

    def handle_supervisor(self):
        """POST /api/supervisor — 多轮对话式编排。"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length > MAX_BODY_SIZE:
                self._send_json(413, {"error": "Request too large"})
                return
            body = json.loads(self.rfile.read(length))
            message = body.get("message", "")
            session_id = body.get("session_id", "")
        except (json.JSONDecodeError, ValueError, TypeError):
            self._send_json(400, {"error": "Invalid request"})
            return

        if not message:
            self._send_json(400, {"error": "Message is empty"})
            return

        try:
            result = _supervisor.process(message, session_id)
            self._send_json(200, result)
        except Exception as e:
            self._send_json(500, {"error": str(e)[:200]})

    # ── Provider 信息 ──────────────────────────────

    def _handle_list_providers(self):
        """GET /api/providers — 列出所有 provider 状态。"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        registry = get_registry()
        self._send_json(200, registry.to_dict())

    def log_message(self, format, *args):
        print(f"[AgentFlow] {args[0] if args else ''}", file=sys.stderr)


# ── 启动后台 worker 线程（模块加载时即启动，测试和正式运行都生效） ──
if not hasattr(_background_worker, "_started"):
    worker = threading.Thread(target=_background_worker, daemon=True, name="bg-worker")
    worker.start()
    _background_worker._started = True  # type: ignore[attr-defined]

if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer((HOST, PORT), AgentFlowHandler)
    print(f"AgentFlow v5 backend running on http://{HOST}:{PORT}", file=sys.stderr)
    print("API:", file=sys.stderr)
    print("  POST /api/decompose    — 编排分解 (同步)", file=sys.stderr)
    print("  POST /api/supervisor    — 多轮对话编排 (Supervisor Agent)", file=sys.stderr)
    print("  POST /api/runs         — 异步执行 (返回 run_id)", file=sys.stderr)
    print("  GET  /api/runs         — 执行历史", file=sys.stderr)
    print("  GET  /api/runs/<id>    — 单 run 详情", file=sys.stderr)
    print("  GET  /api/runs/<id>/events — SSE 实时事件流", file=sys.stderr)
    print("", file=sys.stderr)
    print("  [Self-Orchestration API]  — Agent 可通过以下端点反控编排", file=sys.stderr)
    print("  GET  /api/runs/<id>/nodes        — 节点拓扑+上下游", file=sys.stderr)
    print("  GET  /api/runs/<id>/nodes/<nid>  — 单节点详情", file=sys.stderr)
    print("  GET  /api/runs/<id>/edges        — DAG 边列表", file=sys.stderr)
    print("  POST /api/runs/<id>/nodes        — 动态新增节点", file=sys.stderr)
    print("  PATCH /api/runs/<id>/nodes/<nid> — 修改节点参数", file=sys.stderr)
    print("  DELETE /api/runs/<id>/nodes/<nid> — 删除节点(自动重连)", file=sys.stderr)
    print("  POST /api/runs/<id>/edges        — 新增依赖边", file=sys.stderr)
    print("  DELETE /api/runs/<id>/edges      — 删除依赖边", file=sys.stderr)
    print("  POST /api/runs/<id>/nodes/<nid>/retry — 重置节点重跑", file=sys.stderr)
    print("  POST /api/runs/<id>/reroute      — 批量调整 DAG", file=sys.stderr)
    print("  POST /api/runs/<id>/feedback     — Agent 提反馈", file=sys.stderr)
    print("", file=sys.stderr)
    print("  GET  /api/providers    — Provider 能力矩阵", file=sys.stderr)
    print("  GET  /api/workflows    — 工作流列表", file=sys.stderr)
    print("  POST /api/workflows    — 保存工作流", file=sys.stderr)
    print("  POST /api/hook/<token> — Webhook 触发执行", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down", file=sys.stderr)
