/* AgentFlow — Simulink-style block library sidebar (draggable module palette) */

import { useState, useEffect, useMemo, useCallback } from "react";
import type { CSSProperties } from "react";
import {
  colors,
  fontSize,
  radius,
  shadow,
  spacing,
  transition,
  BLOCK_LIBRARY_WIDTH_OPEN,
  BLOCK_LIBRARY_WIDTH_COLLAPSED,
} from "./theme";
import { PROFILE_CONFIG } from "./utils";  // #4: single source of profile metadata
import { IconAnalysis, IconDesign, IconDevelop, IconTest, IconDoc, IconDeploy, IconSearch, IconChevronRight } from "./icons";

/** Profile types a user can drag onto the canvas. */
export interface BlockDef {
  profile: string;
  icon: string;
  label: string;
  color: string;
  desc: string;
}

/**
 * `BLOCK_LIBRARY` is derived from the unified `PROFILE_CONFIG` (#4) so the
 * sidebar palette, inspector picker, and node renderer all share one source
 * of truth for icon/label/color/desc per profile.
 */
export const BLOCK_LIBRARY: BlockDef[] = (
  Object.keys(PROFILE_CONFIG) as string[]
).map((profile) => ({
  profile,
  icon: PROFILE_CONFIG[profile].icon,
  label: PROFILE_CONFIG[profile].label,
  color: PROFILE_CONFIG[profile].color,
  desc: PROFILE_CONFIG[profile].desc,
}));

export const DRAG_MIME = "application/agentflow-profile";

const COLLAPSE_KEY = "agentflow:blockLibraryCollapsed";

interface BlockLibraryProps {
  /** Called when the user requests a node be created from the palette. */
  onAddNode?: (profile: string) => void;
  /**
   * P0-2: when true the sidebar renders collapsed regardless of the user's
   * persisted preference. Used by App to auto-collapse on narrow screens
   * (<1024px). The internal toggle still flips localStorage so the user's
   * last choice is restored once the viewport widens again.
   */
  forceCollapsed?: boolean;
}

/**
 * Collapsible left sidebar that acts as a Simulink-style block library.
 * Cards are draggable (HTML5 drag-and-drop); the ReactFlow canvas handles
 * the drop to instantiate a new node. Collapse state is persisted.
 */
