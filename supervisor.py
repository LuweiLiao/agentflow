#!/usr/bin/env python3
"""Supervisor 多 Agent 路由 — 多轮对话式编排引擎。

参考 n8n 的 Supervised Multi-Agent (4+1) 架构：
  Supervisor (Router)
    ├── Discovery   — 需求模糊时追问细节
    ├── Planner     — 出方案（plan mode）
    ├── Builder     — 用 tools 构建 DAG
    └── Responder   — 回答用户

用法:
    supervisor = Supervisor()
    resp = supervisor.process("帮我做一个串口调试助手")
    # 后续轮次：
    resp = supervisor.process("用 PyQt5", session_id=resp["session_id"])

API endpoint:
    POST /api/supervisor
    {"message": "...", "session_id": "..."}
    → {"message": "...", "session_id": "...", "nodes": [...], "edges": [...], "done": false}
"""
import json
import os
import threading
import time

from agent_runner import AgentRunner
from agentflow_schema import (
    EdgeDef,
    NodeDef,
    WorkflowJSON,
    validate_workflow,
)

# 默认模型
SUPERVISOR_MODEL = os.environ.get("AGENT_MODEL", "deepseek-v4-flash")

# ── 会话存储（内存版，将来可迁移到 SQLite） ──────────
_sessions: dict[str, dict] = {}

# P1 FIX: 保护 _sessions 的读写锁。Supervisor 在 ThreadingHTTPServer 中被
# 并发调用，未加锁的 dict 会在并发 create/read/delete 时触发
# "dictionary changed size during iteration" 或丢失更新。
# 使用 RLock（可重入）：process() 持锁时会调用 cleanup_expired_sessions()，
# 后者也需要获取同一把锁，普通 Lock 会死锁。
_sessions_lock = threading.RLock()


def _new_session_id() -> str:
    return f"ses_{os.urandom(4).hex()}"


def get_session(session_id: str) -> dict | None:
    with _sessions_lock:
        return _sessions.get(session_id)


# ── Agent 身份定义 ──────────────────────────────────

DISCOVERY_SYSTEM_PROMPT = """你是一个需求挖掘专家（Discovery Agent）。

你的工作：
1. 当用户需求模糊/不完整时，追问关键细节
2. 不要一次性问太多问题（最多 3 个）
3. 当信息足够构建工作流时，回答 "INFO_SUFFICIENT"
4. 始终保持专业、简洁

关键维度（需要时追问）：
- 技术栈 / 框架
- 核心功能
- 目标平台 / 环境
- 复杂度估算

规则：
- 如果用户的需求已经足够清晰，直接回答 INFO_SUFFICIENT
- 绝不要替用户做技术选型，除非用户明确要求推荐
- 一次只问 1-2 个问题""".strip()

