/* AgentFlow 前端 — 类型定义 */

/** 节点类型 profile */
export type Profile =
  | "analysis" | "design" | "dev" | "test" | "doc" | "deploy";

/** 节点状态 */
export type NodeStatus =
  | "pending" | "running" | "completed" | "failed" | "skipped" | "timed_out" | "cancelled";

/** 工作流节点 */
export interface WorkflowNode {
  id: string;
  icon: string;
  label: string;
  desc: string;
  color: string;
  profile: Profile;
  depends_on: string[];
  /** 运行时填充 */
  status?: NodeStatus;
  result?: string;
  cost?: number;
  duration_ms?: number;
  turns?: number;
  model?: string;
  provider?: string;
  /** 嵌套子工作流（展开/折叠） */
  sub_workflow?: GraphData | null;
}

/** 工作流边 */
export interface WorkflowEdge {
  source: string;
  target: string;
}

/** DAG 图数据 */
export interface GraphData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/** Run 状态 */
export interface RunInfo {
  run_id: string;
  status: string;
  requirement: string;
  nodes: any[];
  total_cost: number;
  total_dur: number;
  created_at: number;
}

/** SSE 事件 */
export interface SSENodeEvent {
  node_id: string;
  label: string;
  status: string;
  profile?: string;
  result?: string;
  cost?: number;
  duration_ms?: number;
  turns?: number;
  model?: string;
  provider?: string;
}

export interface SSEWorkflowDone {
  run_id: string;
  status: string;
  total_cost: number;
  total_duration: number;
  nodes: any[];
}

/** Supervisor 响应 */
export interface SupervisorResponse {
  message: string;
  session_id: string;
  step: string;
  done: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  plan_summary?: string;
}