export default function BlockLibrary({ onAddNode, forceCollapsed = false }: BlockLibraryProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BLOCK_LIBRARY;
    return BLOCK_LIBRARY.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        b.profile.toLowerCase().includes(q) ||
        b.desc.toLowerCase().includes(q)
    );
  }, [query]);

  // P0-2: auto-collapse on narrow screens; the user's persisted preference
  // is still honoured once the viewport widens again.
  const effectiveCollapsed = collapsed || forceCollapsed;
  const width = effectiveCollapsed ? BLOCK_LIBRARY_WIDTH_COLLAPSED : BLOCK_LIBRARY_WIDTH_OPEN;

  return (
    <aside
      style={{
        width,
        flexShrink: 0,
        height: "100%",
        background: colors.bg[2],
        borderRight: `1px solid ${colors.border.subtle}`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        transition: `width ${transition.base}`,
        overflow: "hidden",
      }}
      aria-label="模块库"
    >
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={effectiveCollapsed ? "展开模块库" : "折叠模块库"}
        aria-expanded={!effectiveCollapsed}
        title={effectiveCollapsed ? "展开模块库" : "折叠模块库"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: 36,
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${colors.border.subtle}`,
          color: colors.text.tertiary,
          cursor: "pointer",
          fontSize: 14,
          transition: `color ${transition.fast}, background ${transition.fast}`,
        }}
      >
        {effectiveCollapsed ? <IconChevronRight size={14} /> : <><span style={{display: "inline-flex", transform: "rotate(180deg)"}}><IconChevronRight size={14} /></span> 模块库</>}
      </button>

      {!effectiveCollapsed && (
        <>
          {/* Search / filter */}
          <div style={{ padding: `${spacing[8]}px ${spacing[8]}px`, borderBottom: `1px solid ${colors.border.subtle}`, position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: colors.text.tertiary, pointerEvents: "none", display: "inline-flex" }}>
              <IconSearch size={14} />
            </span>
            <input
              type="text"
              className="af-search-input"
              aria-label="搜索模块"
              placeholder="搜索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: `7px ${spacing[8]}px 7px 30px`,  // P2: increased padding for 13px font
                background: colors.bg[1],
                border: `1px solid ${colors.border.default}`,
                borderRadius: radius.md,
                color: colors.text.primary,
                fontSize: fontSize.base,  // P2: was 12 — now 13px for better readability
                fontFamily: "inherit",
                minHeight: 32,  // P2: was 28 — accommodate larger font
              }}
            />
          </div>

          {/* Block cards */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: `${spacing[8]}px`,
              display: "flex",
              flexDirection: "column",
              gap: spacing[12],  // #4: was spacing[8](8px) → 12px for breathing room
            }}
          >
            {filtered.length === 0 && (
              <div style={{ fontSize: 11, color: colors.text.tertiary, textAlign: "center", marginTop: 16 }} aria-live="polite">
                无匹配模块
              </div>
            )}
            {filtered.map((block) => (
              <BlockCard
                key={block.profile}
                block={block}
              />
            ))}
          </div>

          {/* Footer hint */}
          <div
            style={{
              padding: `${spacing[8]}px`,
              borderTop: `1px solid ${colors.border.subtle}`,
              fontSize: 11,
              color: colors.text.secondary,  // R2-#10: was tertiary — improve contrast
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            拖拽模块到画布<br />或点击添加
          </div>
        </>
      )}
    </aside>
  );
}

function BlockCard({ block }: { block: BlockDef }) {
  const handleDragStart = useCallback((e: React.DragEvent) => {
    const profile = (e.currentTarget as HTMLElement).dataset.profile;
    if (profile) {
      e.dataTransfer.setData(DRAG_MIME, profile);
      e.dataTransfer.effectAllowed = "copy";
    }
  }, []);

  const profileIcons: Record<string, React.ReactNode> = {
    analysis: <IconAnalysis size={16} />,
    design: <IconDesign size={16} />,
    dev: <IconDevelop size={16} />,
    test: <IconTest size={16} />,
    doc: <IconDoc size={16} />,
    deploy: <IconDeploy size={16} />,
  };
  const iconNode = profileIcons[block.profile] || <span style={{ fontSize: 16, lineHeight: 1 }}>{block.icon}</span>;

  return (
    <div
      className="af-block-card"
      data-profile={block.profile}
      draggable
      onDragStart={handleDragStart}
      role="button"
      tabIndex={0}
      title={`点击或拖拽到画布添加「${block.label}」节点`}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: spacing[8],
        padding: `${spacing[8]}px ${spacing[8]}px ${spacing[8]}px ${spacing[12]}px`,
        background: colors.bg[4],
        border: `1px solid ${colors.border.default}`,
        borderRadius: radius.md,
        cursor: "grab",
        overflow: "hidden",
        boxShadow: shadow.sm,
        willChange: "transform",
        transition: `border-color ${transition.base}, transform ${transition.base}, box-shadow ${transition.base}`,
        "--card-color": block.color,
      } as React.CSSProperties}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
        }
      }}
    >
      {/* Left color accent bar */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: block.color,
        }}
      />
      <span style={{ display: "inline-flex", alignItems: "center", lineHeight: 1, color: block.color }}>{iconNode}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: 12, fontWeight: 600, color: colors.text.primary, margin: 0 }}>{block.label}</h3>
        <div
          className="af-block-library-item-desc"
          style={{
            fontSize: 11,
            color: colors.text.secondary,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {block.desc}
        </div>
      </div>
    </div>
  );
}

/* ── Shared styles for App integration ────────────────────────── */

export const blockLibraryWrapperStyle: CSSProperties = {
  height: "100%",
  flexShrink: 0,
};
