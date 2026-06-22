/* AgentFlow — Shared utility functions */

import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import type { AgentNodeData } from "./AgentNode";
import type { WorkflowNode, WorkflowEdge, NodeStatus } from "./types";
import { STATUS_LABELS } from "./types";
import { colors, profileColor } from "./theme";
import { autoLayout } from "./layout";

/* ── Unified profile metadata (#4 — single source of truth) ────── */
/**
 * `PROFILE_CONFIG` is the single source of truth for per-profile metadata
 * (color / icon / label / description). All UI surfaces (BlockLibrary,
 * AgentNode, InspectorPanel) derive from this — no more duplicated maps.
 */
export interface ProfileMeta {
  color: string;
  icon: string;
  label: string;
  desc: string;
}

export const PROFILE_CONFIG: Record<string, ProfileMeta> = {
  analysis: { color: colors.profile.analysis, icon: "📊", label: "分析", desc: "需求分析与方案调研" },
  design:   { color: colors.profile.design,   icon: "🏗️", label: "设计", desc: "架构设计与接口定义" },
  dev:      { color: colors.profile.dev,      icon: "💻", label: "开发", desc: "编码实现核心逻辑" },
  test:     { color: colors.profile.test,     icon: "🧪", label: "测试", desc: "单元测试与质量验证" },
  doc:      { color: colors.profile.doc,      icon: "📝", label: "文档", desc: "文档编写与说明" },
  deploy:   { color: colors.profile.deploy,   icon: "🚀", label: "部署", desc: "部署与上线发布" },
};

/** Derive a flat profile→color map for backward compatibility. */
export const PROFILE_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(PROFILE_CONFIG).map(([k, v]) => [k, v.color])
);
export const DEFAULT_COLOR = colors.accent.purple;

/** Resolve profile metadata, falling back to a neutral default. */
export function profileMeta(profile: string | undefined): ProfileMeta {
  if (profile && PROFILE_CONFIG[profile]) return PROFILE_CONFIG[profile];
  return {
    color: profileColor(profile),
    icon: "🤖",
    label: profile || "未分类",
    desc: "",
  };
}

/* ── Unified status→style map (#3 — single source of truth) ────── */
/**
 * `STATUS_CONFIG` consolidates every per-status visual attribute (bg / text
 * color / dot color / localized label) previously duplicated in AgentNode
 * (`STATUS_CONFIG`) and InspectorPanel (`STATUS_STYLE`). The localized label
 * is sourced from `STATUS_LABELS` (types.ts) so labels stay single-sourced.
 */
export interface StatusMeta {
  bg: string;
  color: string;
  dot: string;
  label: string;
}

const STATUS_BG: Record<string, string> = {
  pending:   "rgba(100,116,139,0.16)",
  running:   "rgba(96,165,250,0.16)",
  completed: "rgba(52,211,153,0.16)",
  failed:    "rgba(248,113,113,0.16)",
  skipped:   "rgba(136,136,136,0.16)",
  timed_out: "rgba(251,191,36,0.16)",
  cancelled: "rgba(148,163,184,0.16)",
};

function buildStatusConfig(): Record<string, StatusMeta> {
  const statuses: Array<{ key: string; dot: string; textColor: string }> = [
    { key: "pending",   dot: colors.status.pending,   textColor: "#94a3b8" },
    { key: "running",   dot: colors.status.running,   textColor: colors.status.running },
    { key: "completed", dot: colors.status.completed, textColor: colors.status.completed },
    { key: "failed",    dot: colors.status.failed,    textColor: colors.status.failed },
    { key: "skipped",   dot: colors.status.skipped,   textColor: colors.status.skipped },
    { key: "timed_out", dot: colors.status.timed_out, textColor: colors.status.timed_out },
    { key: "cancelled", dot: colors.status.cancelled, textColor: colors.text.secondary },
  ];
  const out: Record<string, StatusMeta> = {};
  for (const s of statuses) {
    out[s.key] = {
      bg: STATUS_BG[s.key] ?? STATUS_BG.pending,
      color: s.textColor,
      dot: s.dot,
      // STATUS_LABELS is keyed by NodeStatus; fall back to the raw key.
      label: (STATUS_LABELS as Record<string, string>)[s.key] ?? s.key,
    };
  }
  return out;
}

