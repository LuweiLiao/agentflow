"""
AgentFlow 数据契约 — WorkflowJSON / PromptTask / Envelope JSON
===============================================================
三段数据契约定义 AgentFlow 的数据流骨干：

  画布 ──→ WorkflowJSON ──→ Compiler ──→ PromptTask[] ──→ Orchestrator ──→ Agent
                                                                              │
                               画布 ←─── 结果汇聚 ←─── Envelope JSON ←──────────┘

用法:
    from agentflow_schema import WorkflowJSON, PromptTask, EnvelopeJSON
    from agentflow_schema import validate_workflow, validate_prompt_tasks

    wf = WorkflowJSON.from_dict(raw_dict)
    validate_workflow(wf)
"""

import enum
from dataclasses import asdict, dataclass, field
from typing import Optional

# ═══════════════════════════════════════════════════════
# 枚举
# ═══════════════════════════════════════════════════════

class Profile(str, enum.Enum):
    ANALYSIS = "analysis"
    DESIGN   = "design"
    DEV      = "dev"
    TEST     = "test"
    DOC      = "doc"
    DEPLOY   = "deploy"

    @classmethod
    def label(cls, p: str) -> str:
        return {
            "analysis": "分析型", "design": "设计型", "dev": "开发型",
            "test": "测试型", "doc": "文档型", "deploy": "部署型",
        }.get(p, p)


class NodeStatus(str, enum.Enum):
    PENDING  = "pending"
    READY    = "ready"
    RUNNING  = "running"
    OK       = "ok"
    ERROR    = "error"
    TIMEOUT  = "timeout"
    SKIPPED  = "skipped"


# ═══════════════════════════════════════════════════════
# 数据契约 1: WorkflowJSON — 画布输出 → Compiler 输入
# ═══════════════════════════════════════════════════════

@dataclass
class EdgeDef:
    """DAG 边：source → target"""
    source: str   # 上游节点 id
    target: str   # 下游节点 id

    @classmethod
    def from_dict(cls, d: dict) -> "EdgeDef":
        return cls(source=d["source"], target=d["target"])


@dataclass
class NodeDef:
    """工作流节点"""
    id:      str
    icon:    str                    = "🤖"
    label:   str                    = ""
    desc:    str                    = ""
    color:   str                    = "blue"
    profile: str                    = "dev"       # Profile 枚举字符串
    model:   Optional[str]          = None        # 执行模型名，None=使用全局默认
    params:  dict                   = field(default_factory=dict)  # 节点自定义参数
    result:  Optional[str]          = None        # 执行结果
    output:  Optional[str]          = None        # 详细输出
    status:  str                    = "pending"   # NodeStatus
    cost:    float                  = 0.0
    duration: int                   = 0
    turns:   int                    = 0
    provider: str                   = ""

    @classmethod
    def from_dict(cls, d: dict) -> "NodeDef":
        return cls(
            id=d["id"],
            icon=d.get("icon", "🤖"),
            label=d.get("label", ""),
            desc=d.get("desc", ""),
            color=d.get("color", "blue"),
            profile=d.get("profile", "dev"),
            params=d.get("params", {}),
            result=d.get("result"),
            output=d.get("output"),
            status=d.get("status", "pending"),
            cost=d.get("cost", 0.0),
            duration=d.get("duration", 0),
            turns=d.get("turns", 0),
            provider=d.get("provider", ""),
            model=d.get("model"),
        )
    def to_dict(self) -> dict:
        d = asdict(self)
        return {k: v for k, v in d.items() if v is not None}


