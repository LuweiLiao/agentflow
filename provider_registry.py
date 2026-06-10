#!/usr/bin/env python3
"""ProviderRegistry — Provider 能力矩阵 + 降级策略 + 配置管理。

将 provider 配置从 agent_runner.py 中抽象出来，支持：
  1. 能力声明（Capability）：支持 tools/streaming/vision、max_context、速率限制
  2. 费用模型：每 1K token 输入/输出成本
  3. 降级链：primary → fallback1 → fallback2
  4. 统一的配置管理：ProviderConfig(name, key_env, base_env, ...)
"""
import os
from dataclasses import asdict, dataclass, field
from typing import Optional

# ═══════════════════════════════════════════════════════
# 数据结构
# ═══════════════════════════════════════════════════════

@dataclass
class ProviderCapability:
    """Provider 能力声明。"""
    supports_tools: bool = True
    supports_streaming: bool = True
    supports_vision: bool = False
    max_context: int = 128000
    max_tokens: int = 8192
    default_temperature: float = 0.7
    rate_limit_per_sec: float = 1.0  # 每秒最多请求
    timeout_default: int = 120
    cost_per_1k_input: float = 0.0005   # 美元
    cost_per_1k_output: float = 0.0015  # 美元


@dataclass
class ProviderConfig:
    """单个 Provider 的完整配置。"""
    name: str                              # 唯一标识
    label: str                             # 显示名称
    key_env: str                           # API key 环境变量名
    base_env: str                          # Base URL 环境变量名
    default_base: str                      # 默认 Base URL
    api_pattern: str = "/chat/completions" # API 路径后缀
    models: list[str] = field(default_factory=list)  # 该 provider 已知的模型列表
    capability: ProviderCapability = field(default_factory=ProviderCapability)
    fallback: Optional[str] = None         # 降级 provider name
    supported: bool = False                # 是否已实测
    tags: list[str] = field(default_factory=list)

    def is_configured(self) -> bool:
        """检查是否已配置 API key。"""
        return bool(os.environ.get(self.key_env, ""))


# ═══════════════════════════════════════════════════════
# 注册表
# ═══════════════════════════════════════════════════════

