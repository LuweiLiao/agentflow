/* AgentFlow — 日志面板组件 (E1–E5) */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { colors, radius, spacing, transition } from "./theme";

interface LogPanelProps {
  logs: string[];
  onClear?: () => void;
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

const COLLAPSE_KEY = "agentflow:logCollapsed";

export default function LogPanel({ logs, onClear }: LogPanelProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_KEY);
      // Default to collapsed if no stored preference
      if (stored === null) return true;
      return stored === "1";
    } catch {
      return true;
    }
  });
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<Level>("all");

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // E5 — persist collapse state
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  // E2 — track whether the user is pinned to the bottom.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
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

  return (
    <div
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
        <span style={{ fontSize: 11, fontWeight: 600, color: colors.text.secondary }}>
          📜 日志
        </span>
        <span style={{ fontSize: 10, color: colors.text.tertiary }}>
          ({visibleLogs.length}/{logs.length})
        </span>
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
          >
            🗑
          </button>
        )}
        <span style={{ fontSize: 11, color: colors.text.secondary }}>  {/* R2-#10: was tertiary */}
          {collapsed ? "▸ 展开" : "▾ 折叠"}
        </span>
      </div>

      {!collapsed && (
        <>
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
            <input
              type="text"
              aria-label="搜索日志"
              placeholder="🔍 搜索日志..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                maxWidth: 240,
                padding: "3px 8px",
                background: colors.bg[2],
                border: `1px solid ${colors.border.default}`,
                borderRadius: radius.md,
                color: colors.text.primary,
                fontSize: 11,
                fontFamily: "inherit",
              }}
            />
            {/* E4 — level filter buttons */}
            <div style={{ display: "flex", gap: 2 }}>
              {LEVEL_BUTTONS.map((b) => {
                const active = level === b.key;
                return (
                  <button
                    key={b.key}
                    type="button"
                    aria-pressed={active}
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

          {/* #33 — aria-live scoped to summary, not entire list */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            role="log"
            aria-label="运行日志"
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
                    ? "📝 执行工作流后将在此显示运行日志"
                    : "没有匹配的日志"}
                </div>
              ) : (
                visibleLogs.map((line, i) => {
                  const lv = levelOf(line);
                  return (
                    <div key={i} style={{ color: colorForLevel(lv) }}>
                      {line}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
