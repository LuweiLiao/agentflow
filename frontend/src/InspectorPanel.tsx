import type { WorkflowNode } from "./types";

type InspectorPanelProps = {
  node: WorkflowNode | null;
  onUpdate: (id: string, updates: Partial<WorkflowNode>) => void;
  onDelete: (id: string) => void;
  graphInfo: { nodes: number; edges: number };
};

const PROFILE_OPTIONS = [
  { value: "analysis", label: "分析型", color: "#3b82f6" },
  { value: "design", label: "设计型", color: "#8b5cf6" },
  { value: "dev", label: "开发型", color: "#10b981" },
  { value: "test", label: "测试型", color: "#f59e0b" },
  { value: "doc", label: "文档型", color: "#f97316" },
  { value: "deploy", label: "部署型", color: "#06b6d4" },
];

export default function InspectorPanel({ node, onUpdate, onDelete, graphInfo }: InspectorPanelProps) {
  if (!node) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>📋 检查器</div>
        <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 40 }}>
          选择节点查看详情
        </div>
        <div
          style={{
            marginTop: 30,
            padding: "10px 0",
            borderTop: "1px solid #2d2d2d",
            fontSize: 11,
            color: "#94a3b8",
          }}
        >
          <div>节点: {graphInfo.nodes}</div>
          <div>连线: {graphInfo.edges}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span>{node.icon || "🤖"}</span> {node.label || "未命名"}
      </div>

      {/* Label */}
      <div style={fieldStyle}>
        <label style={labelStyle}>标签</label>
        <input
          style={inputStyle}
          value={node.label}
          onChange={(e) => onUpdate(node.id, { label: e.target.value })}
        />
      </div>

      {/* Description */}
      <div style={fieldStyle}>
        <label style={labelStyle}>描述</label>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: 50 }}
          value={node.desc}
          onChange={(e) => onUpdate(node.id, { desc: e.target.value })}
        />
      </div>

      {/* Profile */}
      <div style={fieldStyle}>
        <label style={labelStyle}>角色</label>
        <select
          style={selectStyle}
          value={node.profile}
          onChange={(e) => onUpdate(node.id, { profile: e.target.value as any })}
        >
          {PROFILE_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.icon} {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Model */}
      <div style={fieldStyle}>
        <label style={labelStyle}>模型</label>
        <input
          style={inputStyle}
          value={node.model || ""}
          placeholder="默认模型"
          onChange={(e) => onUpdate(node.id, { model: e.target.value || undefined })}
        />
      </div>

      {/* Status */}
      <div style={fieldStyle}>
        <label style={labelStyle}>状态</label>
        <div
          style={{
            fontSize: 11,
            padding: "4px 8px",
            borderRadius: 4,
            background:
              node.status === "completed"
                ? "rgba(16,185,129,0.15)"
                : node.status === "running"
                ? "rgba(59,130,246,0.15)"
                : node.status === "failed"
                ? "rgba(239,68,68,0.15)"
                : "transparent",
            color:
              node.status === "completed"
                ? "#34d399"
                : node.status === "running"
                ? "#60a5fa"
                : node.status === "failed"
                ? "#f87171"
                : "#64748b",
          }}
        >
          {node.status || "pending"}
          {node.cost !== undefined && ` · $${node.cost.toFixed(4)}`}
          {node.duration_ms !== undefined && ` · ${node.duration_ms}ms`}
        </div>
      </div>

      {/* Dependencies */}
      {node.depends_on && node.depends_on.length > 0 && (
        <div style={fieldStyle}>
          <label style={labelStyle}>依赖</label>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {node.depends_on.join(", ")}
          </div>
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={() => onDelete(node.id)}
        style={{
          marginTop: 12,
          width: "100%",
          padding: "6px 10px",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 6,
          color: "#f87171",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        🗑 删除节点
      </button>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "#1a1d2e",
  borderLeft: "1px solid #2d2d2d",
  padding: 16,
  width: 260,
  overflowY: "auto",
  height: "100%",
  boxSizing: "border-box",
};

const headerStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#e2e8f0",
  marginBottom: 16,
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const fieldStyle: React.CSSProperties = {
  marginBottom: 12,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "#94a3b8",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  background: "#0f1117",
  border: "1px solid #374151",
  borderRadius: 6,
  color: "#e2e8f0",
  fontSize: 12,
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};
