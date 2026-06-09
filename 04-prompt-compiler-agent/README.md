# 04 — Prompt Compiler Agent

## 概述

**Prompt Compiler Agent** 是 AgentFlow 的核心编译引擎。它是一个固定 Prompt 的 Claude Code 实例，唯一的职责是：**接收 WorkflowJSON，输出 PromptTask[] JSON**。

Compiler Agent 将开发者定义的声明式工作流描述（节点、边、参数、上下文）编译为一组可被下游 Agent Executor 直接执行的具象化 PromptTask。

### 编译流程

```
WorkflowJSON
    │
    ▼
┌─────────────────────────────────────────────┐
│              Compiler Agent                  │
│                                               │
│  1. 解析 WorkflowJSON                         │
│  2. 拓扑排序 (Kahn 算法)                       │
│  3. 节点模板渲染                               │
│  4. 组装 PromptTask                            │
│  5. 验证输出                                   │
│  6. 输出 PromptTask[] JSON                     │
│                                               │
└─────────────────────────────────────────────┘
    │
    ▼
PromptTask[]  →  Agent Executor
```

### 核心能力

| 能力 | 说明 |
|------|------|
| **拓扑排序** | Kahn 算法确保节点按依赖顺序执行，检测循环依赖 |
| **模板渲染** | Jinja2 风格变量注入，支持 `global.goal`、`params.xxx`、`output_schema` 等 |
| **参数传递** | 上游输出 → 下游输入的自动管道 |
| **约束注入** | 全局约束条件自动注入每个 PromptTask |
| **超时 & 重试** | 为每个任务独立配置超时和重试策略 |
| **Schema 验证** | 输出格式自动验证 |

---

## 文件索引

| 文件 | 说明 |
|------|------|
| `README.md` | 本文件 — Compiler Agent 概览与文件索引 |
| `04.1-compiler-prompt.md` | Compiler Agent 的固定 System Prompt 全文 |
| `04.2-template-system.md` | 模板系统设计文档 |
| `04.3-templates/` | 模板示例目录 |
| `04.3-templates/algorithm-designer.yaml` | 算法设计工作流模板 |
| `04.3-templates/software-dev.yaml` | 软件开发工作流模板 |
| `04.3-templates/compile-test.yaml` | 编译-测试迭代工作流模板 |
