import { useState, useEffect, useRef, useCallback } from "react";
import type { WorkflowNode, Profile, NodeStatus } from "./types";
import { STATUS_LABELS } from "./types";
import { colors, radius, shadow, spacing, transition, formatCost, formatDuration } from "./theme";

type InspectorPanelProps = {
  node: WorkflowNode | null;
  onUpdate: (id: string, updates: Partial<WorkflowNode>) => void;
  onDelete: (id: string) => void;
  graphInfo: { nodes: number; edges: number };
};

const PROFILE_OPTIONS: { value: Profile; label: string; color: string }[] = [
  { value: "analysis", label: "📊 分析", color: colors.profile.analysis },
  { value: "design", label: "🎨 设计", color: colors.profile.design },
  { value: "dev", label: "💻 开发", color: colors.profile.dev },
  { value: "test", label: "🧪 测试", color: colors.profile.test },
  { value: "doc", label: "📝 文档", color: colors.profile.doc },
  { value: "deploy", label: "🚀 部署", color: colors.profile.deploy },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending: { bg: "rgba(100,116,139,0.15)", color: colors.text.secondary },
  running: { bg: "rgba(96,165,250,0.15)", color: colors.status.running },
  completed: { bg: "rgba(52,211,153,0.15)", color: colors.status.completed },
  failed: { bg: "rgba(248,113,113,0.15)", color: colors.status.failed },
  skipped: { bg: "rgba(136,136,136,0.15)", color: colors.status.skipped },  // #11: was hardcoded #a0a0a0
  timed_out: { bg: "rgba(251,191,36,0.15)", color: colors.status.timed_out },
  cancelled: { bg: "rgba(148,163,184,0.15)", color: colors.text.secondary },
};

/* D1 — a small debounced field that syncs local state to the parent. */
function useDebouncedField<T>(
  value: T,
  onCommit: (v: T) => void,
  delay = 500
): [T, (v: T) => void, () => void] {
  const [local, setLocal] = useState<T>(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // Keep local in sync when the upstream value changes (e.g. node switch).
  // R3-BUG-P0-001: clear pending debounce timer before overwriting local state
  useEffect(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setLocal(value);
  }, [value]);

  const commit = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    onCommitRef.current(local);
  }, [local]);

  const update = useCallback(
    (v: T) => {
      setLocal(v);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => onCommitRef.current(v), delay);
    },
    [delay]
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return [local, update, commit];
}

