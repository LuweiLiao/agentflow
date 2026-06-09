# 07 — UI 与画布 (UI & Canvas)

> 基于 React Flow 的可视化工作流编辑器，支持节点拖拽、连线、配置、验证与执行状态反馈。

---

## 1. 技术选型

| 维度 | 选择 | 理由 |
|---|---|---|
| 画布引擎 | **React Flow** (v11+) | 轻量、可定制、内置拖拽与连线、TypeScript 友好 |
| 状态管理 | **Zustand** + 画布 Store | 独立于全局状态，React Flow 的 `onNodesChange` / `onEdgesChange` 直接对接 |
| UI 组件库 | **Ant Design** | 配置面板、表单、Schema 查看器、消息提示等 |
| 工作流序列化 | **WorkflowJSON** 格式 | 与 Compiler Agent / Orchestrator 的共享数据契约 |

---

## 2. 整体布局

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]  [Workflow Title]              [Run] [Export] [⚙] │  ← 顶栏
├──────────┬───────────────────────────────────────────────────┤
│          │                                                   │
│  左侧    │              画布 (React Flow)                    │
│  节点    │    ┌───┐     ┌───┐     ┌───┐                    │
│  面板    │    │ A │────▶│ B │────▶│ C │                    │
│          │    └───┘     └───┘     └───┘                    │
│  🔲 Input │         ╲    │                                  │
│  🔲 LLM   │          ┌───┐                                 │
│  🔲 Code  │          │ D │                                 │
│  🔲 Output│          └───┘                                 │
│  🔲 Router│                                                   │
│  🔲 Loop  │         [状态栏: 验证通过 | 3节点 2连线]        │
├──────────┴───────────────────────────────────────────────────┤
│  [节点配置面板 - 右侧抽屉 / 底部弹出]                       │ ← 上下文面板
│  - 类型选择  - 参数编辑  - Schema 查看                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. React Flow 集成方案

### 3.1 节点拖拽 — 从侧边栏到画布

**交互流程：**

1. 侧边栏节点项设置 `draggable` 并监听 `onDragStart`
2. `onDragStart` 中通过 `event.dataTransfer.setData('application/reactflow', type)` 设置节点类型
3. 画布区域监听 `onDrop`：
   - 计算 `reactFlowInstance.screenToFlowPosition()` 获取画布坐标
   - 调用 `addNodes()` 创建新节点（生成唯一 `id`，设置初始位置）
4. 拖拽过程中显示视觉反馈（半透明跟随节点、画布高亮边框）

**关键代码示意：**

```typescript
// 侧边栏节点项
const onDragStart = (event: DragEvent, nodeType: string) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

// 画布 onDrop
const onDrop = useCallback(
  (event: DragEvent) => {
    const type = event.dataTransfer.getData('application/reactflow');
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const newNode = { id: nanoid(), type, position, data: { label: type } };
    addNodes(newNode);
  },
  [reactFlowInstance, addNodes],
);
```

### 3.2 节点配置 — 点击弹出配置面板

**交互流程：**

1. 点击节点时，调用 `setSelectedNode(node)` 更新全局 Store
2. 右侧抽屉（或底部面板）根据选中的 `nodeType` 渲染对应配置表单
3. 表单字段直接映射到 `node.data.params`，修改即写回（`updateNodeData`）
4. Schema 查看：以只读树形控件显示当前节点的 Input/Output Schema
5. 取消选中：点击画布空白处关闭面板

**节点数据模型：**

```typescript
interface FlowNodeData {
  label: string;           // 显示名称
  type: NodeType;          // 'llm_call' | 'code_exec' | 'router' | ...
  params: Record<string, any>; // 运行时参数
  schema?: {               // 可选，从注册表加载
    input: JSONSchema;
    output: JSONSchema;
  };
  status?: NodeStatus;     // 'idle' | 'running' | 'success' | 'error'
}
```

### 3.3 连线 — 从 Output Port 拖到 Input Port

**交互流程：**

