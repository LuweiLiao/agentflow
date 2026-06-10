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

import os, sys, json, subprocess, time, shutil, shlex

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
    # 不允许穿越到 work_dir 外
    for blocked in SANDBOX_BLOCKED_PATHS:
        if real.startswith(os.path.realpath(blocked)) if os.path.isabs(blocked) else False:
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

        if not self.api_key:
            self._log(f"⚠️ 未配置 {provider_name} API 密钥 ({config['key_env']})", err=True)

    # ── 主入口 ──────────────────────────────────────────

    def execute(self, prompt: str, work_dir: str = None,
                profile: str = "dev", tools_enabled: bool = True,
                max_turns: int = 10, timeout: int = 120) -> dict:
        """执行任务，返回结构化结果。

        Returns:
            {"result": "...", "output": "...", "cost": 0.0,
             "duration_ms": 0, "status": "ok", "turns": N,
             "model": "...", "provider": "..."}
        """
        start = time.time()
        work_dir = work_dir or tempfile_get()
        all_output = []
        total_cost = 0.0

        if not self.api_key:
            return self._make_result("API 密钥未配置", "", 0, start, "error")

        messages = [
            {"role": "system", "content": self._system_prompt(profile)},
            {"role": "user", "content": prompt}
        ]
        tool_defs = self._tool_definitions() if tools_enabled else None

        try:
            for turn in range(max_turns):
                if time.time() - start > timeout:
                    raise TimeoutError(f"执行超时 ({timeout}s)")

                resp = self._llm_call(messages, tool_defs)
                msg = resp["choices"][0]["message"]
                total_cost += self._estimate_cost(resp)

                content = msg.get("content", "") or ""
                tool_calls = msg.get("tool_calls", [])

                if content:
                    all_output.append(content)

                if not tool_calls:
                    break  # 完成

                # 处理工具调用
                messages.append({"role": "assistant", "content": content, "tool_calls": tool_calls})
                for tc in tool_calls:
                    fn = tc.get("function", {})
                    name, args_str = fn.get("name", ""), fn.get("arguments", "{}")
                    try:
                        args = json.loads(args_str) if args_str else {}
                    except json.JSONDecodeError:
                        args = {}
                    tr = self._run_tool(name, args, work_dir)
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.get("id", ""),
                        "content": json.dumps(tr, ensure_ascii=False)[:15000]
                    })

            elapsed = int((time.time() - start) * 1000)
            full_output = "\n".join(all_output)
            result = self._extract_summary(full_output)

            return self._make_result(result, full_output, total_cost, start, "ok", turn + 1)

        except TimeoutError as e:
            return self._make_result(str(e), "\n".join(all_output), total_cost, start, "timeout")
        except Exception as e:
            return self._make_result(f"失败: {e}", "\n".join(all_output), total_cost, start, "error")

    # ── 系统提示词 ──────────────────────────────────────

    def _system_prompt(self, profile: str) -> str:
        return f"""你是 AgentFlow 工作流中的 {profile} 角色 Agent。

## 可用工具
- execute_command: 在终端执行命令（支持 bash/sh）
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

    # ── 工具系统 ─────────────────────────────────────────

    def _tool_definitions(self):
        return [
            {"type": "function", "function": {
                "name": "execute_command",
                "description": "在终端执行 bash 命令",
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
                # 安全检查
                if not _is_command_safe(cmd):
                    return {"error": f"命令被沙箱拦截（高危操作）: {cmd[:100]}"}
                # 不使用 shell=True，使用 shlex 分割
                try:
                    cmd_parts = shlex.split(cmd)
                except ValueError as e:
                    return {"error": f"命令解析失败: {e}"}
                r = subprocess.run(cmd_parts, shell=False, capture_output=True, text=True,
                                   cwd=work_dir, timeout=EXECUTE_TIMEOUT)
                out = r.stdout or ""
                if r.stderr:
                    out += f"\n[STDERR]\n{r.stderr}"
                return {"exit_code": r.returncode, "output": out[:10000]}

            elif name == "read_file":
                path_arg = args.get("path", "")
                filepath = os.path.join(work_dir, path_arg) if not os.path.isabs(path_arg) else path_arg
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
        url = f"{self.base_url}/chat/completions" if "/chat/completions" not in self.base_url else self.base_url
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 8192,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        data = json.dumps(payload).encode()
        import urllib.request, urllib.error

        last_error = None
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, data=data, headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }, method="POST")
                with urllib.request.urlopen(req, timeout=120) as resp:
                    return json.loads(resp.read())
            except (urllib.error.HTTPError, urllib.error.URLError, OSError) as e:
                last_error = e
                self._log(f"LLM call attempt {attempt+1}/3 failed: {e}", err=True)
                if attempt < 2:
                    time.sleep(1.5 ** attempt)  # 1.5s → 2.25s 退避
        raise last_error or RuntimeError("LLM call failed after 3 retries")

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
        import re
        json_blocks = re.findall(r'```(?:json)?\s*({.*?})\s*```', output, re.DOTALL)
        for block in reversed(json_blocks):
            try:
                obj = json.loads(block)
                if "summary" in obj:
                    return obj["summary"]
            except: pass
        # 尝试找最后一行的 JSON
        for line in reversed(output.split("\n")):
            line = line.strip()
            if line.startswith("{") and "summary" in line:
                try:
                    return json.loads(line).get("summary", output[:300])
                except: pass
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
    """创建临时工作目录。"""
    path = os.path.join("/tmp", f"agentflow_node_{int(time.time() * 1000)}_{os.getpid()}")
    os.makedirs(path, exist_ok=True)
    return path


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
