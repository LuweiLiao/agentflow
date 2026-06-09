# 05 — Orchestrator 调度器

## 概述

Orchestrator 是 AgentFlow 的核心调度引擎，负责将经过编译器（04-compiler）翻译后的 `PromptTask[]` 按依赖拓扑编排执行，驱动 Docker 容器的全生命周期，并处理执行过程中的各类异常与恢复。

Orchestrator 采用 **有向无环图（DAG）遍历 + 容器运行时隔离** 的架构设计，核心设计目标：

| 目标 | 说明 |
|------|------|
| **拓扑保序** | 严格按 sequence 依赖关系决定执行顺序，不出现乱序 |
| **并行最大化** | `parallel_group` 相同的节点自动并发执行，充分利用资源 |
| **运行时安全** | 每个 PromptTask 运行在独立的 Docker 容器中，环境隔离 |
| **实时反馈** | 通过 stdout 解析 Envelope JSON 流，支持画布实时同步 |
| **鲁棒恢复** | WAL 日志 + 断点续传 + 可配置重试策略，保障长时间工作流不丢进度 |

## 核心概念

```
PromptTask[]  ──→  DAG 拓扑排序  ──→  并行/串行执行  ──→  Docker 容器
                        │                                                │
                        └── sequence + parallel_group                     │
                             决定执行顺序                                  │
                                                                         ▼
                                                                   结果校验
                                                                   (schema)
                                                                      │
                                                              ┌───────┴───────┐
                                                              │               │
                                                            成功             失败
                                                              │               │
                                                        保存结果       重试 / 回滚
```

## 文件索引

| 文件 | 内容 |
|------|------|
| [05.1-core-loop.md](./05.1-core-loop.md) | Orchestrator 核心循环——从接收 PromptTask 到结果同步的完整 8 步流程 |
| [05.2-container-lifecycle.md](./05.2-container-lifecycle.md) | Docker 容器生命周期管理——镜像构建、运行参数、卷挂载、资源限制 |
| [05.3-error-recovery.md](./05.3-error-recovery.md) | 错误恢复机制——超时、重试、回滚、WAL 预写日志、断点续传 |

## 数据流概要

```
Compiled PromptTask[]
        │
        ▼
┌─────────────────────────────────────────────┐
│  Orchestrator Core Loop                      │
│                                              │
│  ① 接收 PromptTask[] 并按拓扑排序            │
│  ② 按 parallel_group 分组并行执行             │
│  ③ 为每个 Task 启动 Docker 容器               │
│  ④ 运行时变量替换（upstream_output → data）   │
│  ⑤ 监听 stdout，解析 Envelope JSON            │
│  ⑥ output_schema 校验                        │
│  ⑦ 成功保存 / 失败重试                       │
│  ⑧ 反馈触发上游重编译（可选）                 │
└─────────────────────────────────────────────┘
        │
        ▼
    Result[]  ──→  画布同步 / 下游消费
```
