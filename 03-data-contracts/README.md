# 03 — 数据契约总览 (Data Contracts)

AgentFlow 定义了三份核心数据契约，它们共同构成了从工作流定义到 Prompt 执行再到结果传输的完整链路。

---

## 三份契约的关系

```
┌─────────────────────────────────────────────────────────────────┐
│                     WorkflowJSON                                │
│  (工作流定义 — 面向开发者 / YAML DSL)                            │
│                                                                 │
│  version     workflow_id    name    global_context              │
│  nodes[] ────── edges[] ───── metadata                         │
│  ┌─────────┐   ┌──────────┐   ┌────────────┐                  │
│  │ type     │   │ source   │   │ description │                 │
│  │ config   │   │ target   │   │ tags        │                 │
│  │ prompt   │   │ condition│   │ created_at  │                 │
│  │ input_   │   └──────────┘   │ author      │                 │
│  │ schema   │                  └────────────┘                  │
│  │ output_  │                                                 │
│  │ schema   │                  ▲                               │
│  │ timeout  │                  │ Compiler                      │
│  │ retry    │                  │ 编译 / 转换                   │
│  └─────────┘                  │                               │
└────────────────────────────────┼───────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PromptTask                                  │
│  (执行单元 — 面向执行引擎)                                      │
│                                                                 │
│  task_id     workflow_id     node_id     node_type              │
│  sequence    parallel_group  depends_on[]                       │
│  prompt (完整提示词 — 已编译)                                   │
│  output_schema   timeout_s   retry                              │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Compiler 做了什么：                                    │     │
│  │  1. 解析 WorkflowJSON nodes[] + edges[] 构建 DAG        │     │
│  │  2. 拓扑排序，分配 sequence / parallel_group / depends_on│     │
│  │  3. 拼接 global_context + node.prompt → 完整 prompt     │     │
│  │  4. 解析 $ref 引用，内联 input_schema / output_schema   │     │
│  │  5. 注入超时和重试策略                                 │     │
│  └────────────────────────────────────────────────────────┘     │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Envelope JSON                               │
│  (执行结果 — 面向传输 & 日志)                                   │
│                                                                 │
│  envelope {     source {          payload {                     │
│    message_id     agent_id          content_type                │
│    correlation_id task_id           schema_ref                  │
│    type                              data                       │
│    timestamp     }                  }                           │
│  }                                                             │
│  status (ok | error | timeout | partial)                       │
│  metrics { tokens_used, elapsed_ms, model }                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 各契约的职责

| 契约 | 文件 | 职责 | 使用者 |
|------|------|------|--------|
| **WorkflowJSON** | `03.1-workflow-json.md` | 人类可写的工作流 DSL，定义节点、边、上下文 | 开发者 / CI |
| **PromptTask** | `03.2-prompt-task.md` | 编译器产出的可执行单元，包含完整提示词 | 执行引擎 |
| **Envelope JSON** | `03.3-envelope-json.md` | 标准化的执行结果封装，用于传输和持久化 | Agent / Logging |

---

## 关键设计原则

1. **不可变性** — PromptTask 一旦编译，不再被 WorkflowJSON 的变更影响；重新编译生成新版本。
2. **可追溯性** — Envelope JSON 携带 `correlation_id` 和 `task_id`，可完整还原执行链路。
3. **Schema 引用** — WorkflowJSON 的 `input_schema` / `output_schema` 支持 `$ref` 引用外部 JSON Schema 文件；Compiler 在编译时内联解析。
4. **错误传播** — `on_success` / `on_failure` 在 WorkflowJSON 中定义，Compiler 转化为 PromptTask 的 `depends_on` 条件边。
