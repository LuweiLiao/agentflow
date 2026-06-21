"""
Claude Code Engine Adapter — Low-level bridge to CC engine subprocess.

Spawns the CC engine (bun run src/entrypoints/cli.tsx -p) as a subprocess,
communicates via stdin/stdout JSON protocol.

Usage:
    adapter = ClaudeCodeAdapter()
    result = adapter.run(
        prompt="Write a Python function...",
        system_prompt_append="You are a code expert.",
        max_budget_usd=0.5,
        timeout=120
    )
    print(result.text)  # The text result
    print(result.cost)  # Cost in USD
"""

import json
import os
import signal
import subprocess
import sys
import time
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class CCEngineResult:
    """Structured result from a CC engine invocation."""
    text: str
    raw: dict
    is_error: bool
    duration_ms: int
    cost_usd: float
    session_id: str
    num_turns: int
    usage: dict
    model_usage: dict
    errors: list
    stop_reason: str


@dataclass
class AgentMessage:
    """Message between agents in a multi-agent workflow."""
    protocol: str = "agentflow/v1"
    from_agent: str = ""
    to_agent: str = ""
    msg_type: str = "artifact_handoff"  # artifact_handoff, review_request, review_feedback, prompt_suggestion, coordination
    payload: dict = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
    thread_id: str = ""


class ClaudeCodeAdapter:
    """
    Low-level adapter for the CC engine subprocess.
    
    - Spawns `bun run src/entrypoints/cli.tsx -p` 
    - Feeds prompt via stdin
    - Parses JSON output from stdout
    """

    ENGINE_DIR = Path("/home/llw/claude-code-engine")
    CLI_ENTRY = "src/entrypoints/cli.tsx"
    BUN_PATH = "/home/llw/.nvm/versions/node/v24.14.1/bin/bun"

    def __init__(self, engine_dir: Optional[str] = None):
        self.engine_dir = Path(engine_dir or self.ENGINE_DIR)
        if not self.engine_dir.exists():
            raise FileNotFoundError(f"CC engine not found at {self.engine_dir}")
        self._session_id: Optional[str] = None

    def _build_cmd(self, append_system_prompt: str = "", 
                    max_budget_usd: float = 0.5,
                    output_format: str = "json") -> list:
        """Build the CC engine CLI command."""
        cmd = [
            self.BUN_PATH, "run", str(self.CLI_ENTRY),
            "-p",  # pipe mode
            f"--output-format={output_format}",
            f"--max-budget-usd={max_budget_usd}",
            "--bare",  # skip hooks, enable simple mode
            # R3-P0-6: 不再传 --permission-mode bypassPermissions，避免 Agent
            #          在宿主机上无审批执行任意文件系统/Shell 操作。改用默认
            #          权限模式（需调用方显式审批或预置细粒度允许列表）。
        ]
        if append_system_prompt:
            cmd.append(f"--append-system-prompt={append_system_prompt}")
        return cmd

    def run(self, prompt: str, *,
            system_prompt_append: str = "",
            max_budget_usd: float = 0.5,
            timeout: int = 180,
            cwd: Optional[str] = None) -> CCEngineResult:
        """
        Run the CC engine with the given prompt.
        
        Args:
            prompt: The main user prompt to send
            system_prompt_append: Extra system context to inject
            max_budget_usd: Maximum API cost for this run
            timeout: Max seconds to wait for completion
            cwd: Working directory (defaults to engine dir)
            
        Returns:
            CCEngineResult with parsed JSON result
        """
        cmd = self._build_cmd(
            append_system_prompt=system_prompt_append,
            max_budget_usd=max_budget_usd,
        )
        
        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(cwd or self.engine_dir),
            text=True,
            # R3-P0-2: 以独立进程组启动，确保 kill 时可杀死整个进程树
            #          （bun → node → 子工作进程），避免孤儿/僵尸进程残留。
            start_new_session=True,
        )

        try:
            stdout, stderr = proc.communicate(input=prompt, timeout=timeout)
        except subprocess.TimeoutExpired:
            # R3-P0-2: 用 SIGTERM → 等待 → SIGKILL 杀死整个进程组。
            self._kill_process_group(proc)
            stdout, stderr = proc.communicate()
            return CCEngineResult(
                text=f"Timed out after {timeout}s",
                raw={"error": "timeout"},
                is_error=True,
                duration_ms=timeout * 1000,
                cost_usd=0.0,
                session_id="",
                num_turns=0,
                usage={},
                model_usage={},
                errors=[f"Timeout after {timeout}s"],
                stop_reason="timeout",
            )

        if proc.returncode != 0:
            return CCEngineResult(
                text=f"CC engine exited with code {proc.returncode}",
                raw={"error": stderr or "unknown error"},
                is_error=True,
                duration_ms=0,
                cost_usd=0.0,
                session_id="",
                num_turns=0,
                usage={},
                model_usage={},
                errors=[stderr or f"Exit code {proc.returncode}"],
                stop_reason="error",
            )

        return self._parse_output(stdout)

    @staticmethod
    def _kill_process_group(proc: subprocess.Popen):
        """R3-P0-2: 终止整个进程组，先 SIGTERM 再 SIGKILL。

        需与 Popen(start_new_session=True) 配合使用。
        """
        try:
            pgid = os.getpgid(proc.pid)
        except ProcessLookupError:
            return
        try:
            os.killpg(pgid, signal.SIGTERM)
            time.sleep(0.5)
            os.killpg(pgid, signal.SIGKILL)
        except ProcessLookupError:
            pass  # 进程组已退出
        except OSError:
            # killpg 失败时回退到直接 kill
            proc.kill()

    def _parse_output(self, stdout: str) -> CCEngineResult:
        """Parse the JSON output from CC engine stdout.

        R3-P0-3: 使用 json.JSONDecoder().raw_decode() 做括号匹配解析，
                 而非逐行 split('\\n')。JSON 值中的换行符不会再导致截断失败。
        """
        decoder = json.JSONDecoder()
        text = stdout.strip()
        idx = 0
        length = len(text)
        while idx < length:
            # 跳过非 JSON 文本（引擎日志/进度行）
            while idx < length and text[idx] not in '{[':
                idx += 1
            if idx >= length:
                break
            try:
                data, consumed = decoder.raw_decode(text[idx:])
            except json.JSONDecodeError:
                # 当前位置不是合法 JSON 开头，前进一位继续找
                idx += 1
                continue
            idx += consumed
            if isinstance(data, dict) and data.get("type") == "result":
                return CCEngineResult(
                    text=data.get("result", ""),
                    raw=data,
                    is_error=data.get("is_error", False),
                    duration_ms=data.get("duration_ms", 0),
                    cost_usd=data.get("total_cost_usd", 0.0),
                    session_id=data.get("session_id", ""),
                    num_turns=data.get("num_turns", 0),
                    usage=data.get("usage", {}),
                    model_usage=data.get("modelUsage", {}),
                    errors=data.get("errors", []),
                    stop_reason=data.get("stop_reason", ""),
                )

        # Fallback: return raw text
        return CCEngineResult(
            text=stdout.strip(),
            raw={"raw_output": stdout.strip()},
            is_error=False,
            duration_ms=0,
            cost_usd=0.0,
            session_id="",
            num_turns=0,
            usage={},
            model_usage={},
            errors=[],
            stop_reason="unknown",
        )

    def run_with_files(self, prompt: str, files: dict[str, str], *,
                        system_prompt_append: str = "",
                        max_budget_usd: float = 0.5,
                        timeout: int = 180) -> CCEngineResult:
        """
        Run CC engine with workspace files injected as context.
        
        Args:
            prompt: The main prompt
            files: Dict of {filename: content} to inject into context
            system_prompt_append: Extra system context
            
        Returns:
            CCEngineResult
        """
        # Build a context that includes the files
        context_parts = []
        for fname, fcontent in files.items():
            context_parts.append(f"=== FILE: {fname} ===\n{fcontent}\n=== END FILE ===")
        
        full_prompt = "\n\n".join(context_parts) + "\n\n" + prompt if context_parts else prompt
        
        append = system_prompt_append
        if files:
            file_list = ", ".join(files.keys())
            append = (append + "\n" if append else "") + \
                     f"The following files are available in the workspace: {file_list}"

        return self.run(full_prompt, 
                        system_prompt_append=append,
                        max_budget_usd=max_budget_usd,
                        timeout=timeout)