1. React Flow 默认支持手柄 (`Handle`) — 节点定义 `source` (output) 和 `target` (input) 位置
2. 自定义手柄样式：左侧 Input（灰色圆点），右侧 Output（蓝色圆点）
3. `onConnect` 回调中执行**类型检查**：
   - 获取源节点的 `outputSchema` 和目标节点的 `inputSchema`
   - 检查类型兼容性（如 `string` → `string` 可连，`number` → `string` 需转换标记）
   - 不兼容时：弹出警告 toast，拒绝连接
4. 连接成功后，Store 中 `edges` 更新，Edge 添加 `sourceHandle` / `targetHandle` 标识

**连线规则：**

| 源 → 目标 | 允许 | 备注 |
|---|---|---|
| `string → string` | ✅ | 直接连接 |
| `number → number` | ✅ | 直接连接 |
| `object → object` | ✅ | Schema 子集检查（可选） |
| `any → *` | ✅ | 宽松模式 |
| `number → string` | ⚠️ | 允许，标记自动转换 |
| `array → string` | ❌ | 类型不匹配 |

**自定义 Edge：**

```typescript
const CustomEdge = ({ id, source, target, data, ...props }: EdgeProps) => (
  <BezierEdge
    id={id}
    source={source}
    target={target}
    style={{
      stroke: data?.compatible ? '#1890ff' : '#faad14',
      strokeWidth: data?.compatible ? 2 : 2,
      strokeDasharray: data?.compatible ? 'none' : '5,5',
    }}
    {...props}
  />
);
```

### 3.4 工作流验证

验证在**每次画布变更**（添加/删除/连线）后自动触发，结果展示在状态栏和 MiniMap 上。

**验证规则链：**

```
验证器(validateWorkflow) {
  1. 结构验证        → 是否有孤立节点？起始节点是否存在？
  2. 循环依赖检测    → DFS 找环，若有环则标记所有环上节点为红
  3. 类型匹配        → 遍历所有 edges，检查 source/target schema 兼容性
  4. 参数完整性      → 每个节点必填参数是否已填写？
  5. 连通性          → 从起始节点能否达到所有终节点？
}

返回值: { valid: boolean; warnings: string[]; errors: ValidationError[] }
```

**循环依赖检测算法：**

```typescript
function detectCycle(nodes: Node[], edges: Edge[]): string[] {
  const adj = buildAdjacencyList(edges);
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycleNodes: string[] = [];

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    inStack.add(nodeId);
    for (const neighbor of (adj.get(nodeId) || [])) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        cycleNodes.push(nodeId, neighbor);
        return true;
      }
    }
    inStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) dfs(node.id);
  }
  return [...new Set(cycleNodes)];
}
```

### 3.5 导出 WorkflowJSON

**菜单路径：** 顶栏「Export」按钮 → 下拉菜单「导出 WorkflowJSON / 导出 YAML」

**WorkflowJSON 格式：**

```json
{
  "version": "1.0",
  "metadata": {
    "name": "My Workflow",
    "description": "数据提取 → LLM 分析 → 输出报告",
    "createdAt": "2026-06-09T10:25:00Z",
    "author": "agentflow-user"
  },
  "nodes": [
    {
      "id": "node_01",
      "type": "input",
      "label": "数据源",
      "params": { "source": "api", "url": "..." },
      "position": { "x": 100, "y": 200 }
    },
    {
      "id": "node_02",
      "type": "llm_call",
      "label": "LLM 分析",
      "params": { "model": "gpt-4", "prompt": "...", "temperature": 0.3 }
    }
  ],
  "edges": [
    {
      "id": "edge_01",
      "source": "node_01",
      "target": "node_02",
      "sourceHandle": "output",
      "targetHandle": "input"
    }
  ]
}
```

### 3.6 执行状态反馈

**执行生命周期：**

```
IDLE (灰色) → RUNNING (蓝色/脉冲动画) → SUCCESS (绿色) | ERROR (红色)
```

| 状态 | 颜色 | 视觉反馈 |
|---|---|---|
| `idle` | `#d9d9d9` (灰色) | 默认状态 |
| `running` | `#1890ff` (蓝色) | 边框脉冲动画 + 节点内旋转图标 |
| `success` | `#52c41a` (绿色) | 实心边框 + 右侧打勾标记 |
| `error` | `#ff4d4f` (红色) | 实心边框 + 错误图标 + Tooltip 显示错误信息 |
| `skipped` | `#faad14` (黄色) | 虚线边框，标记已跳过 |

