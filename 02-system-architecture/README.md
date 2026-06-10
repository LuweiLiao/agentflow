# AgentFlow 系统架构

> 文档版本：v0.2 | 最后更新：2026-06-10

## 概述

AgentFlow 是一款**画布驱动的多 Agent 协作编排系统**。用户输入一句话需求，系统通过**源编排 Agent（GLM-5-Turbo）** 自动拆解为多个子任务节点并构建 DAG，随后将 DAG 编译为可执行的 Prompt 任务链，由自研的 DAG 并行执行引擎（AgentRunner + ThreadPool）调度，最终将结果汇聚回画布。

其核心哲学是 **"需求 In → Agent 自动编排 → DAG 并行执行 → 结果 Out"**，用户只需描述需求，系统自动完成从任务拆解到并行执行到结果汇聚的全流程。

---

## 6 阶段转换链路（核心流水线）

```
用户一句话 ──(0)──→ WorkflowJSON ──(1)──→ WorkflowJSON(带DAG) ──(2)──→ PromptTask[] ──(3)──→ Envelope JSON ──(4)──→ 画布节点更新
                                                                           │
                                                                      DAG并行执行
                                                                     (AgentRunner)
```

| 阶段 | 名称 | 输入 | 输出 | 承担组件 |
|------|------|------|------|---------|
| **0** | 源编排 | 用户一句话 | `WorkflowJSON`（节点+DAG） | GLM-5-Turbo API（集成🔗） |
| **1** | 画布确认 | `WorkflowJSON` | `WorkflowJSON`（用户确认） | CSS Grid HTML 画布（自研🟥） |
| **2** | Prompt 编译 | `WorkflowJSON` | `PromptTask[]` | Prompt Compiler（自研🟥） |
| **3** | DAG 并行执行 | `PromptTask[]` | `Envelope JSON[]` | AgentRunner + ThreadPool（自研🟥） |
| **4** | 结果汇聚 | `Envelope JSON[]` | 画布状态更新 | 汇聚引擎（自研🟥） |

详细描述见 [02.1-core-pipeline.md](./02.1-core-pipeline.md)。

---

## 6+1 层级架构

| 层级 | 名称 | 职责 | 开发状态 |
|------|------|------|---------|
| **L0** | 源编排 | 编排元模型、节点类型注册、画布状态管理、GLM-5-Turbo 需求拆解 | 自研🟥 |
| **L1** | 核心引擎 | Compiler + AgentRunner + 模板系统 + 多 Provider 抽象层 | 自研🟥 |
| **L2** | SDK | 对外编程接口、插件 SDK | Defer |
| **L3** | 市场 | Agent 模板市场、节点市场 | Defer |
| **L4** | 画布 UI | CSS Grid HTML 可视化工作流编辑器（纯前端） | 自研🟥 |
| **L5** | 团队版 | 团队协作、权限管理、共享工作区 | Defer |
| **L6** | 运维 | 部署、监控、日志、运维控制台 | Defer |

详细描述见 [02.2-layers.md](./02.2-layers.md)。

---

## OSS 复用策略

AgentFlow 采用"**核心自研 + 关键集成**"策略，核心调度、编译、执行引擎均为自研，仅通过 API 集成外部 LLM 服务。详情见 [02.3-oss-strategy.md](./02.3-oss-strategy.md)。

---

## 文件索引

| 文件 | 说明 |
|------|------|
| [README.md](./README.md) | **本文** — 架构概览与文件索引 |
| [02.1-core-pipeline.md](./02.1-core-pipeline.md) | 6 阶段转换链路的详细描述，含各阶段数据流、序列图、错误处理 |
| [02.2-layers.md](./02.2-layers.md) | 6+1 层级的详细描述，含各层职责、接口边界、演进路线 |
| [02.3-oss-strategy.md](./02.3-oss-strategy.md) | OSS 复用策略评估，含各组件选型分析、集成深度、维护策略 |

---

## 架构原则

1. **需求驱动** — 所有交互始于用户一句话需求，系统自动完成编排到执行的全流程
2. **不可变阶段边界** — 6 阶段之间通过明确的数据契约通信，阶段内可独立演进
3. **纯 Python 运行时** — 无需 Docker 容器，Agent 通过 subprocess 直接运行，零容器开销
4. **多 Provider 抽象** — 通过统一的 AgentRunner 抽象层支持 12+ 个 OpenAI 兼容 API 供应商，灵活切换
5. **渐进复杂度** — 简单需求可一句话生成完整工作流，复杂场景逐步启用高级配置
6. **自研核心，API 集成** — 核心调度、编译、执行全部自研，仅通过标准 API 集成外部 LLM 服务
