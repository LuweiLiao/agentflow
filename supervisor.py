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


def _new_session_id() -> str:
    return f"ses_{os.urandom(4).hex()}"


def get_session(session_id: str) -> dict | None:
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

根据用户需求和技术细节，生成结构化执行方案。

你的输出必须是**纯 JSON**，格式如下：
{
    "plan_summary": "一句话方案概述",
    "nodes": [
        {
            "id": "n1", "icon": "📋", "label": "需求分析",
            "desc": "详细的节点描述", "color": "blue",
            "profile": "analysis", "depends_on": []
        },
        {
            "id": "n2", "icon": "💻", "label": "后端开发",
            "desc": "实现 API", "color": "green",
            "profile": "dev", "depends_on": ["n1"]
        }
    ],
    "edges": [
        {"source": "n1", "target": "n2"}
    ]
}

profile 必须是: analysis, design, dev, test, doc, deploy 之一
节点数量：3-8 个，根据需求复杂度决定
不要多余的文字，只返回 JSON""".strip()

BUILDER_SYSTEM_PROMPT = """你是工作流构建专家（Builder Agent）。

你负责将 Planner 的方案转换为最终的 DAG 配置。验证以下内容：
1. DAG 无环（拓扑排序可行）
2. 所有节点 id 唯一
3. 所有边引用的节点存在
4. profile 值是合法枚举

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
            _sessions[session_id] = {
                "id": session_id,
                "history": [],
                "context": {},
                "step": "discovery",
                "nodes": [],
                "edges": [],
                "plan": None,
            }

        session = _sessions[session_id]
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

请生成一个 3-8 节点的工作流方案。
profile 必须是: analysis, design, dev, test, doc, deploy 之一。
depends_on 是上游节点 id 数组。

输出格式（纯 JSON）：
{{"plan_summary": "...", "nodes": [...], "edges": [...]}}"""

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
        """无 API key 时的兜底方案。"""
        requirement_lower = requirement.lower()
        if any(kw in requirement_lower for kw in ["串口", "serial", "pyqt", "桌面"]):
            nodes = [
                {"id": "n1", "icon": "📋", "label": "需求分析",
                 "desc": "解析串口调试助手需求", "color": "blue",
                 "profile": "analysis", "depends_on": []},
                {"id": "n2", "icon": "🎨", "label": "UI 设计",
                 "desc": "设计串口调试界面布局", "color": "blue",
                 "profile": "design", "depends_on": ["n1"]},
                {"id": "n3", "icon": "💻", "label": "UI 实现",
                 "desc": "实现 PyQt5 界面", "color": "green",
                 "profile": "dev", "depends_on": ["n2"]},
                {"id": "n4", "icon": "💻", "label": "串口逻辑",
                 "desc": "实现收发/协议/波特率控制", "color": "green",
                 "profile": "dev", "depends_on": ["n2"]},
                {"id": "n5", "icon": "🧪", "label": "集成测试",
                 "desc": "测试收发功能", "color": "purple",
                 "profile": "test", "depends_on": ["n3", "n4"]},
            ]
        elif any(kw in requirement_lower for kw in ["web", "网站", "前端", "后端"]):
            nodes = [
                {"id": "n1", "icon": "📋", "label": "需求分析",
                 "desc": "功能需求分析", "color": "blue",
                 "profile": "analysis", "depends_on": []},
                {"id": "n2", "icon": "🎨", "label": "架构设计",
                 "desc": "技术选型和系统设计", "color": "blue",
                 "profile": "design", "depends_on": ["n1"]},
                {"id": "n3", "icon": "💻", "label": "后端开发",
                 "desc": "API 和数据库实现", "color": "green",
                 "profile": "dev", "depends_on": ["n2"]},
                {"id": "n4", "icon": "💻", "label": "前端开发",
                 "desc": "UI 和交互实现", "color": "green",
                 "profile": "dev", "depends_on": ["n2"]},
                {"id": "n5", "icon": "🧪", "label": "集成测试",
                 "desc": "前后端联调", "color": "purple",
                 "profile": "test", "depends_on": ["n3", "n4"]},
            ]
        else:
            nodes = [
                {"id": "n1", "icon": "📋", "label": "需求分析",
                 "desc": "解析用户需求", "color": "blue",
                 "profile": "analysis", "depends_on": []},
                {"id": "n2", "icon": "💻", "label": "开发实现",
                 "desc": "编码实现核心功能", "color": "green",
                 "profile": "dev", "depends_on": ["n1"]},
                {"id": "n3", "icon": "🧪", "label": "测试验证",
                 "desc": "测试和修复问题", "color": "purple",
                 "profile": "test", "depends_on": ["n2"]},
                {"id": "n4", "icon": "📝", "label": "文档输出",
                 "desc": "生成使用文档", "color": "orange",
                 "profile": "doc", "depends_on": ["n3"]},
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
    """清理过期会话。"""
    now = time.time()
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