**实现方式：**

```typescript
const nodeStyle = (status: NodeStatus): CSSProperties => {
  const styles: Record<NodeStatus, CSSProperties> = {
    idle:     { borderColor: '#d9d9d9', background: '#fafafa' },
    running:  { borderColor: '#1890ff', background: '#e6f7ff', animation: 'pulse 1.5s infinite' },
    success:  { borderColor: '#52c41a', background: '#f6ffed' },
    error:    { borderColor: '#ff4d4f', background: '#fff2f0' },
    skipped:  { borderColor: '#faad14', background: '#fffbe6', opacity: 0.6 },
  };
  return styles[status] || styles.idle;
};
```

**执行进度条：** 底部状态栏显示 `执行中: 2/5 节点完成`

---

## 4. 画布布局建议

### 4.1 自动布局

默认推荐**从上到下 (Top-to-Bottom)** 的 DAG 布局。

```typescript
import { dagre } from '@dagrejs/dagre';

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 100 });

  nodes.forEach(n => g.setNode(n.id, { width: 200, height: 80 }));
  edges.forEach(e => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return {
    nodes: nodes.map(n => ({
      ...n,
      position: { x: g.node(n.id).x - 100, y: g.node(n.id).y - 40 },
    })),
    edges,
  };
}
```

### 4.2 交互手势

| 手势 | 效果 |
|---|---|
| 鼠标滚轮 | 缩放画布 (0.5x ~ 3x) |
| 鼠标中键拖拽 / Ctrl+左键拖拽 | 平移画布 |
| 双击空白 | 调出「添加节点」快速选择菜单 |
| 双击连线 | 在连线上插入新节点 |
| 框选 (Shift+拖拽) | 批量选中多个节点 |
| 拖拽节点到回收站区域 | 删除节点及其所有连线 |
| Ctrl+C / Ctrl+V | 复制粘贴选中节点（位置偏移 +50, +50） |
| Ctrl+Z / Ctrl+Shift+Z | 撤销/重做（基于画布 Store 的快照） |

### 4.3 MiniMap 与控制

React Flow 内置 MiniMap 和 Controls：

```tsx
<ReactFlow>
  <MiniMap
    nodeStrokeColor="#333"
    nodeColor={(n) => nodeStatusColor(n.data.status)}
    maskColor="rgba(0,0,0,0.1)"
  />
  <Controls showInteractive={false} />
  <Background variant="dots" gap={20} size={1} />
</ReactFlow>
```

### 4.4 节点分组 (Node Group)

通过 `GroupNode` 实现子工作流 / 模块化：

- 拖拽节点到 Group 内部自动成为子节点
- Group 折叠时隐藏内部节点，展开时显示
- 递归渲染：Group 内的节点可再次分组

---

## 5. 关键交互细节

### 5.1 节点手柄样式

```css
/* Input Handle — 左侧灰点 */
.react-flow__handle-left {
  width: 8px;
  height: 8px;
  background: #bfbfbf;
  border: 2px solid #fff;
}

/* Output Handle — 右侧蓝点 */
.react-flow__handle-right {
  width: 8px;
  height: 8px;
  background: #1890ff;
  border: 2px solid #fff;
}

/* 连接中高亮 */
.react-flow__handle-connecting {
  background: #52c41a;
  transform: scale(1.3);
}
```

### 5.2 拖拽视觉反馈

- 拖拽中：节点透明度 0.5，跟随鼠标半透明块
- 可放置区域：画布边框变为蓝色虚线高亮
- 不可放置（类型不匹配）：鼠标光标变为 `not-allowed`

### 5.3 快照撤销/撤销栈