export const STATUS_CONFIG: Record<string, StatusMeta> = buildStatusConfig();

/** Resolve status metadata with a `pending` fallback for unknown statuses. */
export function statusMeta(status: string | undefined): StatusMeta {
  const key = status || "pending";
  return STATUS_CONFIG[key] ?? STATUS_CONFIG.pending;
}

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

export function rfNodeToWorkflowNode(rfNode: Node<AgentNodeData>, edges?: Edge[]): WorkflowNode {
  // #45: derive depends_on from edges if provided
  const depends_on = edges
    ? edges.filter((e) => e.target === rfNode.id).map((e) => e.source)
    : [];
  return {
    id: rfNode.id,
    icon: rfNode.data.icon,
    label: rfNode.data.label,
    desc: rfNode.data.desc,
    color: rfNode.data.color,
    profile: rfNode.data.profile as WorkflowNode["profile"],
    depends_on,
    status: rfNode.data.status as NodeStatus,
    cost: rfNode.data.cost,
    duration_ms: rfNode.data.duration_ms,
    model: rfNode.data.model,
    params: rfNode.data.params,
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
    style: { stroke: sourceColor, strokeWidth: 2.5 } as Record<string, unknown>,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: sourceColor,
      width: 18,
      height: 18,
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
        params: n.params,
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

/**
 * Detect whether the given edges (plus an optional hypothetical new edge)
 * form a directed cycle. Consolidates the 3 previously duplicated cycle
 * detection routines in App.tsx (isValidConnection, onConnect, handleImport).
 *
 * Behaviour:
 *   - If `extraEdge` is provided (the "would adding source→target create a
 *     cycle?" case used by isValidConnection/onConnect), only checks for a
 *     back-path from `target` to `source` — O(reachable-from-target).
 *   - If `extraEdge` is omitted, performs a full DAG cycle check (used by
 *     handleImport to validate imported JSON).
 *
 * @returns `true` if a cycle exists.
 */
export function hasCycle(
  edges: { source: string; target: string }[],
  extraEdge?: { source: string; target: string }
): boolean {
  const adj = new Map<string, string[]>();
  const addEdge = (s: string, t: string) => {
    if (!adj.has(s)) adj.set(s, []);
    adj.get(s)!.push(t);
  };
  for (const e of edges) addEdge(e.source, e.target);
  if (extraEdge) addEdge(extraEdge.source, extraEdge.target);

  // Hypothetical-edge check: only verify no path target → source.
  if (extraEdge) {
    const visited = new Set<string>();
    const stack = [extraEdge.target];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (cur === extraEdge.source) return true; // back-edge found → cycle
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const next of adj.get(cur) || []) stack.push(next);
    }
    return false;
  }

  // Full DAG cycle check (iterative DFS with recursion stack).
  const visited = new Set<string>();
  const onStack = new Set<string>();
  for (const root of adj.keys()) {
    if (visited.has(root)) continue;
    const stack: Array<[string, number]> = [[root, 0]];
    onStack.add(root);
    visited.add(root);
    while (stack.length > 0) {
      const [node, i] = stack[stack.length - 1];
      const neighbors = adj.get(node) || [];
      if (i < neighbors.length) {
        stack[stack.length - 1][1] = i + 1;
        const next = neighbors[i];
        if (onStack.has(next)) return true; // cycle
        if (visited.has(next)) continue;
        visited.add(next);
        onStack.add(next);
        stack.push([next, 0]);
      } else {
        stack.pop();
        onStack.delete(node);
      }
    }
  }
  return false;
}

/** Look up a node's profile color by id (falls back to default accent). */
function profileColorForId(id: string, wfNodes: WorkflowNode[]): string {
  const n = wfNodes.find((x) => x.id === id);
  return n ? profileColor(n.profile) : DEFAULT_COLOR;
}
