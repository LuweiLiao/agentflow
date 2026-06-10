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
from concurrent.futures import ThreadPoolExecutor, as_completed
from queue import Queue

from artifact_broker import get_broker
from agent_runner import AgentRunner
from agentflow_schema import (
    NodeDef,
    WorkflowJSON,
    validate_workflow,
)
from prompt_compiler import PromptCompiler
from run_store import extract_json, get_store, startup_scan
from sandbox_runner import get_runner

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 9600
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.environ.get("AGENTFLOW_STATIC_DIR", SCRIPT_DIR)
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
        )
        node_defs.append(nd)

    requirement = run["requirement"]
    edges_real = store.get_run_edges(run_id)
    work_dir = tempfile.mkdtemp(prefix=f"agentflow_{run_id}_")
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
        while not store.all_nodes_done(run_id):
            ready = store.get_pending_nodes(run_id)
            if not ready:
                # 检查是否有 failed 节点需要跳过其下游
                failed = store.count_status(run_id).get("failed", 0)
                if failed > 0:
                    # 标记所有 pending 的下游为 skipped（使用 workflow_edges 表）
                    for n in nodes_data:
                        if n["status"] == "pending":
                            upstream_ids = store.get_upstream(run_id, n["node_id"])
                            if upstream_ids:
                                for uid in upstream_ids:
                                    upstream_status = store.get_run(run_id)["nodes"]
                                    us = next((nn["status"] for nn in upstream_status
                                               if nn["node_id"] == uid), None)
                                    if us == "failed":
                                        store.update_node(run_id, n["node_id"],
                                            status="skipped", result=f"上游节点 {uid} 失败，跳过")
                                        break
                    # 再检查一次
                    ready = store.get_pending_nodes(run_id)
                if not ready:
                    break  # 死锁或全部完成

            # 并行执行就绪节点
            with ThreadPoolExecutor(max_workers=len(ready)) as pool:
                fut_to_nid = {}
                for rn in ready:
                    nid = rn["node_id"]
                    nd = node_map.get(nid)
                    if not nd:
                        continue
                    node_dir = os.path.join(work_dir, f"node_{nid}")
                    os.makedirs(node_dir, exist_ok=True)

                    # 编译当前节点的任务
                    wf = WorkflowJSON(
                        workflow_id=run_id,
                        name=requirement[:100],
                        global_context={
                            "goal": requirement,
                            "language": "zh-CN",
                            "constraints": [],
                        },
                        nodes=node_defs,
                        edges=edges_real,
                    )
                    layer_tasks = compiler.compile(wf, upstream_results=upstream_summaries)
                    task = next((t for t in layer_tasks if t.node_id == nid), None)
                    if not task:
                        continue

                    fut = pool.submit(
                        _execute_one_node, rn, task, node_dir, DEFAULT_AGENT_MODEL
                    )
                    fut_to_nid[fut] = nid

                for fut in as_completed(fut_to_nid):
                    nid = fut_to_nid[fut]
                    try:
                        result = fut.result()
                    except Exception as e:
                        result = {
                            "status": "error",
                            "result": f"执行异常: {e}",
                            "cost": 0, "duration_ms": 0, "turns": 0,
                            "model": DEFAULT_AGENT_MODEL, "provider": "",
                        }

                    status_raw = result.get("status", "error")
                    # 标准化状态值
                    status = "completed" if status_raw == "ok" else \
                             "failed" if status_raw in ("error", "timeout") else \
                             status_raw
                    cost = result.get("cost", 0)
                    dur = result.get("duration_ms", 0)
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

                    # 通过 ArtifactBroker 发布产物
                    output_dir = os.path.join(
                        store.envelopes_dir(run_id).replace("/envelopes", ""),
                        "outputs")
                    os.makedirs(output_dir, exist_ok=True)
                    full_output = result.get("output", "") or result.get("result", "")
                    output_path = os.path.join(output_dir, f"{nid}.txt")
                    with open(output_path, "w") as f:
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
                    except Exception as e:
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

        # 结算
        final_status = "completed"
        counts = store.count_status(run_id)
        if counts.get("failed", 0) > 0 or counts.get("timed_out", 0) > 0:
            final_status = "failed"
        store.update_run_totals(run_id, total_cost, total_dur)
        store.update_run_status(run_id, final_status)

    except Exception as e:
        store.update_run_status(run_id, "failed", str(e)[:500])
        print(f"[AsyncExec] Run {run_id} error: {e}", file=sys.stderr)
    finally:
        try:
            shutil.rmtree(work_dir)
        except OSError:
            pass


