/* AgentFlow — Shared utility functions */

import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import type { AgentNodeData } from "./AgentNode";
import type { WorkflowNode, WorkflowEdge, NodeStatus } from "./types";
import { colors, profileColor } from "./theme";
import { autoLayout } from "./layout";

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

/** Statuses that indicate data has flowed (or is flowing) out of a node. */
const FLOWING_STATUSES = new Set<string>(["running", "completed"]);

/**
 * Build a Simulink-style orthogonal edge object for a given source/target pair.
 *
 * - `type: "smoothstep"` → right-angle routing with rounded corners.
 * - Stroke colored by the source node's profile color.
 * - Closed arrow marker in the source color.
 * - `animated: false` by default; toggled on by {@link applyEdgeAnimation}
 *   when the source node starts running or completes.
 */
export function makeSignalEdge(
  source: string,
  target: string,
  sourceColor: string,
  index = 0,
  label?: string
): Edge {
  const edge: Edge = {
    id: `e_${source}_${target}_${Date.now().toString(36)}`,
    source,
    target,
    sourceHandle: "out",
    targetHandle: "in",
    type: "smoothstep",
    animated: false,
    style: { stroke: sourceColor, strokeWidth: 2 } as Record<string, unknown>,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: sourceColor,
      width: 16,
      height: 16,
    },
  };
  // Section 8 — data-flow annotation shown on edge hover (via CSS).
  if (label) edge.label = label;
  return edge;
}

/**
 * Return a new edges array where `animated` is `true` for any edge whose
 * source node has a status of "running" or "completed" (i.e. data is flowing
 * downstream). Edges whose source is pending/inactive are not animated.
 *
 * Returns the SAME array reference when no edge's `animated` flag would change,
 * so callers can safely use this inside a `setEdges` updater without triggering
 * superfluous re-renders.
 */
export function applyEdgeAnimation(
  edges: Edge[],
  nodes: Node<AgentNodeData>[]
): Edge[] {
  // Map node id -> flowing status for O(1) lookups.
  const flowing = new Set<string>();
  for (const n of nodes) {
    if (FLOWING_STATUSES.has(n.data.status || "")) flowing.add(n.id);
  }

  let changed = false;
  const next = edges.map((e) => {
    const shouldAnimate = flowing.has(e.source);
    if (!!e.animated === shouldAnimate) return e; // no change, keep ref
    changed = true;
    return { ...e, animated: shouldAnimate };
  });

  return changed ? next : edges;
}

/**
 * Convert WorkflowNode[] + WorkflowEdge[] into React Flow Node/Edge arrays.
 *
 * Nodes are positioned via the {@link autoLayout} DAG layering algorithm
 * (left-to-right by dependency depth). Edges use Simulink-style orthogonal
 * routing colored by the source node's profile. The `index` field stored on
 * node data powers the sequence-number badge (C1).
 */
export function toRfNodes(
  wfNodes: WorkflowNode[],
  wfEdges: WorkflowEdge[]
): { rfNodes: Node<AgentNodeData>[]; rfEdges: Edge[] } {
  // First pass: build RF nodes with placeholder positions + capture label map.
  const labelById = new Map<string, string>();
  const initial: Node<AgentNodeData>[] = wfNodes.map((n, i) => {
    labelById.set(n.id, n.label);
    return {
      id: n.id,
      type: "agent",
      position: { x: 0, y: 0 },
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
    };
  });

  // Auto-layout the nodes (left-to-right DAG layers).
  const rfNodes = autoLayout(initial, wfEdges);

  // Build Simulink-style edges (orthogonal + source-colored + hover label).
  const rfEdges: Edge[] = wfEdges.map((e, i) => {
    const srcLabel = labelById.get(e.source) || e.source;
    const tgtLabel = labelById.get(e.target) || e.target;
    return makeSignalEdge(
      e.source,
      e.target,
      profileColorForId(e.source, wfNodes),
      i,
      `${srcLabel} → ${tgtLabel}`
    );
  });

  return { rfNodes, rfEdges };
}

/** Look up a node's profile color by id (falls back to default accent). */
function profileColorForId(id: string, wfNodes: WorkflowNode[]): string {
  const n = wfNodes.find((x) => x.id === id);
  return n ? profileColor(n.profile) : DEFAULT_COLOR;
}
