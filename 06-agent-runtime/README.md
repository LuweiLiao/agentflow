# 06 — Agent 运行时

> 文档版本：v0.2 | 最后更新：2026-06-10

## 概述

Agent 运行时是 AgentFlow 的核心执行层，负责将 Compiler 编译的 PromptTask 转换为实际的 Agent 执行。运行时采用 **Multi-Provider Agent Runner** 架构，支持 12+ 大模型供应商，Think→Act→Observe 循环驱动执行。

## 核心组件

| 组件 | 文件 | 说明 |
|------|------|------|
| **AgentRunner** | `agent_runner.py` | 通用 Agent 执行器，支持任意 OpenAI 兼容 API |
| **Provider 配置** | `agent_runner.py:PROVIDER_CONFIGS` | 12 个供应商的 API 密钥/地址配置 |
| **Model→Provider 映射** | `agent_runner.py:MODEL_PROVIDER_MAP` | 模型名前缀自动匹配供应商 |
| **工具系统** | `agent_runner.py:_tool_definitions()` | 4 个内置工具：execute_command/read_file/write_file/list_files |

## 执行模型

### Think→Act→Observe 循环

```
用户输入 → System Prompt + User Prompt
    │
    ▼
┌─────────────────────────────────────┐
│  LLM Call (任意 Provider)           │
│  返回: {content, tool_calls}        │
└─────────┬───────────┬──────────────┘
          │           │
    有 content   有 tool_calls
          │           │
          ▼           ▼
    收集输出    执行工具 (subprocess)
          │           │
          │           ▼
          │    工具结果→消息队列
          │           │
          └─────┬─────┘
                │
                ▼
        是否还有 tool_calls?
            Yes → 继续循环
            No  → 输出结果
```

### 关键技术参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `max_turns` | 10 | 最多 Think→Act 循环次数 |
| `timeout` | 120s | 单节点最大执行时间 |
| `max_tokens` | 8192 | LLM 输出最大 Token |
| `temperature` | 0.7 | LLM 生成温度 |

## 支持的 Provider

通过设置环境变量即可切换 Provider 和模型：

| Provider | 环境变量 | 模型示例 |
|----------|---------|---------|
| DeepSeek | `DEEPSEEK_API_KEY` | deepseek-chat, deepseek-reasoner |
| 智谱 GLM | `ZAI_API_KEY` | glm-5-turbo, glm-4-plus |
| xAI Grok | `XAI_API_KEY` | grok-3, grok-2 |
| OpenAI | `OPENAI_API_KEY` | gpt-4o, gpt-4o-mini |
| 阿里通义 | `DASHSCOPE_API_KEY` | qwen-max, qwen-plus |
| 月之暗面 | `MOONSHOT_API_KEY` | moonshot-v1-8k |
| SiliconFlow | `SILICONFLOW_API_KEY` | Pro/deepseek-ai/DeepSeek-V3 |
| 零一万物 | `YI_API_KEY` | yi-large, yi-lightning |
| MiniMax | `MINIMAX_API_KEY` | minimax-4 |
| 百度千帆 | `BAIDU_API_KEY` | ernie-4.5 |
| 腾讯混元 | `TENCENT_API_KEY` | hunyuan-turbo |
| 阶跃星辰 | `STEP_API_KEY` | step-2 |

## 成本估算

AgentRunner 内置按 Token 计费的成本估算：

```
cost = prompt_tokens × input_price + completion_tokens × output_price
```

价格表在 `agent_runner.py:PROVIDER_PRICES` 中定义（单位：美元/Token）。

## 安全注意事项

- AgentRunner 使用 `subprocess.run(cmd, shell=True)` 执行命令，Agent 可执行任意 Shell 命令
- 当前无容器隔离，Agent 直接运行在宿主机 Python 进程中
- API Key 从环境变量读取，建议使用 systemd EnvironmentFile 而非 start-agentflow.sh 硬编码
- Phase 3 计划引入 Docker 容器隔离

## 相关文档

- [06.1-registry.md](./06.1-registry.md) — Provider 注册与模型映射
- [06.2-security.md](./06.2-security.md) — 运行时安全架构
