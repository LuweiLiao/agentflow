"""ProviderAdapter — 标准化 LLM Provider 调用层

职责:
  1. 重试 + 指数退避
  2. 熔断器 (circuit breaker)
  3. 连接/读取超时分离
  4. 错误标准化
  5. 流式响应 (SSE)
"""

import json
import sys
import threading
import time
import urllib.error
import urllib.request

# 默认配置
DEFAULT_MAX_RETRIES = 5
DEFAULT_RETRY_DELAY = 1.5
DEFAULT_TIMEOUT_CONNECT = 30
DEFAULT_TIMEOUT_READ = 180
CIRCUIT_BREAKER_THRESHOLD = 5
CIRCUIT_BREAKER_COOLDOWN = 120

# 全局 rate limiter — 每 provider 每秒最多 N 请求
_GLOBAL_RATE_LIMITER: dict[str, tuple] = {}  # {provider_name: (last_call, min_interval)}
_RATE_LIMIT_LOCK = threading.Lock()

# 全局熔断器 — 跨实例共享，key=model_name
_GLOBAL_CIRCUIT_BREAKERS: dict = {}  # dict[str, CircuitBreaker]
_GLOBAL_CB_LOCK = threading.Lock()


class CircuitBreaker:
    """简易熔断器 — 连续失败超过阈值后暂停调用。"""

    def __init__(self, threshold: int = CIRCUIT_BREAKER_THRESHOLD,
                 cooldown: float = CIRCUIT_BREAKER_COOLDOWN):
        self.threshold = threshold
        self.cooldown = cooldown
        self.failures = 0
        self.last_failure = 0.0

    @property
    def is_open(self) -> bool:
        """熔断器是否打开（禁止调用）。"""
        if self.failures >= self.threshold:
            elapsed = time.time() - self.last_failure
            return elapsed < self.cooldown
        return False

    @property
    def remaining_cooldown(self) -> float:
        """剩余冷却秒数（0 = 已恢复）。"""
        if self.failures < self.threshold:
            return 0
        remaining = self.cooldown - (time.time() - self.last_failure)
        return max(0, remaining)

    def record_success(self):
        """调用成功 — 重置失败计数。"""
        self.failures = 0

    def record_failure(self):
        """调用失败 — 递增失败计数。"""
        self.failures += 1
        self.last_failure = time.time()


