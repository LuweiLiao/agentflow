#!/usr/bin/env python3
"""AgentFlow 统一后端 — 异步执行引擎 + ThreadingHTTPServer + SQLite 持久化"""
import hmac
import http.server
import json
import os
import shutil
import signal
import sys
import tempfile
import threading
import time
import traceback
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
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

# R3-P0-7: 在模块加载时一次性设置 Agent 所需的环境变量（只写一次，
#          消除并发 setdefault 竞态）。Agent 进程内通过 os.environ.get 读取。
os.environ.setdefault("AGENTFLOW_API_URL", f"http://{HOST}:{PORT}")

# 全局并发控制
MAX_CONCURRENT_AGENTS = int(os.environ.get("AGENTFLOW_MAX_CONCURRENT", "10"))
MAX_BODY_SIZE = int(os.environ.get("AGENTFLOW_MAX_BODY_SIZE", str(512 * 1024)))
_global_semaphore = threading.Semaphore(MAX_CONCURRENT_AGENTS)

# Bug #12 FIX: 进程启动时间戳，用于 /health 的 uptime 计算。
_PROCESS_START_TIME = time.time()

# Bug #11 FIX: 错误码常量表。所有错误响应应附带稳定的数字 code，
# 便于前端/SDK 做分支处理（HTTP status 仍由响应码传递）。
# 命名规范：<CATEGORY>_<DETAIL>，数字范围：4XXYY / 5XXYY。
ERROR_CODES = {
    "INVALID_REQUEST":   40001,   # 请求格式/参数错误
    "UNAUTHORIZED":      40101,   # 未认证 / token 无效
    "FORBIDDEN":         40301,   # 鉴权通过但无权限（scope 拒绝等）
    "NOT_FOUND":         40401,   # 资源不存在
    "METHOD_NOT_ALLOWED":40501,   # HTTP 方法不支持
    "CONFLICT":          40901,   # 状态冲突（如重复创建）
    "PAYLOAD_TOO_LARGE": 41301,   # 请求体超限
    "UNPROCESSABLE":     42201,   # 语义错误（DAG 有环、schema 校验失败）
    "INTERNAL_ERROR":    50001,   # 服务端内部异常
    "BAD_GATEWAY":       50201,   # 上游 provider 调用失败
    "SCOPE_DENIED":      40302,   # 自编排 scope 校验拒绝
}

# P2 FIX: 工作流级成本上限。超过后中止执行并标记 run 为 'budget_exceeded'。
MAX_RUN_COST = float(os.environ.get("AGENTFLOW_MAX_RUN_COST", "10.0"))

# P3 FIX: 需求长度上限，与前端 MAX_REQUIREMENT_LEN 保持一致 (2000 字符)。
MAX_REQUIREMENT_LEN = int(os.environ.get("AGENTFLOW_MAX_REQUIREMENT_LEN", "2000"))

# P3 FIX: CORS 严格 origin 白名单。
# 优先读取 AGENTFLOW_ALLOWED_ORIGINS（逗号分隔列表）；如未设置，回退到
# 旧 AGENTFLOW_ALLOWED_ORIGIN（单值，可为 "*"）以保持向后兼容。
# 默认允许本机来源，便于本地开发。
_ALLOWED_ORIGINS_ENV = os.environ.get("AGENTFLOW_ALLOWED_ORIGINS", "")
if _ALLOWED_ORIGINS_ENV:
    ALLOWED_ORIGINS = frozenset(
        o.strip() for o in _ALLOWED_ORIGINS_ENV.split(",") if o.strip()
    )
    # 当白名单显式配置时，"*" 仍然被允许（运维显式选择开放模式）。
    ALLOW_WILDCARD = "*" in ALLOWED_ORIGINS
else:
    # 默认仅放行本机来源；保持与既有测试一致的默认行为。
    ALLOWED_ORIGINS = frozenset({
        "http://localhost", f"http://localhost:{PORT}",
        "http://127.0.0.1", f"http://127.0.0.1:{PORT}",
    })
    # 兼容旧 AGENTFLOW_ALLOWED_ORIGIN="*"
    _LEGACY = os.environ.get("AGENTFLOW_ALLOWED_ORIGIN", "")
    ALLOW_WILDCARD = (_LEGACY == "*")

# P3 FIX: 端点级请求体大小限制（字节）。未列出的端点使用全局 MAX_BODY_SIZE。
# 这避免了单个保守阈值限制大 payload 端点（如 execute 允许完整 DAG JSON）
# 同时收紧小文本端点（如 decompose 只接受 requirement 文本）。
ENDPOINT_BODY_LIMITS = {
    "/api/decompose": int(os.environ.get("AGENTFLOW_MAX_BODY_DECOMPOSE", str(10 * 1024))),       # 10 KB
    "/api/supervisor": int(os.environ.get("AGENTFLOW_MAX_BODY_SUPERVISOR", str(64 * 1024))),     # 64 KB
    "/api/execute": int(os.environ.get("AGENTFLOW_MAX_BODY_EXECUTE", str(1024 * 1024))),          # 1 MB
    "/api/execute/stream": int(os.environ.get("AGENTFLOW_MAX_BODY_EXECUTE", str(1024 * 1024))),   # 1 MB
}


def _body_limit_for(path: str) -> int:
    """Return the per-endpoint body size limit, falling back to MAX_BODY_SIZE.

    The effective limit is min(endpoint_limit, MAX_BODY_SIZE): the per-endpoint
    value is a tighter cap, while MAX_BODY_SIZE remains a global ceiling (so
    lowering it for testing/ops affects all endpoints uniformly).
    """
    endpoint_limit = ENDPOINT_BODY_LIMITS.get(path)
    if endpoint_limit is None:
        return MAX_BODY_SIZE
    return min(endpoint_limit, MAX_BODY_SIZE)


# P3 FIX: OpenAPI 3.1 文档生成。
# 手动维护的端点描述，供 /api/docs 返回。新增端点时应同步更新此处。
def _build_openapi_spec() -> dict:
    """Return a minimal OpenAPI 3.1 spec describing all AgentFlow API endpoints."""
    return {
        "openapi": "3.1.0",
        "info": {
            "title": "AgentFlow API",
            "version": "5.0",
            "description": "异步 Agent DAG 执行引擎 + 自编排 API",
        },
        "servers": [{"url": f"http://{HOST}:{PORT}"}],
        "components": {
            "securitySchemes": {
                "bearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "description": "当 AGENTFLOW_API_TOKEN 设置时需要 Bearer token",
                }
            }
        },
        "paths": {
            "/health": {"get": {"summary": "健康检查", "tags": ["system"]}},
            "/api/docs": {"get": {"summary": "OpenAPI 3.1 规范", "tags": ["system"]}},
            "/api/status": {"get": {"summary": "运行时配置状态", "tags": ["system"]}},
            "/api/providers": {"get": {"summary": "Provider 能力矩阵", "tags": ["system"]}},
            "/api/decompose": {"post": {"summary": "编排分解（同步）", "tags": ["orchestration"]}},
            "/api/supervisor": {"post": {"summary": "多轮对话编排", "tags": ["orchestration"]}},
            "/api/runs": {
                "get": {"summary": "执行历史列表", "tags": ["runs"]},
                "post": {"summary": "异步执行（返回 run_id）", "tags": ["runs"]},
            },
            "/api/runs/{run_id}": {
                "get": {"summary": "单 run 详情", "tags": ["runs"]},
                "delete": {"summary": "取消/停止 run", "tags": ["runs"]},
            },
            "/api/runs/{run_id}/events": {"get": {"summary": "SSE 实时事件流", "tags": ["runs"]}},
            "/api/runs/{run_id}/nodes": {
                "get": {"summary": "节点拓扑+上下游", "tags": ["self-orchestration"]},
                "post": {"summary": "动态新增节点", "tags": ["self-orchestration"]},
            },
            "/api/runs/{run_id}/nodes/{node_id}": {
                "get": {"summary": "单节点详情", "tags": ["self-orchestration"]},
                "patch": {"summary": "修改节点参数", "tags": ["self-orchestration"]},
                "delete": {"summary": "删除节点（自动重连）", "tags": ["self-orchestration"]},
            },
            "/api/runs/{run_id}/nodes/{node_id}/retry": {
                "post": {"summary": "重置节点重跑", "tags": ["self-orchestration"]},
            },
            "/api/runs/{run_id}/edges": {
                "get": {"summary": "DAG 边列表", "tags": ["self-orchestration"]},
                "post": {"summary": "新增依赖边", "tags": ["self-orchestration"]},
                "delete": {"summary": "删除依赖边", "tags": ["self-orchestration"]},
            },
            "/api/runs/{run_id}/reroute": {"post": {"summary": "批量调整 DAG", "tags": ["self-orchestration"]}},
            "/api/runs/{run_id}/feedback": {"post": {"summary": "Agent 提反馈", "tags": ["self-orchestration"]}},
            "/api/runs/{run_id}/evolve": {"post": {"summary": "手动触发进化分析", "tags": ["evolution"]}},
            "/api/runs/{run_id}/evolution": {"get": {"summary": "获取进化报告", "tags": ["evolution"]}},
            "/api/runs/{run_id}/upgrade": {"post": {"summary": "升级门控全流程", "tags": ["evolution"]}},
            "/api/runs/{run_id}/resume": {"post": {"summary": "重置节点及下游为 pending（replay）", "tags": ["runs"]}},
            "/api/runs/{run_id}/clone": {"post": {"summary": "从现有 run 快照克隆新 run", "tags": ["runs"]}},
            "/api/runs/{run_id}/artifacts": {"get": {"summary": "列出 run 所有产物", "tags": ["runs"]}},
            "/api/runs/compare": {"get": {"summary": "对比两个 run", "tags": ["runs"]}},
            "/api/evolution/stats": {"get": {"summary": "聚合进化统计", "tags": ["evolution"]}},
            "/api/evolution/history": {"get": {"summary": "进化账本历史", "tags": ["evolution"]}},
            "/api/workflows": {
                "get": {"summary": "工作流列表", "tags": ["workflows"]},
                "post": {"summary": "保存工作流", "tags": ["workflows"]},
            },
            "/api/workflows/{workflow_id}": {
                "get": {"summary": "获取工作流", "tags": ["workflows"]},
                "put": {"summary": "更新工作流", "tags": ["workflows"]},
                "delete": {"summary": "删除工作流", "tags": ["workflows"]},
            },
            "/api/workflows/{workflow_id}/versions": {
                "get": {"summary": "工作流版本列表", "tags": ["workflows"]},
            },
            "/api/workflows/{workflow_id}/templatize": {
                "post": {"summary": "将工作流转为可复用模板", "tags": ["workflows"]},
            },
            "/api/admin/backup": {"post": {"summary": "创建 SQLite 一致性备份", "tags": ["admin"]}},
            "/api/hook/{token}": {"post": {"summary": "Webhook 触发执行", "tags": ["webhook"]}},
        },
        "tags": [
            {"name": "system"},
            {"name": "orchestration"},
            {"name": "runs"},
            {"name": "self-orchestration"},
            {"name": "evolution"},
            {"name": "workflows"},
            {"name": "admin"},
            {"name": "webhook"},
        ],
    }