```typescript
interface CanvasSnapshot {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId?: string;
  viewport?: Viewport;
}

// Zustand store 中维护 undoStack / redoStack (最大 50 步)
const useCanvasStore = create<CanvasStore>((set, get) => ({
  undoStack: [],
  redoStack: [],

  pushSnapshot: () => {
    const { nodes, edges, undoStack } = get();
    undoStack.push({ nodes: cloneDeep(nodes), edges: cloneDeep(edges) });
    if (undoStack.length > 50) undoStack.shift();
    set({ undoStack, redoStack: [] });
  },

  undo: () => {
    const { nodes, edges, undoStack, redoStack } = get();
    const snapshot = undoStack.pop();
    if (!snapshot) return;
    redoStack.push({ nodes: cloneDeep(nodes), edges: cloneDeep(edges) });
    set({ nodes: snapshot.nodes, edges: snapshot.edges, undoStack, redoStack });
  },

  redo: () => { /* 对称逻辑 */ },
}));
```

### 5.4 自动保存

- 画布变更后 3 秒防抖自动保存到 localStorage / IndexedDB
- 页面关闭前通过 `beforeunload` 检查未保存更改
- 保存内容包括：节点布局、参数、已展开/折叠状态、画布视口

---

## 6. 组件树概览

```
CanvasPage
├── TopBar
│   ├── WorkflowTitle (editable)
│   ├── RunButton
│   ├── ExportDropdown (WorkflowJSON / YAML)
│   └── SettingsButton
├── MainLayout (flex row)
│   ├── NodePalette (左侧侧边栏)
│   │   ├── SearchBar
│   │   └── NodeCategoryGroup[]
│   │       └── DraggableNodeItem[]
│   ├── FlowCanvas (React Flow)
│   │   ├── CustomNode[]        (按 type 区分节点渲染)
│   │   │   ├── Handle (左/右)
│   │   │   ├── StatusIndicator
│   │   │   └── Label
│   │   ├── CustomEdge[]
│   │   ├── MiniMap
│   │   ├── Controls
│   │   └── Background
│   └── ConfigPanel (右侧抽屉)
│       ├── NodeTypeSelector
│       ├── ParamForm (动态渲染)
│       └── SchemaViewer (只读树)
└── BottomBar
    ├── ValidationStatus
    ├── ExecutionProgress
    └── UndoRedoButtons
```

---

## 7. 文件结构建议

```
src/canvas/
├── index.tsx                  # CanvasPage 主组件
├── store/
│   ├── canvasStore.ts         # Zustand store (nodes, edges, undo/redo)
│   └── executionStore.ts      # 执行状态订阅 (节点状态)
├── components/
│   ├── NodePalette.tsx        # 左侧节点面板
│   ├── FlowCanvas.tsx         # React Flow 容器
│   ├── ConfigPanel.tsx        # 节点配置面板
│   ├── TopBar.tsx             # 顶栏操作按钮
│   └── BottomBar.tsx          # 底部状态栏
├── nodes/
│   ├── CustomNode.tsx         # 自定义节点渲染器
│   ├── nodeTypes.ts           # 节点类型注册表
│   └── handles.tsx            # 手柄定义
├── edges/
│   ├── CustomEdge.tsx         # 自定义连线
│   └── edgeUtils.ts           # 连线工具函数
├── validators/
│   ├── validateWorkflow.ts    # 主验证器
│   ├── cycleDetection.ts      # 循环依赖检测
│   ├── typeChecker.ts         # Schema 类型兼容检查
│   └── paramValidator.ts      # 参数完整性检查
├── export/
│   ├── toWorkflowJSON.ts      # 导出 WorkflowJSON
│   └── toYAML.ts              # 导出 YAML
└── utils/
    ├── autoLayout.ts          # Dagre 自动布局
    ├── snapshot.ts            # 快照/撤销栈
    └── constants.ts           # 颜色、尺寸等常量
```

---

## 8. 与后端集成

| 操作 | 接口 | 频率 |
|---|---|---|
| 保存工作流 | `PUT /api/workflows/:id` | 自动保存 (3s 防抖) |
| 加载工作流 | `GET /api/workflows/:id` | 页面加载时 |
| 执行工作流 | `POST /api/workflows/:id/execute` | 用户点击 Run |
| 轮询执行状态 | `GET /api/workflows/:id/executions/:execId` | 执行中每 2s |
| WebSocket 推送 | `ws://.../executions/:execId` | 实时节点状态更新 |
| 验证 | `POST /api/workflows/validate` | 每次画布变更后 |
