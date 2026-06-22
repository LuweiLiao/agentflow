/* AgentFlow — Shared style constants (token-driven) */

import type { CSSProperties } from "react";
import {
  colors,
  fontSize,
  radius,
  shadow,
  spacing,
  transition,
  zIndex,
  INSPECTOR_WIDTH,
  LOG_PANEL_HEIGHT,
  TOOLBAR_HEIGHT,
} from "./theme";

export {
  colors,
  fontSize,
  radius,
  shadow,
  spacing,
  transition,
  zIndex,
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
  boxShadow: shadow.toolbarGlow,
  position: "relative",
  zIndex: zIndex.toolbar,
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
  fontSize: fontSize.xl,  // #10/#19: was hardcoded 17 — now uses token (xl=18)
  fontWeight: 700,
  color: colors.text.primary,
  whiteSpace: "nowrap",
  letterSpacing: "0.01em",
};

/* ── Requirement input ─────────────────────────────────────────── */

export const reqInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 300,  // #2: was 220 — ensure usable width
  maxWidth: 520,
  padding: `${spacing[8]}px ${spacing[12]}px`,
  background: colors.bg[1],
  border: `1px solid ${colors.border.default}`,
  borderRadius: radius.md,
  color: colors.text.primary,
  fontSize: fontSize.base,  // #10: token-driven (base=13)
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
  fontSize: fontSize.base,  // #10: token-driven (base=13)
  fontWeight: 600,
  // R2-#10: cursor handled by CSS — inline cursor was overriding :disabled state
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
  padding: `${spacing[8]}px ${spacing[10]}px`,  // #1: was hardcoded 10px — now uses spacing[10]
  background: "transparent",
  border: `1px solid ${colors.border.default}`,
  borderRadius: radius.md,
  color: colors.text.secondary,
  fontSize: fontSize.md,  // #10: token-driven (md=14)
  // R2-#10: cursor handled by CSS — inline cursor was overriding :disabled state
  lineHeight: 1,
  transition: `background ${transition.fast}, border-color ${transition.fast}, color ${transition.fast}`,
};

export const selectMiniStyle: CSSProperties = {
  padding: `${spacing[8]}px ${spacing[10]}px`,  // #1: was hardcoded 10px — now uses spacing[10]
  background: colors.bg[1],
  border: `1px solid ${colors.border.default}`,
  borderRadius: radius.md,
  color: colors.text.secondary,
  fontSize: fontSize.base,  // #10: was hardcoded 12 (between sm/base) — bump to base=13
  maxWidth: 180,  // #3: cap width — was unbounded at 387px
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
  fontSize: fontSize.sm,  // #10: was hardcoded 12 — use sm=11 (status-bar context)
  color: colors.text.secondary,  // R2-#10: was tertiary (fgB=154) — below WCAG AA at 11px
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
  fontSize: fontSize.base,  // #10: token-driven (base=13)
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
  borderRadius: radius.md,  // #1/#2: was missing — inner buttons had 0 while container had 6
  background: "transparent",
  color: colors.text.secondary,
  fontSize: fontSize.base,  // #10: token-driven (base=13)
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: `background ${transition.fast}, color ${transition.fast}`,
};

export const runGroupRunBtn: CSSProperties = {
  ...runGroupBtnBase,
  background: "rgba(52,211,153,0.18)",  // #15: was 0.16 — match AI编排 brightness level
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