class AgentMessageBus:
    """
    In-memory message bus for agent-to-agent communication.
    
    Supports:
    - Send message: one agent sends to another
    - Poll messages: agent reads its inbox
    - Thread history: conversation history between agents
    - Structured messages: artifact handoff, review, prompt suggestions
    """

    def __init__(self):
        self._messages: list[AgentMessage] = []
        self._inboxes: dict[str, list[AgentMessage]] = {}

    def send(self, msg: AgentMessage):
        """Send a message to an agent's inbox."""
        self._messages.append(msg)
        if msg.to_agent not in self._inboxes:
            self._inboxes[msg.to_agent] = []
        self._inboxes[msg.to_agent].append(msg)
        return msg

    def send_artifact_handoff(self, from_agent: str, to_agent: str,
                               message: str, artifacts: list[str] = None,
                               suggestions: list[dict] = None) -> AgentMessage:
        """Send an artifact handoff message."""
        return self.send(AgentMessage(
            from_agent=from_agent,
            to_agent=to_agent,
            msg_type="artifact_handoff",
            payload={
                "message": message,
                "artifacts": artifacts or [],
                "suggestions": suggestions or [],
            }
        ))

    def send_review_request(self, from_agent: str, to_agent: str,
                             artifacts: list[str]) -> AgentMessage:
        """Request a code review."""
        return self.send(AgentMessage(
            from_agent=from_agent,
            to_agent=to_agent,
            msg_type="review_request",
            payload={"artifacts": artifacts}
        ))

    def send_review_feedback(self, from_agent: str, to_agent: str,
                              feedback: str, issues: list[dict]) -> AgentMessage:
        """Send review feedback."""
        return self.send(AgentMessage(
            from_agent=from_agent,
            to_agent=to_agent,
            msg_type="review_feedback",
            payload={"feedback": feedback, "issues": issues}
        ))

    def send_prompt_suggestion(self, from_agent: str, to_agent: str,
                                target_agent: str, suggestion: str) -> AgentMessage:
        """Suggest a prompt improvement for another agent."""
        return self.send(AgentMessage(
            from_agent=from_agent,
            to_agent="__prompt_optimizer__",
            msg_type="prompt_suggestion",
            payload={
                "target_agent": target_agent,
                "suggestion": suggestion
            }
        ))

    def poll(self, agent_id: str, clear: bool = True) -> list[AgentMessage]:
        """Get all messages for an agent."""
        msgs = self._inboxes.get(agent_id, [])
        if clear:
            self._inboxes[agent_id] = []
        return msgs

    def get_thread(self, agent_a: str, agent_b: str) -> list[AgentMessage]:
        """Get full conversation history between two agents."""
        return [
            m for m in self._messages
            if {m.from_agent, m.to_agent} == {agent_a, agent_b}
        ]

    def messages_for_prompt(self, agent_id: str, context_agent: str = None) -> str:
        """Format inbox messages as a prompt injection string."""
        msgs = self.poll(agent_id)
        if not msgs:
            return ""

        parts = ["[Agent Messages Inbox]"]
        for m in msgs:
            parts.append(f"  From: {m.from_agent}")
            parts.append(f"  Type: {m.msg_type}")
            parts.append(f"  Message: {m.payload.get('message', '')}")
            if m.payload.get("artifacts"):
                parts.append(f"  Artifacts: {', '.join(m.payload['artifacts'])}")
            if m.payload.get("suggestions"):
                for s in m.payload["suggestions"]:
                    parts.append(f"  [Suggestion for {s.get('target','?')}]: {s.get('suggestion','')}")
            parts.append("")

        return "\n".join(parts)


