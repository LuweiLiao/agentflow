# 04 — Prompt Compiler Agent

## 概述

**Prompt Compiler** 是 AgentFlow 的核心编译引擎（`prompt_compiler.py`）。它的职责是：**接收 WorkflowJSON，输出 PromptTask[]**。

Compiler 将画布定义的声明式工作流（节点+边+参数）编译为一组可被 `AgentRunner` 直接执行的 `PromptTask`。每个 `PromptTask` 包含完整的自然语言提示词、system prompt、工具集、超时和重试配置。

### 编译流程

```
WorkflowJSON (nodes[] + edges[] + requirement)
    │
    ▼
┌─────────────────────────────────────────────┐
│              PromptCompiler                   │
│                                               │
│  1. 解析 WorkflowJSON                         │
│  2. 拓扑排序 (Kahn 算法 → parallel_groups)     │
│  3. 对每个节点加载 YAML 模板                   │
│  4. 模板变量渲染 ({global.goal}, {params.*})   │
│  5. 构建 upstream_context (上游结果汇聚)       │
│  6. 组装 PromptTask[]                         │
│                                               │
└─────────────────────────────────────────────┘
    │
    ▼
PromptTask[]  →  Orchestrator (AgentRunner)
```

### 核心组件

| 组件 | 文件 | 说明 |
|------|------|------|
| **PromptCompiler** | `prompt_compiler.py` | 编译入口：拓扑排序 → 模板加载 → 渲染 → 组装 |
| **TemplateEngine** | `prompt_compiler.py` | YAML 模板加载和变量渲染引擎 |
| **代理 schema** | `agentflow_schema.py` | `WorkflowJSON`、`PromptTask`、`topological_sort`、`parallel_groups` |
| **AgentRunner** | `agent_runner.py` | 下游执行器，消费 PromptTask |

### 模板系统

6 个 YAML 模板文件位于 `04.3-templates/`：

| 模板 | 角色 | 用途 |
|------|------|------|
| `analysis.yaml` | 🔍 分析型 | 需求分析、数据调研、问题定义 |
| `design.yaml` | 🎨 设计型 | 方案设计、架构设计、算法设计 |
| `dev.yaml` | 💻 开发型 | 编码实现、前后端开发、模型训练 |
| `test.yaml` | 🧪 测试型 | 测试验证、仿真测试、集成测试 |
| `doc.yaml` | 📝 文档型 | 输出报告、文档生成、总结汇报 |
| `deploy.yaml` | 🚀 部署型 | 部署上线、发布运维 |

### 数据契约

```
画布 ──→ WorkflowJSON ──→ PromptCompiler ──→ PromptTask[] ──→ AgentRunner
```

三段数据契约：

1. **WorkflowJSON** — `nodes[]` + `edges[]` + `global_context`
2. **PromptTask** — `task_id` + `prompt` + `system_prompt` + `tool_set` + `max_turns` + `timeout_s`
3. **EnvelopeJSON** — Agent 执行结果封装（统一格式回调）

### 核心能力

| 能力 | 说明 |
|------|------|
| **拓扑排序** | Kahn 算法确保节点按依赖顺序执行，检测循环依赖 |
| **并行分组** | `parallel_groups()` 按拓扑深度分组，同组无依赖可并行 |
| **模板渲染** | 正则变量替换，支持 `{global.goal}`、`{node.label}`、`{params.*}` 等 |
| **上游上下文** | 自动从 DAG 边构建 `upstream_context`（汇聚依赖节点的输出） |
| **模板缓存** | `TemplateEngine._cache` 避免重复加载 YAML 文件 |
| **降级回退** | 模板不存在时自动回退到 `dev.yaml` |

---

## 文件索引

| 文件 | 说明 |
|------|------|
| `README.md` | 本文件 — Compiler 概览与文件索引 |
| `04.1-compiler-prompt.md` | Compiler 编译流程详解（拓扑排序、模板渲染、PromptTask 组装） |
| `04.2-template-system.md` | YAML 模板系统设计文档（模板结构、变量映射、设计原则） |
| `04.3-templates/` | 6 个 YAML 模板文件 |
| `04.3-templates/analysis.yaml` | 分析型 Agent 模板 |
| `04.3-templates/design.yaml` | 设计型 Agent 模板 |
| `04.3-templates/dev.yaml` | 开发型 Agent 模板 |
| `04.3-templates/test.yaml` | 测试型 Agent 模板 |
| `04.3-templates/doc.yaml` | 文档型 Agent 模板 |
| `04.3-templates/deploy.yaml` | 部署型 Agent 模板 |