def _execute_one_node(node_row: dict, task, node_dir: str, default_model: str) -> dict:
    """执行单个节点（在线程池中运行，受全局并发限流）。"""
    with _global_semaphore:
        agent_model = node_row.get("model") or default_model
        agent = AgentRunner(model=agent_model)

    prompt = getattr(task, "prompt", "") or node_row.get("description", "") or "请完成分配的工作。"

    try:
        result = agent.execute(
            prompt=prompt,
            work_dir=node_dir,
            profile=node_row.get("profile", "dev"),
            tools_enabled=True,
            max_turns=getattr(task, "max_turns", 15),
            timeout=getattr(task, "timeout_s", 180),
        )
        return {
            "result": result.get("result", "完成"),
            "output": result.get("output", "") or "",
            "cost": result.get("cost", 0),
            "duration_ms": result.get("duration_ms", 0) or result.get("duration", 0),
            "status": result.get("status", "ok"),
            "turns": result.get("turns", 1),
            "model": result.get("model", agent_model),
            "provider": result.get("provider", ""),
        }
    except Exception as e:
        return {
            "status": "error",
            "result": str(e)[:500],
            "cost": 0, "duration_ms": 0, "turns": 0,
            "model": agent_model, "provider": "",
        }


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
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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

    def do_GET(self):
        url = self.path

        if url == "/api/runs":
            self._handle_list_runs()
            return
        if url.startswith("/api/runs/"):
            parts = url.split("/")
            run_id = parts[-1]
            if len(parts) >= 5 and parts[-2] == "events":
                self._handle_run_events(run_id)
            else:
                self._handle_get_run(run_id)
            return

        # 静态文件
        if url == "/" or url == "":
            url = "/canvas-demo.html"
        filepath = os.path.normpath(os.path.join(STATIC_DIR, url.lstrip("/")))
        allowed_prefix = os.path.normpath(STATIC_DIR) + os.sep
        if not (filepath.startswith(allowed_prefix) or filepath == os.path.normpath(STATIC_DIR)):
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
            origin = self.headers.get("Origin", "")
            for k, v in self._cors_headers(origin).items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(content)
        except OSError as e:
            self.send_error(404, str(e))

    def do_POST(self):
        url = self.path
        if url == "/api/decompose":
            self.handle_decompose()
        elif url == "/api/execute" or url == "/api/runs":
            self.handle_execute()
        elif url == "/api/execute/stream":
            self.handle_execute_stream()
        else:
            self.send_error(404)

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
            count = min(int(body.get("count", 5)), 20)
        except (json.JSONDecodeError, ValueError, TypeError):
            self._send_json(400, {"error": "Invalid request"})
            return

        if not requirement:
            self._send_json(400, {"error": "Requirement is empty"})

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
        if nodes and nodes[-1].get("profile") not in ("doc", "deploy"):
            nodes[-1]["profile"] = "doc"
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
        return (base * 20)[:count]

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
        wf_check = WorkflowJSON(
            workflow_id="validate",
            name=requirement[:100],
            global_context={"goal": requirement, "language": "zh-CN", "constraints": []},
            nodes=[NodeDef(id=n.get("id",""), icon=n.get("icon",""), label=n.get("label",""),
                           desc=n.get("desc",""), color=n.get("color",""), profile=n.get("profile","dev"))
                   for n in nodes],
            edges=edges,
        )
        validation_errors = validate_workflow(wf_check)
        if validation_errors:
            self._send_json(422, {"error": "invalid_workflow", "details": validation_errors})
            return

        # 将 edges 转为 depends_on 字段
        dep_map: dict[str, list[str]] = {}
        for e in edges:
            src, tgt = e.get("source"), e.get("target")
            dep_map.setdefault(tgt, []).append(src)

        for n in nodes:
            nid = n.get("id", "")
            if nid in dep_map:
                n["depends_on"] = dep_map[nid]
            else:
                n.setdefault("depends_on", [])

        # 持久化到 SQLite
        store = get_store()
        run_id = store.create_run(requirement, nodes, edges)

        # 入队异步执行
        _executor_queue.put(run_id)

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

        # 持久化
        dep_map = {}
        for e in edges:
            src, tgt = e.get("source"), e.get("target")
            dep_map.setdefault(tgt, []).append(src)
        for n in nodes:
            nid = n.get("id", "")
            dep_map.get(nid, [])
            n["depends_on"] = dep_map.get(nid, [])

        store = get_store()
        run_id = store.create_run(requirement, nodes)
        total_nodes = len(nodes)
        groups = self._compute_groups(nodes, edges)

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
        """SSE 端点：实时推送 run 内节点状态变更。"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        run = get_store().get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return

        self._send_sse_headers()

        last_states: dict[str, str] = {}
        poll_interval = 1.0
        max_wait = 600
        waited = 0

        try:
            while waited < max_wait:
                run = get_store().get_run(run_id)
                if not run:
                    break

                # 推送 run 级状态变更
                run_status = run.get("status", "unknown")
                for node in run.get("nodes", []):
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

                # run 完成时推送 workflow_done
                if run_status in ("completed", "failed"):
                    self._stream_send("workflow_done", {
                        "run_id": run_id,
                        "status": run_status,
                        "total_cost": run.get("total_cost", 0),
                        "total_duration": run.get("total_dur", 0),
                        "nodes": run.get("nodes", []),
                    })
                    break

                time.sleep(poll_interval)
                waited += poll_interval
        except BrokenPipeError:
            pass

    # ── Run 历史 API ───────────────────────────────

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
        self._send_json(200, run)

    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        origin = self.headers.get("Origin", "")
        for k, v in self._cors_headers(origin).items():
            self.send_header(k, v)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

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
    print("  POST /api/runs         — 异步执行 (返回 run_id)", file=sys.stderr)
    print("  GET  /api/runs/<id>/events — SSE 实时事件流", file=sys.stderr)
    print("  GET  /api/runs         — 执行历史", file=sys.stderr)
    print("  GET  /api/runs/<id>    — 单 run 详情", file=sys.stderr)
    print(f"Model: {DEFAULT_AGENT_MODEL}", file=sys.stderr)
    print("Features: Async exec + SQLite persistence + ThreadingHTTPServer", file=sys.stderr)
    print("           Bracket-balanced JSON + Static file whitelist", file=sys.stderr)
    print("           Failure propagation + Artifact references", file=sys.stderr)
    print("           Workflow snapshots + Normalized edges table", file=sys.stderr)
    print("           ArtifactBroker (content-addressed + access control)", file=sys.stderr)
    print("           SandboxRunner (Local + Docker) + Heartbeat/Lease", file=sys.stderr)
    print("           StartupScan + SSE streaming + Failure propagation", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down", file=sys.stderr)
