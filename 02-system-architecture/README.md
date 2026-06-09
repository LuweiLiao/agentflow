# AgentFlow 系统架构

> 文档版本：v0.1 | 最后更新：2026-06-09

## 概述

AgentFlow 是一款**画布驱动的多 Agent 协作编排系统**。用户通过可视化画布(React Flow)设计工作流，系统将画布定义编译为可执行的 Prompt 任务链，由智能编排器调度 Docker 容器化的 Agent 集群执行，最终将结果汇聚回画布，驱动下一节点。

其核心哲学是 **"Canvas In → Envelope Out → Canvas Back"** —— 从画布设计到执行结果回显形成完整闭环，用户全程在可视化界面中完成复杂多 Agent 工作流的构建与运行。

---

## 5 阶段转换链路（核心流水线）

```
画布 (React Flow) ──(1)──→ WorkflowJSON ──(2)──→ PromptTask[] ──(3)──→ docker run claude --print ──(4)──→ Envelope JSON ──(5)──→ 验证 → 画布更新 / 下一节点
```

| 阶段 | 名称 | 输入 | 输出 | 承担组件 |
|------|------|------|------|---------|
| **1** | 画布序列化 | 图形节点/边 | `WorkflowJSON` | React Flow（复用🟦） |
| **2** | Prompt 编译 | `WorkflowJSON` | `PromptTask[]` | Prompt Compiler Agent（自研🟥） |
| **3** | 编排调度 | `PromptTask[]` | Docker 指令 | Orchestrator（自研🟥） |
| **4** | Agent 执行 | docker run 指令 | `Envelope JSON` | Agent 集群（Docker + Claude Code） |
| **5** | 结果汇聚 | `Envelope JSON` | 验证 → 画布更新 | 汇聚引擎（自研🟥） |

详细描述见 [02.1-core-pipeline.md](./02.1-core-pipeline.md)。

---

## 6+1 层级架构

| 层级 | 名称 | 职责 | 开发状态 |
|------|------|------|---------|
| **L0** | 源编排 | 编排元模型、节点类型注册、画布状态管理 | 自研🟥 |
| **L1** | 核心引擎 | Compiler + Orchestrator + 模板系统 | 自研🟥 |
| **L2** | SDK | 对外编程接口、插件 SDK | Defer |
| **L3** | 市场 | Agent 模板市场、节点市场 | Defer |
| **L4** | 画布 UI | React Flow 可视化工作流编辑器 | 复用🟦 |
| **L5** | 团队版 | 团队协作、权限管理、共享工作区 | Defer |
| **L6** | 运维 | 部署、监控、日志、运维控制台 | Defer |

详细描述见 [02.2-layers.md](./02.2-layers.md)。

---

## OSS 复用策略

AgentFlow 采用"**核心自研 + 关键复用**"策略，对 React Flow、Claude Code CLI、Hermes Agent 等 OSS 组件进行不同深度的集成与复用。详情见 [02.3-oss-strategy.md](./02.3-oss-strategy.md)。

---

## 文件索引

| 文件 | 说明 |
|------|------|
| [README.md](./README.md) | **本文** — 架构概览与文件索引 |
| [02.1-core-pipeline.md](./02.1-core-pipeline.md) | 5 阶段转换链路的详细描述，含各阶段数据流、序列图、错误处理 |
| [02.2-layers.md](./02.2-layers.md) | 6+1 层级的详细描述，含各层职责、接口边界、演进路线 |
| [02.3-oss-strategy.md](./02.3-oss-strategy.md) | OSS 复用策略评估，含各组件选型分析、集成深度、维护策略 |

---

## 架构原则

1. **画布第一** — 所有交互始于画布、终于画布，用户不离开可视化界面
2. **不可变阶段边界** — 5 阶段之间通过明确的 JSON Schema 契约通信，阶段内可独立演进
3. **容器隔离** — 每个 Agent 运行在独立 Docker 容器中，资源与安全隔离
4. **渐进复杂度** — 简单工作流可零配置运行，复杂场景逐步启用 L2~L6 能力
5. **OSS 优先，自研保底** — 能复用的优秀 OSS 组件优先复用，核心调度与控制逻辑自研
