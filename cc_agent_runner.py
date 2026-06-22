"""
AgentFlow-Code Agent Runner — 实现与 AgentRunner 相同的 execute() 接口，
但使用 CC 引擎作为后端（而非 LLM API 调用）。

用法:
    from cc_agent_runner import CCAgentRunner
    agent = CCAgentRunner(max_budget_usd=0.5)
    result = agent.execute(
        prompt="编写一个串口助手...",
        work_dir="/tmp/work"
    )
"""

import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Optional

# 尝试导入 CC 适配器
try:
    from claude_code_adapter import ClaudeCodeAdapter, AgentMessageBus, CCEngineResult
    _HAS_CC = True
except ImportError:
    _HAS_CC = False


class CCAgentRunner:
    """
    AgentFlow-Code Agent Runner — 基于 CC 引擎的 Agent。
    
    实现与 AgentRunner.execute() 相同的返回接口，
    但使用 AgentFlow-Code 引擎源码作为推理后端。
    """

    def __init__(self, max_budget_usd: float = 0.5, 
                 model: Optional[str] = None):
        if not _HAS_CC:
            raise ImportError("claude_code_adapter not found")
        self._adapter = ClaudeCodeAdapter()
        self._bus = AgentMessageBus()
        self._max_budget = max_budget_usd
        self._model = model or os.environ.get("CC_AGENT_MODEL") or os.environ.get("AGENT_MODEL", "deepseek-v4-flash")

    def execute(self, prompt: str, work_dir: str = None,
                profile: str = "dev", tools_enabled: bool = True,
                max_turns: int = 10, timeout: int = 180) -> dict:
        """执行任务，返回与 AgentRunner.execute() 兼容的 dict。"""
        start = time.time()
        
        # Build the full prompt with context
        full_prompt = self._build_prompt(prompt, work_dir, profile, tools_enabled)
        
        # Run via CC engine
        try:
            result = self._adapter.run(
                prompt=full_prompt,
                system_prompt_append=self._get_system_prompt(profile),
                max_budget_usd=self._max_budget,
                timeout=timeout,
                cwd=work_dir,  # Run in the actual workspace, not the engine dir
            )
        except Exception as e:
            duration = int((time.time() - start) * 1000)
            return {
                "result": f"CC engine error: {e}",
                "output": "",
                "cost": 0.0,
                "duration_ms": duration,
                "status": "error",
                "turns": 0,
                "model": self._model,
                "provider": "claude-code-engine",
            }

        duration = int((time.time() - start) * 1000)
        
        status = "error" if result.is_error else "ok"
        
        return {
            "result": result.text,
            "output": result.text,
            "cost": round(result.cost_usd, 6),
            "duration_ms": duration,
            "status": status,
            "turns": result.num_turns,
            "model": self._model,
            "provider": "claude-code-engine",
            "session_id": result.session_id,
            "cc_raw": result.raw,  # 保留原始输出供调试
        }

    def stream_execute(self, prompt: str, work_dir: str = None,
                       profile: str = "dev", tools_enabled: bool = True,
                       max_turns: int = 10, timeout: int = 180,
                       start_time: float = None):
        """流式执行 — 模拟 event 序列（向后兼容）。

        NOTE (#41): This is *simulated* streaming, NOT true incremental token
        streaming. The full prompt is run to completion via self.execute() and
        then split into chunks that are yielded one at a time. Callers should
        not expect sub-second latency on the first content delta. The initial
        'thinking...' event below gives the UI instant feedback that work has
        begun while execute() is still in flight.
        """
        if start_time is None:
            start_time = time.time()

        # 先 yield 一个开始事件
        yield {"type": "node_start", "payload": {"prompt": prompt[:200]}}
        # Instant feedback (#41): emit a 'thinking...' delta immediately so
        # users see activity before the full execute() call returns.
        yield {"type": "node_delta", "payload": {"content": "thinking...\n\n"}}

        # 执行
        result = self.execute(
            prompt=prompt, work_dir=work_dir, profile=profile,
            tools_enabled=tools_enabled, max_turns=max_turns, timeout=timeout
        )
        
        # yield 文本片段
        if result["output"]:
            # 按段落分段发送
            paragraphs = result["output"].split("\n\n")
            for para in paragraphs[:10]:  # 最多 10 段
                if para.strip():
                    yield {
                        "type": "node_delta",
                        "payload": {"content": para.strip() + "\n\n"}
                    }
        
        # 最终状态
        if result["status"] == "ok":
            yield {
                "type": "node_complete",
                "payload": {
                    "result": result["result"],
                    "cost": result["cost"],
                    "turns": result["turns"],
                    "status": "ok",
                    "model": result["model"],
                    "provider": result["provider"],
                }
            }
        else:
            yield {
                "type": "node_failed",
                "payload": {
                    "error": result["result"],
                    "turns": result["turns"],
                    "status": "error",
                }
            }

    def _build_prompt(self, prompt: str, work_dir: str, 
                       profile: str, tools_enabled: bool) -> str:
        """构建完整的 prompt（含工作目录上下文）。"""
        parts = [prompt]
        
        if work_dir:
            parts.append(f"\nWorking directory: {work_dir}")
            # Check for workspace files
            wd = Path(work_dir)
            if wd.exists():
                files = list(wd.glob("*"))
                if files:
                    parts.append("\nFiles in workspace:")
                    for f in sorted(files):
                        if f.is_file() and f.suffix in ('.py', '.md', '.json', '.txt', '.yaml', '.html', '.css', '.js'):
                            size = f.stat().st_size
                            parts.append(f"  {f.name} ({size}B)")

        return "\n".join(parts)

    def _get_system_prompt(self, profile: str) -> str:
        """根据 profile 选择 system prompt 扩展。"""
        prompts = {
            "dev": (
                "You are an expert software developer embedded in AgentFlow, "
                "an AI-driven workflow orchestration platform.\n"
                "Write complete, production-quality code.\n"
                f"Using model: {self._model}\n"
                "Budget: ${:.2f} max per call.".format(self._max_budget)
            ),
            "reviewer": (
                "You are a code reviewer in AgentFlow's CI pipeline.\n"
                "Review code for: correctness, style, edge cases, performance.\n"
                "Be thorough but constructive."
            ),
            "tester": (
                "You are a QA engineer in AgentFlow's test pipeline.\n"
                "Write comprehensive pytest tests.\n"
                "Cover: happy path, edge cases, error conditions."
            ),
        }
        return prompts.get(profile, prompts["dev"])

    def inject_agent_messages(self, messages: list[dict]):
        """从消息总线注入 agent 间消息。"""
        for msg in messages:
            self._bus.send(
                from_agent=msg.get("from", ""),
                to_agent=msg.get("to", ""),
                msg_type=msg.get("type", "artifact_handoff"),
                payload=msg.get("payload", {}),
            )

    def get_message_context(self, agent_id: str) -> str:
        """获取当前 agent 的消息上下文（注入到 prompt 中）。"""
        return self._bus.messages_for_prompt(agent_id)


# ── 快捷测试 ────────────────────────────────────────
if __name__ == "__main__":
    agent = CCAgentRunner(max_budget_usd=0.2)
    result = agent.execute(
        prompt="Write a Python hello world function and explain it.",
        work_dir="/tmp/cc-test",
        timeout=30,
    )
    print(f"Status: {result['status']}")
    print(f"Cost: ${result['cost']:.4f}")
    print(f"Duration: {result['duration_ms']}ms")
    print(f"Result[:300]:\n{result['result'][:300]}")