@dataclass
class WorkflowJSON:
    """工作流定义 — 画布的输出，Compiler 的输入"""
    version:        str                    = "1.0.0"
    workflow_id:    str                    = ""
    name:           str                    = ""
    global_context: dict                   = field(default_factory=lambda: {
        "goal": "", "language": "zh-CN", "constraints": []
    })
    nodes:          list[NodeDef]          = field(default_factory=list)
    edges:          list[EdgeDef]          = field(default_factory=list)
    metadata:       dict                   = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> "WorkflowJSON":
        """从字典构造，兼容当前前端传来的格式。"""
        # 兼容前端直接传 nodes[] 的简化格式
        if "nodes" in d:
            nodes = [NodeDef.from_dict(n) for n in d["nodes"]]
        else:
            nodes = []

        edges_raw = d.get("edges", [])
        if isinstance(edges_raw, list):
            edges = [EdgeDef.from_dict(e) if isinstance(e, dict)
                     else EdgeDef(source=e.get("source",""), target=e.get("target",""))
                     for e in edges_raw]
        else:
            edges = []

        return cls(
            version=d.get("version", "1.0.0"),
            workflow_id=d.get("workflow_id", ""),
            name=d.get("name", ""),
            global_context=d.get("global_context", {"goal": "", "language": "zh-CN"}),
            nodes=nodes,
            edges=edges,
        )

    @classmethod
    def from_api_request(cls, nodes: list[dict],
                         requirement: str = "",
                         edges: list[dict] = None) -> "WorkflowJSON":
        """从 /api/decompose 或前端请求构建。"""
        return cls(
            workflow_id=f"wf_{id(nodes):x}",
            name=requirement[:30] if requirement else "工作流",
            global_context={
                "goal": requirement,
                "language": "zh-CN",
                "constraints": [],
            },
            nodes=[NodeDef.from_dict(n) for n in nodes],
            edges=[EdgeDef.from_dict(e) for e in (edges or [])],
        )

    def to_dict(self) -> dict:
        return {
            "version": self.version,
            "workflow_id": self.workflow_id,
            "name": self.name,
            "global_context": self.global_context,
            "nodes": [n.to_dict() for n in self.nodes],
            "edges": [asdict(e) for e in self.edges],
            "metadata": self.metadata,
        }


# ═══════════════════════════════════════════════════════
# 数据契约 2: PromptTask — Compiler 的输出 → Orchestrator
# ═══════════════════════════════════════════════════════

@dataclass
class PromptTask:
    """
    可执行的 Agent 任务。Compiler 对每个节点渲染 YAML 模板后生成。
    """
    task_id:      str
    workflow_id:  str            = ""
    node_id:      str            = ""
    node_type:    str            = "dev"     # profile
    sequence:     int            = 0         # 执行顺序
    parallel_group: int          = 0         # 同组可并行
    depends_on:   list[str]      = field(default_factory=list)  # 依赖的 node_id[]
    prompt:       str            = ""        # 完整的自然语言提示词
    system_prompt: str           = ""        # Agent system prompt
    tool_set:     list[str]      = field(default_factory=lambda: ["bash", "read", "write"])
    max_turns:    int            = 10
    timeout_s:    int            = 120
    retry:        int            = 0

    @property
    def label(self) -> str:
        return f"[{self.node_type}] {self.node_id}"

    def to_dict(self) -> dict:
        return asdict(self)


# ═══════════════════════════════════════════════════════
# 数据契约 3: Envelope JSON — Agent 输出 → Orchestrator → 画布
# ═══════════════════════════════════════════════════════

@dataclass
class ResultMetrics:
    cost:       float = 0.0       # 美元
    duration_ms: int  = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    turns:      int   = 0
    model:      str   = ""
    provider:   str   = ""
    files:      list[str] = field(default_factory=list)


@dataclass
class EnvelopeJSON:
    """Agent 执行结果的统一封装。"""
    task_id:      str
    node_id:      str            = ""
    status:       str            = "pending"  # NodeStatus
    summary:      str            = ""
    payload:      dict           = field(default_factory=dict)  # Agent 原始输出
    metrics:      ResultMetrics  = field(default_factory=ResultMetrics)
    errors:       list[str]      = field(default_factory=list)
    timestamp:    float          = 0.0

    def to_node_dict(self) -> dict:
        """转回 NodeDef 兼容格式，供前端消费。"""
        return {
            "id": self.node_id,
            "result": self.summary,
            "output": self.payload.get("output", ""),
            "status": self.status,
            "cost": self.metrics.cost,
            "duration": self.metrics.duration_ms,
            "turns": self.metrics.turns,
            "model": self.metrics.model,
            "provider": self.metrics.provider,
            "files": self.metrics.files,
        }


# ═══════════════════════════════════════════════════════
# 校验器
# ═══════════════════════════════════════════════════════

