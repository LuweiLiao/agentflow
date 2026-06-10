"""Eval Harness — AgentFlow 自动化回归基准。

两层设计：
  1. 结构验证（无需后端）: 模板一致性、DAG 正确性、数据契约完整性
  2. 端到端基准（需后端+LLM）: 完整编排→执行→验证→结果记录

用法：
    # 结构验证（快速，无 LLM 调用）
    python3 -m pytest evals/ -v --tb=short -m "not e2e"

    # 完整基准（启动后端后）
    python3 evals/run_benchmark.py
"""
import json
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# ── Eval 结果持久化 ────────────────────────────────────
EVALS_DB_DIR = os.path.join(PROJECT_ROOT, ".agentflow", "evals")


def record_eval_result(name: str, result: dict):
    """记录一次 eval 结果到 JSON 文件，支持回归追踪。"""
    os.makedirs(EVALS_DB_DIR, exist_ok=True)
    path = os.path.join(EVALS_DB_DIR, f"{name}.json")
    history = []
    if os.path.exists(path):
        try:
            with open(path) as f:
                history = json.load(f)
        except (json.JSONDecodeError, OSError):
            history = []
    history.append(result)
    with open(path, "w") as f:
        json.dump(history[-100:], f, ensure_ascii=False, indent=2)


def get_eval_history(name: str, limit: int = 10) -> list:
    """获取 eval 历史记录。"""
    path = os.path.join(EVALS_DB_DIR, f"{name}.json")
    if not os.path.exists(path):
        return []
    try:
        with open(path) as f:
            data = json.load(f)
        return data[-limit:]
    except (json.JSONDecodeError, OSError):
        return []


# ── 工作流验证工具（无需后端） ──────────────────────────
from agentflow_schema import (  # noqa: E402
    EdgeDef,
    NodeDef,
    WorkflowJSON,
    parallel_groups,
    validate_workflow,
)


def validate_decomposition(nodes: list[dict], edges: list[dict]) -> list[str]:
    """验证编排结果的 DAG 正确性。返回错误列表。"""
    node_defs = [
        NodeDef(id=n["id"], icon=n.get("icon", ""),
                label=n.get("label", ""), desc=n.get("desc", ""),
                color=n.get("color", ""), profile=n.get("profile", "dev"))
        for n in nodes
    ]
    edge_defs = [
        EdgeDef(source=e["source"], target=e["target"])
        for e in edges
    ]
    wf = WorkflowJSON(
        workflow_id="eval",
        name="eval-workflow",
        global_context={"goal": "eval", "language": "zh-CN", "constraints": []},
        nodes=node_defs,
        edges=edge_defs,
    )
    errors = validate_workflow(wf)

    # 额外分析
    if not errors:
        groups = parallel_groups(node_defs, edge_defs)
        if len(groups) < 1:
            errors.append("并行分组异常")
        if len(node_defs) > 1 and len(edge_defs) == 0:
            errors.append("多节点 DAG 无任何边连接")

    return errors


def check_cost_latency(total_cost: float, total_duration_ms: int,
                       node_count: int) -> list[str]:
    """检查成本/耗时是否在合理范围。"""
    errors = []
    cost_per_node = total_cost / max(node_count, 1)
    dur_per_node = total_duration_ms / max(node_count, 1)

    if total_cost > 1.0:
        errors.append(f"总费用 ${total_cost:.4f} > $1.00")
    if cost_per_node > 0.5:
        errors.append(f"单节点平均费用 ${cost_per_node:.4f} > $0.50")
    if dur_per_node > 300000:
        errors.append(f"单节点平均耗时 {dur_per_node:.0f}ms > 300s")
    if total_duration_ms > 600000:
        errors.append(f"总耗时 {total_duration_ms / 1000:.0f}s > 600s")

    return errors


# ── API 辅助（需要后端运行） ────────────────────────────
try:
    import urllib.error
    import urllib.request
    _HAS_NET = True
except ImportError:
    _HAS_NET = False


def backend_is_alive(host: str = "127.0.0.1", port: int = 9600) -> bool:
    """检查后端是否运行。"""
    if not _HAS_NET:
        return False
    try:
        req = urllib.request.Request(f"http://{host}:{port}/api/runs")
        resp = urllib.request.urlopen(req, timeout=3)
        return resp.status == 200
    except Exception:
        return False
