# 03 — 数据契约总览 (Data Contracts)

> **版本: v0.2** — 已与 `agentflow_schema.py` 实际实现对齐。

AgentFlow 定义了三份核心数据契约，它们共同构成了从工作流定义到 Prompt 执行再到结果传输的完整链路。

---

## 三份契约的关系

```
┌─────────────────────────────────────────────────────────────────┐
│                     WorkflowJSON                                │
│  (工作流定义 — 画布输出 → Compiler 输入)                        │
│                                                                 │
│  version     workflow_id    name    global_context              │
│  (goal / language / constraints)                                │
│  nodes[] ────── edges[] ───── metadata                         │
│  ┌──────────────────┐   ┌──────────┐   ┌────────────┐          │
│  │ id / icon / label│   │ source   │   │ (任意键值)  │          │
│  │ desc / color /   │   │ target   │   └────────────┘          │
│  │ profile / model  │   └──────────┘                           │
│  │ params / result  │         │                                │
│  │ output / status  │         │ Compiler                       │
│  │ cost / duration  │         │ 编译 / 转换                    │
│  │ turns / provider │         │                                │
│  └──────────────────┘         │                                │
└───────────────────────────────┼────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PromptTask                                  │
│  (执行单元 — 面向执行引擎 / Orchestrator)                       │
│                                                                 │
│  task_id     workflow_id     node_id     node_type (profile)    │
│  sequence    parallel_group(int)   depends_on[]                 │
│  prompt (完整字符串)   system_prompt                            │
│  tool_set [bash/read/write]                                     │
│  max_turns   timeout_s   retry (int)                            │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Compiler 做了什么：                                    │     │
│  │  1. 解析 WorkflowJSON nodes[] + edges[] 构建 DAG        │     │
│  │  2. 拓扑排序，分配 sequence / parallel_group / depends_on│     │
│  │  3. 拼接 global_context + node params → 完整 prompt     │     │
│  │  4. 注入 system_prompt、tool_set 等执行参数             │     │
│  └────────────────────────────────────────────────────────┘     │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Envelope JSON                               │
│  (执行结果 — 面向传输 & 日志)                                   │
│                                                                 │
│  task_id     node_id     status                                 │
│  summary     payload     errors[]                               │
│  timestamp                                                      │
│                                                                 │
│  metrics {                                                     │
│    cost / duration_ms / prompt_tokens / completion_tokens       │
│    turns / model / provider / files[]                           │
│  }                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 各契约的职责

| 契约 | 文件 | 职责 | 使用者 |
|------|------|------|--------|
| **WorkflowJSON** | `03.1-workflow-json.md` | 工作流 DSL，定义节点、边、上下文 | 画布 / Compiler |
| **PromptTask** | `03.2-prompt-task.md` | Compiler 产出的可执行单元，包含完整提示词与参数 | Orchestrator / Agent |
| **Envelope JSON** | `03.3-envelope-json.md` | 标准化的执行结果封装，用于传输和持久化 | Agent → Orchestrator |

---

## 关键设计原则

1. **不可变性** — PromptTask 一旦编译，不再被 WorkflowJSON 的变更影响；重新编译生成新版本。

2. **可追溯性** — Envelope JSON 携带 `task_id` 和 `node_id`，可完整还原执行链路。

3. **Profile 驱动** — 每个节点使用 1 个 Profile（`analysis` / `design` / `dev` / `test` / `doc` / `deploy`），Profile 决定 Agent 的 System Prompt 和工具集。

4. **扁平化设计** — 所有契约使用扁平字段（而非复杂嵌套），降低序列化和校验复杂度。

---

## 已实现 vs 设计意向

| 概念 | 状态 | 说明 |
|------|------|------|
| WorkflowJSON 基础结构 | ✅ 已实现 | version / workflow_id / name / global_context / nodes / edges / metadata |
| NodeDef: id / icon / label / desc / color / profile / model / params | ✅ 已实现 | 画布节点核心字段 |
| NodeDef: result / output / status / cost / duration / turns / provider | ✅ 已实现 | 执行回填字段 |
| EdgeDef: source / target | ✅ 已实现 | 简洁的 DAG 边 |
| EdgeDef: data_mapping / condition | ⏳ 设计意向 | 未来扩展 - 条件边和数据映射 |
| PromptTask 基础结构 | ✅ 已实现 | task_id / workflow_id / node_id / node_type / sequence / depends_on |
| PromptTask: system_prompt / tool_set / max_turns | ✅ 已实现 | Agent 执行参数 |
| PromptTask: output_schema | ⏳ 设计意向 | 未来版本支持结构化输出校验 |
| PromptTask: retry 对象 (backoff / max_attempts) | ⏳ 设计意向 | 当前 retry 仅 int 表示重试次数 |
| EnvelopeJSON 基础结构 | ✅ 已实现 | task_id / node_id / status / summary / payload / metrics / errors / timestamp |
| EnvelopeJSON: envelope 消息封装 | ⏳ 设计意向 | 当前为扁平结构，无独立 envelope/source 包装 |
| EnvelopeJSON: metrics 详细指标 | ✅ 已实现 | cost / duration_ms / prompt_tokens / completion_tokens / turns / model / provider / files |
