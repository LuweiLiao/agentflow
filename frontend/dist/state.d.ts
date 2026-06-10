import type { WorkflowNode, WorkflowEdge, GraphData, NodeStatus } from "./types.js";
/** 图的不可变操作 — 事务式修改 */
export declare class GraphStore {
    private _nodes;
    private _edges;
    private _listeners;
    constructor(data?: GraphData);
    get nodes(): WorkflowNode[];
    get edges(): WorkflowEdge[];
    getNode(id: string): WorkflowNode | undefined;
    /** 拓扑排序后的节点列表 */
    get topoSorted(): WorkflowNode[];
    /** 获取上游节点 */
    getUpstream(nodeId: string): string[];
    /** 获取下游节点 */
    getDownstream(nodeId: string): string[];
    /** 添加节点（含验证） */
    addNode(node: WorkflowNode): boolean;
    /** 更新节点 */
    updateNode(id: string, updates: Partial<WorkflowNode>): boolean;
    /** 更新节点状态（带状态机验证） */
    updateNodeStatus(id: string, status: NodeStatus): boolean;
    /** 删除节点（同时删除相关边） */
    removeNode(id: string): boolean;
    /** 添加边 */
    addEdge(source: string, target: string): boolean;
    /** 删除边 */
    removeEdge(source: string, target: string): boolean;
    /** 清空 */
    clear(): void;
    /** 用新数据替换全部 */
    load(data: GraphData): void;
    /** 导出为 plain object */
    toJSON(): GraphData;
    private _wouldCreateCycle;
    subscribe(fn: () => void): () => void;
    private _notify;
}
