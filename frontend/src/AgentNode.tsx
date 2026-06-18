import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { colors, shadow, formatCost, formatDuration } from "./theme";

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
};

const PROFILE_LABELS: Record<string, string> = {
  analysis: "分析",
  design: "设计",
  dev: "开发",
  test: "测试",
  doc: "文档",
  deploy: "部署",
};

type StatusConfig = { bg: string; color: string; label: string; dot: string };

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    bg: "rgba(100,116,139,0.16)",
    color: colors.text.secondary,
    dot: colors.status.pending,
    label: "等待",
  },
  running: {
    bg: "rgba(96,165,250,0.16)",
    color: colors.status.running,
    dot: colors.status.running,
    label: "运行中",
  },
  completed: {
    bg: "rgba(52,211,153,0.16)",
    color: colors.status.completed,
    dot: colors.status.completed,
    label: "完成",
  },
  failed: {
    bg: "rgba(248,113,113,0.16)",
    color: colors.status.failed,
    dot: colors.status.failed,
    label: "失败",
  },
  skipped: {
    bg: "rgba(136,136,136,0.16)",
    color: "#a0a0a0",
    dot: colors.status.skipped,
    label: "跳过",
  },
  timed_out: {
    bg: "rgba(251,191,36,0.16)",
    color: colors.status.timed_out,
    dot: colors.status.timed_out,
    label: "超时",
  },
  cancelled: {
    bg: "rgba(148,163,184,0.16)",
    color: colors.text.secondary,
    dot: colors.status.cancelled,
    label: "已取消",
  },
};

function AgentNode({ data, selected }: NodeProps<Node<AgentNodeData>>) {
  const statusKey = data.status || "pending";
  const sc = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
  const profileLabel = PROFILE_LABELS[data.profile] || data.profile;
  const accent = data.color || colors.accent.purple;
  const isRunning = statusKey === "running";

  const cardClass = [
    "agentflow-node-card",
    isRunning ? "agentflow-node--running" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClass}
      style={{
        position: "relative",
        background: colors.bg[3],
        border: `2px solid ${selected ? colors.accent.blue : accent}`,
        borderRadius: 10,
        padding: "10px 14px 10px 18px",
        minWidth: 208,
        maxWidth: 280,
        boxShadow: selected
          ? `0 0 0 2px rgba(96,165,250,0.3), ${shadow.lg}`
          : shadow.md,
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      {/* C5 — left accent bar (profile identity) */}
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

      {/* C1 — index badge */}
      {data.index !== undefined && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: -9,
            left: -9,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: accent,
            color: colors.text.inverse,
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: shadow.sm,
            zIndex: 2,
          }}
        >
          {data.index}
        </span>
      )}

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 10,
          height: 10,
          background: accent,
          border: `2px solid ${colors.bg[3]}`,
          bottom: -5,
        }}
      />

      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 10,
          height: 10,
          background: accent,
          border: `2px solid ${colors.bg[3]}`,
          top: -5,
        }}
      />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{data.icon || "🤖"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: colors.text.primary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {data.label || "未命名"}
          </div>
          <div style={{ fontSize: 10, color: colors.text.tertiary }}>
            [{profileLabel}]
          </div>
        </div>

        {/* C4 — status badge with dot indicator */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 500,
            padding: "2px 8px",
            borderRadius: 999,
            background: sc.bg,
            color: sc.color,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: sc.dot,
              flexShrink: 0,
            }}
          />
          {sc.label}
        </span>
      </div>

      {/* Sub-workflow indicator */}
      {data.hasSubWorkflow && (
        <div
          style={{
            marginTop: 4,
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

      {/* C7 — description, 3-line clamp, lighter color */}
      {data.desc && (
        <div
          style={{
            fontSize: 11,
            color: colors.text.secondary,
            lineHeight: 1.45,
            marginTop: 2,
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

      {/* C6 — footer: model + formatted cost/duration */}
      {(data.model || data.cost !== undefined || data.duration_ms !== undefined) && (
        <div
          style={{
            marginTop: 6,
            display: "flex",
            gap: 8,
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
  );
}

export default memo(AgentNode);
