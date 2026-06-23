/* AgentFlow — 日志面板组件 (E1–E5) */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { colors, fontSize, radius, spacing, transition } from "./theme";
import { IconSearch, IconTrash } from "./icons";

interface LogPanelProps {
  logs: string[];
  onClear?: () => void;
  /** P0-3: error count to surface as a badge in the header when collapsed. */
  errorCount?: number;
}

type Level = "all" | "info" | "success" | "error" | "warning";

const LEVEL_BUTTONS: { key: Level; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "info", label: "信息" },
  { key: "success", label: "成功" },
  { key: "error", label: "错误" },
  { key: "warning", label: "警告" },
];

function levelOf(line: string): Exclude<Level, "all"> {
  if (line.startsWith("❌") || line.includes("失败")) return "error";
  if (line.startsWith("✅") || line.startsWith("🏁")) return "success";
  if (line.startsWith("⚠️")) return "warning";
  if (line.startsWith("ℹ️") || line.startsWith("📋")) return "warning";
  return "info";
}

function colorForLevel(level: Exclude<Level, "all">): string {
  switch (level) {
    case "error": return colors.status.failed;
    case "success": return colors.status.completed;
    case "warning": return colors.status.timed_out;
    default: return colors.text.secondary;
  }
}

/** P3: left border color bar per log level for visual scanning. */
function borderForLevel(level: Exclude<Level, "all">): string {
  switch (level) {
    case "error": return "3px solid #f87171";
    case "success": return "3px solid #34d399";
    case "warning": return "3px solid #fbbf24";
    default: return "3px solid transparent";
  }
}

const COLLAPSE_KEY = "agentflow:logCollapsed";