def _validate_id(id_str: str) -> bool:
    """R3-P0-4: Reject IDs containing path traversal characters.

    Used to validate run_id / node_id / workflow_id before they are joined
    into filesystem paths. Any ID containing '..', '/', or '\\\\' is rejected.
    """
    if not id_str:
        return False
    return ".." not in id_str and "/" not in id_str and "\\" not in id_str


# ── Bug #6 FIX: 基于 dataclass 的请求体验证 ────────────
# 为高风险 POST 端点提供显式类型检查 + 范围校验，替代散落的 if 判断。
# 验证失败时抛出 ValidationError，由 handler 统一转 400 响应。
class ValidationError(ValueError):
    """请求体验证失败。message 直接作为客户端错误响应。"""


@dataclass
class DecomposeRequest:
    """POST /api/decompose 请求体校验模型。

    与前端 MAX_REQUIREMENT_LEN (2000) 和 node count 上限 (100) 保持一致。
    """
    requirement: str = ""
    count: int = 5

    @classmethod
    def from_body(cls, body: dict) -> "DecomposeRequest":
        if not isinstance(body, dict):
            raise ValidationError("Request body must be a JSON object")
        requirement = body.get("requirement", "")
        if not isinstance(requirement, str):
            raise ValidationError("requirement must be a string")
        if not requirement.strip():
            raise ValidationError("Requirement is empty")
        if len(requirement) > MAX_REQUIREMENT_LEN:
            raise ValidationError(
                f"Requirement too long ({len(requirement)} > {MAX_REQUIREMENT_LEN})"
            )
        count_raw = body.get("count", 5)
        try:
            count = int(count_raw)
        except (TypeError, ValueError):
            raise ValidationError("count must be an integer")
        # 范围验证：clamp 到 1..100（与 test_decompose_count_clamped_to_100
        # 既有契约一致 —— 超出范围不报错而是截断，避免 LLM 拆解被拒）。
        count = max(1, min(count, 100))
        return cls(requirement=requirement, count=count)


@dataclass
class ExecuteRequest:
    """POST /api/execute (或 /api/runs) 请求体校验模型。"""
    nodes: list = field(default_factory=list)
    edges: list = field(default_factory=list)
    requirement: str = ""
    workflow_id: str = ""

    @classmethod
    def from_body(cls, body: dict) -> "ExecuteRequest":
        if not isinstance(body, dict):
            raise ValidationError("Request body must be a JSON object")
        nodes = body.get("nodes", [])
        if not isinstance(nodes, list):
            raise ValidationError("nodes must be an array")
        if len(nodes) == 0:
            raise ValidationError("No nodes")
        # 范围验证：单 run 最多 200 节点（防止滥用导致 DB 爆炸）
        if len(nodes) > 200:
            raise ValidationError(f"Too many nodes ({len(nodes)} > 200)")
        edges = body.get("edges", [])
        if edges is not None and not isinstance(edges, list):
            raise ValidationError("edges must be an array")
        requirement = body.get("requirement", "")
        if not isinstance(requirement, str):
            raise ValidationError("requirement must be a string")
        if len(requirement) > MAX_REQUIREMENT_LEN:
            raise ValidationError(
                f"Requirement too long ({len(requirement)} > {MAX_REQUIREMENT_LEN})"
            )
        workflow_id = body.get("workflow_id", "")
        if not isinstance(workflow_id, str):
            raise ValidationError("workflow_id must be a string")
        return cls(nodes=nodes, edges=edges or [], requirement=requirement,
                   workflow_id=workflow_id)


# ── 结构化日志 helper ────────────────────────────────────
# P2 FIX: 轻量级结构化日志，替代关键路径的 print() 调用。
# 输出 ISO 时间戳 + 级别 + 消息 + 可选的 run_id/node_id 上下文。
def _log(level: str, msg: str, run_id: str = None, node_id: str = None, **kwargs):
    """Structured logging helper.

    Args:
        level: Log level (INFO, WARN, ERROR, DEBUG).
        msg: Log message.
        run_id: Optional run context.
        node_id: Optional node context.
        **kwargs: Additional structured fields appended as key=value.
    """
    ts = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime())
    parts = [f"[{ts}Z]", f"[{level.upper()}]"]
    if run_id:
        parts.append(f"[run={run_id}]")
    if node_id:
        parts.append(f"[node={node_id}]")
    parts.append(msg)
    for k, v in kwargs.items():
        parts.append(f"{k}={v}")
    print(" ".join(parts), file=sys.stderr)

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
        _log("ERROR", f"Event persistence failed type={event_type}: {exc}",
             run_id=run_id, tag="RunEventPersistence")
        traceback.print_exc(file=sys.stderr)
        raise
    return ev


def _run_workspace(run_id: str) -> str:
    """Return durable per-run workspace path. Never use ephemeral /tmp for run artifacts."""
    path = os.path.join(SCRIPT_DIR, ".agentflow", "workspaces", run_id)
    os.makedirs(path, exist_ok=True)
    # R3-P0-10: 启动时清理超过 24 小时的旧 workspace 目录，防止磁盘无限增长。
    _cleanup_old_workspaces()
    return path


# R3-P0-10: workspace 清理状态锁，避免多线程并发清理。
_workspace_cleanup_lock = threading.Lock()


def _cleanup_old_workspaces(max_age_seconds: int = 86400):
    """删除超过 max_age_seconds 的 workspace 子目录（best-effort）。

    Bug #4 FIX: 改为可重复调用 — 每次 _run_workspace 入口和后台周期任务
    都会触发扫描。异常静默忽略，避免清理失败影响主流程。
    """
    with _workspace_cleanup_lock:
        ws_root = os.path.join(SCRIPT_DIR, ".agentflow", "workspaces")
        if not os.path.isdir(ws_root):
            return
        now = time.time()
        try:
            for name in os.listdir(ws_root):
                dpath = os.path.join(ws_root, name)
                if not os.path.isdir(dpath):
                    continue
                try:
                    mtime = os.path.getmtime(dpath)
                except OSError:
                    continue
                if (now - mtime) > max_age_seconds:
                    shutil.rmtree(dpath, ignore_errors=True)
        except OSError:
            pass


