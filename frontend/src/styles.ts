/* AgentFlow — Shared style constants (token-driven) */

import type { CSSProperties } from "react";
import {
  colors,
  radius,
  shadow,
  spacing,
  transition,
  INSPECTOR_WIDTH,
  LOG_PANEL_HEIGHT,
  TOOLBAR_HEIGHT,
} from "./theme";

export {
  colors,
  radius,
  shadow,
  spacing,
  transition,
  INSPECTOR_WIDTH,
  LOG_PANEL_HEIGHT,
  TOOLBAR_HEIGHT,
};

/* ── App shell ─────────────────────────────────────────────────── */

export const containerStyle: CSSProperties = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  background: colors.bg[0],
  color: colors.text.primary,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif',
  overflow: "hidden",
};

/* ── Toolbar ───────────────────────────────────────────────────── */

/** Premium toolbar: subtle gradient + bottom glow, no flex-wrap. */
export const toolbarStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
  background: `linear-gradient(180deg, ${colors.bg[3]} 0%, ${colors.bg[2]} 100%)`,
  borderBottom: `1px solid ${colors.border.subtle}`,
  boxShadow: "0 1px 0 rgba(96,165,250,0.06), 0 4px 16px rgba(0,0,0,0.3)",
  position: "relative",
  zIndex: 50,
};

/** Top action row: logo + requirement + primary actions  |  utility buttons. */
export const toolbarRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing[8],
  padding: `${spacing[8]}px ${spacing[12]}px`,
  minWidth: 0,
};

export const toolbarLeftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing[8],
  flex: 1,
  minWidth: 0,
};

export const toolbarRightStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing[4],
  flexShrink: 0,
};

/** Thin vertical divider between button groups. */
export const toolbarDividerStyle: CSSProperties = {
  width: 1,
  height: 22,
  background: colors.border.default,
  margin: `0 ${spacing[4]}px`,
  flexShrink: 0,
};

export const logoStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: colors.text.primary,
  whiteSpace: "nowrap",
  letterSpacing: "0.01em",
};

/* ── Requirement input ─────────────────────────────────────────── */

export const reqInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 220,
  maxWidth: 520,
  padding: `${spacing[8]}px ${spacing[12]}px`,
  background: colors.bg[1],
  border: `1px solid ${colors.border.default}`,
  borderRadius: radius.md,
  color: colors.text.primary,
  fontSize: 13,
  lineHeight: 1.45,
  resize: "none",
  fontFamily: "inherit",
  transition: `border-color ${transition.fast}, box-shadow ${transition.fast}`,
  overflow: "hidden",
};

/* ── Buttons ───────────────────────────────────────────────────── */

export const btnStyle: CSSProperties = {
  padding: `${spacing[8]}px ${spacing[16]}px`,
  background: "rgba(59,130,246,0.14)",
  border: "1px solid rgba(59,130,246,0.35)",
  borderRadius: radius.md,
  color: colors.accent.blue,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: `transform ${transition.fast}, box-shadow ${transition.fast}, background ${transition.fast}, opacity ${transition.fast}`,
};

export const runBtnStyle: CSSProperties = {
  ...btnStyle,
  background: "rgba(16,185,129,0.14)",
  borderColor: "rgba(16,185,129,0.4)",
  color: colors.accent.green,
};

export const btnMiniStyle: CSSProperties = {
  padding: `${spacing[8]}px 10px`,
  background: "transparent",
  border: `1px solid ${colors.border.default}`,
  borderRadius: radius.md,
  color: colors.text.secondary,
  fontSize: 14,
  cursor: "pointer",
  lineHeight: 1,
  transition: `background ${transition.fast}, border-color ${transition.fast}, color ${transition.fast}`,
};

export const selectMiniStyle: CSSProperties = {
  padding: `${spacing[8]}px 10px`,
  background: colors.bg[1],
  border: `1px solid ${colors.border.default}`,
  borderRadius: radius.md,
  color: colors.text.secondary,
  fontSize: 12,
  cursor: "pointer",
};

/* ── Status bar (toolbar bottom) ───────────────────────────────── */

export const toolbarStatusBarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing[16],
  padding: `${spacing[4]}px ${spacing[12]}px`,
  borderTop: `1px solid ${colors.border.subtle}`,
  background: colors.bg[1],
  fontSize: 11,
  color: colors.text.tertiary,
};

/* ── Progress bar (below toolbar) ──────────────────────────────── */

export const progressBarWrapStyle: CSSProperties = {
  height: 4,
  background: colors.bg[1],
  display: "flex",
  overflow: "hidden",
  borderBottom: `1px solid ${colors.border.subtle}`,
};

/* ── Utility helpers reused across panels ──────────────────────── */

export const iconBtnBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  color: colors.text.tertiary,
  cursor: "pointer",
  padding: spacing[4],
  borderRadius: radius.sm,
  fontSize: 13,
  transition: `background ${transition.fast}, color ${transition.fast}`,
};

/* ── Run-control button group (Simulink Start/Pause/Stop) ──────── */

/** Container that visually groups the Run / Pause / Stop transport buttons. */
export const runGroupStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0,
  borderRadius: radius.md,
  overflow: "hidden",
  border: `1px solid ${colors.border.default}`,
};

/** Shared base for each transport button inside the run group. */
export const runGroupBtnBase: CSSProperties = {
  padding: `${spacing[8]}px ${spacing[12]}px`,
  border: "none",
  borderRight: `1px solid ${colors.border.subtle}`,
  background: "transparent",
  color: colors.text.secondary,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: `background ${transition.fast}, color ${transition.fast}`,
};

export const runGroupRunBtn: CSSProperties = {
  ...runGroupBtnBase,
  background: "rgba(16,185,129,0.16)",
  color: colors.accent.green,
};

export const runGroupPauseBtn: CSSProperties = {
  ...runGroupBtnBase,
  background: "rgba(251,191,36,0.14)",
  color: colors.accent.yellow,
};

export const runGroupStopBtn: CSSProperties = {
  ...runGroupBtnBase,
  background: "rgba(248,113,113,0.14)",
  color: colors.accent.red,
  borderRight: "none",
};

/** The auto-layout toolbar button (sits near canvas controls). */
export const layoutBtnStyle: CSSProperties = {
  ...btnMiniStyle,
  background: "rgba(96,165,250,0.12)",
  borderColor: "rgba(96,165,250,0.35)",
  color: colors.accent.blue,
};