def validate_workflow(wf: WorkflowJSON) -> list[str]:
    """校验 WorkflowJSON 完整性，返回错误列表。"""
    errors = []
    if not wf.nodes:
        errors.append("nodes 为空")
        return errors

    # 重复 node id
    seen = {}
    for n in wf.nodes:
        if n.id in seen:
            errors.append(f"重复 node id: '{n.id}' (第 {seen[n.id]+1} 和当前节点)")
        seen[n.id] = seen.get(n.id, 0) + 1

    # 空 id
    for n in wf.nodes:
        if not n.id.strip():
            errors.append("节点包含空 id")
            break

    # 最大节点限制
    max_nodes = 200
    if len(wf.nodes) > max_nodes:
        errors.append(f"节点数 ({len(wf.nodes)}) 超过最大限制 ({max_nodes})")

    node_ids = {n.id for n in wf.nodes}
    for e in wf.edges:
        if e.source not in node_ids:
            errors.append(f"edges.source '{e.source}' 不存在")
        if e.target not in node_ids:
            errors.append(f"edges.target '{e.target}' 不存在")
        if e.source == e.target:
            errors.append(f"自环: {e.source} → {e.target}")

    # 孤儿节点（无入边也无出边，且不是唯一节点）
    if len(wf.nodes) > 1:
        has_in = {n.id: False for n in wf.nodes}
        has_out = {n.id: False for n in wf.nodes}
        for e in wf.edges:
            if e.source in has_out:
                has_out[e.source] = True
            if e.target in has_in:
                has_in[e.target] = True
        orphans = [nid for nid in node_ids if not has_in[nid] and not has_out[nid]]
        if len(orphans) > 1:
            errors.append(f"孤儿节点（无上下游连接）: {orphans}")

    # DAG 环检测
    try:
        sorted_nodes, _ = topological_sort(wf.nodes, wf.edges)
        if len(sorted_nodes) != len(wf.nodes):
            unsorted = set(node_ids) - {n.id for n in sorted_nodes}
            errors.append(f"DAG 中存在环，无法排序的节点: {list(unsorted)}")
    except Exception as e:
        errors.append(f"拓扑排序异常: {e}")

    # Profile 校验
    profiles = {p.value for p in Profile}
    for n in wf.nodes:
        if n.profile not in profiles:
            errors.append(f"节点 {n.id}: 未知 profile '{n.profile}'")

    return errors


def validate_prompt_tasks(tasks: list[PromptTask]) -> list[str]:
    """校验 PromptTask[] 完整性。"""
    errors = []
    if not tasks:
        errors.append("tasks 为空")
        return errors
    node_ids = {t.node_id for t in tasks}
    for t in tasks:
        if not t.prompt:
            errors.append(f"任务 {t.task_id} (node={t.node_id}): prompt 为空")
        # depends_on 存的是 node_id[]，不是 task_id[]
        for dep in t.depends_on:
            if dep not in node_ids:
                errors.append(f"任务 {t.task_id}: 依赖 node_id '{dep}' 不存在")
    return errors


# ═══════════════════════════════════════════════════════
# DAG 工具
# ═══════════════════════════════════════════════════════

def build_dag(nodes: list[NodeDef],
              edges: list[EdgeDef]) -> dict[str, list[str]]:
    """构建 DAG 邻接表。返回 {node_id: [downstream_ids]}"""
    dag: dict[str, list[str]] = {n.id: [] for n in nodes}
    for e in edges:
        if e.source in dag:
            dag[e.source].append(e.target)
    return dag


def topological_sort(nodes: list[NodeDef],
                     edges: list[EdgeDef]) -> tuple[list[NodeDef], dict[str, int]]:
    """
    Kahn 拓扑排序。
    返回 (sorted_nodes, depth_map) — depth_map[node_id] = 层级深度。
    """
    node_map = {n.id: n for n in nodes}
    in_degree = {n.id: 0 for n in nodes}
    adjacency = {n.id: [] for n in nodes}

    for e in edges:
        if e.source in adjacency and e.target in adjacency:
            adjacency[e.source].append(e.target)
            in_degree[e.target] = in_degree.get(e.target, 0) + 1

    # BFS
    queue = [nid for nid, deg in in_degree.items() if deg == 0]
    depth = {nid: 0 for nid in queue}
    sorted_ids = []

    while queue:
        # 同深度优先处理
        nid = queue.pop(0)
        sorted_ids.append(nid)
        for downstream in adjacency.get(nid, []):
            in_degree[downstream] -= 1
            if in_degree[downstream] == 0:
                depth[downstream] = max(depth.get(downstream, 0), depth.get(nid, 0) + 1)
                queue.append(downstream)

    # 环检测：如果排好序的节点数不等于总节点数，说明有环
    if len(sorted_ids) != len(nodes):
        raise ValueError(f"DAG 包含环: {len(nodes) - len(sorted_ids)} 个节点无法排序")

    sorted_nodes = [node_map[nid] for nid in sorted_ids]
    return sorted_nodes, depth


def parallel_groups(nodes: list[NodeDef],
                    edges: list[EdgeDef]) -> list[list[NodeDef]]:
    """
    将节点分组为并行执行层。
    返回 [[层0节点...], [层1节点...], ...]
    同层无依赖，可并行。
    """
    _, depth = topological_sort(nodes, edges)
    groups: dict[int, list[NodeDef]] = {}
    node_map = {n.id: n for n in nodes}
    for nid, d in depth.items():
        if nid in node_map:
            groups.setdefault(d, []).append(node_map[nid])
    return [groups[d] for d in sorted(groups.keys())]
