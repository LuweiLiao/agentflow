/* AgentFlow — Shared utility functions */

import type { Edge, Node } from "@xyflow/react";
import type { AgentNodeData } from "./AgentNode";
import type { WorkflowNode, WorkflowEdge, NodeStatus } from "./types";
import { colors, profileColor } from "./theme";

export const PROFILE_COLORS: Record<string, string> = {
  analysis: colors.profile.analysis,
  design: colors.profile.design,
  dev: colors.profile.dev,
  test: colors.profile.test,
  doc: colors.profile.doc,
  deploy: colors.profile.deploy,
};
export const DEFAULT_COLOR = colors.accent.purple;

/**
 * Generate a unique node id. Uses crypto.randomUUID when available and falls
 * back to a high-entropy timestamp+random id. Replaces the previous module-level
 * mutable counter (G6) which could collide across reloads / HMR.
 */
export function nextId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `n_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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

/**
 * Convert WorkflowNode[] + WorkflowEdge[] into React Flow Node/Edge arrays.
 * The `index` field stored on node data powers the sequence-number badge (C1).
 */
export function toRfNodes(
  wfNodes: WorkflowNode[],
  wfEdges: WorkflowEdge[]
): { rfNodes: Node<AgentNodeData>[]; rfEdges: Edge[] } {
  const rfNodes: Node<AgentNodeData>[] = wfNodes.map((n, i) => ({
    id: n.id,
    type: "agent",
    position: { x: 320, y: i * 168 },
    data: {
      icon: n.icon || "🤖",
      label: n.label,
      desc: n.desc,
      color: profileColor(n.profile),
      profile: n.profile,
      status: n.status,
      cost: n.cost,
      duration_ms: n.duration_ms,
      model: n.model,
      index: i + 1,
      hasSubWorkflow: n.sub_workflow != null && Object.keys(n.sub_workflow).length > 0,
    },
  }));
  const rfEdges: Edge[] = wfEdges.map((e, i) => ({
    id: `e${i}_${e.source}_${e.target}`,
    source: e.source,
    target: e.target,
    style: { stroke: colors.border.bright, strokeWidth: 2 } as any,
    markerEnd: { type: "arrowclosed", color: colors.border.bright },
  }));
  return { rfNodes, rfEdges };
}
