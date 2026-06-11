/* AgentFlow — 日志面板组件 */

interface LogPanelProps {
  logs: string[];
}

function colorForLine(line: string): React.CSSProperties {
  if (line.startsWith("❌") || line.includes("失败")) return { color: "#f87171" };
  if (line.startsWith("✅") || line.startsWith("🏁")) return { color: "#34d399" };
  if (line.startsWith("▶️") || line.startsWith("🤖")) return { color: "#60a5fa" };
  if (line.startsWith("ℹ️") || line.startsWith("📋")) return { color: "#fbbf24" };
  return {};
}

export default function LogPanel({ logs }: LogPanelProps) {
  return (
    <div
      style={{
        height: 140,
        overflowY: "auto",
        padding: "6px 12px",
        background: "#111318",
        borderTop: "1px solid #2d2d2d",
      }}
    >
      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
        📜 日志
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, fontFamily: "monospace" }}>
        {logs.map((line, i) => (
          <div key={i}>
            <span style={colorForLine(line)}>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
