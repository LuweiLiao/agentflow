# Claude Code Engine 嵌入 AgentFlow 架构方案

## 现状

AgentFlow 已能通过 DeepSeek API 成功编排复杂任务：
- run_a34ede4da69a: 7节点 DAG，全自动生成 PyQt 串口助手，152测试通过
- 但 Agent 间无直接对话，提示词固定，缺少"有机整体"的自进化能力

## 目标

将 Claude Code 引擎源码嵌入 AgentFlow，实现：
1. **CC 级智能体**：每个 Agent 节点由 Claude Code 引擎驱动（而非简单 LLM API）
2. **Agent 间对话**：Agent 通过结构化消息协议沟通，形成"同事关系"
3. **互相调优提示词**：Agent 可读取/修改其他 Agent 的系统提示词，形成自进化闭环

## 架构设计

```
┌────────────────────────────────────────────────────────────┐
│                    AgentFlow Backend                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Workflow Scheduler (现有)                   │   │
│  │  Node A → Node B → Node C → Test → Review → Doc     │   │
│  └──────────┬───────────────────────────┬──────────────┘   │
│             │                           │                    │
│  ┌──────────▼──────────┐   ┌───────────▼──────────────────┐ │
│  │ AgentRunner (现有)    │   │ CC AgentRunner (新增)        │ │
│  │ (LLM API calls)      │   │ (CC Engine子进程)             │ │
│  └──────────────────────┘   └───────────┬──────────────────┘ │
│                                    │                          │
│  ┌─────────────────────────────────▼──────────────────────┐  │
│  │          CC Engine Adapter (claude_code_adapter.py)    │  │
│  │   Spawns: bun run cli.tsx -p --output-format=json     │  │
│  │   Stdin:  workflow prompt + context + message_queue   │  │
│  │   Stdout: JSON results + agent_messages               │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │          Agent Message Bus (新建)                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Agent A  │←→│ Agent B  │←→│ Agent C  │           │  │
│  │  │ (CC proc)│  │ (CC proc)│  │ (CC proc)│           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └────────────────────────────────────────────────────────┘
└────────────────────────────────────────────────────────────┘
```

## 分层设计

### Layer 1: CC Engine Adapter (`claude_code_adapter.py`)
- 封装 `bun run src/entrypoints/cli.tsx -p --output-format=json` 调用
- 支持：输入 prompt + context → 输出 JSON result
- 超时控制、重试、错误处理
- Session 管理（单次对话 vs 持久化 session）

### Layer 2: Claude Code Agent Runner (`cc_agent_runner.py`)
- 继承/包装现有 AgentRunner 接口
- 自动注入 workspace context、tool constraints
- 流式输出管道（stdout → AgentFlow event bus）

### Layer 3: Agent Message Bus (`agent_message_bus.py`)
- Agent 间消息格式：
  ```json
  {
    "protocol": "agentflow/v1",
    "from": "agent-n3-core-dev",
    "to": "agent-n4-gui-dev",
    "type": "artifact_handoff",
    "payload": {
      "message": "Core API 已实现，接口文档见 workspace/api.md",
      "artifacts": ["/workspace/api.md", "/workspace/core.py"],
      "suggestions": [
        {"target": "system_prompt", "agent": "n3", "suggestion": "添加 PyQt6 依赖说明"}
      ]
    }
  }
  ```
- 消息类型：
  - `artifact_handoff` — 产出物交接
  - `review_request` — 请求审查
  - `review_feedback` — 审查反馈
  - `prompt_suggestion` — 提示词调优建议
  - `coordination` — 协调指令（wait/proceed/rerun）
- 持久化：消息写入 SQLite（agent_message_store 表）
- Agent 间消息通过 `--append-system-prompt` 注入到 CC prompt 上下文

### Layer 4: Prompt Optimizer (`prompt_optimizer.py`)
- 工作流完成后，收集所有 Agent 的执行记录
- 分析：测试失败 → 根因 → 对应的 prompt 缺陷
- 生成优化建议：修改 system_prompt 的特定段落
- 版本化存储：每个 agent 的 prompt 历史
- 下次工作流自动使用优化后的 prompt

## 数据流（以 PyQt 串口助手为例）

```
Step 1: n1_spec → CC Engine (write spec)
  ↓ 产出物 spec.md
  ↓ 消息: artifact_handoff → n2

Step 2: n2_arch → CC Engine (read spec.md → design architecture)
  ↓ 产出物 arch.md
  ↓ 消息: artifact_handoff → n3

Step 3: n3_core_dev → CC Engine (read arch → write core.py)
  ↓ 产出物 core.py + api.md
  ↓ 消息: artifact_handoff + review_request → n4

Step 4: n4_gui_dev → CC Engine (read api.md → write app.py)
  ↓ 产出物 app.py
  ↓ 消息: review_feedback → n3 (如果发现 bug)
  ↓ 触发 re-entry: n3 修 bug

Step 5: n5_tests → CC Engine (read code → write tests)
  ↓ 消息: prompt_suggestion → optimizer

Step 6-7: review + doc 同上

Step 8: Prompt Optimizer 分析全过程
  ↓ 更新 n3_core_dev 的 prompt_template 加入 PyQt 约束
  ↓ 下次 run 自动生效
```

## 实现计划

### Phase 1 (当前): CC Adapter + 验证
- [x] 下载 CC 源码 (claude-code-engine/)
- [x] 验证构建 (bun install + bun run build)
- [x] 验证 pipe mode (bun run cli.tsx -p)
- [ ] 实现 claude_code_adapter.py
- [ ] 实现 cc_agent_runner.py
- [ ] 提交单 CC Agent 工作流

### Phase 2: 多 Agent 对话
- [ ] 实现 agent_message_bus.py
- [ ] 实现 message routing
- [ ] 实现 artifact_handoff 协议
- [ ] 提交多 Agent 工作流

### Phase 3: 提示词互调优
- [ ] 实现 prompt_optimizer.py
- [ ] 实现 prompt versioning
- [ ] 自动注入优化后 prompt
- [ ] 闭环验证：CC 工作流质量提升
