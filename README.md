# AgentFlow — Agent 编排平台

![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue)
![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

**AgentFlow** 是一个零外部依赖的 Agent 编排平台。用户描述需求 → AI 自动拆解为有向无环图(DAG) → 逐层并行执行 → 实时 SSE 流式推送。

> ⚡ 核心理念：把开发流程当控制系统——Agent 自动闭环反馈

## 快速开始

```bash
# 只需要 Python 3.10+，零 pip install

# 配置任意一个 API Key
export DEEPSEEK_API_KEY="sk-..."     # DeepSeek
# 或
export ZAI_API_KEY="your-key-here"   # 智谱 GLM
# 或
export OPENAI_API_KEY="sk-..."       # OpenAI
# 或 12 个 provider 中任何一个

# 启动
./start-agentflow.sh

# 浏览器打开
open http://localhost:9600
```

## 架构

```
┌─────────────────────────────────────────────────────────┐
│                    AgentFlow Backend                     │
│                                                         │
│  POST /api/decompose      → 编排 Agent 拆解需求          │
│  POST /api/execute        → 全量 JSON 执行               │
│  POST /api/execute/stream → SSE 流式逐节点推送            │
│  GET  /api/runs           → Run 历史                     │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │Compiler  │→ │Orchestra-│→ │Provider  │               │
│  │(模板引擎) │  │tor (DAG) │  │Adapter   │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

## 支持 12 个 Provider

| Provider | 环境变量 | 默认模型 |
|----------|---------|---------|
| DeepSeek | `DEEPSEEK_API_KEY` | deepseek-chat |
| 智谱 GLM | `ZAI_API_KEY` | glm-5-turbo |
| xAI Grok | `XAI_API_KEY` | grok-3 |
| OpenAI | `OPENAI_API_KEY` | gpt-4o |
| 阿里通义 | `DASHSCOPE_API_KEY` | qwen-max |
| 月之暗面 | `MOONSHOT_API_KEY` | moonshot-v1-8k |
| SiliconFlow | `SILICONFLOW_API_KEY` | Pro/deepseek-ai/DeepSeek-V3 |
| 零一万物 | `YI_API_KEY` | yi-large |
| MiniMax | `MINIMAX_API_KEY` | minimax-4 |
| 百度千帆 | `BAIDU_API_KEY` | ernie-4.5 |
| 腾讯混元 | `TENCENT_API_KEY` | hunyuan-turbo |
| 阶跃星辰 | `STEP_API_KEY` | step-2 |

## 实例测试报告

> 以下为 2026-06-10 对 AgentFlow v3 的实测结果，涵盖 4 个真实项目类型。

### 📊 测试结果总览

| 项目 | 类型 | 流式执行 | 成功节点 | 关键阻塞 |
|------|------|---------|---------|---------|
| 🔌 PyQt5 串口调试助手 | 桌面 GUI | ✅ SSE 流 | ❌ 0/5 (429) | API Rate Limit |
| 🌐 Todo 网页应用 | Web 前端 | - | - | (同 429) |
| 🚁 ADRC 四旋翼控制 | Simulink/MATLAB | - | - | 无法生成 .slx 文件 |
| 🐕 四足 VMC 控制 | Python 仿真 | - | - | 领域知识深度 |

### 🔌 项目 1: PyQt5 串口调试助手

**需求:** 用 PyQt5 写一个串口调试助手，支持波特率选择、HEX 收发、自动滚动、保存到文件

**分解结果:** ✅ 成功拆解为 5 个 DAG 节点

| 节点 | 阶段 | 预期输出 |
|------|------|---------|
| a1 | 需求分析 | 功能列表：波特率/校验位/HEX收发/自动滚动/保存 |
| a2 | UI设计 | Qt Designer 布局：左侧配置区 + 中间收发区 + 底部状态栏 |
| a3 | 核心编码 | serial_thread.py + main_window.py：QSerialPort + HEX转换 + 文件保存 |
| a4 | 测试验证 | 模拟串口回环：HEX收发正常 / 自动滚动OK / 保存成功 |
| a5 | 文档输出 | README.md + 使用说明 |

**SSE 流事件时序:**

```
workflow_start   → run_4e5746d885ba, 5 nodes
group_start[0]   → a1 (需求分析)
node_complete[0] → ❌ HTTP 429 Too Many Requests
group_start[1]   → a2 (UI设计)
node_complete[1] → ❌ HTTP 429 Too Many Requests
...所有节点均 429 失败
workflow_done    → 5 nodes, 5 errors, cost=$0.00
```

**阻塞点分析:** [详见下方](#-已识别阻塞点)

### 🌐 项目 2: Todo 网页应用

**需求:** HTML/CSS/JS Todo 应用，支持添加/删除/标记完成/本地存储

**分解结果:** ✅ 拆解为 5 节点
- 阻塞原因同上 (API Rate Limit)

### 🚁 项目 3: 四旋翼 ADRC 控制 Simulink 模型

**需求:** ADRC 自抗扰控制，位置环+姿态环，MATLAB 脚本+仿真参数

**独特阻塞:**
- AgentRunner 只能输出**文本文件**（.m 脚本），无法创建 Simulink 二进制格式（.slx）
- 需额外集成 MATLAB Engine API 或 Simulink CLI
- ADRC 控制器的 ESO 观测器参数整定需要专业知识

### 🐕 项目 4: 四足机器人 VMC 控制

**需求:** Python 实现 VMC（虚拟模型控制），单腿 3-DOF 运动学 + Trot 步态 + 可视化

**独特阻塞:**
- VMC 需要 Spring-Damper 虚拟力 → 雅可比 → 关节力矩映射
- LLM 生成的物理参数可能不稳定
- 缺乏可视化验证反馈闭环

---

## 🚨 已识别阻塞点

### P0 — 必须修复

| # | 问题 | 影响 | 状态 |
|---|------|------|------|
| 1 | **API 429 限流** — 所有节点连续失败 | 100% 失败率 | ✅ 已修复: 增加 5 次重试 + 30s→480s 指数退避 + 全局限流 1req/s |
| 2 | **熔断器跨实例不共享** — 每个 `_execute_one_node` 新建 AgentRunner，导致熔断器每节点重置 | 熔断器形同虚设 | ✅ 已修复: 全局 `_GLOBAL_CIRCUIT_BREAKERS` 字典 |
| 3 | **LLM 分解不可靠** — 非流式/通用领域 fallback 到硬编码模板 | 分解结果过于泛化 | 🚧 需改善: 添加领域特定模板、重试分解 |
| 4 | **Fallback 模板重复 ID** — `(base * 20)[:count]` 可产生重复 ID | DAG cycle 验证失败 | ✅ 已修复: 自动去重 + 验证拦截 |

### P1 — 短期优化

| # | 问题 | 影响 | 状态 |
|---|------|------|------|
| 5 | **无 Simulink/MATLAB 支持** — AgentRunner 只能写文本文件 | 无法生成 .slx 模型 | ❌ 待实现: MATLAB MCP integration |
| 6 | **无领域特定模板** — fallback 只识别 PID/Web/ML 三类 | 其他领域分解质量差 | ❌ 待扩展 |
| 7 | **执行结果验证缺失** — 生成的代码是否可运行未知 | 需要人工检查 | ❌ 待实现: 语法检查 + 单元测试自动执行 |
| 8 | **前端 SSE 适配** — canvas-demo.html 未适配 stream 端点 | 前端体验仍是全量 JSON | ✅ 已完成: 新增 handle_execute_stream |

### 修复后的效果

在修复 P0 #1 和 #2 后，ProviderAdapter 的 429 退避实际执行日志：

```
[AgentRunner] → Provider: zhipu | Model: glm-5-turbo
[ProviderAdapter] Attempt 1 failed: HTTP Error 429: Too Many Requests
[ProviderAdapter] 429 rate limited, waiting 30s (attempt 1/5)
[ProviderAdapter] Attempt 2 failed: HTTP Error 429: Too Many Requests
[ProviderAdapter] 429 rate limited, waiting 60s (attempt 2/5)
[ProviderAdapter] Attempt 3 failed: HTTP Error 429: Too Many Requests
[ProviderAdapter] 429 rate limited, waiting 120s (attempt 3/5)
```

> ⚠️ **注意:** 实测中 Zhipu GLM 的免费 API key 具有极低的 Rate Limit（~1 请求/2-3分钟），导致所有节点 429 失败。
> **建议使用 DeepSeek、SiliconFlow 或其他更高限流的 Provider 进行测试。**

---

## 技术细节

### 零外部依赖

整个项目只用 Python 标准库：
- `http.server` — HTTP 服务器
- `json` — 序列化
- `urllib` — LLM API 调用
- `concurrent.futures` — DAG 并行执行
- `threading` — 限流/熔断器
- `os`, `sys`, `shutil`, `tempfile` — 文件/目录管理

### SSE 流式事件协议

| 事件 | 触发时机 | 数据 |
|------|---------|------|
| `workflow_start` | 工作流开始 | run_id, total_nodes, total_groups |
| `group_start` | 每层 DAG 开始 | group_idx, nodes[] |
| `node_start` | 每个节点开始 | node_id, label, profile |
| `node_complete` | 每个节点完成 | node_id, status, result, cost, duration |
| `group_complete` | 每层完成 | group_idx, completed |
| `workflow_done` | 全部完成 | run_id, nodes[], total_cost |

---

## 项目结构

```
agentflow/
├── agentflow-backend.py    # HTTP 服务器 + API + DAG 执行引擎
├── agent_runner.py         # Multi-Provider Agent 运行器
├── agentflow_schema.py     # WorkflowJSON / NodeDef / EdgeDef 数据契约
├── prompt_compiler.py      # 模板引擎 + 动态编译
├── provider_adapter.py     # Provider 抽象层：重试/熔断/限流/SSE
├── artifact_store.py       # 文件型 Artifact 存储
├── output_validator.py     # JSON 模糊提取 + Schema 校验
├── templates/              # 6 个 profile 模板 (JSON)
│   ├── analysis.json
│   ├── design.json
│   ├── dev.json
│   ├── test.json
│   ├── doc.json
│   └── deploy.json
├── tests/                  # 92 测试，覆盖全部模块
├── start-agentflow.sh      # 启动脚本
├── Dockerfile              # 多阶段构建，零 pip install
└── .env.example            # 12 provider 环境变量模板
```
