/* AgentFlow 前端 — 类型定义 */

/** 节点类型 profile */
export type Profile =
  | "analysis" | "design" | "dev" | "test" | "doc" | "deploy";

/** 节点状态 */
export type NodeStatus =
  | "pending" | "running" | "completed" | "failed" | "skipped" | "timed_out" | "cancelled";

/** 中文状态标签映射 */
export const STATUS_LABELS: Record<NodeStatus, string> = {
  pending: "等待",
  running: "运行中",
  completed: "已完成",
  failed: "已失败",
  skipped: "已跳过",
  timed_out: "已超时",
  cancelled: "已取消",
};

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
  nodes: WorkflowNode[];
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
  nodes: WorkflowNode[];
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

/* ── Evolution report interfaces (G4: replaces `any`) ──────────── */

export interface EvalResult {
  baseline_avg_score: number;
  candidate_avg_score: number;
  improvement: number;
  passed?: boolean;
  [key: string]: unknown;
}

export interface EvolutionProposal {
  proposal_id: string;
  target: string;
  title: string;
  rationale: string;
  risk: string;
}

export interface UpgradeDecision {
  action: string;
  reason: string;
  proposal: EvolutionProposal | null;
  eval_result: EvalResult | null;
  candidate_artifacts: unknown[];
}

export interface Promotion {
  promotion_id: string;
  template_name: string;
  diff_summary: string;
  rolled_back: boolean;
}

export interface UpgradeSummary {
  total: number;
  accepted: number;
  rejected: number;
  pending_review: number;
  promoted: number;
}

export interface RecurringPattern {
  failure_class: string;
  occurrence_count: number;
  root_cause_fragment: string;
  affected_runs?: string[];
}

export interface EvolutionStats {
  total_runs_analyzed: number;
  total_attributions: number;
  total_proposals: number;
  total_promotions: number;
  total_rollbacks: number;
  failure_class_counts: Record<string, number>;
  proposal_acceptance_rate: number;
  recurring_patterns: RecurringPattern[];
  template_improvement_trend: Record<string, number>;
}

export interface EvolutionReport {
  ok: boolean;
  report: {
    attributions?: FailureAttribution[];
    proposals?: EvolutionProposal[];
  } | null;
}

export interface FailureAttribution {
  failure_class: string;
  root_cause: string;
  evidence: string[];
  confidence: number;
  affected_nodes: string[];
}