def _workspace_cleanup_loop(interval_seconds: int = 600):
    """周期性 workspace 清理守护线程（默认每 10 分钟扫描一次）。

    Bug #4 FIX: 替代旧的「进程生命周期内一次性扫描」策略，
    确保长期运行的服务不会积累过期 workspace。
    """
    _log("INFO", f"Workspace cleanup daemon started (interval={interval_seconds}s)",
         tag="WorkspaceCleanup")
    while True:
        try:
            _cleanup_old_workspaces()
        except Exception as e:
            _log("ERROR", f"Workspace cleanup iteration failed: {e}",
                 tag="WorkspaceCleanup")
        time.sleep(interval_seconds)


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

    F08 FIX: Only copy into namespaced input/ subdirectories to guarantee
    deterministic fan-in. The previous root-level overlay caused non-deterministic
    file overwrites when multiple upstreams had same-named files.

    For single-upstream nodes, we also symlink/copy to the node root for
    backward compatibility with agents that expect files at cwd.
    """
    upstream_ids = sorted(store.get_upstream(run_id, node_id))
    for upstream_id in upstream_ids:
        upstream_dir = os.path.join(run_workspace, f"node_{upstream_id}")
        # Always copy to namespaced input directory — deterministic, no conflicts
        _copy_tree_contents(upstream_dir, os.path.join(node_dir, "input", f"node_{upstream_id}"))

    # Single-upstream backward compat: also copy to node root (no conflict possible)
    if len(upstream_ids) == 1:
        upstream_dir = os.path.join(run_workspace, f"node_{upstream_ids[0]}")
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
    try:
        scan_result = startup_scan()
        if scan_result["pending_resumed"]:
            _log("INFO", f"发现 {len(scan_result['pending_resumed'])} 个 pending run",
                 tag="StartupScan")
            for rid in scan_result["pending_resumed"]:
                _executor_queue.put(rid)
        if scan_result["stale_marked"]:
            _log("WARN", f"标记 {len(scan_result['stale_marked'])} 个 stale run 为 failed",
                 tag="StartupScan")
    except Exception as e:
        _log("ERROR", f"启动扫描异常: {e}", tag="StartupScan")

    while True:
        run_id = _executor_queue.get()
        try:
            _execute_run(run_id)
        except Exception as e:
            _store.update_run_status(run_id, "failed", str(e)[:500])
            _log("ERROR", f"Run failed: {e}", run_id=run_id, tag="BackgroundWorker")
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

    # R3-P0-11: 线程池在 while 循环外部创建并复用，避免每次 batch 都
    #          创建/销毁 ThreadPoolExecutor 造成线程资源泄漏。
    _run_pool = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_AGENTS)
    try:
        dag_version = store.get_dag_version(run_id)
        while not store.all_nodes_done(run_id):
            # F46 FIX: check if run was cancelled by user (DELETE /api/runs/{rid})
            run_status_check = store.get_run(run_id) or {}
            if run_status_check.get("status") == "cancelled":
                _log("INFO", "Run cancelled by user, stopping", run_id=run_id, tag="AsyncExec")
                break

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
                    # R3-P0-12: 限制最大迭代次数，防止 DAG 异常时死循环。
                    _MAX_SKIP_ITER = min(len(all_nodes) + 1, 1000)  # P2 fix: bound to actual node count
                    changed = True
                    for _skip_iter in range(_MAX_SKIP_ITER):
                        if not changed:
                            break
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
                    else:
                        _log("WARN", f"skip-propagation hit max iterations ({_MAX_SKIP_ITER})",
                             run_id=run_id, tag="AsyncExec")
                    # 再检查一次
                    ready = store.get_pending_nodes(run_id)
                if not ready:
                    # F31 FIX: backoff retry before declaring deadlock.
                    # 瞬时竞态可能导致 get_pending_nodes 暂时返回空（如某节点刚
                    # completed 但状态尚未传播）。最多重试 2 次，每次 sleep 0.5s。
                    for _backoff in range(2):
                        time.sleep(0.5)
                        ready = store.get_pending_nodes(run_id)
                        if ready:
                            break
                if not ready:
                    counts_now = store.count_status(run_id)
                    if counts_now.get("pending", 0) > 0 or counts_now.get("running", 0) > 0:
                        _fail_unready_pending_nodes(
                            store,
                            run_id,
                            "no ready nodes while workflow still has unfinished nodes",
                        )
                    break  # 死锁或全部完成

            # F13/F29 FIX: Parallel execution of independent ready nodes.
            # Each node has its own isolated node_dir (F08 fix ensures no fan-in
            # conflicts). Global semaphore limits concurrency. Events are thread-safe.
            # Prepare all ready nodes first (sequential, fast), then execute in parallel.
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
            task_map = {t.node_id: t for t in layer_tasks}

            # Phase 1: Prepare all ready nodes (sequential — fast I/O + compilation)
            prepared_nodes = []
            for rn in sorted(ready, key=lambda n: str(n.get("node_id", ""))):
                nid = rn["node_id"]
                nd = node_map.get(nid)
                if not nd:
                    continue
                task = task_map.get(nid)
                if not task:
                    continue
                node_dir = os.path.join(work_dir, f"node_{nid}")
                os.makedirs(node_dir, exist_ok=True)
                _materialize_upstream_artifacts(store, run_id, nid, work_dir, node_dir)
                # P1 FIX: Atomic transition pending→running via optimistic lock,
                # eliminating the TOCTOU race where two workers could grab the
                # same ready node. If another worker already claimed it, skip.
                if not store.transition_node_status(run_id, nid, "pending", "running"):
                    _log("DEBUG", "Node already claimed, skipping", run_id=run_id, node_id=nid, tag="AsyncExec")
                    continue
                _publish_event(run_id, "node_start",
                    node_id=nid,
                    payload={
                        "label": nd.get("label", ""),
                        "profile": nd.get("profile", "dev"),
                        "status": "running",
                    })
                current_run_for_params = store.get_run(run_id) or {}
                current_node_for_params = next(
                    (x for x in current_run_for_params.get("nodes", []) if x.get("node_id") == nid),
                    node_map.get(nid) or {},
                )
                node_params = current_node_for_params.get("params", {}) or {}
                task.prompt = _append_feedback_to_prompt(task.prompt, node_params)
                rn["agent_type"] = node_params.get("agent_type", "standard")
                rn["max_budget"] = node_params.get("max_budget", 0.5)
                prepared_nodes.append((rn, nd, task, node_dir, node_params))

            # Phase 2: Execute all prepared nodes in parallel
            def _exec_node(args):
                rn_inner, task_inner, node_dir_inner = args
                try:
                    return (rn_inner, task_inner, node_dir_inner,
                            _execute_one_node(rn_inner, task_inner, node_dir_inner,
                                              DEFAULT_AGENT_MODEL, run_id))
                except Exception as e:
                    return (rn_inner, task_inner, node_dir_inner, {
                        "status": "error",
                        "result": f"执行异常: {e}",
                        "cost": 0, "duration_ms": 0, "turns": 0,
                        "model": DEFAULT_AGENT_MODEL, "provider": "",
                    })

            exec_args = [(rn, task, node_dir) for rn, nd, task, node_dir, _ in prepared_nodes]

            if len(exec_args) <= 1:
                # Single node — no need for thread pool overhead
                exec_results = [_exec_node(exec_args[0])] if exec_args else []
            else:
                # R3-P0-11: 复用循环外创建的 _run_pool，而非每次创建新池。
                exec_results = list(_run_pool.map(_exec_node, exec_args))

            # Phase 3: Post-process results sequentially (quality gate, store, events)
            dag_bumped = False
            for (rn, nd, task, node_dir, node_params_pre) in prepared_nodes:
                nid = rn["node_id"]
                # Find matching result
                matching = [(r, t, d, res) for r, t, d, res in exec_results if r.get("node_id") == nid]
                if not matching:
                    continue
                _, task, node_dir, result = matching[0]

                # QualityGate 检查 + Retry
                from quality_gate import QualityGate
                qgate = QualityGate()
                max_attempts = 2
                attempt = 0
                # F32 FIX: accumulate ALL attempt costs, not just the last one
                attempt_costs = [result.get("cost", 0)]
                attempt_durs = [result.get("duration_ms", 0)]
                while True:
                    attempt += 1
                    status_raw = result.get("status", "error")
                    status = "completed" if status_raw == "ok" else \
                             "failed" if status_raw in ("error", "timeout") else \
                             status_raw

                    # F46 FIX: check if run was cancelled by user
                    run_check = store.get_run(run_id) or {}
                    if run_check.get("status") == "cancelled":
                        status = "cancelled"
                        break

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
                    # F32 FIX: accumulate retry cost
                    attempt_costs.append(result.get("cost", 0))
                    attempt_durs.append(result.get("duration_ms", 0))
                    _log("INFO", f"Node retry {attempt}/{max_attempts}: {qr.reason}",
                         run_id=run_id, node_id=nid, tag="AsyncExec")

                # F32 FIX: use accumulated costs from ALL attempts
                cost = sum(attempt_costs)
                dur = sum(attempt_durs)
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
                        _log("INFO", f"Workflow feedback loop scheduled -> {node_params.get('loop_to')}",
                             run_id=run_id, node_id=nid, tag="AsyncExec")
                        continue
                    status = "failed"
                    result["error"] = qr.reason
                    if not result.get("result"):
                        result["result"] = qr.reason
                total_cost += cost
                total_dur += dur

                # P2 FIX: 工作流成本上限检查。超过 MAX_RUN_COST 时中止执行。
                if total_cost > MAX_RUN_COST:
                    _log("WARN", f"Run exceeded cost ceiling ${total_cost:.4f} > ${MAX_RUN_COST:.4f}, aborting",
                         run_id=run_id, tag="BudgetControl")
                    _publish_event(
                        run_id,
                        "budget_exceeded",
                        payload={"total_cost": total_cost, "limit": MAX_RUN_COST},
                    )
                    # 将剩余 pending/running 节点标记为 skipped
                    for _n in (store.get_run(run_id) or {}).get("nodes", []):
                        if _n.get("status") in ("pending", "running"):
                            store.update_node(
                                run_id,
                                _n["node_id"],
                                status="skipped",
                                result=f"工作流预算超限 (${total_cost:.4f} > ${MAX_RUN_COST:.4f})",
                            )
                    store.update_run_status(run_id, "budget_exceeded")
                    break

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
                        "label": nd.get("label", ""),
                        "profile": nd.get("profile", "dev"),
                        "status": status,
                        "cost": cost,
                        "duration_ms": dur,
                        "turns": result.get("turns", 0),
                        "result": result.get("result", "")[:2000],  # P2 fix: was 500
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
                    summary = (full_output[:2000] + "...") if len(full_output) > 2000 else full_output
                    upstream_summaries[nid] = json.dumps({
                        "summary": summary,
                        "artifact": art_ref.to_dict(),
                    }, ensure_ascii=False)
                except Exception as broker_err:
                    # fallback: 仍用文件路径
                    _log("WARN", f"ArtifactBroker publish failed: {broker_err}",
                         run_id=run_id, node_id=nid, tag="ArtifactBroker")
                    summary = (full_output[:2000] + "...") if len(full_output) > 2000 else full_output
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

                _log("INFO", f"Node: {status}", run_id=run_id, node_id=nid,
                     cost=f"${cost:.6f}", duration=f"{dur}ms", tag="AsyncExec")

                # 检查 DAG 是否被 Agent 在运行中修改过
                if store.get_dag_version(run_id) > dag_version:
                    dag_version = store.get_dag_version(run_id)
                    _log("INFO", f"DAG version bumped to {dag_version}, re-evaluating",
                         run_id=run_id, tag="AsyncExec")
                    dag_bumped = True
                    break  # 跳出 Phase 3 后处理循环，外层 while 重新准备 ready

        # 结算
        final_status = "completed"
        counts = store.count_status(run_id)
        # F46 FIX: handle cancelled status
        run_status_final = store.get_run(run_id) or {}
        if run_status_final.get("status") == "cancelled":
            final_status = "cancelled"
        elif run_status_final.get("status") == "budget_exceeded":
            # P2 FIX: preserve budget_exceeded status set during execution
            final_status = "budget_exceeded"
        elif counts.get("failed", 0) > 0 or counts.get("timed_out", 0) > 0:
            final_status = "failed"
        # Bug #14 FIX: detect orphaned running/pending nodes
        elif counts.get("running", 0) > 0 or counts.get("pending", 0) > 0:
            final_status = "failed"
        store.update_run_totals(run_id, total_cost, total_dur)
        store.update_run_status(run_id, final_status)
        _publish_event(run_id,
            "run_done" if final_status == "completed" else "run_failed",
            payload={"status": final_status, "total_cost": total_cost,
                     "total_dur": total_dur, "total_duration": total_dur})

        # Phase 2A: Auto-trigger evolution analysis on failed runs
        if final_status != "completed":
            try:
                _run_evolution_analysis(run_id)
            except Exception as ev_err:
                _log("ERROR", f"Auto-analysis failed: {ev_err}", run_id=run_id, tag="Evolution")

    except Exception as e:
        store.update_run_status(run_id, "failed", str(e)[:500])
        _log("ERROR", f"Run error: {e}", run_id=run_id, tag="AsyncExec")
    finally:
        # R3-P0-11: 确保线程池在 run 结束后关闭（无论成功/失败/异常）。
        _run_pool.shutdown(wait=False)


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
    except Exception as ledger_err:
        # P2 FIX: log instead of silently swallowing
        _log("WARN", f"record_analysis failed: {ledger_err}", run_id=run_id, tag="EvolutionLedger")
    _log("INFO", f"Evolution report: {len(report_dict.get('attributions', []))} attributions, "
         f"{len(report_dict.get('proposals', []))} proposals (v{version})",
         run_id=run_id, tag="Evolution")
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
    except OSError as walk_err:
        # P2 FIX: log instead of silently returning partial results
        _log("WARN", f"walk failed: {walk_err}", tag="WorkspaceSnapshot")
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
        # P3 FIX #8: per-node model override. node_row["model"] 是 DB 存储的
        # 顶层 model 字段（来自 decompose/inspector 编辑），params.agent_model
        # 是前端 InspectorPanel 提供的 finer-grained 覆盖。优先级：
        #   node_row["model"] > params.agent_model > default_model
        node_params_raw = node_row.get("params", {}) or {}
        agent_model = (
            node_row.get("model")
            or node_params_raw.get("agent_model")
            or default_model
        )
        agent_type = node_row.get("agent_type", "standard")

        # F64 FIX: write env scope to a thread-local manifest file instead of
        # mutating os.environ (which is process-global and races with concurrent
        # node executions). The agent reads its scope from this file via the
        # AGENTFLOW_SCOPE_FILE env var (set once at startup, not per-request).
        agent_scope = node_params_raw.get("scope", "self")
        scope_data = {
            "run_id": run_id or "",
            "node_id": node_row.get("node_id", ""),
            "scope": agent_scope,
            "dag_version": str(_store.get_dag_version(run_id)) if run_id else "0",
            "api_url": f"http://{HOST}:{PORT}",
        }
        scope_dir = os.path.dirname(node_dir) if node_dir else "/tmp"
        # R3-P0-4: 校验 run_id / node_id 不含路径穿越字符，防止写入任意路径。
        safe_run = run_id if (not run_id or _validate_id(run_id)) else "x"
        safe_node = node_row.get("node_id", "x")
        if not _validate_id(safe_node):
            safe_node = "x"
        scope_file = os.path.join(scope_dir, f".scope_{safe_run}_{safe_node}.json")
        try:
            with open(scope_file, "w") as sf:
                json.dump(scope_data, sf)
        except OSError:
            pass  # scope file is best-effort
        # R3-P0-7: 不再在每次 _execute_one_node 调用中 setdefault 环境变量，
        #          消除多线程并发写 os.environ 的竞态。AGENTFLOW_API_URL 已在
        #          模块初始化时设置；scope 路径由 per-node 文件传递。

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


def _health_payload() -> dict:
    """Bug #12 FIX: 增强 /health 返回运维指标（active_runs/queue_depth/db_size/uptime）。

    所有指标都是 best-effort：单条指标采集失败不影响整体 200 响应。
    """
    payload = {"status": "ok", "version": "5.0"}
    # uptime
    try:
        payload["uptime_seconds"] = round(time.time() - _PROCESS_START_TIME, 1)
    except Exception:
        pass
    # queue depth（执行队列积压）
    try:
        payload["queue_depth"] = _executor_queue.qsize()
    except Exception:
        pass
    # active runs（running + pending 数量，反映当前负载）
    try:
        store = get_store()
        active = store._read(
            "SELECT COUNT(*) AS c FROM runs WHERE status IN ('running','pending')"
        )
        payload["active_runs"] = int(active[0]["c"]) if active else 0
    except Exception:
        pass
    # DB 文件大小
    try:
        from run_store import DB_PATH
        if os.path.isfile(DB_PATH):
            payload["db_size_bytes"] = os.path.getsize(DB_PATH)
    except Exception:
        pass
    return payload


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

    def _check_id(self, id_str: str, label: str = "id") -> str | None:
        """R3-P0-4: Validate a path parameter ID for traversal safety.

        Returns the ID if valid, otherwise sends a 400 and returns None
        (the caller should ``return`` immediately on None).
        """
        if not _validate_id(id_str):
            self._send_json(400, {"error": f"Invalid {label}: path traversal rejected"})
            return None
        return id_str

    # ── P3 FIX: 请求 ID 追踪 + 全局异常中间件 ──────────
    def _begin_request(self):
        """在每个请求开始时调用：生成/提取 X-Request-ID，存到 self.request_id。"""
        # 优先信任客户端传入的 X-Request-ID（便于跨服务追踪），否则生成新 UUID。
        incoming = self.headers.get("X-Request-ID", "").strip()
        if incoming and _validate_id(incoming):
            self.request_id = incoming
        else:
            self.request_id = uuid.uuid4().hex[:16]

    def _handle_uncaught(self, exc: Exception):
        """全局异常兜底：返回结构化 500 响应而非裸堆栈。

        仅在 do_X 外层 try/except 中调用。已发送响应（BrokenPipe 等）时静默忽略。
        """
        rid = getattr(self, "request_id", "unknown")
        tb = traceback.format_exc()
        _log("ERROR", f"Unhandled exception: {exc!r}",
             tag="UnhandledException", request_id=rid, traceback=tb[:500])
        try:
            # Bug #11 FIX: 使用 _send_error 统一错误码表。
            self._send_error(500, "INTERNAL_ERROR",
                             message=str(exc)[:200])
        except Exception:
            # 响应已部分发送或连接已断开，无法再写入 — 静默忽略。
            pass

    def _cors_headers(self, origin: str = "") -> dict:
        # P3 FIX: 严格 origin 白名单（替代通配符回退）。
        # 规则：
        #   1. 若 AGENTFLOW_ALLOWED_ORIGINS 显式配置（含 "*"），按白名单校验；
        #   2. 否则按默认本机来源列表校验；
        #   3. 命中白名单的 origin 原样回显，否则回退到默认 origin（localhost），
        #      避免 "*" 通配符泄露给任意站点。
        _DEFAULT_ORIGIN = "http://localhost"
        if ALLOW_WILDCARD:
            origin_val = origin or _DEFAULT_ORIGIN
            if origin_val == "":
                origin_val = "*"
        elif origin and origin in ALLOWED_ORIGINS:
            origin_val = origin
        else:
            origin_val = _DEFAULT_ORIGIN
        return {
            "Access-Control-Allow-Origin": origin_val,
            "Access-Control-Allow-Methods": "POST, GET, HEAD, OPTIONS, PATCH, DELETE",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-ID",
            "Access-Control-Expose-Headers": "X-Request-ID",
        }

    def _require_auth(self) -> bool:
        if not AGENTFLOW_API_TOKEN:
            return True
        # P1 FIX: 使用 hmac.compare_digest 进行常量时间比较，防止时序侧信道
        # 攻击者通过响应耗时逐字节爆破 API token。
        auth = self.headers.get("Authorization", "")
        expected_bearer = f"Bearer {AGENTFLOW_API_TOKEN}"
        if auth.startswith("Bearer ") and hmac.compare_digest(auth, expected_bearer):
            return True
        api_key = self.headers.get("X-API-Key", "")
        if api_key and hmac.compare_digest(api_key, AGENTFLOW_API_TOKEN):
            return True
        return False

    def do_OPTIONS(self):
        self._begin_request()
        try:
            self._do_options_impl()
        except Exception as e:
            self._handle_uncaught(e)

    def _do_options_impl(self):
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
        # P2 FIX: resolve symlinks before prefix check to prevent path traversal
        # via symlink chains pointing outside STATIC_DIR / SCRIPT_DIR.
        filepath_real = os.path.realpath(filepath)
        static_real = os.path.realpath(STATIC_DIR)
        script_real = os.path.realpath(SCRIPT_DIR)
        if not (filepath_real.startswith(static_real + os.sep) or
                filepath_real == static_real or
                filepath_real.startswith(script_real + os.sep) or
                filepath_real == script_real):
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
            self._apply_security_headers()
            self.end_headers()
            if send_body:
                self.wfile.write(content)
        except OSError as e:
            self.send_error(404, str(e))

    def do_HEAD(self):
        self._begin_request()
        try:
            self._do_head_impl()
        except Exception as e:
            self._handle_uncaught(e)

    def _do_head_impl(self):
        path = _api_path(self.path)
        if path.startswith("/api/"):
            self.send_error(405, "Method Not Allowed")
            return
        self._serve_static(send_body=False)

    def do_GET(self):
        self._begin_request()
        try:
            self._do_get_impl()
        except Exception as e:
            self._handle_uncaught(e)

    def _do_get_impl(self):
        path = _api_path(self.path)

        if path == "/api/runs":
            self._handle_list_runs()
            return
        if path == "/api/status":
            self._handle_status()
            return
        if path == "/health":
            # Bug #12 FIX: 增强 health endpoint，返回运维指标供 Docker/k8s 探针
            # 和监控面板使用（active_runs/queue_depth/db_size/uptime）。
            self._send_json(200, _health_payload())
            return
        if path == "/api/docs":
            # P3 FIX: OpenAPI 3.1 spec endpoint.
            self._send_json(200, _build_openapi_spec())
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
        if path == "/api/runs/compare":
            # P3 FIX: 执行历史对比 API。必须在 /api/runs/{id} 通配之前匹配。
            self._handle_compare_runs()
            return
        if path.startswith("/api/workflows/"):
            parts = path.strip("/").split("/")
            # GET /api/workflows/{id}/versions — 版本列表
            if len(parts) == 3 and parts[2] == "versions":
                wf_id = parts[1]
                if not _validate_id(wf_id):
                    self._send_json(400, {"error": "Invalid workflow_id"})
                    return
                self._handle_list_workflow_versions(wf_id)
                return
            wf_id = path.split("/")[-1]
            # R3-P0-4: 校验 workflow_id 不含路径穿越字符
            if not _validate_id(wf_id):
                self._send_json(400, {"error": "Invalid workflow_id"})
                return
            self._handle_get_workflow(wf_id)
            return
        if path.startswith("/api/runs/"):
            parts = path.strip("/").split("/")
            if len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "events":
                # R3-P0-4
                if not _validate_id(parts[2]):
                    self._send_json(400, {"error": "Invalid run_id"}); return
                self._handle_run_events(parts[2])
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "nodes":
                if not _validate_id(parts[2]):
                    self._send_json(400, {"error": "Invalid run_id"}); return
                self._handle_get_run_nodes(parts[2])
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "edges":
                if not _validate_id(parts[2]):
                    self._send_json(400, {"error": "Invalid run_id"}); return
                self._handle_get_run_edges(parts[2])
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "evolution":
                if not _validate_id(parts[2]):
                    self._send_json(400, {"error": "Invalid run_id"}); return
                self._handle_get_evolution(parts[2])
            # Bug #3 FIX: GET /api/runs/{rid}/artifacts — 列出该 run 所有生成的产物
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "artifacts":
                if not _validate_id(parts[2]):
                    self._send_json(400, {"error": "Invalid run_id"}); return
                self._handle_list_run_artifacts(parts[2])
            elif len(parts) == 5 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "nodes":
                if not _validate_id(parts[2]) or not _validate_id(parts[4]):
                    self._send_json(400, {"error": "Invalid run_id/node_id"}); return
                self._handle_get_run_node(parts[2], parts[4])
            elif len(parts) == 3 and parts[0] == "api" and parts[1] == "runs":
                if not _validate_id(parts[2]):
                    self._send_json(400, {"error": "Invalid run_id"}); return
                self._handle_get_run(parts[2])
            else:
                self.send_error(404)
            return

        self._serve_static(send_body=True)

    def do_POST(self):
        self._begin_request()
        try:
            self._do_post_impl()
        except Exception as e:
            self._handle_uncaught(e)

    def _do_post_impl(self):
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
        elif path == "/api/admin/backup":
            # P3 FIX: SQLite 一致性备份端点。
            self._handle_admin_backup()
        elif path.startswith("/api/hook/"):
            token = path.split("/")[-1]
            self._handle_webhook_trigger(token)
        else:
            parts = path.strip("/").split("/")
            # R3-P0-4: 校验所有从 URL 提取的 run_id / node_id
            if parts[0] == "api" and parts[1] == "runs" and len(parts) >= 3:
                if not _validate_id(parts[2]):
                    self._send_json(400, {"error": "Invalid run_id"}); return
                if len(parts) >= 5 and parts[3] == "nodes":
                    if not _validate_id(parts[4]):
                        self._send_json(400, {"error": "Invalid node_id"}); return
            # R3-P0-4: 校验 workflow_id（用于 templatize 等子路由）
            if parts[0] == "api" and parts[1] == "workflows" and len(parts) >= 3:
                if not _validate_id(parts[2]):
                    self._send_json(400, {"error": "Invalid workflow_id"}); return
            # POST /api/workflows/{wid}/templatize — 将工作流转为可复用模板
            if len(parts) == 4 and parts[0] == "api" and parts[1] == "workflows" and parts[3] == "templatize":
                self._handle_templatize_workflow(parts[2])
            # POST /api/runs/{rid}/nodes — 新增节点
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "nodes":
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
            # Bug #1 FIX: POST /api/runs/{rid}/resume?from_node={nid} — 重置节点及下游为 pending
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "resume":
                self._handle_resume_run(parts[2])
            # Bug #2 FIX: POST /api/runs/{rid}/clone — 从现有 run 快照创建新 run
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "clone":
                self._handle_clone_run(parts[2])
            else:
                self.send_error(404)

    def do_PUT(self):
        self._begin_request()
        try:
            self._do_put_impl()
        except Exception as e:
            self._handle_uncaught(e)

    def _do_put_impl(self):
        path = _api_path(self.path)
        if path.startswith("/api/workflows/"):
            wf_id = path.split("/")[-1]
            # R3-P0-4
            if not _validate_id(wf_id):
                self._send_json(400, {"error": "Invalid workflow_id"}); return
            self._handle_update_workflow(wf_id)
        else:
            self.send_error(404)

    def do_PATCH(self):
        self._begin_request()
        try:
            self._do_patch_impl()
        except Exception as e:
            self._handle_uncaught(e)

    def _do_patch_impl(self):
        path = _api_path(self.path)
        # PATCH /api/runs/{rid}/nodes/{nid}
        parts = path.strip("/").split("/")
        # R3-P0-4
        if len(parts) == 5 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "nodes":
            if not _validate_id(parts[2]) or not _validate_id(parts[4]):
                self._send_json(400, {"error": "Invalid run_id/node_id"}); return
            self._handle_patch_node(parts[2], parts[4])
        else:
            self.send_error(404)

    def do_DELETE(self):
        self._begin_request()
        try:
            self._do_delete_impl()
        except Exception as e:
            self._handle_uncaught(e)

    def _do_delete_impl(self):
        path = _api_path(self.path)
        if path.startswith("/api/workflows/"):
            wf_id = path.split("/")[-1]
            # R3-P0-4
            if not _validate_id(wf_id):
                self._send_json(400, {"error": "Invalid workflow_id"}); return
            self._handle_delete_workflow(wf_id)
        else:
            parts = path.strip("/").split("/")
            # R3-P0-4: 校验 run_id / node_id
            if parts[0] == "api" and parts[1] == "runs" and len(parts) >= 3:
                if not _validate_id(parts[2]):
                    self._send_json(400, {"error": "Invalid run_id"}); return
                if len(parts) >= 5 and parts[3] == "nodes":
                    if not _validate_id(parts[4]):
                        self._send_json(400, {"error": "Invalid node_id"}); return
            # DELETE /api/runs/{rid} — cancel/stop a run (F68 FIX)
            if len(parts) == 3 and parts[0] == "api" and parts[1] == "runs":
                self._handle_delete_run(parts[2])
            # DELETE /api/runs/{rid}/nodes/{nid} — 删除节点
            elif len(parts) == 5 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "nodes":
                self._handle_delete_node(parts[2], parts[4])
            # DELETE /api/runs/{rid}/edges — 删除边（body 中传 source/target）
            elif len(parts) == 4 and parts[0] == "api" and parts[1] == "runs" and parts[3] == "edges":
                self._handle_remove_edge(parts[2])
            else:
                self.send_error(404)

    def _read_json_body(self, max_size: int | None = None) -> tuple[dict | None, str | None]:
        """读取并解析 JSON 请求体。

        Args:
            max_size: 可选的 per-call 大小上限（字节）。未指定时使用全局 MAX_BODY_SIZE。
        """
        try:
            length = int(self.headers.get("Content-Length", 0))
            # Bug #30 FIX: guard against negative Content-Length
            if length < 0:
                return None, "Invalid Content-Length"
            limit = max_size if max_size is not None else MAX_BODY_SIZE
            if length > limit:
                return None, f"Request too large ({length} > {limit})"
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
            # P3 FIX: per-endpoint body limit (decompose 只接受 requirement 文本，10KB 足够)
            _limit = _body_limit_for("/api/decompose")
            if length > _limit:
                self._send_json(413, {"error": f"Request too large ({length} > {_limit})"})
                return
            body = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, ValueError, TypeError):
            self._send_json(400, {"error": "Invalid request"})
            return

        # Bug #6 FIX: 使用 dataclass 校验器做类型检查 + 范围校验。
        # 校验失败时 error 字段保留人类可读消息（含 'empty' 关键字以兼容测试），
        # 同时附带稳定的数字 code。
        try:
            req = DecomposeRequest.from_body(body)
            requirement = req.requirement
            count = req.count
        except ValidationError as ve:
            self._send_json(400, {
                "error": str(ve),
                "code": ERROR_CODES["INVALID_REQUEST"],
            })
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
        except Exception as decomp_err:
            # P2 FIX: log instead of silently falling back
            _log("WARN", f"LLM decomposition failed, using fallback template: {decomp_err}", tag="Decompose")
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
            # P3 FIX: per-endpoint body limit (execute 允许完整 DAG JSON，1MB)
            _limit = _body_limit_for("/api/execute")
            if length > _limit:
                self.send_error(413, f"Request too large ({length} > {_limit})")
                return
            body = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, ValueError, TypeError):
            self._send_json(400, {"error": "Invalid request"})
            return
        # Bug #6 FIX: dataclass 校验器做类型检查 + 范围校验。
        try:
            req = ExecuteRequest.from_body(body)
            nodes = req.nodes
            edges = req.edges
            requirement = req.requirement
        except ValidationError as ve:
            self._send_json(400, {
                "error": str(ve),
                "code": ERROR_CODES["INVALID_REQUEST"],
            })
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

        # F19/F20 FIX: catch cycle validation errors from create_run
        try:
            workflow_id = body.get("workflow_id", "")
            run_id = _submit_run(requirement, nodes, edges, workflow_id=workflow_id)
        except ValueError as ve:
            self._send_json(422, {"error": "invalid_dag", "details": str(ve)})
            return

        _log("INFO", f"Submitted run: {len(nodes)} nodes", run_id=run_id, tag="Execute")
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
        # R3-P0-5: 客户端断连标志，由 _stream_send / keepalive 写异常设置。
        self._sse_disconnected = False

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

                # R3-P0-5: 检测客户端是否已断开。_stream_send 写失败时设置标志。
                if getattr(self, "_sse_disconnected", False):
                    break

                # 检查是否完成
                if run["status"] in ("completed", "failed"):
                    break

                # R3-P0-5: 用短轮询替代 time.sleep(1)，更快响应断连。
                #          每次写一个 SSE 注释 keepalive 来探测连接活性；
                #          如果客户端已断开，write 会抛 BrokenPipeError。
                _chunk = 0.2
                _end = waited + poll_interval
                while waited < _end:
                    try:
                        self.wfile.write(b": keepalive\n\n")
                        self.wfile.flush()
                    except (BrokenPipeError, ConnectionResetError, OSError):
                        self._sse_disconnected = True
                        break
                    time.sleep(_chunk)
                    waited += _chunk
                if getattr(self, "_sse_disconnected", False):
                    break

            # 回执最终结果
            final = store.get_run(run_id)
            if final and not getattr(self, "_sse_disconnected", False):
                self._stream_send("workflow_done", {
                    "run_id": run_id,
                    "status": final["status"],
                    "total_cost": final["total_cost"],
                    "total_duration": final["total_dur"],
                    "nodes": final["nodes"],
                })
            elif not getattr(self, "_sse_disconnected", False):
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
        # P3 FIX: SSE 流也回显 X-Request-ID。
        rid = getattr(self, "request_id", "")
        if rid:
            self.send_header("X-Request-ID", rid)
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
        except (BrokenPipeError, ConnectionResetError, OSError):
            # R3-P0-5: 标记客户端已断开，SSE 轮询循环将据此提前退出。
            self._sse_disconnected = True

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

        # F44 FIX: Eliminate replay race by snapshotting EventBus state BEFORE DB read,
        # then deduplicate. Events are published to both EventBus and DB atomically
        # in _publish_event. We read EventBus memory first (atomic under Condition lock),
        # then DB, then continue with live subscription from the max sequence seen.
        #
        # P2 FIX: Since sequences are monotonic per run, we only need a single
        # integer (max_sent) to deduplicate — O(1) per event instead of an
        # ever-growing set with periodic O(n log n) pruning.
        max_sent = after_sequence

        # Step 1: Read EventBus in-memory events (atomic snapshot)
        bus_events = _event_bus.get_events(run_id, after_sequence=after_sequence)
        for ev_obj in bus_events:
            d = ev_obj.to_dict()
            seq = d.get("sequence", 0)
            if seq > max_sent:
                self._stream_send(d.get("type", "event"), d)
                max_sent = seq

        # Step 2: Read DB-persisted events that EventBus may have pruned (bounded memory)
        store = get_store()
        persisted = store.list_events(run_id, after_sequence=after_sequence)
        for ev in persisted:
            seq = ev.get("sequence", 0)
            if seq > max_sent:
                self._stream_send(ev.get("type", "event"), ev)
                max_sent = seq

        # Step 3: Subscribe to live events from where we left off — no gap
        for ev_obj in _event_bus.subscribe(run_id, after_sequence=max_sent, timeout_s=600):
            d = ev_obj.to_dict()
            seq = d.get("sequence", 0)
            if seq > max_sent:
                self._stream_send(d.get("type", "event"), d)
                max_sent = seq

    # ── Run 历史 API ───────────────────────────────

    def _handle_delete_run(self, run_id: str):
        """DELETE /api/runs/{rid} — cancel/stop a running workflow (F68 FIX).

        Marks all pending/running nodes as 'cancelled' and the run as 'cancelled'.
        Does NOT delete run data — the run remains in history for inspection.
        """
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        store = get_store()
        run = store.get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return
        if run["status"] in ("completed", "failed", "cancelled"):
            self._send_json(200, {"ok": True, "run_id": run_id, "status": run["status"],
                                  "message": "Run already finished, nothing to cancel"})
            return
        # Mark all pending/running nodes as cancelled
        cancelled_nodes = []
        for n in run.get("nodes", []):
            if n.get("status") in ("pending", "running"):
                store.update_node(run_id, n["node_id"], status="cancelled",
                                  result="Run cancelled by user")
                cancelled_nodes.append(n["node_id"])
        store.update_run_status(run_id, "cancelled", "Cancelled by user")
        _publish_event(run_id, "run_cancelled",
                       payload={"cancelled_nodes": cancelled_nodes})
        self._send_json(200, {"ok": True, "run_id": run_id, "status": "cancelled",
                              "cancelled_nodes": cancelled_nodes})

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

    def _handle_list_run_artifacts(self, run_id: str):
        """Bug #3 FIX: GET /api/runs/{rid}/artifacts

        列出该 run 通过 ArtifactBroker 发布的所有 artifact 元数据，
        按 source_node 分组聚合，便于前端 InspectorPanel 展示产物清单。
        """
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        store = get_store()
        run = store.get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return
        broker = get_broker()
        artifacts = broker.list_run_artifacts(run_id)
        # 按 source_node 聚合
        by_node: dict[str, list] = {}
        for art in artifacts:
            by_node.setdefault(art.get("source_node", ""), []).append(art)
        self._send_json(200, {
            "run_id": run_id,
            "total": len(artifacts),
            "artifacts": artifacts,
            "by_node": by_node,
        })

    def _handle_resume_run(self, run_id: str):
        """Bug #1 FIX: POST /api/runs/{rid}/resume?from_node={nid}

        Replay 从指定节点开始：将 from_node 及其所有下游节点重置为 pending，
        保留上游 completed 节点的产出。然后将 run 重新入队执行。

        若不提供 from_node，则重置所有 failed/skipped/cancelled 节点（全量 replay）。
        """
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        store = get_store()
        run = store.get_run(run_id)
        if not run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return

        from urllib.parse import parse_qs
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        from_node = (qs.get("from_node", [""]) or [""])[0]

        existing_ids = {n["node_id"] for n in run["nodes"]}
        if from_node:
            if from_node not in existing_ids:
                self._send_json(404, {
                    "error": f"Node {from_node} not found in run {run_id}",
                    "code": ERROR_CODES["NOT_FOUND"],
                })
                return
            # 收集 from_node 及其全部下游（含自身）
            reset_ids = set(_collect_downstream_nodes(store, run_id, from_node, include_self=True))
        else:
            # 无 from_node：重置所有非 completed 终态节点（failed/skipped/cancelled/timed_out）
            reset_ids = {
                n["node_id"] for n in run["nodes"]
                if n.get("status") in ("failed", "skipped", "cancelled", "timed_out", "error")
            }
            if not reset_ids:
                self._send_json(400, {
                    "error": "No replayable nodes (provide from_node or have failed nodes)",
                })
                return

        # 执行重置：清除 result/error/cost，状态置 pending
        for nid in reset_ids:
            store.update_node(run_id, nid, status="pending", result="",
                              error="", cost=0.0, duration_ms=0, turns=0)
        # 将 run 状态恢复为 pending 并入队
        store.update_run_status(run_id, "pending", "")
        _executor_queue.put(run_id)
        _publish_event(run_id, "run_resumed",
                       payload={"from_node": from_node, "reset_nodes": sorted(reset_ids)})
        self._send_json(200, {
            "ok": True,
            "run_id": run_id,
            "status": "pending",
            "from_node": from_node,
            "reset_nodes": sorted(reset_ids),
            "message": f"Replay queued: {len(reset_ids)} node(s) reset to pending",
        })

    def _handle_clone_run(self, run_id: str):
        """Bug #2 FIX: POST /api/runs/{rid}/clone

        从现有 run 的工作流快照创建一个新的 run。请求体可选覆盖字段：
          - requirement: str  覆盖原始需求文本
          - nodes: list       覆盖节点定义（结构同 /api/execute）
          - edges: list       覆盖边定义
          - workflow_id: str  关联的工作流 ID
          - auto_start: bool  是否立即入队执行（默认 true）
        """
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        store = get_store()
        src_run = store.get_run(run_id)
        if not src_run:
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return

        body, err = self._read_json_body()
        body = body or {}
        if err:
            self._send_json(400, {"error": err})
            return

        # 基线：从源 run 的节点/边构造 nodes/edges
        base_nodes = [
            {
                "id": n["node_id"],
                "icon": n.get("icon", ""),
                "label": n.get("label", ""),
                "desc": n.get("description", ""),
                "color": n.get("color", ""),
                "profile": n.get("profile", "dev"),
                "params": n.get("params", {}) or {},
            }
            for n in src_run["nodes"]
        ]
        base_edges = store.get_run_edges(run_id)
        base_requirement = src_run.get("requirement", "")

        # 应用可选覆盖
        nodes = body.get("nodes", base_nodes)
        edges = body.get("edges", base_edges)
        requirement = body.get("requirement", base_requirement)
        workflow_id = body.get("workflow_id", "")
        auto_start = body.get("auto_start", True)

        # Bug #6 FIX: 复用 ExecuteRequest 校验器验证克隆后的负载
        try:
            req = ExecuteRequest.from_body({
                "nodes": nodes,
                "edges": edges,
                "requirement": requirement,
                "workflow_id": workflow_id,
            })
        except ValidationError as ve:
            self._send_json(400, {"error": str(ve), "code": ERROR_CODES["INVALID_REQUEST"]})
            return

        try:
            new_run_id = store.create_run(
                req.requirement, _apply_edges_to_nodes(req.nodes, req.edges),
                req.edges, workflow_id=req.workflow_id,
            )
        except ValueError as ve:
            self._send_json(422, {"error": "invalid_dag", "details": str(ve)})
            return

        if auto_start:
            _executor_queue.put(new_run_id)
        _publish_event(new_run_id, "run_cloned",
                       payload={"source_run_id": run_id})
        self._send_json(202, {
            "ok": True,
            "run_id": new_run_id,
            "source_run_id": run_id,
            "status": "pending" if auto_start else "draft",
            "node_count": len(req.nodes),
            "message": f"Cloned from {run_id}",
        })

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

        # P0 FIX: Do NOT trust x_agent_node_id / x_agent_scope from query string —
        # they are client-supplied and can be forged by any caller to claim "run"
        # scope and bypass per-node permission checks. Treat DELETE as an external
        # API call; _check_scope returns (True, "") when caller_node_id is None.
        caller_node_id = None
        caller_scope = "self"
        # F27 FIX: auto_reconnect 默认关闭，仅当 query param 显式为 "1"/"true" 时开启
        from urllib.parse import parse_qs
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        auto_reconnect = qs.get("auto_reconnect", ["0"])[0].lower() in ("1", "true", "yes")
        allowed, reason = _check_scope(run_id, caller_node_id, node_id, caller_scope)
        if not allowed:
            self._send_json(403, {"ok": False, "error": reason, "code": "SCOPE_DENIED"})
            return

        if store.remove_node(run_id, node_id, auto_reconnect=auto_reconnect):
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

        # F24 FIX: 区分「边已存在」（幂等 200）和「无效节点」（400）
        if store.edge_exists(run_id, source, target):
            self._send_json(200, {
                "ok": True,
                "message": "Edge already exists",
                "data": {"source": source, "target": target},
                "dag_version": store.get_dag_version(run_id),
            })
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
            # add_edge 返回 False：区分无效节点 vs 会形成环
            if not store.nodes_exist(run_id, source, target):
                self._send_json(400, {
                    "ok": False,
                    "error": "Invalid nodes: source or target does not exist",
                })
            else:
                self._send_json(409, {
                    "ok": False,
                    "error": "Edge would create a cycle",
                })

    def _handle_remove_edge(self, run_id: str):
        """DELETE /api/runs/{rid}/edges — 删除依赖边（query params only）"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        store = get_store()
        # P3 FIX: 移除 DELETE body 读取，只用 query string 参数。
        # DELETE with body 不是所有 HTTP 客户端都支持，query params 更可靠。
        from urllib.parse import parse_qs
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        source = qs.get("source", [""])[0]
        target = qs.get("target", [""])[0]
        # P0 FIX: Do NOT trust x_agent_node_id / x_agent_scope from query string
        # or body — they are client-supplied and forgeable. Treat as external API
        # call; _check_scope returns (True, "") when caller_node_id is None.
        caller_node_id = None
        caller_scope = "self"

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
            # F34 FIX: transitive downstream reset (not just direct dependents)
            downstream = _collect_downstream_nodes(store, run_id, node_id, include_self=False)
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
                    _log("WARN", f"Promotion failed: {e}", tag="Promotion")

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
            wf.pop("webhook_token", None)  # P2 fix: strip token from list response
        self._send_json(200, {"workflows": workflows, "count": len(workflows)})

    def _handle_get_workflow(self, workflow_id: str):
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        wf = get_store().get_workflow(workflow_id)
        if not wf:
            self._send_json(404, {"error": f"Workflow {workflow_id} not found"})
            return
        # P3 FIX: webhook_token 只在创建时返回，GET 响应中 strip 掉，只保留 webhook_url
        wf["webhook_url"] = self._webhook_url(wf.get("webhook_token", ""))
        wf.pop("webhook_token", None)
        self._send_json(200, wf)

    def _handle_list_workflow_versions(self, workflow_id: str):
        """GET /api/workflows/{id}/versions — 工作流版本列表"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        wf = get_store().get_workflow(workflow_id)
        if not wf:
            self._send_json(404, {"error": f"Workflow {workflow_id} not found"})
            return
        versions = get_store().list_workflow_versions(workflow_id)
        self._send_json(200, {
            "workflow_id": workflow_id,
            "versions": versions,
            "count": len(versions),
        })

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
        # F18 FIX: validate DAG acyclicity on webhook trigger
        try:
            run_id = _submit_run(
                requirement, wf["nodes"], wf["edges"], workflow_id=wf["workflow_id"]
            )
        except ValueError as ve:
            self._send_json(422, {"error": "invalid_dag", "details": str(ve)})
            return
        _log("INFO", f"Triggered via webhook -> {run_id}", run_id=run_id, tag="Webhook")
        self._send_json(202, {
            "run_id": run_id,
            "workflow_id": wf["workflow_id"],
            "status": "pending",
            "message": "Webhook triggered execution",
        })

    def _apply_security_headers(self):
        """P1 FIX: 发送标准安全响应头，缓解 MIME 嗅探、点击劫持、XSS/CSP。"""
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Content-Security-Policy",
                         "default-src 'self'; frame-ancestors 'none'; base-uri 'self'")

    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        origin = self.headers.get("Origin", "")
        for k, v in self._cors_headers(origin).items():
            self.send_header(k, v)
        # P3 FIX: 在所有 JSON 响应中回显 X-Request-ID，便于客户端日志关联。
        rid = getattr(self, "request_id", "")
        if rid:
            self.send_header("X-Request-ID", rid)
        self.send_header("Content-Type", "application/json")
        self._apply_security_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def _send_error(self, http_status: int, error_name: str,
                    message: str = "", **extra) -> None:
        """Bug #11 FIX: 统一错误响应构造器。

        自动从 ERROR_CODES 查表填入稳定数字 code，并保留人类可读 error/message。
        ``error_name`` 必须是 ERROR_CODES 的键（如 'NOT_FOUND'）；
        未注册的名称回退到 INVALID_REQUEST/INTERNAL_ERROR。

        示例:
            self._send_error(404, "NOT_FOUND", f"Run {rid} not found")
            → 404 {"error": "not_found", "code": 40401, "message": "Run x not found"}
        """
        code = ERROR_CODES.get(error_name)
        if code is None:
            # 回退：4xx → INVALID_REQUEST，5xx → INTERNAL_ERROR
            fallback = "INVALID_REQUEST" if http_status < 500 else "INTERNAL_ERROR"
            code = ERROR_CODES[fallback]
            error_name = error_name or fallback
        payload = {
            "error": error_name.lower(),
            "code": code,
            "message": message,
        }
        rid = getattr(self, "request_id", "")
        if rid:
            payload["request_id"] = rid
        payload.update(extra)
        self._send_json(http_status, payload)

    # ── Supervisor 多 Agent 路由 ────────────────────

    def handle_supervisor(self):
        """POST /api/supervisor — 多轮对话式编排。"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            # P3 FIX: per-endpoint body limit (supervisor 多轮对话)
            _limit = _body_limit_for("/api/supervisor")
            if length > _limit:
                self._send_json(413, {"error": f"Request too large ({length} > {_limit})"})
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

    # ── P3 FIX: 执行历史对比 ──────────────────────────────

    def _handle_compare_runs(self):
        """GET /api/runs/compare?run_a={id}&run_b={id}

        返回两个 run 的节点状态/成本/耗时逐项对比，便于 diff 分析。
        """
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        parsed = urlparse(self.path)
        from urllib.parse import parse_qs
        qs = parse_qs(parsed.query)
        run_a = qs.get("run_a", [""])[0]
        run_b = qs.get("run_b", [""])[0]
        if not run_a or not run_b:
            self._send_json(400, {"error": "run_a and run_b query params are required"})
            return
        if not _validate_id(run_a) or not _validate_id(run_b):
            self._send_json(400, {"error": "Invalid run_id in run_a/run_b"})
            return
        store = get_store()
        ra = store.get_run(run_a)
        rb = store.get_run(run_b)
        if not ra:
            self._send_json(404, {"error": f"Run {run_a} not found"})
            return
        if not rb:
            self._send_json(404, {"error": f"Run {run_b} not found"})
            return

        # 逐节点对比（按 node_id 对齐）
        nodes_a = {n["node_id"]: n for n in ra.get("nodes", [])}
        nodes_b = {n["node_id"]: n for n in rb.get("nodes", [])}
        all_nids = sorted(set(nodes_a) | set(nodes_b))
        node_diff = []
        for nid in all_nids:
            na = nodes_a.get(nid, {})
            nb = nodes_b.get(nid, {})
            node_diff.append({
                "node_id": nid,
                "status_a": na.get("status"),
                "status_b": nb.get("status"),
                "status_changed": na.get("status") != nb.get("status"),
                "cost_a": na.get("cost", 0),
                "cost_b": nb.get("cost", 0),
                "cost_delta": round((nb.get("cost", 0) or 0) - (na.get("cost", 0) or 0), 6),
                "duration_a": na.get("duration_ms", 0),
                "duration_b": nb.get("duration_ms", 0),
                "duration_delta": (nb.get("duration_ms", 0) or 0) - (na.get("duration_ms", 0) or 0),
            })

        self._send_json(200, {
            "run_a": {
                "run_id": run_a,
                "status": ra["status"],
                "total_cost": ra.get("total_cost", 0),
                "total_dur": ra.get("total_dur", 0),
                "node_count": len(ra.get("nodes", [])),
                "created_at": ra.get("created_at"),
            },
            "run_b": {
                "run_id": run_b,
                "status": rb["status"],
                "total_cost": rb.get("total_cost", 0),
                "total_dur": rb.get("total_dur", 0),
                "node_count": len(rb.get("nodes", [])),
                "created_at": rb.get("created_at"),
            },
            "summary": {
                "total_cost_delta": round(
                    (rb.get("total_cost", 0) or 0) - (ra.get("total_cost", 0) or 0), 6),
                "total_duration_delta": (rb.get("total_dur", 0) or 0) - (ra.get("total_dur", 0) or 0),
                "status_changed": ra["status"] != rb["status"],
                "nodes_compared": len(all_nids),
                "nodes_status_changed": sum(1 for d in node_diff if d["status_changed"]),
            },
            "node_diff": node_diff,
        })

    # ── P3 FIX: 工作流模板化 ──────────────────────────────

    def _handle_templatize_workflow(self, workflow_id: str):
        """POST /api/workflows/{id}/templatize

        将工作流定义转为可复用模板：提取变量占位符，剥离实例特定数据。
        """
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        store = get_store()
        wf = store.get_workflow(workflow_id)
        if not wf:
            self._send_json(404, {"error": f"Workflow {workflow_id} not found"})
            return

        import re
        import copy

        # 提取变量占位符策略：
        # 1. requirement 中的具体值替换为 {{requirement}} 占位符
        # 2. 节点 desc/label 中的具体技术名词保留（它们是模板结构的一部分）
        # 3. 节点 params 中的值保留（它们定义节点行为）
        # 4. 剥离 webhook_token、created_at 等实例元数据
        original_requirement = wf.get("requirement", "")
        template_nodes = []
        variables = []
        for node in wf.get("nodes", []):
            tn = copy.deepcopy(node)
            # 标准化 node_id 为占位符模式（保留结构，去实例化）
            tn.pop("result", None)
            tn.pop("status", None)
            tn.pop("cost", None)
            tn.pop("duration_ms", None)
            tn.pop("error", None)
            template_nodes.append(tn)

        # 识别 requirement 中的潜在变量（简单启发式：名词短语）
        # 这里用保守策略：整个 requirement 作为 {{requirement}} 变量
        variables.append({
            "name": "requirement",
            "default": original_requirement[:200],
            "description": "原始需求文本，模板实例化时替换",
        })

        # 从节点 params 中识别可参数化字段
        for node in template_nodes:
            params = node.get("params", {}) or {}
            for pk, pv in params.items():
                if isinstance(pv, str) and len(pv) > 10:
                    variables.append({
                        "name": f"{node.get('id', 'node')}.{pk}",
                        "default": pv[:200],
                        "description": f"节点 {node.get('id', '?')} 的 {pk} 参数",
                    })

        template = {
            "template_id": f"tpl_{workflow_id}",
            "source_workflow_id": workflow_id,
            "name": wf.get("name", ""),
            "requirement_template": "{{requirement}}",
            "nodes": template_nodes,
            "edges": wf.get("edges", []),
            "variables": variables,
            "node_count": len(template_nodes),
            "edge_count": len(wf.get("edges", [])),
            "created_at": time.time(),
        }
        _log("INFO", f"Templatized workflow {workflow_id}: "
             f"{len(template_nodes)} nodes, {len(variables)} variables",
             tag="Templatize")
        self._send_json(200, {"ok": True, "template": template})

    # ── P3 FIX: SQLite 一致性备份 ─────────────────────────

    def _handle_admin_backup(self):
        """POST /api/admin/backup

        使用 SQLite Online Backup API 创建一致性快照。
        返回备份文件路径和元数据。
        """
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        import sqlite3
        from run_store import DB_PATH, RUNS_DIR
        if not os.path.isfile(DB_PATH):
            self._send_json(404, {"error": f"Database not found at {DB_PATH}"})
            return

        # 备份目录
        backup_dir = os.environ.get(
            "AGENTFLOW_BACKUP_DIR",
            os.path.join(RUNS_DIR, "backups"),
        )
        os.makedirs(backup_dir, exist_ok=True)
        ts = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
        backup_path = os.path.join(backup_dir, f"runs_backup_{ts}.db")

        try:
            # SQLite Online Backup API — 在线一致性快照，不阻塞写入。
            # Bug #9 FIX: 所有 sqlite3.connect 都显式设置 timeout，避免数据库锁
            # 状态下 backup 操作无限阻塞（与 run_store._get_conn 保持一致）。
            src = sqlite3.connect(DB_PATH, timeout=5)
            dst = sqlite3.connect(backup_path, timeout=5)
            src.backup(dst)
            dst.close()
            src.close()
        except sqlite3.Error as e:
            _log("ERROR", f"Backup failed: {e}", tag="Backup")
            self._send_json(500, {"error": f"Backup failed: {e}"})
            return

        backup_size = os.path.getsize(backup_path)
        _log("INFO", f"Backup created: {backup_path} ({backup_size} bytes)",
             tag="Backup")
        self._send_json(200, {
            "ok": True,
            "backup_path": backup_path,
            "backup_size": backup_size,
            "timestamp": ts,
            "source_db": DB_PATH,
        })

    def log_message(self, format, *args):
        print(f"[AgentFlow] {args[0] if args else ''}", file=sys.stderr)