class ProviderRegistry:
    """Provider 注册表 — 查询、匹配、降级。"""

    def __init__(self):
        self._providers: dict[str, ProviderConfig] = {}
        self._model_to_provider: dict[str, str] = {}  # model → provider_name
        self._name_prefixes: list[tuple[str, str]] = []  # (prefix, provider_name)
        self._load_defaults()

    def _load_defaults(self):
        """加载预定义的 12 个 Provider。"""
        defaults = [
            ProviderConfig(
                name="deepseek", label="DeepSeek",
                key_env="DEEPSEEK_API_KEY",
                base_env="DEEPSEEK_BASE_URL",
                default_base="https://api.deepseek.com",
                models=["deepseek-chat", "deepseek-reasoner",
                        "deepseek-v4-flash", "deepseek-v3"],
                capability=ProviderCapability(
                    supports_tools=True, supports_streaming=True,
                    max_context=128000, rate_limit_per_sec=5.0,
                    cost_per_1k_input=0.0001, cost_per_1k_output=0.0003,
                ),
                fallback="openai",
                supported=True,
                tags=["recommended", "fast", "cheap"],
            ),
            ProviderConfig(
                name="openai", label="OpenAI",
                key_env="OPENAI_API_KEY",
                base_env="OPENAI_BASE_URL",
                default_base="https://api.openai.com/v1",
                models=["gpt-4o", "gpt-4o-mini", "gpt-4", "gpt-4-turbo",
                        "gpt-3.5-turbo", "o1", "o1-mini", "o3-mini"],
                capability=ProviderCapability(
                    supports_tools=True, supports_streaming=True,
                    supports_vision=True, max_context=128000,
                    cost_per_1k_input=0.0025, cost_per_1k_output=0.01,
                ),
                supported=False,
                tags=["standard"],
            ),
            ProviderConfig(
                name="zhipu", label="智谱 GLM",
                key_env="ZAI_API_KEY",
                base_env="ZHIPU_BASE_URL",
                default_base="https://open.bigmodel.cn/api/paas/v4",
                models=["glm-5-turbo", "glm-4-plus", "glm-4"],
                capability=ProviderCapability(
                    supports_tools=True, supports_streaming=True,
                    max_context=128000, rate_limit_per_sec=0.02,  # 免费 key 限流极低
                    cost_per_1k_input=0.001, cost_per_1k_output=0.002,
                ),
                supported=False,
                tags=["chinese", "beta"],
            ),
            ProviderConfig(
                name="xai", label="xAI Grok",
                key_env="XAI_API_KEY",
                base_env="XAI_BASE_URL",
                default_base="https://api.x.ai/v1",
                models=["grok-3", "grok-2", "grok-mini", "grok-3-mini", "grok"],
                capability=ProviderCapability(
                    supports_tools=True, supports_streaming=True,
                    max_context=128000,
                ),
                supported=False,
                tags=["beta"],
            ),
            ProviderConfig(
                name="aliyun", label="阿里通义",
                key_env="DASHSCOPE_API_KEY",
                base_env="DASHSCOPE_BASE_URL",
                default_base="https://dashscope.aliyuncs.com/compatible-mode/v1",
                models=["qwen-max", "qwen-plus", "qwen-turbo", "qwen2.5", "qwen2.5-coder"],
                capability=ProviderCapability(
                    supports_tools=True, supports_streaming=True,
                    max_context=128000, rate_limit_per_sec=2.0,
                    cost_per_1k_input=0.0002, cost_per_1k_output=0.0006,
                ),
                supported=False,
                tags=["chinese"],
            ),
            ProviderConfig(
                name="moonshot", label="月之暗面",
                key_env="MOONSHOT_API_KEY",
                base_env="MOONSHOT_BASE_URL",
                default_base="https://api.moonshot.cn/v1",
                models=["moonshot-v1", "moonshot-v1-8k", "moonshot-v1-32k",
                        "moonshot-v1-128k"],
                capability=ProviderCapability(
                    supports_tools=True, supports_streaming=True,
                    max_context=128000, cost_per_1k_input=0.001,
                    cost_per_1k_output=0.002,
                ),
                supported=False,
                tags=["chinese", "long-context"],
            ),
            ProviderConfig(
                name="siliconflow", label="SiliconFlow",
                key_env="SILICONFLOW_API_KEY",
                base_env="SILICONFLOW_BASE_URL",
                default_base="https://api.siliconflow.cn/v1",
                models=[],  # 代理模式，不限制模型
                capability=ProviderCapability(
                    supports_tools=True, supports_streaming=True,
                    max_context=128000, rate_limit_per_sec=3.0,
                ),
                supported=False,
                tags=["proxy", "multi-model"],
            ),
            ProviderConfig(
                name="lingyi", label="零一万物",
                key_env="YI_API_KEY",
                base_env="YI_BASE_URL",
                default_base="https://api.lingyiwanwu.com/v1",
                models=["yi-large", "yi-lightning", "yi-medium", "yi-vision"],
                capability=ProviderCapability(
                    supports_tools=True, supports_streaming=True,
                    max_context=128000,
                ),
                supported=False,
                tags=["chinese"],
            ),
            ProviderConfig(
                name="minimax", label="MiniMax",
                key_env="MINIMAX_API_KEY",
                base_env="MINIMAX_BASE_URL",
                default_base="https://api.minimax.chat/v1",
                models=["minimax-4", "minimax-4-turbo", "abab6.5"],
                capability=ProviderCapability(
                    supports_tools=True, supports_streaming=True,
                    max_context=128000,
                ),
                supported=False,
                tags=["chinese"],
            ),
            ProviderConfig(
                name="baidu", label="百度千帆",
                key_env="BAIDU_API_KEY",
                base_env="BAIDU_BASE_URL",
                default_base="https://qianfan.baidubce.com/v2",
                models=["ernie-4.5", "ernie-4", "ernie-3.5", "ernie-lite"],
                capability=ProviderCapability(
                    supports_tools=True, supports_streaming=True,
                    max_context=128000,
                ),
                supported=False,
                tags=["chinese"],
            ),
            ProviderConfig(
                name="tencent", label="腾讯混元",
                key_env="TENCENT_API_KEY",
                base_env="TENCENT_BASE_URL",
                default_base="https://api.hunyuan.cloud.tencent.com/v1",
                models=["hunyuan", "hunyuan-turbo", "hunyuan-lite"],
                capability=ProviderCapability(
                    supports_tools=True, supports_streaming=True,
                    max_context=128000,
                ),
                supported=False,
                tags=["chinese"],
            ),
            ProviderConfig(
                name="stepfun", label="阶跃星辰",
                key_env="STEP_API_KEY",
                base_env="STEP_BASE_URL",
                default_base="https://api.stepfun.com/v1",
                models=["step-2", "step-1", "step-1v"],
                capability=ProviderCapability(
                    supports_tools=True, supports_streaming=True,
                    max_context=128000,
                ),
                supported=False,
                tags=["chinese"],
            ),
        ]

        for p in defaults:
            self.register(p)

    def register(self, config: ProviderConfig):
        """注册一个 Provider。"""
        self._providers[config.name] = config
        # 建立 model → provider 索引
        for model in config.models:
            self._model_to_provider[model.lower().strip()] = config.name
        # 前缀匹配
        if config.models:
            # 取第一个模型的前缀模式
            pass

    def get(self, name: str) -> ProviderConfig | None:
        """根据 name 获取 ProviderConfig。"""
        return self._providers.get(name)

    def resolve(self, model: str) -> ProviderConfig | None:
        """根据模型名解析 Provider。返回最匹配的 ProviderConfig。"""
        model_lower = model.lower().strip()
        # 精确匹配
        if model_lower in self._model_to_provider:
            return self._providers.get(self._model_to_provider[model_lower])

        # 前缀匹配
        known_prefixes = [
            ("deepseek", "deepseek"), ("glm-", "zhipu"),
            ("grok", "xai"), ("gpt-", "openai"), ("o1", "openai"), ("o3", "openai"),
            ("qwen", "aliyun"), ("moonshot", "moonshot"),
            ("ernie", "baidu"), ("hunyuan", "tencent"),
            ("yi-", "lingyi"), ("minimax", "minimax"), ("abab", "minimax"),
            ("step-", "stepfun"), ("pro/", "siliconflow"),
        ]
        for prefix, name in known_prefixes:
            if model_lower.startswith(prefix):
                return self._providers.get(name)

        # 兜底：openai 兼容
        return self._providers.get("openai")

    def get_fallback_chain(self, model: str) -> list[ProviderConfig]:
        """获取降级链：本 provider → fallback1 → fallback2。"""
        primary = self.resolve(model)
        if not primary:
            return [self._providers.get("openai")]

        chain = [primary]
        visited = {primary.name}
        current = primary
        while current.fallback and current.fallback not in visited:
            fb = self._providers.get(current.fallback)
            if fb:
                chain.append(fb)
                visited.add(fb.name)
                current = fb
            else:
                break

        return chain

    def list_providers(self, configured_only: bool = False) -> list[ProviderConfig]:
        """列出所有 Provider，可选只列出已配置的。"""
        providers = list(self._providers.values())
        if configured_only:
            providers = [p for p in providers if p.is_configured()]
        return sorted(providers, key=lambda p: (not p.supported, p.name))

    def list_supported_models(self) -> list[str]:
        """列出所有已知模型。"""
        models = []
        for p in self._providers.values():
            models.extend(p.models)
        return sorted(set(models))

    def to_dict(self) -> dict:
        """序列化整个注册表（排除敏感信息）。"""
        return {
            name: {
                "name": cfg.name,
                "label": cfg.label,
                "supported": cfg.supported,
                "configured": cfg.is_configured(),
                "models": cfg.models,
                "fallback": cfg.fallback,
                "tags": cfg.tags,
                "capability": asdict(cfg.capability),
            }
            for name, cfg in self._providers.items()
        }


