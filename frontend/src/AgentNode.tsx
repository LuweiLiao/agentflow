import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

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
};

const PROFILE_LABELS: Record<string, string> = {
  analysis: "分析",
  design: "设计",
  dev: "开发",
  test: "测试",
  doc: "文档",
  deploy: "部署",
};

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#2d2d2d", color: "#666", label: "等待" },
  running:   { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", label: "运行中" },
  completed: { bg: "rgba(16,185,129,0.15)", color: "#34d399", label: "完成" },
  failed:    { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "失败" },
  skipped:   { bg: "rgba(100,100,100,0.15)", color: "#888", label: "跳过" },
  timed_out: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", label: "超时" },
};

function AgentNode({ data, selected }: NodeProps<AgentNodeData>) {
  const sc = STATUS_CONFIG[data.status || "pending"] || STATUS_CONFIG.pending;
  const profileLabel = PROFILE_LABELS[data.profile] || data.profile;

  return (
    <div
      style={{
        background: "#1a1d2e",
        border: `2px solid ${selected ? "#60a5fa" : data.color || "#374151"}`,
        borderRadius: 10,
        padding: "10px 14px",
        minWidth: 200,
        maxWidth: 280,
        boxShadow: selected
          ? "0 0 0 2px rgba(59,130,246,0.3), 0 4px 20px rgba(0,0,0,0.4)"
          : "0 2px 8px rgba(0,0,0,0.3)",
        cursor: "pointer",
        transition: "box-shadow 0.15s, border-color 0.15s",
        position: "relative",
      }}
    >
      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 10,
          height: 10,
          background: data.color || "#60a5fa",
          border: "2px solid #1a1d2e",
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
          background: data.color || "#60a5fa",
          border: "2px solid #1a1d2e",
          top: -5,
        }}
      />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 22 }}>{data.icon || "🤖"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e2e8f0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {data.label || "未命名"}
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>
            [{profileLabel}]
          </div>
        </div>

        {/* Status badge */}
        <span
          style={{
            fontSize: 10,
            padding: "2px 6px",
            borderRadius: 4,
            background: sc.bg,
            color: sc.color,
            whiteSpace: "nowrap",
          }}
        >
          {sc.label}
        </span>
      </div>

      {/* Description */}
      {data.desc && (
        <div
          style={{
            fontSize: 11,
            color: "#94a3b8",
            lineHeight: 1.4,
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {data.desc}
        </div>
      )}

      {/* Footer: model + cost */}
      {(data.model || data.cost !== undefined) && (
        <div
          style={{
            marginTop: 6,
            display: "flex",
            gap: 8,
            fontSize: 10,
            color: "#64748b",
          }}
        >
          {data.model && <span>🧠 {data.model}</span>}
          {data.cost !== undefined && (
            <span>💰 ${data.cost.toFixed(4)}</span>
          )}
          {data.duration_ms !== undefined && (
            <span>⏱ {data.duration_ms}ms</span>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(AgentNode);
