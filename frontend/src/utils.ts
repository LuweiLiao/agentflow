/* AgentFlow — 共享工具函数 */

import type { Edge, Node } from "@xyflow/react";
import type { AgentNodeData } from "./AgentNode";
import type { WorkflowNode, WorkflowEdge, NodeStatus } from "./types";

export const PROFILE_COLORS: Record<string, string> = {
  analysis: "#3b82f6",
  design: "#8b5cf6",
  dev: "#10b981",
  test: "#f59e0b",
  doc: "#f97316",
  deploy: "#06b6d4",
};
export const DEFAULT_COLOR = "#6366f1";

let nodeCounter = 0;
export function nextId(): string {
  nodeCounter++;
  return `n${nodeCounter}`;
}

export function rfNodeToWorkflowNode(rfNode: Node<AgentNodeData>): WorkflowNode {
  return {
    id: rfNode.id,
    icon: rfNode.data.icon,
    label: rfNode.data.label,
    desc: rfNode.data.desc,
    color: rfNode.data.color,
    profile: rfNode.data.profile as WorkflowNode["profile"],
    depends_on: [],
    status: rfNode.data.status as NodeStatus,
    cost: rfNode.data.cost,
    duration_ms: rfNode.data.duration_ms,
    model: rfNode.data.model,
  };
}

export function rfEdgeToWorkflowEdge(e: Edge): WorkflowEdge {
  return { source: e.source, target: e.target };
}

/** 将 WorkflowNode[] + WorkflowEdge[] 转为 React Flow 的 Node<AgentNodeData>[] + Edge[] */
export function toRfNodes(
  wfNodes: WorkflowNode[],
  wfEdges: WorkflowEdge[]
): { rfNodes: Node<AgentNodeData>[]; rfEdges: Edge[] } {
  const rfNodes: Node<AgentNodeData>[] = wfNodes.map((n, i) => ({
    id: n.id,
    type: "agent",
    position: { x: 250, y: i * 160 },
    data: {
      icon: n.icon || "🤖",
      label: n.label,
      desc: n.desc,
      color: PROFILE_COLORS[n.profile] || DEFAULT_COLOR,
      profile: n.profile,
      status: n.status,
      cost: n.cost,
      duration_ms: n.duration_ms,
      model: n.model,
    },
  }));
  const rfEdges: Edge[] = wfEdges.map((e, i) => ({
    id: `e${i}`,
    source: e.source,
    target: e.target,
    style: { stroke: "#4b5563", strokeWidth: 2 } as any,
    markerEnd: { type: "arrowclosed", color: "#4b5563" },
  }));
  return { rfNodes, rfEdges };
}