export default function LogPanel({ logs, onClear, errorCount = 0 }: LogPanelProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_KEY);
      // P1-#1: default to EXPANDED on first visit (better discoverability).
      // Only honour an explicit stored preference once the user has toggled.
      if (stored === null) return false;
      return stored === "1";
    } catch {
      return false;
    }
  });
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<Level>("all");

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // P1-fix: virtualization state — track scroll position & viewport height so
  // we only render the visible window instead of all ~200 log lines as DOM nodes.
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(60);

  // E5 — persist collapse state
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  // E2 — track whether the user is pinned to the bottom; also capture the
  // current scroll offset for virtualized rendering.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
  }, []);

  useEffect(() => {
    if (collapsed) return;
    if (!stickToBottom.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs, collapsed, query, level]);

  // E1 + E4 — filter by text + level
  const visibleLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((line) => {
      if (level !== "all" && levelOf(line) !== level) return false;
      if (q && !line.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [logs, query, level]);

  const counts = useMemo(() => {
    const c = { all: logs.length, info: 0, success: 0, error: 0, warning: 0 };
    for (const l of logs) c[levelOf(l)]++;
    return c;
  }, [logs]);

  // P1-fix: measure the scroll viewport height via ResizeObserver so the
  // virtualization window adapts when the panel collapses/expands.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setViewportH(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [collapsed]);

  // P1-fix: virtualization — compute the visible window [start, end) so only
  // a handful of <div>s are rendered instead of the full log array.
  const ITEM_HEIGHT = 17; // fontSize 11 × lineHeight 1.55 ≈ 17px
  const RENDER_BUFFER = 6;
  const totalItems = visibleLogs.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - RENDER_BUFFER);
  const visibleCount = Math.ceil(viewportH / ITEM_HEIGHT) + RENDER_BUFFER * 2;
  const endIndex = Math.min(totalItems, startIndex + visibleCount);
  const renderSlice = visibleLogs.slice(startIndex, endIndex);
  const totalHeight = totalItems * ITEM_HEIGHT;

  return (
    <div
      className="af-log-panel"
      style={{
        flexShrink: 0,
        background: colors.bg[1],
        borderTop: `1px solid ${colors.border.subtle}`,
        height: collapsed ? 32 : 120,  // #6: was 36, actual DOM was 28 — now 32 matches header padding
        display: "flex",
        flexDirection: "column",
        transition: `height ${transition.base}`,
      }}
    >
      {/* Header (clickable to collapse) */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        aria-controls="log-panel-content"
        aria-label={collapsed ? "展开日志面板" : "折叠日志面板"}
        onClick={() => setCollapsed((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setCollapsed((v) => !v);
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing[8],
          padding: `8px ${spacing[12]}px`,  // #23: was 6px — increase to fill 32px height properly
          cursor: "pointer",
          userSelect: "none",
          borderBottom: collapsed ? "none" : `1px solid ${colors.border.subtle}`,
        }}
      >
        <span style={{ fontSize: 11, color: colors.text.tertiary }}>▾</span>  {/* #12: was 10 — too small */}
        <h2 style={{ fontSize: 11, fontWeight: 600, color: colors.text.secondary, margin: 0 }}>
          日志
        </h2>
        <span style={{ fontSize: 10, color: colors.text.tertiary }}>
          ({visibleLogs.length}/{logs.length})
        </span>
        {/* P0-3: error-count badge — only surfaced when the panel is collapsed
            so users notice problems without expanding the log dock. Uses the
            internally-tallied error-log count (counts.error) which is the
            authoritative source; the optional `errorCount` prop overrides it
            when a caller supplies a different metric. */}
        {collapsed && (errorCount || counts.error) > 0 && (
          <span
            aria-label={`${errorCount || counts.error} 条错误日志`}
            title={`${errorCount || counts.error} 条错误日志`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              borderRadius: radius.full,
              background: colors.status.failed,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {errorCount || counts.error}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {/* E3 — clear logs */}
        {onClear && !collapsed && (
          <button
            type="button"
            aria-label="清空日志"
            title="清空日志"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            style={{
              background: "transparent",
              border: "none",
              color: colors.text.tertiary,
              cursor: "pointer",
              fontSize: 12,
              padding: "2px 6px",
              borderRadius: radius.sm,
            }}
            className="af-log-clear-btn"
          >
            <IconTrash size={14} />
          </button>
        )}
        <span style={{ fontSize: 11, color: colors.text.secondary }}>  {/* R2-#10: was tertiary */}
          {collapsed ? "▸ 展开" : "▾ 折叠"}
        </span>
      </div>

      {!collapsed && (
        <div id="log-panel-content">
          {/* Filter row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[8],
              padding: `4px ${spacing[12]}px`,
              borderBottom: `1px solid ${colors.border.subtle}`,
            }}
          >
            {/* E1 — search input */}
            <div style={{ position: "relative", flex: 1, maxWidth: 240 }}>
              <span style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", color: colors.text.tertiary, pointerEvents: "none", display: "inline-flex" }}>
                <IconSearch size={12} />
              </span>
              <input
                type="text"
                aria-label="搜索日志"
                placeholder="搜索日志..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "5px 8px 5px 24px",  // P2: increased padding for 13px font
                  background: colors.bg[2],
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: radius.md,
                  color: colors.text.primary,
                  fontSize: fontSize.base,  // P2: was 11 — now 13px
                  fontFamily: "inherit",
                  minHeight: 30,  // P2: ensure comfortable height
                }}
              />
            </div>
            {/* E4 — level filter buttons as radio group */}
            <div style={{ display: "flex", gap: 2 }} role="radiogroup" aria-label="日志级别过滤">
              {LEVEL_BUTTONS.map((b) => {
                const active = level === b.key;
                return (
                  <button
                    key={b.key}
                    type="button"
                    className="af-log-level-btn"
                    role="radio"
                    aria-pressed={active}
                    aria-checked={active}
                    onClick={() => setLevel(b.key)}
                    style={{
                      padding: "2px 8px",
                      fontSize: 10,
                      borderRadius: radius.sm,
                      cursor: "pointer",
                      border: "none",
                      background: active ? colors.bg[4] : "transparent",
                      color: active ? colors.text.primary : colors.text.tertiary,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {b.label}
                    {b.key !== "all" && counts[b.key as Exclude<Level, "all">] > 0 && (
                      <span style={{ marginLeft: 3, opacity: 0.7 }}>
                        {counts[b.key as Exclude<Level, "all">]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* #33 — aria-live scoped to summary, not entire list.
              aria-relevant="additions" ensures screen readers only announce
              newly appended log lines instead of re-announcing the whole list
              whenever React reconciles the virtualized slice. */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            role="log"
            aria-label="运行日志"
            aria-live="polite"
            aria-relevant="additions text"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: `4px ${spacing[12]}px`,
            }}
          >
            <div style={{ fontSize: 11, lineHeight: 1.55, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
              {visibleLogs.length === 0 ? (
                <div style={{ color: colors.text.tertiary, padding: "8px 0", textAlign: "center" }}>
                  {logs.length === 0
                    ? "执行工作流后将在此显示运行日志"
                    : "没有匹配的日志"}
                </div>
              ) : (
                /* P1-fix: virtualized list — render only the visible window.
                   A spacer div preserves total scroll height; a translateY
                   offsets the slice to the correct position. */
                <div style={{ height: totalHeight, position: "relative" }}>
                  <div style={{ transform: `translateY(${startIndex * ITEM_HEIGHT}px)` }}>
                    {renderSlice.map((line, i) => {
                      const lv = levelOf(line);
                      return (
                        <div
                          key={`${startIndex + i}-${line.slice(0, 24)}`}
                          className="af-log-entry"
                          style={{
                            color: colorForLevel(lv),
                            height: ITEM_HEIGHT,
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            borderLeft: borderForLevel(lv),
                            paddingLeft: 6,
                          }}
                        >
                          {/* P3: line number column (light gray, right-aligned, 30px) */}
                          <span
                            style={{
                              width: 30,
                              flexShrink: 0,
                              textAlign: "right",
                              paddingRight: 8,
                              color: colors.text.tertiary,
                              opacity: 0.5,
                              userSelect: "none",
                              fontSize: 10,
                            }}
                          >
                            {startIndex + i + 1}
                          </span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {line}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
