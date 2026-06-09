# AgentFlow

**AI Agent Orchestration Platform — 多 Agent 编排平台**

---

AgentFlow 是一个将可视化工作流编排与 AI Agent 自动执行结合的平台。用户通过画布拖拽配线定义工作流 DAG，系统自动编译为 Agent 可执行的提示词，在 Docker 容器中通过 Claude Code CLI 驱动执行，形成完整的闭环反馈系统。

## 核心理念

```
用户说需求 → AI 画草稿 → 用户完善 → 自动执行 → 结果反馈
```

每个画布节点 → 由 Compiler Agent 编译为完整自然语言提示词 → Claude Code 在 Docker 中执行 → 结果通过 Envelope 协议传递。

## 快速导航

| 章节 | 内容 | 适合谁 |
|------|------|--------|
| **[01-愿景与设计理念](01-vision-and-philosophy/README.md)** | 为什么做 AgentFlow？核心哲学是什么？ | 所有人 |
| **[02-系统架构](02-system-architecture/README.md)** | 整体架构、5 阶段转换链路、6+1 层级 | 架构师、开发者 |
| **[03-数据契约](03-data-contracts/README.md)** | WorkflowJSON / PromptTask / Envelope JSON 完整定义 | 开发者 |
| **[04-Prompt Compiler Agent](04-prompt-compiler-agent/README.md)** | Compiler 固定 Prompt、模板系统、模板文件 | 开发者 |
| **[05-Orchestrator 调度器](05-orchestrator/README.md)** | 核心循环、容器生命周期、错误恢复 | 开发者、运维 |
| **[06-Agent 运行时](06-agent-runtime/README.md)** | Agent 类型注册表、安全架构、KMS | 开发者、安全 |
| **[07-画布 UI](07-ui-and-canvas/README.md)** | React Flow 集成、交互设计 | 前端开发者 |
| **[08-实施路线图](08-implementation-roadmap/README.md)** | Phase 1-4 分阶段实施计划 | 项目经理、决策者 |

## 架构一目了然

```
┌────────────────────────────────────────────────────────────┐
│  画布 (React Flow)        ← 用户拖拽配线                    │
└──────────────────┬─────────────────────────────────────────┘
                   │ WorkflowJSON
                   ▼
┌────────────────────────────────────────────────────────────┐
│  Prompt Compiler Agent  ← 专用Claude Code，用模板编译       │
│  (读取 WorkflowJSON + templates/*.yaml → 渲染 PromptTask)   │
└──────────────────┬─────────────────────────────────────────┘
                   │ PromptTask[]
                   ▼
┌────────────────────────────────────────────────────────────┐
│  Orchestrator 调度器  ← 按拓扑序派发 Docker 容器            │
│  (docker run claude --print "{完整提示词}")                  │
└──────────────────┬─────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────┐
   │Agent A │→│Agent B │→│Agent C │  ← Docker + Claude Code
   └────────┘ └────────┘ └────────┘
        │          │          │
        └──────────┼──────────┘
                   │ Envelope JSON
                   ▼
┌────────────────────────────────────────────────────────────┐
│  结果汇聚 → schema验证 → 画布状态更新 → 下一轮/完成        │
└────────────────────────────────────────────────────────────┘
```

## OSS 复用策略

| 分类 | 模块 | 方案 |
|------|------|------|
| 🟦 直接复用 | 画布 UI | npm install @xyflow/react (React Flow 37K⭐) |
| 🟦 直接复用 | Claude SDK | Anthropic 官方 SDK |
| 🟩 封装适配 | 内部 KMS | HashiCorp Vault + session token 层 |
| 🟩 封装适配 | 容器编排 | Docker SDK for Python |
| 🟩 封装适配 | Schema 校验 | jsonschema (Python) / Ajv (JS) |
| 🟩 封装适配 | 模板引擎 | Jinja2 / Go template |
| 🟥 自研核心 | 工作流编译引擎 | 核心差异化 |
| 🟥 自研核心 | Orchestrator 调度 | Agent 生命周期 + Envelope 协议 |
| 🟥 自研核心 | 模板系统 | 提示词模板体系 |
| 🟥 自研核心 | 源编排 L0 | AI 自动生成工作流草稿 |

## 许可证

Private — LuweiLiao