PLANNER_SYSTEM_PROMPT = """你是一个工作流规划专家（Planner Agent）。

## 核心使命
深度分析用户需求，生成**针对该需求量身定制**的 DAG 工作流。每个节点的 desc 必须具体到该需求的技术细节，绝不能写泛泛的"实现功能"。

## 原则
1. **节点数量由需求复杂度决定**：简单需求 3-4 个，中等 5-8 个，复杂系统 10-20+ 个。没有上限。
2. **DAG 结构必须反映需求的真实依赖关系**：可以并行（前端+后端同时开发）、可以扇入（多模块汇入集成测试）、可以分阶段（研究→原型→优化→生产化）。
3. **profile 不限固定类型**：除了 analysis/design/dev/test/doc/deploy，你可以创造任意 profile（如 research/infra/security/i18n/migration/audit/data/research）。profile 只是告诉执行引擎该用什么系统提示词。
4. **desc 必须极其具体**：要包含技术栈、模块名、接口定义、数据结构等。不能写"实现核心功能"，要写"实现 WebSocket 连接管理器，支持心跳检测、自动重连、消息广播到 3+ 主题频道"。

## 输出格式（纯 JSON）
{
    "plan_summary": "一句话方案概述（含具体技术选型）",
    "nodes": [
        {
            "id": "n1",
            "icon": "🔍",
            "label": "节点标题（简短）",
            "desc": "详细到技术层面的节点描述",
            "color": "blue",
            "profile": "analysis",
            "depends_on": []
        }
    ],
    "edges": [
        {"source": "n1", "target": "n2"}
    ]
}

## 示例（注意每个需求的 DAG 结构完全不同）

### 示例 A：用户要做一个无人机 PID 控制器仿真
→ 节点结构：动力学建模 → 控制律设计 → Simulink 仿真 → 参数整定 → 响应曲线分析
→ profile: research → research → dev → test → analysis
→ 这是线性但有专业深度的链

### 示例 B：用户要做一个在线协作文档系统
→ 节点结构：需求分析 → [架构设计 ∥ 技术选型调研] → [WebSocket 服务 ∥ CRDT 引擎 ∥ 前端富文本] → 集成 → [压力测试 ∥ 安全审计] → 部署
→ 5 条并行分支 + 2 次扇入，12+ 节点
→ profile 多样: analysis/design/research/dev/dev/dev/test/security/deploy

### 示例 C：用户要做一个 Python 数据清洗脚本
→ 节点结构：需求理解 → 脚本编写 → 单元测试
→ 只有 3 个节点，因为需求简单

关键：**每个需求的 DAG 应该看起来不一样**。如果不同需求生成了相似的 DAG，说明你在套模板而不是真正分析需求。

不要多余的文字，只返回 JSON。""".strip()

BUILDER_SYSTEM_PROMPT = """你是工作流构建专家（Builder Agent）。

你负责将 Planner 的方案转换为最终的 DAG 配置。验证以下内容：
1. DAG 无环（拓扑排序可行）
2. 所有节点 id 唯一
3. 所有边引用的节点存在
4. profile 值是合法字符串（可以是任意类型，不限于固定枚举）

如果一切正确，输出最终的 nodes 和 edges。
如果有问题，输出错误描述。

输出格式（纯 JSON）：
{"nodes": [...], "edges": [...], "errors": []}""".strip()

RESPONDER_SYSTEM_PROMPT = """你是 AgentFlow 的回应专家（Responder Agent）。

你的工作：
1. 将执行结果用自然语言总结给用户
2. 突出关键信息：节点数量、执行状态、成本、耗时
3. 给出后续建议：下一步可以做什么
4. 语气友好、专业、有建设性""".strip()


# ── 核心类 ─────────────────────────────────────────

