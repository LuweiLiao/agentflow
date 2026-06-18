/* AgentFlow — Design Token System
 *
 * Single source of truth for the visual language. Mirrored as CSS custom
 * properties in `global.css` (for class-based styling) and exported here as
 * TypeScript constants (for React inline styles).
 */

/* ── Color palette ──────────────────────────────────────────────── */

export const colors = {
  /** Surface ramp: bg-0 = deepest, bg-4 = most elevated */
  bg: {
    0: "#0b0d12",
    1: "#0f1117",
    2: "#151823",
    3: "#1a1d2e",
    4: "#232838",
  },
  text: {
    primary: "#e8edf5",
    /** WCAG AA compliant on dark surfaces (contrast >= 4.5:1) */
    secondary: "#a8b3c8",
    tertiary: "#7c869c",
    disabled: "#4a5168",
    inverse: "#0b0d12",
  },
  border: {
    subtle: "#2a2f42",
    default: "#374151",
    bright: "#4b5563",
    accent: "#60a5fa",
  },
  accent: {
    blue: "#60a5fa",
    green: "#34d399",
    purple: "#8b5cf6",
    orange: "#fb923c",
    red: "#f87171",
    yellow: "#fbbf24",
    cyan: "#22d3ee",
  },
  /** Per-profile identity colors */
  profile: {
    analysis: "#3b82f6",
    design: "#8b5cf6",
    dev: "#10b981",
    test: "#f59e0b",
    doc: "#f97316",
    deploy: "#06b6d4",
  },
  status: {
    pending: "#64748b",
    running: "#60a5fa",
    completed: "#34d399",
    failed: "#f87171",
    skipped: "#888888",
    timed_out: "#fbbf24",
    cancelled: "#94a3b8",
  },
} as const;

/* ── Spacing scale ──────────────────────────────────────────────── */

export const spacing = { 4: 4, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32 } as const;
export type Spacing = (typeof spacing)[keyof typeof spacing];

/* ── Border radius ──────────────────────────────────────────────── */

export const radius = { sm: 4, md: 6, lg: 8, xl: 12, "2xl": 16 } as const;
export type Radius = (typeof radius)[keyof typeof radius];

/* ── Shadows ────────────────────────────────────────────────────── */

export const shadow = {
  sm: "0 1px 2px rgba(0,0,0,0.3)",
  md: "0 4px 12px rgba(0,0,0,0.35)",
  lg: "0 8px 24px rgba(0,0,0,0.45)",
  glow: "0 0 0 3px rgba(96,165,250,0.25)",
  hoverLift: "0 6px 18px rgba(0,0,0,0.4)",
} as const;

/* ── Transitions ────────────────────────────────────────────────── */

export const transition = {
  fast: "0.12s ease",
  base: "0.18s ease",
  slow: "0.3s cubic-bezier(0.4,0,0.2,1)",
} as const;

/* ── Z-index layers ─────────────────────────────────────────────── */

export const zIndex = {
  base: 0,
  canvas: 1,
  panel: 10,
  progress: 49,
  toolbar: 50,
  backdrop: 99,
  overlay: 100,
  modal: 1000,
} as const;

/* ── Layout constants ───────────────────────────────────────────── */

/** Full toolbar height (action row + status bar), used to offset overlays. */
export const TOOLBAR_HEIGHT = 104;
export const INSPECTOR_WIDTH = 280;
export const LOG_PANEL_HEIGHT = 160;

/* ── Helpers ────────────────────────────────────────────────────── */

/** Resolve a profile name to its identity color. */
export function profileColor(profile: string | undefined): string {
  if (profile && profile in colors.profile) {
    return colors.profile[profile as keyof typeof colors.profile];
  }
  return colors.accent.purple;
}

/** Format a cost in USD as a human-readable string. */
export function formatCost(cost: number | undefined): string {
  if (cost === undefined || cost === null || Number.isNaN(cost)) return "—";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

/** Format a duration (ms) into a compact human-readable string. */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || ms === null || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}

/* ── CSS custom-property string ─────────────────────────────────── */

/** All design tokens serialised as CSS custom properties for `:root`. */
export const cssVariables = `:root {
  --color-bg-0: ${colors.bg[0]};
  --color-bg-1: ${colors.bg[1]};
  --color-bg-2: ${colors.bg[2]};
  --color-bg-3: ${colors.bg[3]};
  --color-bg-4: ${colors.bg[4]};
  --color-text-primary: ${colors.text.primary};
  --color-text-secondary: ${colors.text.secondary};
  --color-text-tertiary: ${colors.text.tertiary};
  --color-text-disabled: ${colors.text.disabled};
  --color-border-subtle: ${colors.border.subtle};
  --color-border-default: ${colors.border.default};
  --color-border-bright: ${colors.border.bright};
  --color-border-accent: ${colors.border.accent};
  --color-accent-blue: ${colors.accent.blue};
  --color-accent-green: ${colors.accent.green};
  --color-accent-purple: ${colors.accent.purple};
  --color-accent-red: ${colors.accent.red};
  --color-accent-yellow: ${colors.accent.yellow};
  --color-profile-analysis: ${colors.profile.analysis};
  --color-profile-design: ${colors.profile.design};
  --color-profile-dev: ${colors.profile.dev};
  --color-profile-test: ${colors.profile.test};
  --color-profile-doc: ${colors.profile.doc};
  --color-profile-deploy: ${colors.profile.deploy};
  --radius-sm: ${radius.sm}px;
  --radius-md: ${radius.md}px;
  --radius-lg: ${radius.lg}px;
  --radius-xl: ${radius.xl}px;
  --radius-2xl: ${radius["2xl"]}px;
  --toolbar-height: ${TOOLBAR_HEIGHT}px;
  --transition-fast: ${transition.fast};
  --transition-base: ${transition.base};
  --transition-slow: ${transition.slow};
}`;
