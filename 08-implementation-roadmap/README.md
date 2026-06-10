# 08 — 实施路线图 (Implementation Roadmap)

> 版本：v0.2 · 日期：2026-06-10
> 从方案定稿到生态开放的端到端实施计划，共 4 个 Phase。以下为实际实现状态。

---

## 路线图总览

```
Phase 1 (Week 1-2)        Phase 2 (Week 3-8)         Phase 3 (Week 9-12)       Phase 4 (Week 13-16)
┌─────────────────┐      ┌──────────────────────┐    ┌─────────────────────┐    ┌────────────────────┐
│  方案定稿        │ ──▶  │  MVP 实现            │ ──▶ │  生产增强            │ ──▶ │  生态开放           │
│                 │      │                      │    │                     │    │                    │
│ ▢ 数据契约冻结   │      │ ✅ Compiler Agent    │    │ ▢ KMS 集成          │    │ ▢ SDK              │
│ ▢ 画布 UI 设计   │      │ ✅ 6个 Profile 模板   │    │ ▢ 模板管理 UI       │    │ ▢ 节点市场          │
│ ▢ Spec 文档      │      │ ✅ Orchestrator 核心  │    │ ▢ 并行执行          │    │ ▢ RBAC / 多用户    │
│ ▢ 技术选型确认   │      │ ✅ CSS Grid 画布     │    │ ▢ 闭环反馈          │    │ ▢ Docker Compose   │
│                 │      │ ✅ 端到端跑通          │    │ ▢ 执行历史          │    │ ▢ 源编排 L0        │
└─────────────────┘      └──────────────────────┘    └─────────────────────┘    └────────────────────┘
    2 周                      6 周                      4 周                      4 周
```

---

## 分阶段规划表

| 阶段 | 时间 | 核心目标 | 关键交付物 | 状态 |
|---|---|---|---|---|
| **Phase 1** 方案定稿 | Week 1-2 | 冻结数据契约，完成 UI 交互设计 | Spec 文档、Figma 原型、数据契约 | ⏳ 计划阶段 |
| **Phase 2** MVP 实现 | Week 3-8 | 端到端跑通最小闭环 | Compiler Agent、6 Profile 模板、Orchestrator、CSS Grid 画布 | ✅ **实际已实现** |
| **Phase 3** 生产增强 | Week 9-12 | 提升可用性、可靠性与安全性 | KMS 集成、并行执行、执行历史、模板管理 | ⏳ 计划阶段 |
| **Phase 4** 生态开放 | Week 13-16 | 开放生态，降低接入门槛 | SDK、节点市场、RBAC、Docker 部署、源编排 | ⏳ 计划阶段 |

---

## 里程碑与检查点

| 里程碑 | 时间 | 验收标准 | 状态 |
|---|---|---|---|
| M1: 方案评审通过 | Week 2 末 | Spec 全部签字确认 | ⏳ |
| M2: MVP 演示 | Week 8 末 | 端到端跑通一个真实场景 | ✅ **实际通过** |
| M3: 内测版本 | Week 12 末 | 内部团队可用，无 P0 Bug | ⏳ |
| M4: 公测版本 | Week 16 末 | 外部用户可注册使用 | ⏳ |

---

## 依赖关系

```
Phase 1 ──▶ Phase 2 ──▶ Phase 3 ──▶ Phase 4
   │            │            │
   ├▶ 数据契约   └▶ Compiler  └▶ KMS 集成
   │               │            │
   └▶ UI 设计      ├▶ 6个模板    └▶ 模板管理 UI
                   │
                   ├▶ Orchestrator (AgentRunner)
                   │
                   └▶ CSS Grid 画布
```

**关键路径：** 数据契约 → Compiler Agent → Orchestrator → 端到端跑通 → 生产增强

---

## 实际实现 vs 计划对照

| 原有计划 | 实际实现 | 差异说明 |
|---|---|---|
| 3 个基础模板 (Input/LLM Call/Output) | **6 个 Profile 模板** (analysis/design/dev/test/doc/deploy) | 扩展为更细粒度的 Agent 类型 |
| React Flow 画布 | **原生 CSS Grid** 画布 (`canvas-demo.html` v6) | 轻量替代，无 React 依赖 |
| WebSocket 状态推送 | REST API + 前端模拟 | 简化 MVP |
| 节点拖拽 | **硬编码 palette**（6 Profile） | 无 drag-and-drop |
| 连线功能 | **箭头图标** → | 无 Port-to-Port 连线 |
| Docker + Claude Code 执行 | **AgentRunner** (Multi-Provider) | Python 后端直接调用 LLM |

---

## 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|---|---|---|---|
| 数据契约反复修改 | 中 | 高 — 导致各模块重新实现 | Phase 1 充分评审，增加 freeze 机制 |
| Compiler Agent 复杂度超预期 | 中 | 中 — MVP 延迟 | Phase 2 先做最小子集，后续迭代 |
| CSS Grid 画布性能 | 低 | 中 — 大画布卡顿 | 使用虚拟化 + 节点懒加载 |
| Orchestrator 状态一致性 | 中 | 高 — 执行结果不可靠 | 引入事件溯源 + 幂等执行 |
| 团队人手不足 | 高 | 中 — 进度落后 | 优先保证关键路径，裁剪非核心功能 |

---

## 各阶段详细计划

| 阶段 | 详情 | 状态 |
|---|---|---|
| [Phase 1 — 方案定稿](08.1-phase-1.md) | 数据契约冻结、画布 UI 交互设计、Spec 文档 | ⏳ 计划 |
| [Phase 2 — MVP 实现](08.2-phase-2.md) | Compiler Agent、**6 个 Profile 模板**、Orchestrator 核心、**CSS Grid 画布**、端到端跑通 | 🟢 **已实现（含状态标注）** |
| [Phase 3 — 生产增强](08.3-phase-3.md) | KMS 集成、模板管理 UI、并行执行、闭环反馈、执行历史 | ⏳ 计划 |
| [Phase 4 — 生态开放](08.4-phase-4.md) | SDK、节点市场、多用户/RBAC、Docker Compose、源编排 L0 | ⏳ 计划 |