# ── 全局单例 ──────────────────────────────────────
_registry: ProviderRegistry | None = None


def get_registry() -> ProviderRegistry:
    global _registry
    if _registry is None:
        _registry = ProviderRegistry()
    return _registry


# ── PATH/ENV 工具 ───────────────────────────────────
def find_available_model(preferred: str = None) -> str:
    """找一个有 API key 的可用模型。优先使用 preferred。"""
    registry = get_registry()

    if preferred:
        # 尝试 preferred
        config = registry.resolve(preferred)
        if config and config.is_configured():
            return preferred

    # 遍历找已配置的
    for p in registry.list_providers(configured_only=True):
        if p.models:
            return p.models[0]

    # 都没有就用默认的
    return os.environ.get("AGENT_MODEL", "deepseek-v4-flash")


def estimate_cost(model: str, input_tokens: int = 0,
                  output_tokens: int = 0) -> float:
    """估算一次调用的费用。"""
    registry = get_registry()
    config = registry.resolve(model)
    if not config:
        return 0.0
    cap = config.capability
    return (input_tokens / 1000 * cap.cost_per_1k_input +
            output_tokens / 1000 * cap.cost_per_1k_output)


if __name__ == "__main__":
    reg = get_registry()
    print("AgentFlow Provider Registry")
    print("=" * 60)
    print(f"{'Provider':<15} {'状态':<10} {'模型数':<8} {'降级':<12}")
    print("-" * 60)
    for p in reg.list_providers():
        status = "✅ 已配置" if p.is_configured() else "⏳ 未配置"
        fb = p.fallback or "-"
        print(f"{p.label:<15} {status:<10} {len(p.models):<8} {fb:<12}")
    print()

    # 测试 resolve
    test_models = ["deepseek-v4-flash", "glm-5-turbo", "gpt-4o", "unknown-model"]
    for m in test_models:
        resolved = reg.resolve(m)
        fb_chain = reg.get_fallback_chain(m)
        print(f"模型 '{m}' → {resolved.name if resolved else '未知'}"
              f" (降级链: {' → '.join(p.name for p in fb_chain)})")

    print(f"\n可用模型: {find_available_model()}")
