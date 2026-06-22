#!/usr/bin/env python3
"""
Multi-Provider Agent Runner — 支持任何 OpenAI 兼容 API 的通用 Agent。

能用的大模型（配置环境变量即可）：
  DeepSeek       DEEPSEEK_API_KEY           deepseek-chat, deepseek-reasoner
  智谱 GLM       ZAI_API_KEY / ZHIPU_API_KEY  glm-5-turbo, glm-4-plus
  xAI Grok       XAI_API_KEY                grok-3, grok-2
  OpenAI         OPENAI_API_KEY             gpt-4o, gpt-4o-mini
  阿里通义       DASHSCOPE_API_KEY          qwen-max, qwen-plus
  月之暗面       MOONSHOT_API_KEY           moonshot-v1-8k
  SiliconFlow    SILICONFLOW_API_KEY        Pro/deepseek-ai/DeepSeek-V3
  零一万物       YI_API_KEY                 yi-large, yi-lightning
  MiniMax        MINIMAX_API_KEY            minimax-4
  百度千帆       BAIDU_API_KEY              ernie-4.5
  腾讯混元       TENCENT_API_KEY            hunyuan-turbo
  阶跃星辰       STEP_API_KEY               step-2

用法：
    from agent_runner import AgentRunner
    agent = AgentRunner(model="deepseek-chat")
    result = agent.execute("写一个 hello world", work_dir="/tmp/work")
"""

import json
import os
import re
import shlex
import subprocess
import sys
import time

from provider_adapter import ProviderAdapter