class Supervisor:
    """Supervisor 多 Agent 路由引擎。"""

    def __init__(self, model: str = SUPERVISOR_MODEL):
        self.model = model
        self._agent_cache: dict[str, AgentRunner] = {}

    def _get_agent(self) -> AgentRunner:
        """获取 AgentRunner 实例（缓存复用）。"""
        key = self.model
        if key not in self._agent_cache:
            self._agent_cache[key] = AgentRunner(model=self.model)
        return self._agent_cache[key]

    def _llm_ask(self, system_prompt: str, user_message: str,
                 timeout: int = 30) -> str:
        """用 LLM 回答，不调工具。"""
        agent = self._get_agent()
        result = agent.execute(
            prompt=f"{system_prompt}\n\n用户: {user_message}",
            work_dir="/tmp/agentflow_supervisor",
            profile="analysis",
            tools_enabled=False,
            max_turns=1,
            timeout=timeout,
        )
        return result.get("output", "") or result.get("result", "")

    def process(self, message: str, session_id: str = None) -> dict:
        """处理用户消息，返回响应。

        Args:
            message: 用户消息
            session_id: 会话 ID（None=新会话）

        Returns:
            {"message": str, "session_id": str,
             "nodes": list, "edges": list,
             "step": str, "done": bool}
        """
        if not session_id or session_id not in _sessions:
            session_id = _new_session_id()
            with _sessions_lock:
                _sessions[session_id] = {
                    "id": session_id,
                    "history": [],
                    "context": {},
                    "step": "discovery",
                    "nodes": [],
                    "edges": [],
                    "plan": None,
                    "created_at": time.time(),  # Bug #8 FIX: track creation time for cleanup
                }

        with _sessions_lock:
            session = _sessions[session_id]
            session["last_active"] = time.time()  # Bug #8 FIX: track last active for eviction
            # Periodic cleanup: prevent unbounded session growth
            if len(_sessions) > 100:
                cleanup_expired_sessions(max_age=3600)
            session["history"].append({"role": "user", "content": message})

        step = session.get("step", "discovery")

        if step == "discovery":
            return self._run_discovery(session, message)
        elif step == "planning":
            return self._run_planning(session, message)
        elif step == "building":
            return self._run_building(session, message)
        elif step == "done":
            # 已完成，返回已有结果
            return self._make_response(session, message)
        else:
            # 兜底
            session["step"] = "done"
            return self._make_response(session, message)

    def _run_discovery(self, session: dict, message: str) -> dict:
        """Discovery 阶段：追问细节或确认已足够。"""
        # 构建上下文
        history_text = "\n".join(
            f"{h['role']}: {h['content']}" for h in session["history"]
        )

        prompt = f"""当前对话历史：
{history_text}

用户的最新需求：{message}

作为 Discovery Agent，判断：
1. 需求是否足够明确（技术栈、核心功能、目标平台都清楚）
2. 如果不够清楚，追问 1-2 个关键问题
3. 如果足够，回答 "INFO_SUFFICIENT"

输出格式（纯 JSON，不要其他文字）：
{{"intent": "clarify"|"sufficient", "questions": ["问句1", ...], "summary": "需求摘要"}}"""

        try:
            raw = self._llm_ask(DISCOVERY_SYSTEM_PROMPT, prompt, timeout=30)
            clean = raw.strip()
            # 提取 JSON
            start = clean.find("{")
            end = clean.rfind("}")
            if start >= 0 and end > start:
                parsed = json.loads(clean[start:end+1])
            else:
                parsed = {"intent": "sufficient", "questions": [],
                          "summary": message[:100]}
        except (json.JSONDecodeError, ValueError):
            parsed = {"intent": "sufficient", "questions": [],
                      "summary": message[:100]}

        if parsed.get("intent") == "sufficient":
            # 进入规划阶段
            session["context"]["summary"] = parsed.get("summary", message)
            session["step"] = "planning"
            return self._run_planning(session, message)

        # 仍在 discovery
        questions = parsed.get("questions", [])
        reply = "请补充以下信息：\n" + "\n".join(f"- {q}" for q in questions) if questions \
                else "请提供更多细节（技术栈、核心功能、目标平台）。"
        session["history"].append({"role": "assistant", "content": reply})
        return {
            "message": reply,
            "session_id": session["id"],
            "step": "discovery",
            "done": False,
            "nodes": [],
            "edges": [],
        }

    def _run_planning(self, session: dict, message: str) -> dict:
        """Planning 阶段：生成结构化方案。"""
        summary = session["context"].get("summary", message)

        prompt = f"""用户需求摘要：{summary}

请深度分析这个需求，生成一个**量身定制**的工作流方案。

要求：
1. 先在内心分析：这个需求涉及哪些技术领域？哪些可以并行？哪些有严格的先后依赖？
2. 节点数量由复杂度决定——简单需求 3-4 个，中等 5-8 个，复杂系统 10-20+ 个
3. DAG 结构要反映真实依赖：允许并行分支、扇入汇合、多阶段
4. 每个节点的 desc 必须包含具体技术细节（技术栈、模块名、接口），不要泛泛而谈
5. profile 可以是任意类型，不限于固定枚举
6. color 从这些选: blue/green/purple/orange/red/cyan/pink/yellow
7. icon 用合适的 emoji

输出纯 JSON：{{"plan_summary": "...", "nodes": [...], "edges": [...]}}"""

        try:
            raw = self._llm_ask(PLANNER_SYSTEM_PROMPT, prompt, timeout=45)
            clean = raw.strip()
            start = clean.find("{")
            end = clean.rfind("}")
            if start >= 0 and end > start:
                plan = json.loads(clean[start:end+1])
            else:
                plan = self._fallback_plan(summary)
        except (json.JSONDecodeError, ValueError):
            plan = self._fallback_plan(summary)

        nodes = plan.get("nodes", [])
        edges = plan.get("edges", [])
        plan_summary = plan.get("plan_summary", "工作流方案")

        # 验证 DAG
        node_defs = [
            NodeDef(id=n["id"], icon=n.get("icon", "🤖"),
                    label=n.get("label", ""), desc=n.get("desc", ""),
                    color=n.get("color", "blue"),
                    profile=n.get("profile", "dev"))
            for n in nodes
        ]
        edge_defs = [
            EdgeDef(source=e["source"], target=e["target"])
            for e in edges
        ]
        if node_defs:
            wf = WorkflowJSON(
                workflow_id=session["id"],
                name=plan_summary[:50],
                global_context={"goal": summary, "language": "zh-CN",
                                "constraints": []},
                nodes=node_defs,
                edges=edge_defs,
            )
            validation_errors = validate_workflow(wf)
            if validation_errors:
                # 有验证错误，让 Builder 修复
                session["context"]["plan_raw"] = {"nodes": nodes, "edges": edges,
                                                   "errors": validation_errors}
            else:
                session["context"]["plan"] = {"nodes": nodes, "edges": edges}

        session["context"]["plan_summary"] = plan_summary
        session["step"] = "building"
        session["nodes"] = nodes
        session["edges"] = edges

        reply = f"📋 **规划方案**：{plan_summary}\n共 {len(nodes)} 个节点\n\n"
        for n in nodes:
            deps = n.get("depends_on", [])
            dep_str = f" ← {', '.join(deps)}" if deps else ""
            reply += f"- {n.get('icon', '🤖')} **{n.get('label', n['id'])}** [{n.get('profile', 'dev')}]{dep_str}\n"

        session["history"].append({"role": "assistant", "content": reply})

        return {
            "message": reply,
            "session_id": session["id"],
            "step": "planning",
            "done": False,
            "nodes": nodes,
            "edges": edges,
        }

    def _run_building(self, session: dict, message: str) -> dict:
        """Building 阶段：确认并返回最终 DAG。"""
        nodes = session.get("nodes", [])
        edges = session.get("edges", [])

        # 如果用户说"好/确认/开始执行"，返回最终结果
        confirm_keywords = ["好", "确认", "可以", "开始", "执行", "是的",
                            "yes", "ok", "y", "go", "run", "就这个", "行"]
        is_confirm = any(kw in message.lower().strip()
                         for kw in confirm_keywords)

        if is_confirm:
            # 用户确认方案
            session["step"] = "done"
            return {
                "message": "✅ 方案已确认，可以开始执行！",
                "session_id": session["id"],
                "step": "done",
                "done": True,
                "nodes": nodes,
                "edges": edges,
                "plan_summary": session["context"].get("plan_summary", ""),
            }
        else:
            # 用户有修改意见，回到 planning
            session["step"] = "planning"
            session["history"].append({
                "role": "user", "content": f"修改意见: {message}"
            })
            return self._run_planning(session, message)

    def _make_response(self, session: dict, message: str) -> dict:
        """已完成的会话返回当前结果。"""
        return {
            "message": "工作流已就绪，可以提交执行。",
            "session_id": session["id"],
            "step": "done",
            "done": True,
            "nodes": session.get("nodes", []),
            "edges": session.get("edges", []),
        }

    def _fallback_plan(self, requirement: str) -> dict:
        """无 API key 时的兜底方案——基于需求关键词生成更多样化的 DAG。"""
        r = requirement.lower()
        nodes: list[dict] = []

        # 根据需求领域生成不同结构的 DAG
        if any(kw in r for kw in ["串口", "serial", "pyqt", "桌面", "gui"]):
            # 桌面应用——UI + 逻辑双分支并行
            nodes = [
                {"id": "n1", "icon": "📋", "label": "需求分析",
                 "desc": f"解析需求：{requirement[:60]}", "color": "blue",
                 "profile": "analysis", "depends_on": []},
                {"id": "n2", "icon": "🎨", "label": "UI 设计",
                 "desc": "设计界面布局、交互流程、配色方案", "color": "cyan",
                 "profile": "design", "depends_on": ["n1"]},
                {"id": "n3", "icon": "💻", "label": "UI 实现",
                 "desc": "实现主窗口、控件、事件绑定", "color": "green",
                 "profile": "dev", "depends_on": ["n2"]},
                {"id": "n4", "icon": "⚙️", "label": "核心逻辑",
                 "desc": "实现业务逻辑层（数据处理、协议解析）", "color": "green",
                 "profile": "dev", "depends_on": ["n2"]},
                {"id": "n5", "icon": "🔌", "label": "集成联调",
                 "desc": "UI 与逻辑层对接、端到端测试", "color": "purple",
                 "profile": "test", "depends_on": ["n3", "n4"]},
            ]
        elif any(kw in r for kw in ["web", "网站", "前端", "后端", "api", "fullstack", "全栈"]):
            # Web 应用——前后端并行 + 中间件
            nodes = [
                {"id": "n1", "icon": "📋", "label": "需求分析",
                 "desc": f"功能需求拆解、技术选型：{requirement[:50]}", "color": "blue",
                 "profile": "analysis", "depends_on": []},
                {"id": "n2", "icon": "🏛️", "label": "架构设计",
                 "desc": "系统架构、API 设计、数据库 ER 图", "color": "cyan",
                 "profile": "design", "depends_on": ["n1"]},
                {"id": "n3", "icon": "🗄️", "label": "数据库层",
                 "desc": "建表、迁移脚本、索引优化", "color": "orange",
                 "profile": "dev", "depends_on": ["n2"]},
                {"id": "n4", "icon": "🔌", "label": "后端 API",
                 "desc": "REST/GraphQL 接口实现、中间件", "color": "green",
                 "profile": "dev", "depends_on": ["n3"]},
                {"id": "n5", "icon": "🎨", "label": "前端界面",
                 "desc": "页面组件、状态管理、路由", "color": "green",
                 "profile": "dev", "depends_on": ["n2"]},
                {"id": "n6", "icon": "🔗", "label": "前后端联调",
                 "desc": "接口对接、跨域处理、认证流程", "color": "purple",
                 "profile": "test", "depends_on": ["n4", "n5"]},
            ]
        elif any(kw in r for kw in ["pid", "控制", "仿真", "simulink", "matlab", "无人机", "飞控"]):
            # 控制/仿真——研究型深度链
            nodes = [
                {"id": "n1", "icon": "📚", "label": "文献调研",
                 "desc": f"调研相关算法和控制策略：{requirement[:50]}", "color": "blue",
                 "profile": "research", "depends_on": []},
                {"id": "n2", "icon": "🧮", "label": "数学建模",
                 "desc": "建立动力学/运动学模型、状态空间表示", "color": "cyan",
                 "profile": "research", "depends_on": ["n1"]},
                {"id": "n3", "icon": "🎛️", "label": "控制律设计",
                 "desc": "设计控制器（PID/LQR/MPC）、稳定性分析", "color": "orange",
                 "profile": "design", "depends_on": ["n2"]},
                {"id": "n4", "icon": "💻", "label": "仿真实现",
                 "desc": "Simulink/MATLAB 仿真模型搭建", "color": "green",
                 "profile": "dev", "depends_on": ["n3"]},
                {"id": "n5", "icon": "📊", "label": "性能评估",
                 "desc": "阶跃响应、频域分析、鲁棒性验证", "color": "purple",
                 "profile": "test", "depends_on": ["n4"]},
            ]
        elif any(kw in r for kw in ["爬虫", "crawler", "数据清洗", "etl", "数据处理", "脚本"]):
            # 数据脚本——轻量
            nodes = [
                {"id": "n1", "icon": "📋", "label": "需求理解",
                 "desc": f"明确数据源、输出格式、清洗规则：{requirement[:50]}", "color": "blue",
                 "profile": "analysis", "depends_on": []},
                {"id": "n2", "icon": "💻", "label": "脚本编写",
                 "desc": "Python 脚本实现（requests/pandas/scrapy）", "color": "green",
                 "profile": "dev", "depends_on": ["n1"]},
                {"id": "n3", "icon": "🧪", "label": "测试验证",
                 "desc": "单元测试、边界数据测试、性能基准", "color": "purple",
                 "profile": "test", "depends_on": ["n2"]},
            ]
        else:
            # 通用——但仍然尝试给出更有针对性的结构
            nodes = [
                {"id": "n1", "icon": "📋", "label": "需求分析",
                 "desc": f"深度解析需求：{requirement[:60]}", "color": "blue",
                 "profile": "analysis", "depends_on": []},
                {"id": "n2", "icon": "🏗️", "label": "方案设计",
                 "desc": "技术选型、模块划分、接口定义", "color": "cyan",
                 "profile": "design", "depends_on": ["n1"]},
                {"id": "n3", "icon": "💻", "label": "核心开发",
                 "desc": "编码实现核心功能模块", "color": "green",
                 "profile": "dev", "depends_on": ["n2"]},
                {"id": "n4", "icon": "🧪", "label": "测试验证",
                 "desc": "单元测试 + 集成测试 + 边界检查", "color": "purple",
                 "profile": "test", "depends_on": ["n3"]},
            ]
        edges = []
        for n in nodes:
            for dep in n.get("depends_on", []):
                edges.append({"source": dep, "target": n["id"]})
        if not edges and len(nodes) > 1:
            for i in range(len(nodes) - 1):
                edges.append({"source": nodes[i]["id"], "target": nodes[i+1]["id"]})
        return {
            "plan_summary": f"{len(nodes)} 节点工作流",
            "nodes": nodes,
            "edges": edges,
        }


