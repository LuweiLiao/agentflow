"""
AgentFlow-Code Engine Adapter — Low-level bridge to AgentFlow-Code engine subprocess.

Spawns the CC engine (bun dist/cli-bun.js -p) as a subprocess,
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

Unified LLM API:
    adapter = ClaudeCodeAdapter.from_provider_registry()
    # or explicitly:
    adapter = ClaudeCodeAdapter(llm_config={
        "provider": "openai",
        "api_key": "sk-...",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4o",
    })
"""

import json
import os
import signal
import subprocess
import sys
import tempfile
import threading
import time
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

    - Spawns `bun dist/cli-bun.js -p` (pre-built bundle, self-contained)
    - Feeds prompt via stdin
    - Parses JSON output from stdout
    """

    # ── 引擎配置 ──
    # Phase C #1: default to the *project-local* engine directory (sibling of
    # this adapter file) instead of the system-wide /opt/claude-code-engine.
    # AGENTFLOW_CC_ENGINE_DIR still overrides for container/Docker deployments
    # (see Dockerfile), so nothing breaks there.
    ENGINE_DIR = Path(os.environ.get(
        "AGENTFLOW_CC_ENGINE_DIR",
        Path(__file__).resolve().parent / "claude-code-engine",
    ))
    # FIX #1: Use pre-built bundle (dist/cli-bun.js), not raw .tsx source.
    # The pre-built bundle is self-contained and does not require the TS toolchain.
    CLI_ENTRY = "dist/cli-bun.js"
    BUN_PATH = os.environ.get("BUN_PATH", "/usr/local/bin/bun")

    def __init__(self, engine_dir: Optional[str] = None,
                 llm_config: Optional[dict] = None):
        """
        Construct the adapter.

        Args:
            engine_dir: Path to the CC engine installation. Defaults to
                AGENTFLOW_CC_ENGINE_DIR env var, otherwise the project-local
                ./claude-code-engine directory (sibling of this file).
            llm_config: Optional unified LLM provider config dict with keys:
                {provider, api_key, base_url, model}.
                When provided, the adapter injects OpenAI-compatible env vars
                (CLAUDE_CODE_USE_OPENAI, OPENAI_API_KEY, OPENAI_BASE_URL,
                OPENAI_MODEL) into the engine subprocess.
        """
        self.engine_dir = Path(engine_dir) if engine_dir else Path(self.ENGINE_DIR)
        if not self.engine_dir.exists():
            raise FileNotFoundError(f"CC engine not found at {self.engine_dir}")
        # FIX #1 (absolute path): CLI entry resolved against engine_dir.
        self.cli_entry_path = str(self.engine_dir / self.CLI_ENTRY)
        # Unified LLM API (#11): store optional provider config.
        self.llm_config = llm_config or None

    @classmethod
    def from_provider_registry(cls, engine_dir: Optional[str] = None) -> "ClaudeCodeAdapter":
        """
        Construct an adapter reading the unified LLM provider config from the
        process environment.

        Recognized env vars (any subset may be set):
            AGENTFLOW_LLM_PROVIDER   – e.g. "openai", "azure", "anthropic-via-openai"
            AGENTFLOW_LLM_API_KEY    – API key for the provider
            AGENTFLOW_LLM_BASE_URL   – OpenAI-compatible base URL
            AGENTFLOW_LLM_MODEL      – model name to use

        Returns:
            ClaudeCodeAdapter with llm_config populated if any provider env
            vars were present, otherwise a plain adapter.
        """
        provider = os.environ.get("AGENTFLOW_LLM_PROVIDER")
        api_key = os.environ.get("AGENTFLOW_LLM_API_KEY")
        base_url = os.environ.get("AGENTFLOW_LLM_BASE_URL")
        model = os.environ.get("AGENTFLOW_LLM_MODEL")

        llm_config = None
        if any([provider, api_key, base_url, model]):
            llm_config = {
                "provider": provider or "openai",
                "api_key": api_key or "",
                "base_url": base_url or "",
                "model": model or "",
            }
        return cls(engine_dir=engine_dir, llm_config=llm_config)

    # ── Unified LLM API helpers ──

    def _llm_env(self) -> dict:
        """
        Build env-var overrides for the unified LLM API (#12).

        When self.llm_config is set, returns a dict containing:
            CLAUDE_CODE_USE_OPENAI=1
            OPENAI_API_KEY     (from config)
            OPENAI_BASE_URL    (from config)
            OPENAI_MODEL       (from config)
        Only non-empty values are included so we don't clobber existing env.
        """
        if not self.llm_config:
            return {}
        env: dict = {"CLAUDE_CODE_USE_OPENAI": "1"}
        cfg = self.llm_config
        if cfg.get("api_key"):
            env["OPENAI_API_KEY"] = cfg["api_key"]
        if cfg.get("base_url"):
            env["OPENAI_BASE_URL"] = cfg["base_url"]
        if cfg.get("model"):
            env["OPENAI_MODEL"] = cfg["model"]
        return env

    def _build_env(self) -> dict:
        """
        Construct a minimal, sanitized environment for the engine subprocess
        (FIX #5).

        Starts from a curated allowlist (PATH, HOME, USER, LANG, LC_*, TERM)
        plus any API keys the engine may need. Provider config from
        self.llm_config is layered on top via _llm_env().
        """
        # Curated allowlist — avoids leaking arbitrary host secrets into the
        # engine subprocess.
        # Phase C #3: pass through every provider key the engine supports so
        # OpenAI / DeepSeek / ZAI / Grok / Google / Azure all work headless,
        # plus the AGENTFLOW_ prefix so all AgentFlow config vars flow through.
        allow_prefixes = ("LC_", "AGENTFLOW_")
        allow_exact = {
            "PATH", "HOME", "USER", "LANG", "TERM",
            "NODE_ENV",
            # API keys / provider config the engine itself may consult
            # (passed through only if set in the host environment).
            "ANTHROPIC_API_KEY",
            "OPENAI_API_KEY",
            "OPENAI_BASE_URL",
            "OPENAI_MODEL",
            "OPENAI_ORGANIZATION",
            "DEEPSEEK_API_KEY",
            "ZAI_API_KEY",
            "GROK_API_KEY",
            "GOOGLE_API_KEY",
            "AZURE_API_KEY",
        }
        env: dict = {}
        for k, v in os.environ.items():
            if k in allow_exact or any(k.startswith(p) for p in allow_prefixes):
                env[k] = v
        # Ensure PATH/HOME always present even if host omitted them.
        env.setdefault("PATH", "/usr/local/bin:/usr/bin:/bin")
        env.setdefault("HOME", os.path.expanduser("~"))
        # Layer unified LLM API env vars on top.
        env.update(self._llm_env())
        return env

    def _build_cmd(self, append_system_prompt: str = "",
                    max_budget_usd: float = 0.5,
                    output_format: str = "json",
                    workspace_dir: Optional[str] = None) -> list:
        """Build the CC engine CLI command.

        Args:
            workspace_dir: Optional workspace path passed to the engine via
                ``--add-dir`` so it can read/write the caller's project files
                in addition to the cwd it was launched in (Phase C #5).
        """
        # FIX #6: Validate budget before spawn — guard against misconfiguration
        # that would produce an instant over-budget failure or a no-op run.
        if not isinstance(max_budget_usd, (int, float)) or max_budget_usd <= 0:
            raise ValueError(
                f"max_budget_usd must be a positive number, got {max_budget_usd!r}"
            )

        # FIX #2: `bun dist/cli-bun.js` — no "run", pre-built bundle.
        # FIX #1: absolute path to the bundle.
        cmd = [
            self.BUN_PATH, self.cli_entry_path,
            "-p",  # pipe mode
            f"--output-format={output_format}",
            f"--max-budget-usd={max_budget_usd}",
            "--bare",  # skip hooks, enable simple mode
            # FIX #8: headless tool use requires skipping interactive permission
            # prompts; otherwise the engine cannot execute any tools in a
            # non-interactive (subprocess) context.
            "--dangerously-skip-permissions",
        ]
        if append_system_prompt:
            cmd.append(f"--append-system-prompt={append_system_prompt}")
        # Phase C #5: share the workspace with the engine so it can read/write
        # the caller's project files, not just the directory it was launched in.
        if workspace_dir:
            cmd.append(f"--add-dir={workspace_dir}")
        return cmd

    def run(self, prompt: str, *,
            system_prompt_append: str = "",
            max_budget_usd: float = 0.5,
            timeout: int = 180,
            cwd: Optional[str] = None,
            llm_config: Optional[dict] = None) -> CCEngineResult:
        """
        Run the CC engine with the given prompt.

        Args:
            prompt: The main user prompt to send
            system_prompt_append: Extra system context to inject
            max_budget_usd: Maximum API cost for this run (must be > 0)
            timeout: Max seconds to wait for completion
            cwd: Working directory the engine runs in. This is the *workflow
                workspace*, NOT the engine dir. When omitted, a fresh temp
                directory is created so the engine never writes into its own
                tree. The directory is also passed to the engine via
                ``--add-dir`` so it has explicit workspace access (Phase C #2).
            llm_config: Optional per-call override of the unified LLM provider
                config ({provider, api_key, base_url, model}). When provided,
                takes precedence over the constructor's llm_config.

        Returns:
            CCEngineResult with parsed JSON result
        """
        # Unified LLM API (#11): per-call override.
        if llm_config is not None:
            self.llm_config = llm_config

        # Phase C #2: the agent must run in the *workflow workspace*, not the
        # engine directory. When no cwd is provided, spin up a fresh temp dir
        # so we never accidentally write into the engine's own tree.
        workspace_dir = cwd or tempfile.mkdtemp(prefix="agentflow-workspace-")

        cmd = self._build_cmd(
            append_system_prompt=system_prompt_append,
            max_budget_usd=max_budget_usd,
            workspace_dir=workspace_dir,  # Phase C #5: --add-dir=<workspace>
        )

        # FIX #5: pass a minimal, sanitized env to the subprocess.
        proc_env = self._build_env()

        # FIX #10: capture actual wall-clock duration with time.monotonic().
        start_ts = time.monotonic()

        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(workspace_dir),  # Phase C #2: workspace, not engine dir
            env=proc_env,
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
            # FIX #3: communicate() again to reap pipes, with a hard cap so we
            # never block forever if the process refuses to die after kill.
            try:
                stdout, stderr = proc.communicate(timeout=5)
            except subprocess.TimeoutExpired:
                stdout, stderr = "", ""
            elapsed_ms = int((time.monotonic() - start_ts) * 1000)
            return CCEngineResult(
                text=f"Timed out after {timeout}s",
                raw={"error": "timeout", "stdout": stdout, "stderr": stderr},
                is_error=True,
                duration_ms=elapsed_ms,
                cost_usd=0.0,
                session_id="",
                num_turns=0,
                usage={},
                model_usage={},
                errors=[f"Timeout after {timeout}s"],
                stop_reason="timeout",
            )

        elapsed_ms = int((time.monotonic() - start_ts) * 1000)

        if proc.returncode != 0:
            return CCEngineResult(
                text=f"CC engine exited with code {proc.returncode}",
                raw={"error": stderr or "unknown error"},
                is_error=True,
                duration_ms=elapsed_ms,
                cost_usd=0.0,
                session_id="",
                num_turns=0,
                usage={},
                model_usage={},
                errors=[stderr or f"Exit code {proc.returncode}"],
                stop_reason="error",
            )

        result = self._parse_output(stdout)
        # If the parser couldn't find a result envelope, surface actual timing.
        if not result.duration_ms:
            result.duration_ms = elapsed_ms
        return result

    def run_streaming(self, prompt: str, *,
                      system_prompt_append: str = "",
                      max_budget_usd: float = 0.5,
                      timeout: int = 180,
                      cwd: Optional[str] = None,
                      llm_config: Optional[dict] = None):
        """Run the CC engine with TRUE incremental streaming (Phase C #4).

        Unlike cc_agent_runner's simulated stream_execute(), this reads the
        engine's stdout line by line as it runs (``--output-format=stream-json``)
        and yields each parsed event immediately. Supports the engine's
        tool_use, text_delta, result and error stream event types.

        Yields:
            ``{"type": "stream_event", "payload": <parsed json line>}`` for
            each engine event (tool_use / text_delta / result / error / ...),
            then a final
            ``{"type": "stream_complete", "payload": {cost_usd, duration_ms,
            is_error, text, session_id, ...}}`` summary event.

        Returns (via generator return / StopIteration.value):
            CCEngineResult built from the final 'result' event, or an error
            result on timeout / non-zero exit / no result event.

        The engine runs in the workflow workspace (cwd or a fresh temp dir),
        which is also passed via ``--add-dir`` (same Phase C #2 / #5 behavior
        as run()).
        """
        if llm_config is not None:
            self.llm_config = llm_config

        # Phase C #2: workspace, not engine dir.
        workspace_dir = cwd or tempfile.mkdtemp(prefix="agentflow-workspace-")

        cmd = self._build_cmd(
            append_system_prompt=system_prompt_append,
            max_budget_usd=max_budget_usd,
            output_format="stream-json",  # Phase C #4: real streaming
            workspace_dir=workspace_dir,
        )
        proc_env = self._build_env()

        start_ts = time.monotonic()
        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(workspace_dir),
            env=proc_env,
            text=True,
            bufsize=1,  # line buffered — critical for incremental streaming
            # R3-P0-2: independent process group for clean kill of the tree.
            start_new_session=True,
        )

        # Enforce timeout via a watcher thread that kills the whole process
        # group. When killed, the stdout pipe closes and the read loop ends.
        timed_out = {"flag": False}

        def _enforce_timeout():
            if proc.poll() is None:
                timed_out["flag"] = True
                self._kill_process_group(proc)

        timer = threading.Timer(timeout, _enforce_timeout)
        timer.daemon = True
        timer.start()

        # Feed the prompt on a separate daemon thread to avoid deadlock if the
        # prompt exceeds the OS pipe buffer (~64 KB) while we are still reading.
        def _feed_stdin():
            try:
                proc.stdin.write(prompt)
                proc.stdin.close()
            except (BrokenPipeError, OSError):
                pass

        writer = threading.Thread(target=_feed_stdin, daemon=True)
        writer.start()

        final_result: Optional[CCEngineResult] = None
        elapsed_ms = 0
        try:
            for line in proc.stdout:
                line = line.strip()
                if not line:
                    continue
                try:
                    evt = json.loads(line)
                except json.JSONDecodeError:
                    # Skip non-JSON log/progress lines the engine may emit.
                    continue
                yield {"type": "stream_event", "payload": evt}
                # Capture the terminal 'result' event for cost/duration.
                if isinstance(evt, dict) and evt.get("type") == "result":
                    final_result = self._result_from_dict(
                        evt, int((time.monotonic() - start_ts) * 1000)
                    )
        except GeneratorExit:
            # Caller abandoned the generator — clean up the subprocess tree.
            self._kill_process_group(proc)
            raise
        finally:
            timer.cancel()
            writer.join(timeout=2)

        elapsed_ms = int((time.monotonic() - start_ts) * 1000)

        # Reap the process (with a short remaining timeout budget).
        try:
            proc.wait(timeout=max(1, int(timeout - (time.monotonic() - start_ts))))
        except subprocess.TimeoutExpired:
            self._kill_process_group(proc)

        if timed_out["flag"]:
            err_result = CCEngineResult(
                text=f"Timed out after {timeout}s",
                raw={"error": "timeout"},
                is_error=True,
                duration_ms=elapsed_ms,
                cost_usd=0.0,
                session_id="",
                num_turns=0,
                usage={},
                model_usage={},
                errors=[f"Timeout after {timeout}s"],
                stop_reason="timeout",
            )
            yield {"type": "stream_complete", "payload": {
                "cost_usd": 0.0, "duration_ms": elapsed_ms,
                "is_error": True, "text": err_result.text,
                "session_id": "", "timed_out": True,
            }}
            return err_result

        if final_result is None:
            # No 'result' event was emitted — surface stderr / return code.
            try:
                stderr = proc.stderr.read() if proc.stderr else ""
            except Exception:
                stderr = ""
            is_err = proc.returncode != 0
            final_result = CCEngineResult(
                text=stderr.strip() if is_err else "",
                raw={"error": stderr or "no result event",
                     "returncode": proc.returncode},
                is_error=is_err,
                duration_ms=elapsed_ms,
                cost_usd=0.0,
                session_id="",
                num_turns=0,
                usage={},
                model_usage={},
                errors=[stderr or
                        f"Engine exited (code {proc.returncode}) with no result event"],
                stop_reason="error" if is_err else "no_result",
            )
        elif not final_result.duration_ms:
            final_result.duration_ms = elapsed_ms

        yield {"type": "stream_complete", "payload": {
            "cost_usd": final_result.cost_usd,
            "duration_ms": final_result.duration_ms,
            "is_error": final_result.is_error,
            "text": final_result.text,
            "session_id": final_result.session_id,
        }}
        return final_result

    @staticmethod
    def _kill_process_group(proc: subprocess.Popen):
        """R3-P0-2: 终止整个进程组，先 SIGTERM 再 SIGKILL。

        需与 Popen(start_new_session=True) 配合使用。

        FIX #44: Use proc.wait(timeout=2) to give the process a graceful
        shutdown window before escalating to SIGKILL, instead of a blind
        time.sleep(0.5) that always blocks half a second regardless of
        whether the process already exited.
        """
        try:
            pgid = os.getpgid(proc.pid)
        except ProcessLookupError:
            return
        try:
            os.killpg(pgid, signal.SIGTERM)
            proc.wait(timeout=2)  # graceful shutdown window
        except (subprocess.TimeoutExpired, ProcessLookupError):
            try:
                os.killpg(pgid, signal.SIGKILL)
            except (ProcessLookupError, OSError):
                pass

    def _result_from_dict(self, data: dict, elapsed_ms: int = 0) -> CCEngineResult:
        """Build a CCEngineResult from a parsed 'result'-type event dict.

        Shared by _parse_output (json mode) and run_streaming (stream-json
        mode). When the event lacks duration_ms, fall back to elapsed_ms.
        """
        return CCEngineResult(
            text=data.get("result", ""),
            raw=data,
            is_error=data.get("is_error", False),
            duration_ms=data.get("duration_ms", 0) or elapsed_ms,
            cost_usd=data.get("total_cost_usd", 0.0),
            session_id=data.get("session_id", ""),
            num_turns=data.get("num_turns", 0),
            usage=data.get("usage", {}),
            model_usage=data.get("modelUsage", {}),
            errors=data.get("errors", []),
            stop_reason=data.get("stop_reason", ""),
        )

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
                return self._result_from_dict(data)

        # FIX #7: Fallback when no parseable result envelope was found.
        # This is an error condition, not a silent success.
        return CCEngineResult(
            text=stdout.strip(),
            raw={"raw_output": stdout.strip()},
            is_error=True,
            duration_ms=0,
            cost_usd=0.0,
            session_id="",
            num_turns=0,
            usage={},
            model_usage={},
            errors=["Failed to parse any result envelope from engine output"],
            stop_reason="unparseable",
        )

    def run_with_files(self, prompt: str, files: dict[str, str], *,
                        system_prompt_append: str = "",
                        max_budget_usd: float = 0.5,
                        timeout: int = 180,
                        llm_config: Optional[dict] = None) -> CCEngineResult:
        """
        Run CC engine with workspace files injected as context.

        Args:
            prompt: The main prompt
            files: Dict of {filename: content} to inject into context
            system_prompt_append: Extra system context
            llm_config: Optional per-call unified LLM provider config override.

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
                        timeout=timeout,
                        llm_config=llm_config)


class AgentMessageBus:
    """
    In-memory message bus for agent-to-agent communication.

    Supports:
    - Send message: one agent sends to another
    - Poll messages: agent reads its inbox
    - Thread history: conversation history between agents
    - Structured messages: artifact handoff, review, prompt suggestions

    Persistence (#42): send() also appends each message to an append-only
    JSONL log at ~/.agentflow/message_bus.jsonl. load_from_file() rebuilds
    a bus from such a file.
    """

    DEFAULT_LOG_PATH = Path.home() / ".agentflow" / "message_bus.jsonl"

    def __init__(self, log_path: Optional[str] = None):
        self._messages: list[AgentMessage] = []
        self._inboxes: dict[str, list[AgentMessage]] = {}
        self._log_path = Path(log_path) if log_path else self.DEFAULT_LOG_PATH

    def _persist(self, msg: AgentMessage) -> None:
        """Append a single message to the JSONL log file (#42).

        Best-effort: IO errors are swallowed so send() never fails on a
        persistence problem.
        """
        try:
            self._log_path.parent.mkdir(parents=True, exist_ok=True)
            record = {
                "protocol": msg.protocol,
                "from_agent": msg.from_agent,
                "to_agent": msg.to_agent,
                "msg_type": msg.msg_type,
                "payload": msg.payload,
                "timestamp": msg.timestamp,
                "thread_id": msg.thread_id,
            }
            with open(self._log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except OSError:
            pass

    @classmethod
    def load_from_file(cls, path: Optional[str] = None) -> "AgentMessageBus":
        """Rebuild a bus from a JSONL log written by send() (#42).

        Each line is a JSON record matching the AgentMessage fields. The
        returned bus has its in-memory _messages and _inboxes populated, and
        its _log_path set so subsequent send() calls continue to append.
        """
        log_path = Path(path) if path else cls.DEFAULT_LOG_PATH
        bus = cls(log_path=str(log_path))
        if not log_path.exists():
            return bus
        try:
            with open(log_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        record = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    msg = AgentMessage(**record)
                    bus._messages.append(msg)
                    bus._inboxes.setdefault(msg.to_agent, []).append(msg)
        except OSError:
            pass
        return bus

    def send(self, msg=None, **kwargs) -> AgentMessage:
        """
        Send a message to an agent's inbox.

        FIX #4: Accepts EITHER an AgentMessage instance OR keyword arguments
        matching the AgentMessage fields. This makes the bus flexible for
        callers that construct messages inline.

        Examples:
            bus.send(existing_msg)
            bus.send(from_agent="a", to_agent="b", msg_type="coordination",
                     payload={"k": "v"})
        """
        if msg is None:
            msg = AgentMessage(**kwargs)
        elif kwargs:
            # Allow partial overrides on an existing message.
            for k, v in kwargs.items():
                if hasattr(msg, k):
                    setattr(msg, k, v)
        elif not isinstance(msg, AgentMessage):
            raise TypeError(
                f"send() expected AgentMessage or kwargs, got {type(msg).__name__}"
            )
        self._messages.append(msg)
        if msg.to_agent not in self._inboxes:
            self._inboxes[msg.to_agent] = []
        self._inboxes[msg.to_agent].append(msg)
        self._persist(msg)  # append-only JSONL persistence (#42)
        return msg

    def send_raw(self, **kwargs) -> AgentMessage:
        """
        Send a message constructed from raw keyword arguments (FIX #4
        convenience method).

        All kwargs are forwarded to the AgentMessage constructor.
        """
        return self.send(AgentMessage(**kwargs))

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

    # ── Persistence (#43) ──────────────────────────────

    DEFAULT_HISTORY_PATH = Path.home() / ".agentflow" / "prompt_history.json"

    def save_to_file(self, path: Optional[str] = None) -> str:
        """Serialize _prompt_history to a JSON file (#43).

        Args:
            path: Output path. Defaults to ~/.agentflow/prompt_history.json.

        Returns:
            The path written to.
        """
        out_path = Path(path) if path else self.DEFAULT_HISTORY_PATH
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(self._prompt_history, f, ensure_ascii=False, indent=2)
        return str(out_path)

    @classmethod
    def load_from_file(cls, path: Optional[str] = None) -> "PromptOptimizer":
        """Rebuild a PromptOptimizer from a JSON file written by
        save_to_file() (#43).

        If the file does not exist or is unreadable, returns a fresh empty
        optimizer (history preserved if readable, otherwise untouched).
        """
        opt = cls()
        in_path = Path(path) if path else cls.DEFAULT_HISTORY_PATH
        if not in_path.exists():
            return opt
        try:
            with open(in_path, "r", encoding="utf-8") as f:
                opt._prompt_history = json.load(f)
        except (OSError, json.JSONDecodeError):
            pass
        return opt
