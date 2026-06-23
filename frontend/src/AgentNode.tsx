import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { colors, fontSize, shadow, radius, spacing, transition, formatCost, formatDuration } from "./theme";  // #36: added radius
import { statusMeta, profileMeta } from "./utils";  // #3/#4: unified maps
import type { NodeParams } from "./types";

export type AgentNodeData = {
  icon: string;
  label: string;
  desc: string;
  color: string;
  profile: string;
  status?: string;
  cost?: number;
  duration_ms?: number;
  model?: string;
  /** Sequence number shown in the index badge (1, 2, 3, …) */
  index?: number;
  /** 嵌套子工作流指示（true=可展开，null/undefined=无） */
  hasSubWorkflow?: boolean;
  /** 高级参数 (params_json) */
  params?: NodeParams;
};

const NODE_WIDTH = 220;
const NODE_MAX_WIDTH = 260;

function hexToRgba(hex: string, alpha: number): string {
  // Accept "#rrggbb" or "#rgb"; fall back to the raw color on parse failure.
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function AgentNode({ data, selected }: NodeProps<Node<AgentNodeData>>) {
  const sc = statusMeta(data.status);  // #3: unified status lookup (was STATUS_CONFIG[...])
  const profileLabel = profileMeta(data.profile).label;  // #4: unified profile lookup
  const accent = data.color || colors.accent.purple;
  const isRunning = (data.status || "pending") === "running";

  const cardClass = [
    "agentflow-node-card",
    "af-node",
    isRunning ? "agentflow-node--running" : "",
    selected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Title-bar background: profile color at 22% opacity; pulses when running.
  const titleBg = isRunning ? hexToRgba(accent, 0.35) : hexToRgba(accent, 0.22);

  return (
    <div
      className={cardClass}
      style={{
        position: "relative",
        background: colors.bg[3],
        border: `2px solid ${accent}`,  // #14: keep profile color even when selected
        borderRadius: radius.md,  // #36: was hardcoded 4 — now uses token
        padding: 0,
        width: NODE_WIDTH,
        maxWidth: NODE_MAX_WIDTH,
        boxShadow: selected
          ? `0 0 0 2px ${hexToRgba(accent, 0.4)}, 0 0 16px ${hexToRgba(accent, 0.25)}, ${shadow.lg}`
          : `${shadow.md}`,
        cursor: "pointer",
        overflow: "hidden",
        transition: `box-shadow ${transition.base}, border-color ${transition.fast}`,
      }}
    >
      {/* R2-#4: Removed clipped port labels — redundant with Handle components */}

      {/* ── Title bar (full-width colored header) ── */}
      <div
        className={isRunning ? "agentflow-node-title--running" : undefined}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: spacing[6],
          height: 28,
          padding: "0 8px 0 18px", // left padding clears the accent bar
          background: titleBg,
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        {/* C5 — left accent bar spans only the title bar height */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: accent,
          }}
        />

        {/* C1 — index badge integrated with the icon */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
          {data.index !== undefined && (
            <span
              aria-hidden
              style={{
                width: 18,
                height: 18,
                borderRadius: radius.sm,  // #2: was hardcoded 4 — now uses token
                background: accent,
                color: colors.text.inverse,
                fontSize: 11,  // R2-#6: was 10/16px — too small
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {data.index}
            </span>
          )}
          <span style={{ fontSize: fontSize.base, lineHeight: 1, flexShrink: 0 }}>{data.icon || "🤖"}</span>
          <span
            style={{
              fontSize: fontSize.sm,
              fontWeight: 600,
              color: colors.text.primary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {data.label || "未命名"}
          </span>
          <span
            style={{
              fontSize: 11,  // R2-#5: was 9 — nearly unreadable
              color: colors.text.secondary,  // R2-#10: was tertiary (fgB=154) — improve contrast
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            [{profileLabel}]
          </span>
        </span>

        {/* C4 — status badge, right-aligned in title bar */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,  // R2-#7: was 10
            fontWeight: 500,
            padding: "2px 7px",  // R2-#7: slightly taller
            borderRadius: radius.full,  // #2: was hardcoded 999 — now uses token
            background: sc.bg,
            color: sc.color,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 7,  // R2-#8: was 6
              height: 7,
              borderRadius: "50%",
              background: sc.dot,
              flexShrink: 0,
            }}
          />
          {/* #35 — status text label provides colorblind accessibility */}
          {sc.label}
        </span>
      </div>

      {/* Source handle (right side — Simulink-style horizontal flow) */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          width: 10,
          height: 10,
          background: accent,
          border: `2px solid ${colors.bg[3]}`,
          right: -5,
        }}
      />

      {/* Target handle (left side — Simulink-style horizontal flow) */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{
          width: 10,
          height: 10,
          background: accent,
          border: `2px solid ${colors.bg[3]}`,
          left: -5,
        }}
      />

      {/* ── Body ── */}
      <div style={{ padding: "8px 10px" }}>
        {/* Sub-workflow indicator */}
        {data.hasSubWorkflow && (
          <div
            style={{
              marginBottom: spacing[4],
              fontSize: 10,
              color: colors.accent.purple,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>🔽</span>
            <span>子工作流</span>
          </div>
        )}

        {/* C7 — description, 3-line clamp with tooltip */}
        {data.desc && (
          <div
            title={data.desc}
            style={{
              fontSize: 11,
              color: colors.text.secondary,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {data.desc}
          </div>
        )}

        {/* C6 — compact footer: model + cost/duration */}
        {(data.model || data.cost !== undefined || data.duration_ms !== undefined) && (
          <div
            style={{
              marginTop: spacing[6],
              paddingTop: spacing[6],
              borderTop: `1px solid ${colors.border.subtle}`,
              display: "flex",
              gap: spacing[8],
              flexWrap: "wrap",
              fontSize: 10,
              color: colors.text.tertiary,
            }}
          >
            {data.model && <span>🧠 {data.model}</span>}
            {data.cost !== undefined && <span>💰 {formatCost(data.cost)}</span>}
            {data.duration_ms !== undefined && (
              <span>⏱ {formatDuration(data.duration_ms)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * R3-P2: custom memo comparator — only re-render when one of the actually
 * visible fields changes (id, status, label). The default shallow compare
 * re-renders whenever `data` (always a new object after reducer updates)
 * changes, even if no visible field did. This skips re-renders for cost /
 * duration / model / index updates when those props are not currently shown
 * (e.g. SSE cost update on a node whose body is collapsed) — but to be safe
 * we also include `selected` so the focus ring is always correct.
 */
export default memo(AgentNode, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.selected === next.selected &&
    prev.data.status === next.data.status &&
    prev.data.label === next.data.label
  );
});
