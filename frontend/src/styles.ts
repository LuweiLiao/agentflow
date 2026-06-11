/* AgentFlow — 共享样式常量 */

import type { CSSProperties } from "react";

export const containerStyle: CSSProperties = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#0f1117",
  color: "#e2e8f0",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  overflow: "hidden",
};

export const toolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  background: "#1a1d2e",
  borderBottom: "1px solid #2d2d2d",
  flexWrap: "wrap",
};

export const reqInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 200,
  padding: "6px 10px",
  background: "#0f1117",
  border: "1px solid #374151",
  borderRadius: 6,
  color: "#e2e8f0",
  fontSize: 12,
  resize: "none",
  fontFamily: "inherit",
};

export const btnStyle: CSSProperties = {
  padding: "6px 14px",
  background: "rgba(59,130,246,0.12)",
  border: "1px solid rgba(59,130,246,0.3)",
  borderRadius: 6,
  color: "#60a5fa",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const btnMiniStyle: CSSProperties = {
  padding: "4px 8px",
  background: "transparent",
  border: "1px solid #374151",
  borderRadius: 6,
  color: "#94a3b8",
  fontSize: 14,
  cursor: "pointer",
};

export const selectMiniStyle: CSSProperties = {
  padding: "4px 8px",
  background: "#0f1117",
  border: "1px solid #374151",
  borderRadius: 6,
  color: "#94a3b8",
  fontSize: 11,
  cursor: "pointer",
};

/** 运行按钮的绿色样式 */
export const runBtnStyle: CSSProperties = {
  ...btnStyle,
  background: "rgba(16,185,129,0.12)",
  color: "#34d399",
};