# ── 启动后台 worker 线程（模块加载时即启动，测试和正式运行都生效） ──
if not hasattr(_background_worker, "_started"):
    worker = threading.Thread(target=_background_worker, daemon=True, name="bg-worker")
    worker.start()
    _background_worker._started = True  # type: ignore[attr-defined]

# Bug #4 FIX: 启动 workspace 周期清理守护线程（每 10 分钟一次）
if not hasattr(_workspace_cleanup_loop, "_started"):
    _cleanup_thread = threading.Thread(
        target=_workspace_cleanup_loop, daemon=True, name="ws-cleanup"
    )
    _cleanup_thread.start()
    _workspace_cleanup_loop._started = True  # type: ignore[attr-defined]

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

    # P1 FIX: 优雅关闭。注册 SIGINT/SIGTERM handler，收到信号时调用
    # server.shutdown()（让 serve_forever 退出）并等待在途请求完成，
    # 而非被 SIGTERM 默认动作（terminate 进程）立即杀死导致连接中断。
    _shutdown_requested = threading.Event()

    def _handle_shutdown(signum, frame):
        print(f"\n[AgentFlow] Received signal {signum}, shutting down gracefully...",
              file=sys.stderr)
        # 在独立线程中调用 shutdown，避免在信号 handler 中直接阻塞主线程
        # （signal handler 运行在主线程，shutdown 会阻塞等待 serve_forever 退出）。
        threading.Thread(target=server.shutdown, daemon=True).start()
        _shutdown_requested.set()

    signal.signal(signal.SIGINT, _handle_shutdown)
    signal.signal(signal.SIGTERM, _handle_shutdown)

    try:
        server.serve_forever()
    finally:
        server.server_close()
        if not _shutdown_requested.is_set():
            # KeyboardInterrupt path
            print("\nShutting down", file=sys.stderr)
        print("[AgentFlow] Server stopped.", file=sys.stderr)
