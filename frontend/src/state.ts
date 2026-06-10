/* AgentFlow 前端 — 图数据状态管理 */

import type { WorkflowNode, WorkflowEdge, GraphData, NodeStatus } from "./types.js";

/** 图的不可变操作 — 事务式修改 */
export class GraphStore {
  private _nodes: Map<string, WorkflowNode> = new Map();
  private _edges: WorkflowEdge[] = [];
  private _listeners: Set<() => void> = new Set();

  constructor(data?: GraphData) {
    if (data) {
      for (const n of data.nodes) this._nodes.set(n.id, { ...n });
      this._edges = [...data.edges];
    }
  }

  // ── 只读访问 ──

  get nodes(): WorkflowNode[] {
    return Array.from(this._nodes.values());
  }

  get edges(): WorkflowEdge[] {
    return [...this._edges];
  }

  getNode(id: string): WorkflowNode | undefined {
    return this._nodes.get(id);
  }

  /** 拓扑排序后的节点列表 */
  get topoSorted(): WorkflowNode[] {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    for (const [id] of this._nodes) {
      inDegree.set(id, 0);
      adj.set(id, []);
    }
    for (const e of this._edges) {
      adj.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }
    const sorted: WorkflowNode[] = [];
    while (queue.length > 0) {
      const id = queue.shift()!;
      const node = this._nodes.get(id);
      if (node) sorted.push(node);
      for (const tgt of adj.get(id) || []) {
        const nd = inDegree.get(tgt) || 1;
        inDegree.set(tgt, nd - 1);
        if (nd - 1 === 0) queue.push(tgt);
      }
    }
    return sorted;
  }

  /** 获取上游节点 */
  getUpstream(nodeId: string): string[] {
    return this._edges
      .filter(e => e.target === nodeId)
      .map(e => e.source);
  }

  /** 获取下游节点 */
  getDownstream(nodeId: string): string[] {
    return this._edges
      .filter(e => e.source === nodeId)
      .map(e => e.target);
  }

  // ── 事务式修改 ──

  /** 添加节点（含验证） */
  addNode(node: WorkflowNode): boolean {
    if (this._nodes.has(node.id)) return false;
    this._nodes.set(node.id, { ...node });
    this._notify();
    return true;
  }

  /** 更新节点 */
  updateNode(id: string, updates: Partial<WorkflowNode>): boolean {
    const node = this._nodes.get(id);
    if (!node) return false;
    Object.assign(node, updates);
    this._notify();
    return true;
  }

  /** 更新节点状态（带状态机验证） */
  updateNodeStatus(id: string, status: NodeStatus): boolean {
    const node = this._nodes.get(id);
    if (!node) return false;
    const validTransitions: Record<string, string[]> = {
      pending: ["running", "skipped"],
      running: ["completed", "failed", "timed_out"],
      completed: [],
      failed: [],
      skipped: [],
      timed_out: [],
      cancelled: [],
    };
    const allowed = validTransitions[node.status || "pending"];
    if (allowed.length > 0 && !allowed.includes(status)) {
      console.warn(`节点 ${id}: 非法状态转换 ${node.status} → ${status}`);
      return false;
    }
    node.status = status;
    this._notify();
    return true;
  }

  /** 删除节点（同时删除相关边） */
  removeNode(id: string): boolean {
    if (!this._nodes.has(id)) return false;
    this._nodes.delete(id);
    this._edges = this._edges.filter(e => e.source !== id && e.target !== id);
    this._notify();
    return true;
  }

  /** 添加边 */
  addEdge(source: string, target: string): boolean {
    if (source === target) return false;  // 禁自环
    if (!this._nodes.has(source) || !this._nodes.has(target)) return false;
    if (this._edges.some(e => e.source === source && e.target === target)) return false;
    // 检查是否会产生环
    if (this._wouldCreateCycle(source, target)) return false;
    this._edges.push({ source, target });
    this._notify();
    return true;
  }

  /** 删除边 */
  removeEdge(source: string, target: string): boolean {
    const idx = this._edges.findIndex(e => e.source === source && e.target === target);
    if (idx < 0) return false;
    this._edges.splice(idx, 1);
    this._notify();
    return true;
  }

  /** 清空 */
  clear(): void {
    this._nodes.clear();
    this._edges = [];
    this._notify();
  }

  /** 用新数据替换全部 */
  load(data: GraphData): void {
    this._nodes.clear();
    for (const n of data.nodes) this._nodes.set(n.id, { ...n });
    this._edges = [...data.edges];
    this._notify();
  }

  /** 导出为 plain object */
  toJSON(): GraphData {
    return {
      nodes: this.nodes,
      edges: this.edges,
    };
  }

  // ── 环检测（Kahn）──
  private _wouldCreateCycle(source: string, target: string): boolean {
    // 临时加上边，检查是否有环
    const testEdges = [...this._edges, { source, target }];
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    for (const [id] of this._nodes) {
      inDegree.set(id, 0);
      adj.set(id, []);
    }
    for (const e of testEdges) {
      adj.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }
    let count = 0;
    while (queue.length > 0) {
      const id = queue.shift()!;
      count++;
      for (const tgt of adj.get(id) || []) {
        const nd = (inDegree.get(tgt) || 1) - 1;
        inDegree.set(tgt, nd);
        if (nd === 0) queue.push(tgt);
      }
    }
    return count !== this._nodes.size;
  }

  // ── 观察者 ──

  subscribe(fn: () => void): () => void {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  private _notify(): void {
    for (const fn of this._listeners) fn();
  }
}