def _load_env_files_once() -> None:
    """Load project/user .env files without overriding existing process env.

    AgentFlow is often started as a bare background Python process, so shell env
    may not contain provider keys even though .env exists. Keep this minimal to
    avoid adding a runtime dependency on python-dotenv.
    """
    candidates = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
        os.path.expanduser("~/.hermes/.env"),
    ]
    for path in candidates:
        if not os.path.exists(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                for raw in f:
                    line = raw.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key and key not in os.environ:
                        os.environ[key] = val
        except OSError:
            continue


_load_env_files_once()

# Agent 工具沙箱配置
# 禁止 Agent 访问的敏感文件/目录模式
SANDBOX_BLOCKED_PATHS = [
    "/etc/shadow", "/etc/passwd", "/etc/ssh/", "/root/.ssh/",
    "/home/", "/proc/", "/sys/", "/dev/", "/boot/",
    "/var/log/", "/var/lib/",
    ".git/config", ".env", ".env.local",
]
# 默认禁止执行这些命令
SANDBOX_BLOCKED_COMMANDS = [
    "rm -rf /", "rm -rf /*", "mkfs.", "dd if=", ">:",
    "chmod 777 /", "chown ", "sudo ", "su ",
    ":(){ :|:& };:",  # fork bomb
    "wget ", "curl ", "nc ", "ncat ", "telnet ",
]
# 命令超时（秒）
EXECUTE_TIMEOUT = 30


def _is_path_safe(filepath: str, work_dir: str) -> bool:
    """检查文件路径是否安全（在 work_dir 内且不访问敏感路径）。"""
    real = os.path.realpath(os.path.normpath(filepath))
    work = os.path.realpath(os.path.normpath(work_dir))
    # 必须在 work_dir 内
    if not real.startswith(work + os.sep) and real != work:
        return False
    # work_dir 本身可能位于 /home 等普通用户目录；只禁止穿越到工作区外的敏感路径。
    for blocked in SANDBOX_BLOCKED_PATHS:
        if not os.path.isabs(blocked):
            continue
        blocked_real = os.path.realpath(blocked)
        if real.startswith(blocked_real) and not work.startswith(blocked_real):
            return False
    return True


def _is_command_safe(cmd: str) -> bool:
    """检查命令是否包含禁止操作。"""
    cmd_lower = cmd.lower().strip()
    for blocked in SANDBOX_BLOCKED_COMMANDS:
        if blocked.lower() in cmd_lower:
            return False
    return True

class AgentRunner:
    """通用 Agent — 支持任何 OpenAI 兼容 API + 工具调用循环。"""

    # 所有支持的 provider 配置
    PROVIDER_CONFIGS = {
        "openai":      {"key_env": "OPENAI_API_KEY",      "base_env": "OPENAI_BASE_URL",      "default_base": "https://api.openai.com/v1"},
        "deepseek":    {"key_env": "DEEPSEEK_API_KEY",    "base_env": "DEEPSEEK_BASE_URL",    "default_base": "https://api.deepseek.com/v1"},
        "zhipu":       {"key_env": "ZAI_API_KEY",         "base_env": "ZAI_BASE_URL",         "default_base": "https://open.bigmodel.cn/api/paas/v4"},
        "xai":         {"key_env": "XAI_API_KEY",         "base_env": "XAI_BASE_URL",         "default_base": "https://api.x.ai/v1"},
        "aliyun":      {"key_env": "DASHSCOPE_API_KEY",   "base_env": "DASHSCOPE_BASE_URL",   "default_base": "https://dashscope.aliyuncs.com/compatible-mode/v1"},
        "moonshot":    {"key_env": "MOONSHOT_API_KEY",    "base_env": "MOONSHOT_BASE_URL",    "default_base": "https://api.moonshot.cn/v1"},
        "siliconflow": {"key_env": "SILICONFLOW_API_KEY", "base_env": "SILICONFLOW_BASE_URL", "default_base": "https://api.siliconflow.cn/v1"},
        "lingyi":      {"key_env": "YI_API_KEY",          "base_env": "YI_BASE_URL",          "default_base": "https://api.lingyiwanwu.com/v1"},
        "minimax":     {"key_env": "MINIMAX_API_KEY",     "base_env": "MINIMAX_BASE_URL",     "default_base": "https://api.minimax.chat/v1"},
        "baidu":       {"key_env": "BAIDU_API_KEY",       "base_env": "BAIDU_BASE_URL",       "default_base": "https://qianfan.baidubce.com/v2"},
        "tencent":     {"key_env": "TENCENT_API_KEY",     "base_env": "TENCENT_BASE_URL",     "default_base": "https://api.hunyuan.cloud.tencent.com/v1"},
        "stepfun":     {"key_env": "STEP_API_KEY",        "base_env": "STEP_BASE_URL",        "default_base": "https://api.stepfun.com/v1"},
    }

    # 模型名 → provider 映射
    MODEL_PROVIDER_MAP = {}
    for provider, models in {
        "deepseek":    ["deepseek-chat", "deepseek-reasoner", "deepseek-coder", "deepseek-v3", "deepseek-r1"],
        "zhipu":       ["glm-5", "glm-5-turbo", "glm-4", "glm-4-plus", "glm-4v", "glm-4-flash"],
        "xai":         ["grok-3", "grok-2", "grok-mini", "grok-3-mini", "grok"],
        "openai":      ["gpt-4o", "gpt-4o-mini", "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "o1", "o1-mini", "o3-mini"],
        "aliyun":      ["qwen-max", "qwen-plus", "qwen-turbo", "qwen2.5", "qwen2.5-coder"],
        "moonshot":    ["moonshot-v1", "moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
        "siliconflow": [],
        "lingyi":      ["yi-large", "yi-lightning", "yi-medium", "yi-vision"],
        "minimax":     ["minimax-4", "minimax-4-turbo", "abab6.5"],
        "baidu":       ["ernie-4.5", "ernie-4", "ernie-3.5", "ernie-lite"],
        "tencent":     ["hunyuan", "hunyuan-turbo", "hunyuan-lite"],
        "stepfun":     ["step-2", "step-1", "step-1v"],
    }.items():
        for m in models:
            MODEL_PROVIDER_MAP[m] = provider

    def __init__(self, model: str = None):
        self.model = model or os.environ.get("AGENT_MODEL", "deepseek-chat")
        self._configure()
        self._log(f"初始化 → Provider: {self.provider_name} | Model: {self.model} | Base: {self.base_url}")

    def _configure(self):
        """根据模型名自动配置 provider。"""
        # 尝试从模型名推断 provider
        model_lower = self.model.lower().strip()
        provider_name = self.MODEL_PROVIDER_MAP.get(model_lower)

        # 前缀匹配
        if not provider_name:
            for prefix, name in [
                ("deepseek", "deepseek"), ("glm-", "zhipu"), ("grok", "xai"),
                ("gpt-", "openai"), ("o1", "openai"), ("o3", "openai"),
                ("qwen", "aliyun"), ("moonshot", "moonshot"),
                ("ernie", "baidu"), ("hunyuan", "tencent"),
                ("yi-", "lingyi"), ("minimax", "minimax"),
                ("step-", "stepfun"), ("abab", "minimax"),
                ("pro/", "siliconflow"),
            ]:
                if model_lower.startswith(prefix):
                    provider_name = name
                    break

        # fallback 链
        if not provider_name:
            provider_name = "openai"

        config = self.PROVIDER_CONFIGS.get(provider_name, self.PROVIDER_CONFIGS["openai"])
        self.provider_name = provider_name

        # API key：优先级 env > fallback
        self.api_key = os.environ.get(config["key_env"], "")
        if not self.api_key and provider_name == "zhipu":
            self.api_key = os.environ.get("ZHIPU_API_KEY", "")
        if not self.api_key:
            # 最后尝试通用的 OPENAI_API_KEY
            generic_key = os.environ.get("OPENAI_API_KEY", "")
            if generic_key and provider_name in ("deepseek", "openai", "siliconflow"):
                self.api_key = generic_key

        # Base URL
        self.base_url = (os.environ.get(config["base_env"], config["default_base"]).rstrip("/"))

        # 创建 ProviderAdapter
        self.adapter = ProviderAdapter(
            base_url=self.base_url,
            api_key=self.api_key or "",
            model=self.model,
        )

        if not self.api_key:
            self._log(f"⚠️ 未配置 {provider_name} API 密钥 ({config['key_env']})", err=True)

    # ── 主入口 ──────────────────────────────────────────

    def execute(self, prompt: str, work_dir: str = None,
                profile: str = "dev", tools_enabled: bool = True,
                max_turns: int = 10, timeout: int = 120) -> dict:
        """执行任务，返回结构化结果。

        这是 stream_execute() 的收集器版本 — 保持向后兼容。

        Returns:
            {"result": "...", "output": "...", "cost": 0.0,
             "duration_ms": 0, "status": "ok", "turns": N,
             "model": "...", "provider": "..."}
        """
        start = time.time()
        output_parts = []
        total_cost = 0.0
        status = "error"
        result_text = ""
        total_turns = 0

        for event in self.stream_execute(
            prompt=prompt,
            work_dir=work_dir,
            profile=profile,
            tools_enabled=tools_enabled,
            max_turns=max_turns,
            timeout=timeout,
            start_time=start,
        ):
            if event["type"] == "node_delta":
                output_parts.append(event["payload"].get("content", ""))
            elif event["type"] == "node_complete":
                status = event["payload"].get("status", "ok")
                result_text = event["payload"].get("result", "")
                total_cost = event["payload"].get("cost", 0)
                total_turns = event["payload"].get("turns", 0)
            elif event["type"] == "node_failed":
                status = event["payload"].get("status", "error")
                result_text = event["payload"].get("error", "未知错误")
                total_turns = event["payload"].get("turns", 0)

        full_output = "\n".join(output_parts)

        return {
            "result": result_text,
            "output": full_output,
            "cost": round(total_cost, 6),
            "duration_ms": int((time.time() - start) * 1000),
            "status": status,
            "turns": total_turns,
            "model": self.model,
            "provider": self.provider_name,
        }

    def stream_execute(self, prompt: str, work_dir: str = None,
                       profile: str = "dev", tools_enabled: bool = True,
                       max_turns: int = 10, timeout: int = 120,
                       start_time: float = None,
                       should_abort: callable = None) -> dict:
        """Streaming agent execution — yields event dicts for each lifecycle step.

        Yields:
            {"type": "node_delta",  "payload": {"turn": N, "content": "..."}}
            {"type": "tool_start",  "tool_call_id": "...", "payload": {"name": "...", "args": {...}}}
            {"type": "tool_end",    "tool_call_id": "...", "payload": {"result": {...}, "is_error": bool}}
            {"type": "node_complete","payload": {"result": "...", "status": "ok", "cost": 0.0}}
            {"type": "node_failed",  "payload": {"status": "error|timeout", "error": "..."}}
        """
        start = start_time or time.time()
        work_dir = work_dir or tempfile_get()
        all_output = []
        total_cost = 0.0

        # 注入 AgentFlow 自编排上下文
        self._inject_agentflow_context(work_dir)

        if not self.api_key:
            yield {"type": "node_failed", "payload": {
                "status": "error", "error": "API 密钥未配置"
            }}
            return

        messages = [
            {"role": "system", "content": self._system_prompt(profile)},
            {"role": "user", "content": prompt}
        ]
        tool_defs = self._tool_definitions() if tools_enabled else None
        turn = 0

        try:
            for turn in range(max_turns):
                if time.time() - start > timeout:
                    raise TimeoutError(f"执行超时 ({timeout}s)")

                if should_abort and should_abort():
                    yield {"type": "node_failed", "payload": {
                        "status": "aborted", "error": "用户中断"
                    }}
                    return

                resp = self._llm_call(messages, tool_defs)
                msg = resp["choices"][0]["message"]
                total_cost += self._estimate_cost(resp)

                content = msg.get("content", "") or ""
                tool_calls = msg.get("tool_calls", [])

                if content:
                    all_output.append(content)
                    yield {
                        "type": "node_delta",
                        "payload": {"turn": turn, "content": content}
                    }

                if not tool_calls:
                    break

                # 处理工具调用
                messages.append({"role": "assistant", "content": content, "tool_calls": tool_calls})
                for tc in tool_calls:
                    if should_abort and should_abort():
                        yield {"type": "node_failed", "payload": {
                            "status": "aborted", "error": "用户中断"
                        }}
                        return

                    fn = tc.get("function", {})
                    name, args_str = fn.get("name", ""), fn.get("arguments", "{}")
                    try:
                        args = json.loads(args_str) if args_str else {}
                    except json.JSONDecodeError as json_err:
                        # P3 FIX: 记录解析错误而非静默返回空 dict。
                        # 静默返回 {} 会导致工具以空参数执行，产生难以追踪的故障。
                        import sys as _sys
                        print(f"[AgentRunner][WARN] tool_calls JSON parse failed: "
                              f"tool={name!r} raw_args={args_str[:200]!r} "
                              f"error={json_err}", file=_sys.stderr)
                        args = {}

                    yield {
                        "type": "tool_start",
                        "tool_call_id": tc.get("id", ""),
                        "payload": {"name": name, "args": args}
                    }

                    tr = self._run_tool(name, args, work_dir)
                    is_error = "error" in tr

                    yield {
                        "type": "tool_end",
                        "tool_call_id": tc.get("id", ""),
                        "payload": {
                            "result": tr,
                            "is_error": is_error,
                            "name": name,
                        }
                    }

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.get("id", ""),
                        "content": json.dumps(tr, ensure_ascii=False)[:15000]
                    })

            full_output = "\n".join(all_output)
            result = self._extract_summary(full_output)

            yield {
                "type": "node_complete",
                "payload": {
                    "result": result,
                    "output": full_output,
                    "status": "ok",
                    "cost": round(total_cost, 6),
                    "turns": turn + 1,
                }
            }

        except TimeoutError as e:
            yield {"type": "node_failed", "payload": {
                "status": "timeout",
                "error": str(e),
                "output": "\n".join(all_output),
                "cost": round(total_cost, 6),
            }}
        except Exception as e:
            yield {"type": "node_failed", "payload": {
                "status": "error",
                "error": f"失败: {e}",
                "output": "\n".join(all_output),
                "cost": round(total_cost, 6),
            }}

    # ── AgentFlow Self-Orchestration 上下文注入 ──────

    def _inject_agentflow_context(self, work_dir: str):
        """注入 AgentFlow 自编排上下文到工作目录和环境变量。
        
        Agent 可以读取 .agentflow/ 下的文件来获取编排 API 信息，
        也可以通过环境变量获取。
        """
        if not work_dir:
            return
        try:
            os.makedirs(work_dir, exist_ok=True)

            # 从环境变量读取编排上下文
            api_url = os.environ.get("AGENTFLOW_API_URL", "http://127.0.0.1:9600")
            run_id = os.environ.get("AGENTFLOW_RUN_ID", "")
            node_id = os.environ.get("AGENTFLOW_NODE_ID", "")
            dag_version = os.environ.get("AGENTFLOW_DAG_VERSION", "0")

            # 3. .agentflow/api.py — Python 调用模板
            api_py = f'''"""
AgentFlow Self-Orchestration API — Python 调用模板
Agent 可以通过此模块调用编排 API 调整 DAG 结构。

用法:
    from api import agentflow
    status = agentflow.get_run()
    result = agentflow.add_node(id="new_node", label="新任务", profile="dev", desc="...", depends_on=["task1"])
    agentflow.retry_node("task2")
    agentflow.feedback("task2 超时，建议拆分")
'''

            # 写入 .agentflow/ 目录文件
            dot_dir = os.path.join(work_dir, ".agentflow")
            os.makedirs(dot_dir, exist_ok=True)

            # 1. context.json — 完整上下文
            ctx = {
                "api_url": api_url,
                "run_id": run_id,
                "node_id": node_id,
                "scope": "self",
                "dag_version": dag_version if dag_version != "0" else 0,
                "available_endpoints": [
                    "GET  /api/runs/<id>              — 获取运行状态",
                    "GET  /api/runs/<id>/nodes        — 获取所有节点",
                    "GET  /api/runs/<id>/nodes/<nid>  — 获取单节点详情",
                    "GET  /api/runs/<id>/edges        — 获取 DAG 边",
                    "POST /api/runs/<id>/nodes        — 新增节点",
                    "PATCH /api/runs/<id>/nodes/<nid> — 修改节点",
                    "DELETE /api/runs/<id>/nodes/<nid> — 删除节点",
                    "POST /api/runs/<id>/edges        — 新增依赖边",
                    "DELETE /api/runs/<id>/edges      — 删除依赖边",
                    "POST /api/runs/<id>/nodes/<nid>/retry — 重置节点重跑",
                    "POST /api/runs/<id>/reroute      — 批量调整 DAG",
                    "POST /api/runs/<id>/feedback     — 提反馈意见",
                ],
                "scope_info": {
                    "self": "只能修改自己的节点（默认）",
                    "downstream": "可修改自己及下游节点",
                    "run": "可修改 run 内任何节点",
                },
            }
            ctx_path = os.path.join(dot_dir, "context.json")
            with open(ctx_path, "w", encoding="utf-8") as f:
                json.dump(ctx, f, ensure_ascii=False, indent=2)

            # 2. api.sh — curl 命令模板
            auth_header = ""
            api_token = os.environ.get("AGENTFLOW_API_TOKEN", "")
            if api_token:
                auth_header = f' -H "Authorization: Bearer {api_token}"'

            api_sh_lines = [
                "#!/bin/bash",
                f'# AgentFlow Self-Orchestration API — curl 命令模板',
                f'# Run ID: {run_id}',
                f'# Node ID: {node_id}',
                f'AGENTFLOW_API="{api_url}"',
                f'RUN_ID="{run_id}"',
                f'BASE="$AGENTFLOW_API/api/runs/$RUN_ID"',
                '',
                f'# 示例命令（取消注释即可使用）：',
                f'# 获取运行状态',
                f'# curl -s $BASE | python3 -m json.tool',
                f'',
                f'# 查看所有节点',
                f'# curl -s $BASE/nodes | python3 -m json.tool',
                f'',
                f'# 新增节点',
                f'''# curl -s -X POST $BASE/nodes \\
#   -H "Content-Type: application/json" \\
#   -d '{{"id":"new_task","label":"新任务","profile":"dev","desc":"描述","depends_on":[]}}' | python3 -m json.tool''',
                f'',
                f'# 删除节点',
                f'# curl -s -X DELETE $BASE/nodes/task_name | python3 -m json.tool',
                f'',
                f'# 提交反馈',
                f'''# curl -s -X POST $BASE/feedback \\
#   -H "Content-Type: application/json" \\
#   -d '{{"from_node":"{node_id}","type":"general","message":"描述你的建议"}}' | python3 -m json.tool''',
                f'',
            ]
            api_sh_path = os.path.join(dot_dir, "api.sh")
            with open(api_sh_path, "w", encoding="utf-8") as f:
                f.write("\n".join(api_sh_lines))  # Bug #11 FIX: was "\\n" (literal backslash-n)
            os.chmod(api_sh_path, 0o755)

            # 写入 api.py
            api_py_path = os.path.join(dot_dir, "api.py")
            with open(api_py_path, "w", encoding="utf-8") as f:
                f.write(api_py)

        except OSError as e:
            self._log(f"_inject_agentflow_context error: {e}", err=True)

    # ── 系统提示词 ──────────────────────────────────────

    def _system_prompt(self, profile: str) -> str:
        # 检查环境变量是否指示这是 AgentFlow 编排中的执行
        run_id = os.environ.get("AGENTFLOW_RUN_ID", "")
        has_agentflow_context = bool(run_id)
        scope = os.environ.get("AGENTFLOW_AGENT_SCOPE", "self")

        base = f"""你是 AgentFlow 工作流中的 {profile} 角色 Agent。

## 可用工具
- execute_command: 在沙箱终端中执行命令（无 sudo/rm -rf/网络等高危操作）
- read_file: 读取文件内容
- write_file: 写入文件内容
- list_files: 列出目录内容

## 工作方式
1. 先思考要做什么，必要时使用工具
2. 逐步分解任务，每次调用一个工具
3. 观察工具结果，决定下一步
4. 任务完成后输出最终结果

## 输出要求
在最后以 JSON 格式输出最终结果：
```json
{{"summary":"一句话总结","output":"详细输出内容","files":["生成的文件列表"],"metrics":{{"key":"value"}}}}
```

使用中文回复。"""

        if has_agentflow_context:
            base += f"""

## 编排 API 能力
你正在 AgentFlow 编排上下文中执行 (Run: {run_id})。
你可以通过 REST API 动态调整工作流结构。API 信息在工作目录的 .agentflow/ 目录中：
  - .agentflow/context.json  — 完整运行上下文
  - .agentflow/api.sh       — curl 命令模板
  - .agentflow/api.py       — Python 调用模板

### 可用操作
1. **查看状态** — curl -s $AGENTFLOW_API/api/runs/$RUN_ID | python3 -m json.tool
2. **查看节点** — curl -s $AGENTFLOW_API/api/runs/$RUN_ID/nodes | python3 -m json.tool  
3. **新增节点** — POST /api/runs/<run_id>/nodes (新增子任务/并行任务)
4. **修改自己** — PATCH /api/runs/<run_id>/nodes/<自己的节点ID>
5. **删除节点** — DELETE /api/runs/<run_id>/nodes/<node_id> (自动重连上下游)
6. **重置重跑** — POST /api/runs/<run_id>/nodes/<node_id>/retry
7. **批量调整** — POST /api/runs/<run_id>/reroute (增加/删除多个节点和边)
8. **提反馈** — POST /api/runs/<run_id>/feedback (给编排器提建议)

### Scope 限制
你的 scope: {scope}
- self(默认): 只能修改自己的节点
- downstream: 可修改自己及下游节点
- run: 可修改任何节点

如需修改权限外的节点，通过 feedback 提建议给编排器处理。
"""
        return base

    # ── 工具系统 ─────────────────────────────────────────

    def _tool_definitions(self):
        return [
            {"type": "function", "function": {
                "name": "execute_command",
                "description": "在沙箱终端执行命令（高危操作被禁止）",
                "parameters": {"type": "object", "properties": {
                    "command": {"type": "string", "description": "要执行的 Shell 命令"}
                }, "required": ["command"]}
            }},
            {"type": "function", "function": {
                "name": "read_file",
                "description": "读取文件内容",
                "parameters": {"type": "object", "properties": {
                    "path": {"type": "string", "description": "文件路径（相对或绝对）"}
                }, "required": ["path"]}
            }},
            {"type": "function", "function": {
                "name": "write_file",
                "description": "写入文件（覆盖模式）",
                "parameters": {"type": "object", "properties": {
                    "path": {"type": "string", "description": "文件路径"},
                    "content": {"type": "string", "description": "文件内容"}
                }, "required": ["path", "content"]}
            }},
            {"type": "function", "function": {
                "name": "list_files",
                "description": "列出目录中的文件",
                "parameters": {"type": "object", "properties": {
                    "path": {"type": "string", "description": "目录路径，默认当前目录"}
                }, "required": []}
            }}
        ]

    def _run_tool(self, name: str, args: dict, work_dir: str):
        try:
            if name == "execute_command":
                cmd = args.get("command", "")
                if not cmd.strip():
                    return {"error": "空命令"}
                # 安全检查（defense-in-depth blocklist）
                if not _is_command_safe(cmd):
                    return {"error": f"命令被沙箱拦截（高危操作）: {cmd[:100]}"}
                # shell=False 防止命令注入：shlex.split 将命令拆分为 argv 列表，
                # shell 元字符（&& | > $( )）不再被解释执行。
                # _is_command_safe() blocklist 作为额外防线保留。
                r = subprocess.run(shlex.split(cmd), shell=False, capture_output=True, text=True,
                                   cwd=work_dir, timeout=EXECUTE_TIMEOUT)
                out = r.stdout or ""
                if r.stderr:
                    out += f"\n[STDERR]\n{r.stderr}"
                return {"exit_code": r.returncode, "output": out[:10000]}

            elif name == "read_file":
                path_arg = args.get("path", "")
                filepath = os.path.join(work_dir, path_arg) if not os.path.isabs(path_arg) else path_arg
                # Path traversal protection: resolve symlinks and verify inside workspace
                real_path = os.path.realpath(filepath)
                if not real_path.startswith(os.path.realpath(work_dir) + os.sep):
                    return {"error": "Path outside workspace"}
                if not _is_path_safe(filepath, work_dir):
                    return {"error": f"路径被沙箱拦截（超出工作区）: {path_arg[:100]}"}
                if not os.path.isfile(filepath):
                    return {"error": f"文件不存在: {filepath}"}
                with open(filepath) as f:
                    c = f.read()
                return {"content": c[:10000], "size": len(c)}

            elif name == "write_file":
                path_arg, content = args.get("path", ""), args.get("content", "")
                filepath = os.path.join(work_dir, path_arg) if not os.path.isabs(path_arg) else path_arg
                # Path traversal protection: resolve symlinks and verify inside workspace
                real_path = os.path.realpath(filepath)
                if not real_path.startswith(os.path.realpath(work_dir) + os.sep):
                    return {"error": "Path outside workspace"}
                if not _is_path_safe(filepath, work_dir):
                    return {"error": f"路径被沙箱拦截（超出工作区）: {path_arg[:100]}"}
                fp = filepath
                os.makedirs(os.path.dirname(fp) or work_dir, exist_ok=True)
                with open(fp, "w") as f:
                    f.write(content)
                return {"written": True, "path": path_arg, "size": len(content)}

            elif name == "list_files":
                path_arg = args.get("path", ".")
                fp = os.path.join(work_dir, path_arg) if not os.path.isabs(path_arg) else path_arg
                # Path traversal protection: resolve symlinks and verify inside workspace
                real_path = os.path.realpath(fp)
                if not real_path.startswith(os.path.realpath(work_dir) + os.sep):
                    return {"error": "Path outside workspace"}
                if not _is_path_safe(fp, work_dir):
                    return {"error": f"路径被沙箱拦截（超出工作区）: {path_arg[:100]}"}
                if not os.path.isdir(fp):
                    return {"error": f"目录不存在: {fp}"}
                items = sorted(os.listdir(fp))
                return {"files": items, "count": len(items)}
            else:
                return {"error": f"未知工具: {name}"}
        except subprocess.TimeoutExpired:
            return {"error": f"命令执行超时 (>{EXECUTE_TIMEOUT}s)"}
        except Exception as e:
            return {"error": str(e)}

    # ── LLM 调用 ─────────────────────────────────────────

    def _llm_call(self, messages: list, tools: list = None):
        """P2 FIX: 调用 LLM，支持 provider failover 链。

        如果主模型调用失败（超时或 5xx），自动尝试 AGENT_FALLBACK_MODEL
        环境变量指定的备选模型。
        """
        try:
            return self.adapter.chat_completion(messages, tools=tools)
        except Exception as primary_err:
            fallback_model = os.environ.get("AGENT_FALLBACK_MODEL", "").strip()
            if not fallback_model or fallback_model == self.model:
                raise
            if not self._is_failover_eligible(primary_err):
                raise
            self._log(
                f"主模型 {self.model} 失败 ({type(primary_err).__name__}: {primary_err}), "
                f"切换到 fallback 模型: {fallback_model}",
                err=True,
            )
            try:
                fallback_agent = AgentRunner(model=fallback_model)
                if not fallback_agent.api_key:
                    raise
                return fallback_agent.adapter.chat_completion(messages, tools=tools)
            except Exception:
                # fallback 也失败 — 抛出原始错误
                raise primary_err from primary_err

    @staticmethod
    def _is_failover_eligible(err: Exception) -> bool:
        """判断错误是否适用于 failover（仅超时或 5xx 错误触发切换）。"""
        import urllib.error
        if isinstance(err, TimeoutError):
            return True
        if isinstance(err, urllib.error.HTTPError):
            return 500 <= err.code < 600
        if isinstance(err, urllib.error.URLError):
            return True
        err_str = str(err).lower()
        if "timeout" in err_str or "timed out" in err_str:
            return True
        if any(code in err_str for code in ("500", "502", "503", "504", "5xx")):
            return True
        return False

    # ── 工具函数 ─────────────────────────────────────────

    def _estimate_cost(self, resp: dict) -> float:
        usage = resp.get("usage", {})
        inp = usage.get("prompt_tokens", 0)
        out = usage.get("completion_tokens", 0)
        prices = {
            "deepseek":    (0.00000027, 0.00000110),  # DeepSeek-V3
            "zhipu":       (0.00000005, 0.00000050),  # GLM-4-Plus
            "xai":         (0.00000300, 0.00001500),  # Grok-3
            "openai":      (0.00000250, 0.00001000),  # GPT-4o
            "aliyun":      (0.00000080, 0.00000200),  # Qwen-Max
            "moonshot":    (0.00000100, 0.00000100),
            "siliconflow": (0.00000100, 0.00000100),
            "lingyi":      (0.00000140, 0.00000140),
            "minimax":     (0.00000150, 0.00000150),
            "baidu":       (0.00000120, 0.00000120),
            "tencent":     (0.00000100, 0.00000100),
            "stepfun":     (0.00000100, 0.00000100),
        }
        p = prices.get(self.provider_name, (0.000001, 0.000002))
        return inp * p[0] + out * p[1]

    def _extract_summary(self, output: str) -> str:
        """从输出中提取总结性内容。"""
        output = output.strip()
        if not output:
            return ""
        # 尝试从尾部 JSON 块提取 summary
        json_blocks = re.findall(r'```(?:json)?\s*({.*?})\s*```', output, re.DOTALL)
        for block in reversed(json_blocks):
            try:
                obj = json.loads(block)
                if "summary" in obj:
                    return obj["summary"]
            except Exception:
                pass
        # 尝试找最后一行的 JSON
        for line in reversed(output.split("\n")):
            line = line.strip()
            if line.startswith("{") and "summary" in line:
                try:
                    return json.loads(line).get("summary", output[:300])
                except Exception:
                    pass
        return output[:500]

    def _make_result(self, result, output, cost, start, status, turns=1):
        return {
            "result": result,
            "output": output,
            "cost": round(cost, 6),
            "duration_ms": int((time.time() - start) * 1000),
            "status": status,
            "turns": turns,
            "model": self.model,
            "provider": self.provider_name
        }

    def _log(self, msg, err=False):
        stream = sys.stderr if err else sys.stderr
        print(f"[AgentRunner] {msg}", file=stream)


def tempfile_get():
    """创建临时工作目录。

    P1 FIX: 使用 tempfile.mkdtemp() 替代 timestamp+PID 命名方案。
    旧实现 ``agentflow_node_{ms}_{pid}`` 在高并发（同毫秒、或 PID 回绕）时
    会碰撞，且目录名可预测，存在符号链接竞态风险。mkdtemp 原子创建一个
    不可预测的唯一目录名并返回。
    """
    import tempfile
    return tempfile.mkdtemp(prefix="agentflow_node_")


# ── CLI 入口 ────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="AgentRunner CLI")
    parser.add_argument("prompt", nargs="?", help="提示词")
    parser.add_argument("--model", default=os.environ.get("AGENT_MODEL", "deepseek-chat"), help="模型名")
    parser.add_argument("--profile", default="dev", help="Agent 角色")
    parser.add_argument("--work-dir", help="工作目录")
    parser.add_argument("--no-tools", action="store_true", help="禁用工具")
    parser.add_argument("--list-providers", action="store_true", help="列出所有支持的 provider")
    args = parser.parse_args()

    if args.list_providers:
        print("支持的 Providers（设置对应环境变量即可使用）：")
        print()
        for name, cfg in AgentRunner.PROVIDER_CONFIGS.items():
            key_env, base_env, default_base = cfg["key_env"], cfg["base_env"], cfg["default_base"]
            detected = "✓" if os.environ.get(key_env) else "✗"
            print(f"  {name:15s}  {detected}  {key_env:25s}  {default_base}")
        sys.exit(0)

    agent = AgentRunner(model=args.model)
    result = agent.execute(
        prompt=args.prompt or sys.stdin.read(),
        work_dir=args.work_dir or tempfile_get(),
        profile=args.profile,
        tools_enabled=not args.no_tools
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