class ProviderAdapter:
    """标准化 Provider 调用适配器。"""

    def __init__(self, base_url: str, api_key: str, model: str,
                 max_retries: int = DEFAULT_MAX_RETRIES,
                 timeout_connect: int = DEFAULT_TIMEOUT_CONNECT,
                 timeout_read: int = DEFAULT_TIMEOUT_READ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.max_retries = max_retries
        self.timeout_connect = timeout_connect
        self.timeout_read = timeout_read
        self.circuit_breaker = CircuitBreaker()
        self._stats = {"total_calls": 0, "success_calls": 0,
                       "failed_calls": 0, "last_error": None}

        # 使用全局熔断器（跨实例共享）
        with _GLOBAL_CB_LOCK:
            if model not in _GLOBAL_CIRCUIT_BREAKERS:
                _GLOBAL_CIRCUIT_BREAKERS[model] = CircuitBreaker()
            self._global_cb = _GLOBAL_CIRCUIT_BREAKERS[model]

    # ── 公开接口 ────────────────────────────────────────

    def chat_completion(self, messages: list, tools: list = None,
                        temperature: float = 0.7,
                        max_tokens: int = 8192) -> dict:
        """调用 LLM chat completion 并返回标准响应。

        Returns:
            {"choices": [...], "usage": {...}} 或抛出异常
        """
        if self._global_cb.is_open:
            remaining = self._global_cb.remaining_cooldown
            raise CircuitBreakerOpenError(
                f"熔断器打开，剩余冷却 {remaining:.0f}s",
                cooldown_remaining=remaining,
            )

        # 全局 rate limiting（跨实例协调）
        self._global_throttle()

        url = self._build_url()
        payload = self._build_payload(messages, tools, temperature, max_tokens)
        data = json.dumps(payload).encode()

        last_error = None
        for attempt in range(self.max_retries):
            try:
                resp = self._do_request(url, data)
                self._global_cb.record_success()
                self._stats["total_calls"] += 1
                self._stats["success_calls"] += 1
                return resp
            except urllib.error.HTTPError as e:
                last_error = e
                self._log_attempt_failure(attempt, e)
                if e.code == 429:
                    # 429 (rate limit): 长退避 30s → 60s → 120s → 240s → 480s
                    delay = 30 * (2 ** attempt)
                    msg = (f"[ProviderAdapter] 429 rate limited, "
                           f"waiting {delay}s (attempt {attempt+1}/{self.max_retries})")
                    print(msg, file=sys.stderr)
                    time.sleep(delay)
                elif self._should_retry(e, attempt):
                    delay = DEFAULT_RETRY_DELAY ** attempt
                    time.sleep(delay)
                else:
                    break
            except (urllib.error.URLError, OSError, json.JSONDecodeError) as e:
                last_error = e
                self._log_attempt_failure(attempt, e)
                if self._should_retry(e, attempt):
                    delay = DEFAULT_RETRY_DELAY ** attempt
                    time.sleep(delay)
                else:
                    break

        self._global_cb.record_failure()
        self._stats["total_calls"] += 1
        self._stats["failed_calls"] += 1
        self._stats["last_error"] = str(last_error)
        raise ProviderError(f"调用失败 (重试{self.max_retries}次): {last_error}") from last_error

    def chat_completion_stream(self, messages: list, tools: list = None,
                                temperature: float = 0.7,
                                max_tokens: int = 8192):
        """流式调用 LLM，逐块 yield SSE 数据。

        Yields:
            每个 SSE data 块的 json dict
        """
        if self._global_cb.is_open:
            remaining = self._global_cb.remaining_cooldown
            raise CircuitBreakerOpenError(
                f"熔断器打开，剩余冷却 {remaining:.0f}s",
                cooldown_remaining=remaining,
            )

        url = self._build_url()
        payload = self._build_payload(messages, tools, temperature, max_tokens)
        payload["stream"] = True
        data = json.dumps(payload).encode()

        last_error = None
        for attempt in range(self.max_retries):
            try:
                req = urllib.request.Request(url, data=data, headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                    "Accept": "text/event-stream",
                }, method="POST")
                with urllib.request.urlopen(req, timeout=self.timeout_read) as resp:
                    buffer = b""
                    while True:
                        chunk = resp.read(4096)
                        if not chunk:
                            break
                        buffer += chunk
                        # 按行分割 SSE
                        while b"\n" in buffer:
                            line, buffer = buffer.split(b"\n", 1)
                            line = line.decode("utf-8", errors="replace").strip()
                            if line.startswith("data: "):
                                data_str = line[6:]
                                if data_str == "[DONE]":
                                    return
                                try:
                                    yield json.loads(data_str)
                                except json.JSONDecodeError:
                                    continue  # 跳过格式错误的块
                self._global_cb.record_success()
                return
            except (urllib.error.HTTPError, urllib.error.URLError,
                    OSError) as e:
                last_error = e
                self._log_attempt_failure(attempt, e)
                if self._should_retry(e, attempt):
                    delay = DEFAULT_RETRY_DELAY ** attempt
                    time.sleep(delay)

        self._global_cb.record_failure()
        raise ProviderError(f"流式调用失败 (重试{self.max_retries}次): {last_error}") from last_error

    # ── 状态 ────────────────────────────────────────────

    @property
    def stats(self) -> dict:
        """调用统计。"""
        return {**self._stats, "circuit_breaker_open": self._global_cb.is_open}

    def reset_stats(self):
        """重置统计和熔断器。"""
        self._stats = {"total_calls": 0, "success_calls": 0,
                       "failed_calls": 0, "last_error": None}
        self.circuit_breaker = CircuitBreaker()

    # ── 内部 ────────────────────────────────────────────

    def _build_url(self) -> str:
        if "/chat/completions" in self.base_url:
            return self.base_url
        return f"{self.base_url}/chat/completions"

    def _build_payload(self, messages: list, tools: list = None,
                       temperature: float = 0.7,
                       max_tokens: int = 8192) -> dict:
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"
        return payload

    def _do_request(self, url: str, data: bytes) -> dict:
        """执行 HTTP 请求并解析 JSON 响应。"""
        req = urllib.request.Request(url, data=data, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }, method="POST")
        with urllib.request.urlopen(req, timeout=self.timeout_read) as resp:
            raw = resp.read()
            return json.loads(raw)

    def _should_retry(self, error: Exception, attempt: int) -> bool:
        """判断是否应该重试。"""
        if attempt >= self.max_retries - 1:
            return False
        # HTTP 429 (rate limit) 和 5xx (server error) 可重试
        if isinstance(error, urllib.error.HTTPError):
            code = error.code
            if code in (429, 500, 502, 503, 504):
                return True
            return False
        # 网络错误可重试
        if isinstance(error, (urllib.error.URLError, OSError)):
            return True
        return False

    def _log_attempt_failure(self, attempt: int, error: Exception):
        stream = sys.stderr
        print(f"[ProviderAdapter] Attempt {attempt + 1} failed: {error}", file=stream)

    def _log(self, msg: str):
        print(f"[ProviderAdapter] {msg}", file=sys.stderr)

    def __repr__(self) -> str:
        return (f"ProviderAdapter(model={self.model}, "
                f"circuit={'OPEN' if self._global_cb.is_open else 'CLOSED'}, "
                f"calls={self._stats['total_calls']})")

    def _global_throttle(self):
        """全局跨实例限流 — 同一 provider 每秒最多 1 次请求。"""
        with _RATE_LIMIT_LOCK:
            key = self.model.split("/")[0] if "/" in self.model else self.model
            last_call, min_interval = _GLOBAL_RATE_LIMITER.get(key, (0, 1.0))
            now = time.time()
            elapsed = now - last_call
            if elapsed < min_interval:
                wait = min_interval - elapsed
                self._log(f"全局限流: 等待 {wait:.1f}s ({key})")
                time.sleep(wait)
            _GLOBAL_RATE_LIMITER[key] = (time.time(), min_interval)


class ProviderError(Exception):
    """Provider 调用标准异常。"""
    pass


class CircuitBreakerOpenError(ProviderError):
    """熔断器打开时的异常。"""
    def __init__(self, message: str, cooldown_remaining: float = 0):
        super().__init__(message)
        self.cooldown_remaining = cooldown_remaining


def create_adapter(provider_name: str, model: str,
                   provider_configs: dict) -> ProviderAdapter:
    """工厂函数：从 provider name 和配置创建适配器。"""
    import os
    config = provider_configs.get(provider_name, provider_configs.get("openai"))
    if not config:
        raise ValueError(f"未知 provider: {provider_name}")

    api_key = os.environ.get(config["key_env"], "")
    base_url = os.environ.get(config["base_env"], config["default_base"])

    return ProviderAdapter(
        base_url=base_url,
        api_key=api_key,
        model=model,
    )
