# 05 — Orchestrator 调度器

## 概述

Orchestrator 是 AgentFlow 的核心调度引擎（`agentflow-backend.py` 的 `handle_execute()` 方法）。它负责：

1. 接收前端传来的 `nodes[]` + `edges[]`
2. 构建 `WorkflowJSON` 并校验
3. 调用 `PromptCompiler` 编译为 `PromptTask[]`
4. 使用 Kahn 拓扑排序进行 DAG 并行分组
5. 通过 `ThreadPoolExecutor` 同组并行执行
6. 驱动 `AgentRunner` 执行每个节点（Think→Act→Observe 循环）
7. 汇聚结果并返回

**无 Docker！无容器！** 所有 Agent 节点直接在进程中由 `AgentRunner` 执行。

### DAG 并行执行流程

```
前端请求 (nodes[] + edges[] + requirement)
    │
    ▼
┌─────────────────────────────────────────────┐
│         Orchestrator (handle_execute)         │
│                                               │
│  ① 构建 WorkflowJSON + 校验                   │
│  ② PromptCompiler.compile() → PromptTask[]    │
│  ③ Kahn 拓扑排序 → parallel_groups 分组       │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │  ④ ThreadPoolExecutor 逐组并行执行       │  │
│  │                                          │  │
│  │  Group 0: [analysis]                     │  │
│  │  Group 1: [dev, test]    ← ThreadPool    │  │
│  │  Group 2: [doc]                         │  │
│  │                                          │  │
│  │  每个节点: AgentRunner.execute()          │  │
│  │    Think → Act (bash/read/write) → Observe│  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ⑤ 结果汇聚 → node.to_dict() → 返回前端      │
│                                               │
└─────────────────────────────────────────────┘
    │
    ▼
JSON Response ({nodes, total_cost, total_duration})
```

### 核心设计目标

| 目标 | 说明 |
|------|------|
| **拓扑保序** | 严格按 DAG 依赖关系决定执行顺序，不出现乱序 |
| **并行最大化** | 同深度（parallel_groups）的节点自动并发执行 |
| **无容器化** | 所有 Agent 在进程中直接调度，无 Docker 开销 |
| **实时反馈** | 每个节点完成后更新状态，支持画布同步 |
| **错误隔离** | 单个节点失败不影响同组其他节点 |

### 技术栈

| 组件 | 说明 |
|------|------|
| `http.server` | Python 内置 HTTP 服务器 |
| `ThreadPoolExecutor` | 同组节点并行执行 |
| `PromptCompiler` | WorkflowJSON → PromptTask[] |
| `AgentRunner` | 节点执行引擎 |
| `topological_sort` | Kahn 算法拓扑排序 |
| `parallel_groups` | 按深度分组（同层可并行） |

---

## 文件索引

| 文件 | 内容 |
|------|------|
| [05.1-core-loop.md](./05.1-core-loop.md) | Orchestrator 核心循环——DAG 并行执行引擎，从请求到结果的全流程 |
| [05.2-error-handling.md](./05.2-error-handling.md) | 错误处理与重试策略——超时控制、节点级错误隔离、降级机制 |
| [05.3-degradation-control.md](./05.3-degradation-control.md) | 降级机制与超时控制——模板回退、变量降级、资源管理 |

## 数据流概要

```
前端                  Orchestrator                   AgentRunner
 │                        │                              │
 │  POST /api/execute     │                              │
 │  {nodes, edges, req}   │                              │
 │───────────────────────►│                              │
 │                        │  WorkflowJSON + 校验          │
 │                        │  PromptCompiler.compile()     │
 │                        │  parallel_groups()            │
 │                        │                              │
 │                        │  ┌─ Group 0 ──┐              │
 │                        │  │ analysis   │─► AgentRunner │
 │                        │  └────────────┘              │
 │                        │       │                      │
 │                        │  ┌─ Group 1 ──────┐          │
 │                        │  │ dev     │─► AR  │          │
 │                        │  │ test    │─► AR  │          │
 │                        │  └────────────────┘          │
 │                        │       │                      │
 │                        │  ┌─ Group 2 ──┐              │
 │                        │  │ doc       │─► AgentRunner │
 │                        │  └────────────┘              │
 │                        │                              │
 │  JSON Response         │                              │
 │◄──────────────────────│                              │
 │  {nodes: [...],       │                              │
 │   total_cost,          │                              │
 │   total_duration}      │                              │
```