export default function InspectorPanel({ node, onUpdate, onDelete, graphInfo }: InspectorPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  // D3 — detect overflow to toggle the bottom gradient fade.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setShowFade(el.scrollHeight > el.clientHeight + 4 && el.scrollTop + el.clientHeight < el.scrollHeight - 4);
    check();
    el.addEventListener("scroll", check);
    return () => el.removeEventListener("scroll", check);
  }, [node]);

  // D5 — two-step delete confirmation with timeout reset.
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
  }, []);

  // D1 — debounced editable fields.
  const [label, setLabel, commitLabel] = useDebouncedField(node?.label ?? "", (v) => node && onUpdate(node.id, { label: v }));
  const [desc, setDesc, commitDesc] = useDebouncedField(node?.desc ?? "", (v) => node && onUpdate(node.id, { desc: v }));
  const [model, setModel, commitModel] = useDebouncedField(node?.model ?? "", (v) => node && onUpdate(node.id, { model: v || undefined }));

  if (!node) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>📋 检查器</div>
        {/* #5/#29/#30 — Rich empty state with guidance */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          marginTop: 40,
          color: colors.text.tertiary,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 32, opacity: 0.4 }}>👆</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: colors.text.secondary }}>
            点击节点查看属性
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.7, maxWidth: 200, color: colors.text.secondary }}>
            在画布中选中任意节点后，<br />这里将显示详细信息和编辑面板
          </div>
        </div>
        {/* #30 — workflow summary in footer */}
        <div style={{ ...footerStatStyle, marginTop: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🧩 节点</span>
            <strong style={{ color: colors.text.secondary }}>{graphInfo.nodes}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🔗 连线</span>
            <strong style={{ color: colors.text.secondary }}>{graphInfo.edges}</strong>
          </div>
          {graphInfo.nodes > 0 && (
            <div style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: `1px solid ${colors.border.subtle}`,
              fontSize: 11,  // R2-#10: was 10 — improve readability
              color: graphInfo.edges >= graphInfo.nodes - 1 ? colors.status.completed : colors.status.timed_out,
            }}>
              {graphInfo.edges >= graphInfo.nodes - 1 ? "✓ 工作流连通" : "⚠ 部分节点未连接"}
            </div>
          )}
        </div>
      </div>
    );
  }

  const statusKey = (node.status || "pending") as NodeStatus;
  const ss = STATUS_STYLE[statusKey] || STATUS_STYLE.pending;
  const activeProfile = PROFILE_OPTIONS.find((p) => p.value === node.profile);

  const handleDeleteClick = () => {
    if (!confirming) {
      setConfirming(true);
      confirmTimer.current = setTimeout(() => setConfirming(false), 3000);
    } else {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      setConfirming(false);
      onDelete(node.id);
    }
  };

  return (
    <div style={{ ...panelStyle, position: "relative" }}>
      <div ref={scrollRef} style={{ height: "100%", overflowY: "auto", paddingRight: 2 }}>
        <div style={headerStyle}>
          <span>{node.icon || "🤖"}</span> {node.label || "未命名"}
          <span style={{ fontSize: 10, color: colors.text.tertiary, fontWeight: 400, marginLeft: 4 }}>
            #{node.id.slice(-6)}
          </span>
        </div>

        {/* D7 — 基本信息 */}
        <SectionHeader>基本信息</SectionHeader>

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="insp-label">标签</label>
          <input
            id="insp-label"
            style={inputStyle}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={commitLabel}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="insp-desc">描述</label>
          <textarea
            id="insp-desc"
            style={{ ...inputStyle, resize: "vertical", minHeight: 44, lineHeight: 1.5 }}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={commitDesc}
          />
        </div>

        {/* D7 — 配置 */}
        <SectionHeader>配置</SectionHeader>

        {/* D4 — profile selector with color swatches */}
        <div style={fieldStyle}>
          <label style={labelStyle}>角色</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PROFILE_OPTIONS.map((p) => {
              const active = node.profile === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  title={p.label}
                  aria-pressed={active}
                  onClick={() => onUpdate(node.id, { profile: p.value })}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 9px",
                    borderRadius: radius.md,
                    fontSize: 11,
                    cursor: "pointer",
                    border: `1px solid ${active ? p.color : colors.border.default}`,
                    background: active ? p.color : colors.bg[1],
                    color: active ? "#fff" : colors.text.secondary,
                    fontWeight: active ? 600 : 400,
                    transition: `background ${transition.fast}, border-color ${transition.fast}`,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="insp-model">模型</label>
          <input
            id="insp-model"
            style={inputStyle}
            value={model}
            placeholder="默认模型"
            onChange={(e) => setModel(e.target.value)}
            onBlur={commitModel}
          />
        </div>

        {/* D7 — 状态 */}
        <SectionHeader>状态</SectionHeader>

        <div style={fieldStyle}>
          <label style={labelStyle}>当前状态</label>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              padding: "4px 10px",
              borderRadius: 999,
              background: ss.bg,
              color: ss.color,
            }}
          >
            {/* D2 — localized status label */}
            {STATUS_LABELS[statusKey] ?? node.status}
          </div>
          {(node.cost !== undefined || node.duration_ms !== undefined) && (
            <div style={{ marginTop: 6, fontSize: 11, color: colors.text.tertiary }}>
              {node.cost !== undefined && <span>💰 {formatCost(node.cost)}　</span>}
              {node.duration_ms !== undefined && <span>⏱ {formatDuration(node.duration_ms)}</span>}
            </div>
          )}
        </div>

        {/* D6 — dependencies as chips */}
        {node.depends_on && node.depends_on.length > 0 && (
          <div style={fieldStyle}>
            <label style={labelStyle}>依赖</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {node.depends_on.map((d) => (
                <span
                  key={d}
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: radius.sm,
                    background: colors.bg[4],
                    color: colors.text.secondary,
                    border: `1px solid ${colors.border.default}`,
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* D5 — two-step delete */}
        <button
          onClick={handleDeleteClick}
          aria-label={confirming ? "确认删除节点" : "删除节点"}
          style={{
            position: "sticky",
            bottom: 8,
            marginTop: 12,
            width: "100%",
            padding: "7px 10px",
            background: confirming ? "rgba(248,113,113,0.25)" : "rgba(248,113,113,0.1)",
            border: `1px solid ${confirming ? "rgba(248,113,113,0.6)" : "rgba(248,113,113,0.3)"}`,
            borderRadius: radius.md,
            color: colors.status.failed,
            fontSize: 12,
            fontWeight: confirming ? 700 : 500,
            cursor: "pointer",
            transition: `background ${transition.fast}, border-color ${transition.fast}`,
          }}
        >
          {confirming ? "⚠ 确认删除?" : "🗑 删除节点"}
        </button>
      </div>

      {/* D3 — bottom scroll fade indicator */}
      {showFade && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 28,
            pointerEvents: "none",
            background: `linear-gradient(180deg, transparent 0%, ${colors.bg[3]} 80%)`,
          }}
        />
      )}
    </div>
  );
}

/* ── Sub-components & styles ───────────────────────────────────── */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "12px 0 6px",  // R2-#12: was 18px 0 10px — fit content without scroll
        fontSize: 12,  // R2-#9: was 11 — low contrast on dark bg
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: colors.text.secondary,  // R2-#9: was tertiary — improve contrast
      }}
    >
      <span>{children}</span>
      <span style={{ flex: 1, height: 1, background: colors.border.subtle }} />
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: colors.bg[3],
  borderLeft: `1px solid ${colors.border.subtle}`,
  padding: "14px 14px",  // #7: was 16px — slightly tighter to widen content area
  width: 280,
  height: "100%",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  boxShadow: shadow.sm,
};

const headerStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: colors.text.primary,
  marginBottom: 8,
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const fieldStyle: React.CSSProperties = {
  marginBottom: 8,  // R2-#12: was 12→10→8 — fit content without scroll
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: colors.text.secondary,  // R2-#10: was tertiary (fgB=154) — below WCAG AA
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 9px",
  background: colors.bg[1],
  border: `1px solid ${colors.border.default}`,
  borderRadius: radius.md,
  color: colors.text.primary,
  fontSize: 12,
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: `border-color ${transition.fast}`,
};

const footerStatStyle: React.CSSProperties = {
  padding: "10px 0",
  borderTop: `1px solid ${colors.border.subtle}`,
  fontSize: 11,
  color: colors.text.secondary,
  lineHeight: 1.8,
};
