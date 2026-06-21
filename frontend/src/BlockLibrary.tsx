/* AgentFlow — Simulink-style block library sidebar (draggable module palette) */

import { useState, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import {
  colors,
  radius,
  shadow,
  spacing,
  transition,
  BLOCK_LIBRARY_WIDTH_OPEN,
  BLOCK_LIBRARY_WIDTH_COLLAPSED,
} from "./theme";

/** Profile types a user can drag onto the canvas. */
export interface BlockDef {
  profile: string;
  icon: string;
  label: string;
  color: string;
  desc: string;
}

export const BLOCK_LIBRARY: BlockDef[] = [
  { profile: "analysis", icon: "📊", label: "分析", color: colors.profile.analysis, desc: "需求分析与方案调研" },
  { profile: "design", icon: "🏗️", label: "设计", color: colors.profile.design, desc: "架构设计与接口定义" },
  { profile: "dev", icon: "💻", label: "开发", color: colors.profile.dev, desc: "编码实现核心逻辑" },
  { profile: "test", icon: "🧪", label: "测试", color: colors.profile.test, desc: "单元测试与质量验证" },
  { profile: "doc", icon: "📝", label: "文档", color: colors.profile.doc, desc: "文档编写与说明" },
  { profile: "deploy", icon: "🚀", label: "部署", color: colors.profile.deploy, desc: "部署与上线发布" },
];

export const DRAG_MIME = "application/agentflow-profile";

const COLLAPSE_KEY = "agentflow:blockLibraryCollapsed";

interface BlockLibraryProps {
  /** Called when the user requests a node be created from the palette. */
  onAddNode?: (profile: string) => void;
}

/**
 * Collapsible left sidebar that acts as a Simulink-style block library.
 * Cards are draggable (HTML5 drag-and-drop); the ReactFlow canvas handles
 * the drop to instantiate a new node. Collapse state is persisted.
 */
export default function BlockLibrary({ onAddNode }: BlockLibraryProps) {
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

  const width = collapsed ? BLOCK_LIBRARY_WIDTH_COLLAPSED : BLOCK_LIBRARY_WIDTH_OPEN;

  const handleDragStart = (e: React.DragEvent, profile: string) => {
    e.dataTransfer.setData(DRAG_MIME, profile);
    e.dataTransfer.effectAllowed = "copy";
  };

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
        aria-label={collapsed ? "展开模块库" : "折叠模块库"}
        aria-expanded={!collapsed}
        title={collapsed ? "展开模块库" : "折叠模块库"}
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
        {collapsed ? "▶" : "◀ 模块库"}
      </button>

      {!collapsed && (
        <>
          {/* Search / filter */}
          <div style={{ padding: `${spacing[8]}px ${spacing[8]}px`, borderBottom: `1px solid ${colors.border.subtle}` }}>
            <input
              type="text"
              aria-label="搜索模块"
              placeholder="🔍 搜索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: `${spacing[6] || 6}px ${spacing[8]}px`,  // #5: was 4px → 6px vertical padding for taller input
                background: colors.bg[1],
                border: `1px solid ${colors.border.default}`,
                borderRadius: radius.md,
                color: colors.text.primary,
                fontSize: 12,
                fontFamily: "inherit",
                outline: "none",
                minHeight: 28,  // #5: ensure at least 28px height
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
              <div style={{ fontSize: 11, color: colors.text.tertiary, textAlign: "center", marginTop: 16 }}>
                无匹配模块
              </div>
            )}
            {filtered.map((block) => (
              <BlockCard
                key={block.profile}
                block={block}
                onDragStart={(e) => handleDragStart(e, block.profile)}
                onAdd={() => onAddNode?.(block.profile)}
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

function BlockCard({
  block,
  onDragStart,
  onAdd,
}: {
  block: BlockDef;
  onDragStart: (e: React.DragEvent) => void;
  onAdd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDoubleClick={onAdd}
      role="button"
      tabIndex={0}
      title={`拖拽到画布添加「${block.label}」节点`}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: spacing[8],
        padding: `${spacing[8]}px ${spacing[8]}px ${spacing[8]}px ${spacing[12]}px`,
        background: colors.bg[4],  // #14: was bg[3](brightness=34) same as aside — use bg[4](brightness=46) for card elevation
        border: `1px solid ${colors.border.default}`,
        borderRadius: radius.md,
        cursor: "grab",
        overflow: "hidden",
        boxShadow: shadow.sm,
        willChange: "transform",  // #50: prevent paint jitter on hover
        transition: `border-color ${transition.fast}, transform ${transition.fast}, box-shadow ${transition.fast}`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = block.color;
        el.style.transform = "translateY(-1px)";
        el.style.boxShadow = shadow.hoverLift;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = colors.border.default;
        el.style.transform = "";
        el.style.boxShadow = shadow.sm;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAdd();
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
          width: 4,  // #6: was 3 — too thin to be noticeable
          background: block.color,
        }}
      />
      <span style={{ fontSize: 16, lineHeight: 1 }}>{block.icon}</span>  {/* #19: was 18 — too large for 51px card */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.text.primary }}>{block.label}</div>
        <div
          style={{
            fontSize: 11,  // #16: was 10 — too small
            color: colors.text.secondary,  // #16: was tertiary(154) — too low contrast, bump to secondary(182)
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