# ── 会话清理 ──────────────────────────────────────
def cleanup_expired_sessions(max_age: int = 3600):
    """清理过期会话。

    P1 FIX: 在 _sessions_lock 保护下操作，避免与并发 process() 调用产生
    "dictionary changed size during iteration"。先快照待删除 key，再删除。
    """
    now = time.time()
    with _sessions_lock:
        expired = [
            sid for sid, s in _sessions.items()
            if s.get("created_at", 0) < now - max_age
        ]
        for sid in expired:
            del _sessions[sid]
    return len(expired)


if __name__ == "__main__":
    # 快速测试
    sup = Supervisor()
    resp = sup.process("帮我做一个串口调试助手")
    print(f"[Round 1] step={resp['step']}, done={resp['done']}")
    print(f"  message: {resp['message'][:80]}...")

    if not resp["done"]:
        resp2 = sup.process("用 PyQt5，支持9600/115200波特率，HEX收发",
                            session_id=resp["session_id"])
        print(f"[Round 2] step={resp2['step']}, done={resp2['done']}")
        print(f"  message: {resp2['message'][:80]}...")
        if "nodes" in resp2:
            print(f"  nodes: {len(resp2.get('nodes', []))}")

    print(f"\nActive sessions: {len(_sessions)}")
    print(f"Cleanup: {cleanup_expired_sessions(max_age=0)} sessions removed")
