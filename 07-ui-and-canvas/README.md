# 07 — 画布 UI (Canvas UI)

> 版本：v0.2 · 日期：2026-06-10

## 概述

画布 UI 是 AgentFlow 面向用户的**核心交互界面**，负责工作流的可视化编排。当前实现为一个**自包含的单页 HTML 应用**（`canvas-demo.html` v6），不依赖 React 或 React Flow，使用**原生 CSS Grid** 实现横平竖直的节点布局。

---

## 架构总览

```
┌──────────────────────────────────────────────────────────┐
│  TopBar: Logo | Breadcrumb | 状态指示                    │
├────────┬──────────────────────────────┬──────────────────┤
│ Sidebar │        Canvas               │  Panel           │
│ 190px   │        (flex:1)             │  310px           │
│         │   ┌──────────────────────┐  │                  │
│ Node    │   │  CSS Grid 布局        │  │  节点配置 /      │
│ Palette │   │  step │ agent │→│out  │  │  执行日志 /      │
│ 6个     │   │  ───────────────────  │  │  结果详情        │
│ Profile │   │  00  │ card  │→│card  │  │                  │
│ 硬编码  │   │  01  │ card  │→│card  │  │                  │
│         │   │  ...  │       │  │     │  │                  │
│         │   └──────────────────────┘  │                  │
└────────┴──────────────────────────────┴──────────────────┘
```

## 技术实现

### CSS Grid 画布布局

画布核心使用 CSS Grid，实现**横平竖直**、**纵列垂直中心对齐**的布局：

```css
.canvas-grid-inner {
  display: grid;
  grid-template-columns: 30px 220px 32px 200px;
  /*                     step   agent  gap   output          */
  grid-auto-rows: 76px;
  align-items: center;
  justify-items: center;
  gap: 4px 0;
}
```

| 列 | 宽度 | 内容 | 说明 |
|---|---|---|---|
| step-number | 30px | `01`, `02`... | 步骤编号，右对齐 |
| agent-card | 220px | Agent 卡片 | 图标 + 名称 + Profile + 状态徽章 |
| gap/arrow | 32px | `→` | 水平箭头表示数据流方向 |
| output-card | 200px | 输出卡片 | 显示 Agent 执行结果 |

### 暗色主题 CSS 变量

```css
:root {
  --bg: #0f1117; --surface: #1a1d2e; --surface2: #232742;
  --border: #2a2e42; --text: #e2e8f0; --text2: #94a3b8; --text3: #64748b;
  --accent: #3b82f6; --accent2: #7c3aed; --green: #10b981;
  --font: 'Inter', ...; --mono: 'JetBrains Mono', ...;
  --card-w: 220px; --output-w: 200px; --gap: 32px;
  --row-h: 76px; --step-w: 30px;
}
```

### 三层面板布局

| 面板 | 宽度 | 内容 |
|---|---|---|
| **左侧边栏** (sidebar) | 190px | 节点类型 Palette（6 个硬编码 Profile） |
| **中间画布** (canvas-wrap) | flex:1 | CSS Grid 渲染 + 状态动画 |
| **右侧面板** (panel) | 310px | 节点配置 / 执行日志 / 结果弹窗 |

---

## 4 步交互流程

### Step 0: 友好页 (欢迎界面)

- 需求文本输入框（带 4 个快捷 hint）
- Agent 数量调节器（± 按钮，范围 1~100）
- AI 自动生成工作流按钮 → 调用 GLM-5-Turbo API（`/api/decompose`）

### Step 1: 生成器 (编排中)

- 进度条动画（0% → 100%）
- GLM 编排日志（模拟 9 步流程）
- 支持跳过 / API 调用失败时降级到本地模板

### Step 2: 画布 (工作流展示)

- CSS Grid 渲染 Agent 卡片 + 输出卡片
- 底部画布工具栏：Agent 数量调节 + 运行按钮
- 点击节点 → 右侧面板显示节点配置详情

### Step 3: 执行 (Agent 运行)

- 实时执行日志面板
- 节点状态动画：灰色 → 蓝色(executing) → 绿色(done)
- 输出卡片渐变显示
- 完成弹窗：显示 cost / duration / turns / model 信息

---

## 关键功能

### Agent Profile 系统（6 种硬编码类型）

| Profile | 图标 | 颜色 | 说明 |
|---|---|---|---|
| analysis | 🧮 | blue | 分析型 |
| design | 📐 | purple | 设计型 |
| dev | 💻 | green | 开发型 |
| test | 🧪 | purple | 测试型 |
| doc | 📝 | orange | 文档型 |
| deploy | 🌐 | green | 部署型 |

### 全局状态变量

```javascript
let step = 0, genTimer = null, execTimer = null;
let currentNodes = [];
let workflowEdges = [];       // DAG 依赖关系
const AGENT_PROFILES = { ... };
const WORKFLOW_TEMPLATES = { 'pid', '网站', '机器学习', '自动驾驶' };
```

### API 接口

| 接口 | 方法 | 功能 | 超时 |
|---|---|---|---|
| `/api/decompose` | POST | 编排 Agent 拆解需求 → 生成节点列表 | — |
| `/api/execute` | POST | AgentRunner 执行引擎 → 真实 LLM 调用 | 5min (AbortController) |

### 错误处理与降级

- API 调用失败 → 自动降级到本地模板
- ABORT 控制器超时（5 分钟）
- 执行失败 → fallbackExecution 模拟降级

---

## 与原始设计（React Flow）的差异

| 维度 | 原始设计 (Spec) | 实际实现 (v6) |
|---|---|---|
| 画布框架 | React Flow (xyflow) | 原生 CSS Grid |
| 节点拖拽 | 侧边栏拖入画布 | 硬编码 palette，无拖拽 |
| 连线功能 | Port-to-Port 拖线 + 类型检查 | 箭头图标 `→`，无实际连线 |
| 工作流验证 | 循环检测 + 类型匹配 | 无 |
| 导出 WfJSON | Ctrl+S / 右键导出 | 后端序列化 |
| 自动布局 | dagre 自动布局 | CSS Grid 固定行列 |
| 撤销/重做 | 快照栈（50 步） | 无 |
| 状态推送 | WebSocket | REST + 前端模拟 |
| 执行引擎 | Docker + Claude Code | AgentRunner (Multi-Provider) |

---

## 本地模板系统（降级用）

4 个内置工作流模板，支持动态调整节点数量：

```javascript
const WORKFLOW_TEMPLATES = {
  'pid':        { name:'PID控制器设计',   nodes:6 },
  '网站':       { name:'企业官网',         nodes:7 },
  '机器学习':   { name:'ML训练流水线',    nodes:7 },
  '自动驾驶':   { name:'感知模块',         nodes:8 },
};
```

`adjustTemplateToCount()` 函数支持在 2~20 范围内动态增删节点。

---

## 未来计划

- [ ] 迁移到 React + React Flow 实现完整拖拽/连线
- [ ] 添加 WebSocket 实时状态推送
- [ ] 工作流验证（循环检测 + Schema 类型匹配）
- [ ] WorkflowJSON 前端导出
- [ ] 撤消/重做系统
- [ ] 集成真实 Compiler Agent + Orchestrator
