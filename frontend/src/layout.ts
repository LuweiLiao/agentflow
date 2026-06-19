/* AgentFlow — DAG layered auto-layout (Simulink-style left-to-right flow) */

import { LAYER_GAP_X, NODE_GAP_Y } from "./theme";

/**
 * Assign each node to a topological "layer" (depth) using Kahn's algorithm
 * with longest-path layering. Falls back to a simple grid if a cycle is
 * detected (remaining in-degree > 0 after the sort).
 *
 * @returns a Map of nodeId -> layer index. Disconnected nodes land on layer 0.
 */
function assignLayers(
  nodeIds: string[],
  edges: { source: string; target: string }[]
): { layers: Map<string, number>; hasCycle: boolean } {
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const layers = new Map<string, number>();

  for (const id of nodeIds) {
    adj.set(id, []);
    inDegree.set(id, 0);
    layers.set(id, 0);
  }
  for (const e of edges) {
    // Only count edges between known nodes.
    if (!adj.has(e.source) || !inDegree.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  }

  // Kahn's algorithm: process zero-in-degree nodes, propagating max-depth.
  const queue: string[] = nodeIds.filter((id) => (inDegree.get(id) || 0) === 0);
  let processed = 0;
  while (queue.length > 0) {
    const node = queue.shift()!;
    processed++;
    const layer = layers.get(node) || 0;
    for (const next of adj.get(node) || []) {
      layers.set(next, Math.max(layers.get(next) || 0, layer + 1));
      inDegree.set(next, (inDegree.get(next) || 0) - 1);
      if ((inDegree.get(next) || 0) === 0) queue.push(next);
    }
  }

  const hasCycle = processed < nodeIds.length;
  return { layers, hasCycle };
}

/**
 * Grid fallback when the graph contains a cycle. Arranges nodes in a square-ish
 * grid starting at the origin.
 */
function gridLayout<T extends { id: string; position?: { x: number; y: number } }>(
  nodes: T[]
): T[] {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  return nodes.map((node, i) => ({
    ...node,
    position: {
      x: (i % cols) * LAYER_GAP_X,
      y: Math.floor(i / cols) * NODE_GAP_Y,
    },
  }));
}

/**
 * Compute a layered DAG layout using Kahn's topological sort.
 *
 * Nodes are assigned to "layers" based on their longest path from a root
 * (topological depth). Layers are arranged left-to-right; within each layer,
 * nodes are stacked vertically and centered around the midpoint of the tallest
 * layer so that parallel branches don't overlap.
 *
 * - Nodes with no dependencies = layer 0.
 * - Node layer = max(all predecessor layers) + 1.
 * - Disconnected nodes land on layer 0.
 * - If a cycle is detected, a grid fallback is used.
 *
 * @returns a new array of nodes with updated `position` fields (does not mutate).
 */
export function autoLayout<
  T extends { id: string; position?: { x: number; y: number } }
>(nodes: T[], edges: { source: string; target: string }[]): T[] {
  if (nodes.length === 0) return nodes;

  const nodeIds = nodes.map((n) => n.id);
  const { layers, hasCycle } = assignLayers(nodeIds, edges);

  if (hasCycle) return gridLayout(nodes);

  // Group node ids by layer.
  const layerGroups = new Map<number, string[]>();
  let maxLayer = 0;
  for (const id of nodeIds) {
    const layer = layers.get(id) || 0;
    maxLayer = Math.max(maxLayer, layer);
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(id);
  }

  // Determine the tallest layer so we can vertically center every layer.
  let maxCount = 1;
  for (const ids of layerGroups.values()) {
    if (ids.length > maxCount) maxCount = ids.length;
  }
  const tallestHeight = (maxCount - 1) * NODE_GAP_Y;
  const midY = tallestHeight / 2;

  // Compute each node's position.
  const positions = new Map<string, { x: number; y: number }>();
  const X_START = 80;
  for (let layer = 0; layer <= maxLayer; layer++) {
    const ids = layerGroups.get(layer) || [];
    const count = ids.length;
    const layerHeight = (count - 1) * NODE_GAP_Y;
    const startY = midY - layerHeight / 2;
    ids.forEach((id, i) => {
      positions.set(id, {
        x: X_START + layer * LAYER_GAP_X,
        y: startY + i * NODE_GAP_Y,
      });
    });
  }

  // Any node that somehow missed a position (defensive) -> origin.
  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) || { x: 0, y: 0 },
  }));
}