class PromptOptimizer:
    """
    Analyzes workflow execution and optimizes agent prompts.
    
    After a workflow run, collects:
    - Test pass/fail rates
    - Code quality issues found during review
    - Agent interaction patterns
    - Specific prompt deficiencies
    
    Generates optimized prompts for future runs.
    """

    def __init__(self):
        self._prompt_history: dict[str, list[dict]] = {}
        self._optimization_log: list[dict] = []

    def record_execution(self, agent_id: str, prompt: str, 
                          result: CCEngineResult,
                          test_results: dict = None,
                          review_issues: list[dict] = None):
        """Record an agent's execution for analysis."""
        if agent_id not in self._prompt_history:
            self._prompt_history[agent_id] = []
        self._prompt_history[agent_id].append({
            "prompt": prompt,
            "cost": result.cost_usd,
            "num_turns": result.num_turns,
            "errors": result.errors,
            "test_results": test_results or {},
            "review_issues": review_issues or [],
            "timestamp": time.time(),
        })

    def analyze_and_optimize(self, agent_id: str) -> list[str]:
        """
        Analyze execution history and suggest prompt optimizations.
        
        Returns list of optimization suggestions.
        """
        history = self._prompt_history.get(agent_id, [])
        if len(history) < 2:
            return ["Not enough data to optimize (need 2+ runs)"]

        suggestions = []
        recent = history[-1]

        # Check for test failures
        if recent.get("test_results"):
            fails = sum(1 for v in recent["test_results"].values() if not v)
            if fails > 0:
                suggestions.append(
                    f"Test failure rate: {fails}/{len(recent['test_results'])}. "
                    f"Add explicit test constraints to agent prompt."
                )

        # Check for review issues
        if recent.get("review_issues"):
            suggestions.append(
                f"{len(recent['review_issues'])} code quality issues found. "
                f"Add coding standards enforcement to prompt."
            )

        # Cost optimization
        cost = recent.get("cost", 0)
        if cost > 0.5:
            suggestions.append(
                f"High cost (${cost:.2f}). Consider reducing max_budget_usd "
                f"or requesting more focused output."
            )

        return suggestions or ["No optimization needed"]

    def generate_optimized_prompt(self, agent_id: str, base_prompt: str) -> str:
        """Generate an optimized prompt with learnings from past runs."""
        suggestions = self.analyze_and_optimize(agent_id)
        if not suggestions or "Not enough data" in suggestions[0]:
            return base_prompt

        # Append optimization hints
        hints = "\n\n## Optimization Hints (from previous runs)\n" + \
                "\n".join(f"- {s}" for s in suggestions)
        return base_prompt + hints
