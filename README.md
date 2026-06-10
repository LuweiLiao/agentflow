# AgentFlow

**AI Agent Orchestration Platform — 多 Agent 编排平台**

---

AgentFlow 是一个将可视化工作流编排与 AI Agent 自动执行结合的平台。用户输入一句话需求，系统自动通过 GLM-5-Turbo 源编排 Agent 拆解为多个子任务，构建 DAG 依赖关系，编译为 Agent 可执行的提示词，由自研的 DAG 并行执行引擎（AgentRunner + ThreadPool）驱动执行，形成完整的"需求→编排→编译→并行执行→结果汇聚"闭环。

## 核心理念

```
用户说需求 → AI 自动拆解 → 用户确认 → DAG 并行执行 → 结果反馈
```

每个画布节点 → 由 Prompt Compiler 编译为完整自然语言提示词 → AgentRunner 调用 12+ 个 OpenAI 兼容 LLM API 执行 → 结果通过 Envelope 协议汇聚。

## 快速导航

| 章节 | 内容 | 适合谁 |
|------|------|--------|
| **[01-愿景与设计理念](01-vision-and-philosophy/README.md)** | 为什么做 AgentFlow？核心哲学是什么？ | 所有人 |
| **[02-系统架构](02-system-architecture/README.md)** | 整体架构、6 阶段转换链路、6+1 层级 | 架构师、开发者 |
| **[03-数据契约](03-data-contracts/README.md)** | WorkflowJSON / PromptTask / Envelope JSON 完整定义 | 开发者 |
| **[04-Prompt Compiler Agent](04-prompt-compiler-agent/README.md)** | Compiler 固定 Prompt、模板系统、模板文件 | 开发者 |
| **[05-Orchestrator 调度器](05-orchestrator/README.md)** | DAG 调度、并行执行、错误恢复 | 开发者、运维 |
| **[06-Agent 运行时](06-agent-runtime/README.md)** | Agent 类型注册表、安全架构、KMS | 开发者、安全 |
| **[07-画布 UI](07-ui-and-canvas/README.md)** | CSS Grid HTML 画布集成、交互设计 | 前端开发者 |
| **[08-实施路线图](08-implementation-roadmap/README.md)** | Phase 1-4 分阶段实施计划 | 项目经理、决策者 |

## 架构一目了然

```
用户一句话需求
       │
       ▼
┌────────────────────────────────────────────────────────────┐
│  Stage 0: 源编排 (GLM-5-Turbo 自动拆解 → 节点 + DAG)      │
└──────────────────┬─────────────────────────────────────────┘
                   │ 节点列表 + DAG 边
                   ▼
┌────────────────────────────────────────────────────────────┐
│  Stage 1: 画布确认 (CSS Grid HTML 可视化展示)              │
└──────────────────┬─────────────────────────────────────────┘
                   │ WorkflowJSON
                   ▼
┌────────────────────────────────────────────────────────────┐
│  Stage 2: Prompt Compiler (YAML模板 → 自然语言提示词)       │
│  (拓扑排序 + 模板渲染 + 变量注入 + 上游上下文)              │
└──────────────────┬─────────────────────────────────────────┘
                   │ PromptTask[]
                   ▼
┌────────────────────────────────────────────────────────────┐
│  Stage 3: DAG 并行执行 (AgentRunner + ThreadPool)           │
│  按拓扑深度分组 → 同组并行 → AgentRunner调用LLM API       │
└──────────────────┬─────────────────────────────────────────┘
                   │ Envelope JSON[]
                   ▼
┌────────────────────────────────────────────────────────────┐
│  Stage 4: 结果汇聚 → 验证 → 画布状态更新                   │
└────────────────────────────────────────────────────────────┘
```

## OSS 复用策略

| 分类 | 模块 | 方案 |
|------|------|------|
| 🟥 自研核心 | 源编排 L0 | GLM-5-Turbo 自动拆解 + 本地模板降级 |
| 🟥 自研核心 | Prompt Compiler | YAML 模板引擎 + Kahn 拓扑排序 |
| 🟥 自研核心 | AgentRunner | 通用 Agent 执行器，12+ LLM 供应商 |
| 🟥 自研核心 | DAG 并行执行引擎 | ThreadPoolExecutor 分层并行 |
| 🟥 自研核心 | 画布 UI | CSS Grid HTML 纯前端，零外部依赖 |
| 🟥 自研核心 | 结果汇聚引擎 | Envelope 协议 + 指标统计 |
| 🟥 自研核心 | 数据契约 | @dataclass 序列化/反序列化 |
| 🔗 集成 | GLM-5-Turbo API | 源编排专用 LLM 服务 |
| 🔗 集成 | 12+ LLM Provider API | Agent 执行层的多供应商支持 |

## 许可证

Private — LuweiLiao
