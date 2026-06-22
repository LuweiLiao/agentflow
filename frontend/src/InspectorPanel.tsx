import { useState, useEffect, useRef, useCallback } from "react";
import type { WorkflowNode, Profile, NodeStatus, NodeParams } from "./types";
import { STATUS_LABELS } from "./types";
import { colors, radius, shadow, spacing, transition, formatCost, formatDuration } from "./theme";
import { PROFILE_CONFIG, statusMeta } from "./utils";  // #3/#4: unified maps

type InspectorPanelProps = {
  node: WorkflowNode | null;
  onUpdate: (id: string, updates: Partial<WorkflowNode>) => void;
  onDelete: (id: string) => void;
  graphInfo: { nodes: number; edges: number };
};

/**
 * Build the profile picker options from the unified `PROFILE_CONFIG` (#4).
 * Previously this was a hand-maintained duplicate of the same data.
 */
const PROFILE_OPTIONS: { value: Profile; label: string; color: string }[] = (
  Object.keys(PROFILE_CONFIG) as Profile[]
).map((value) => ({
  value,
  label: `${PROFILE_CONFIG[value].icon} ${PROFILE_CONFIG[value].label}`,
  color: PROFILE_CONFIG[value].color,
}));

/* D1 — a small debounced field that syncs local state to the parent.
 * R3-P3: now also exposes a `dirty` flag (true while local has unflushed
 * edits) so callers can render an "unsaved" indicator next to the input. */
function useDebouncedField<T>(
  value: T,
  onCommit: (v: T) => void,
  delay = 500
): [T, (v: T) => void, () => void, boolean] {
  const [local, setLocal] = useState<T>(value);
  const [dirty, setDirty] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // Keep local in sync when the upstream value changes (e.g. node switch).
  // R3-BUG-P0-001: clear pending debounce timer before overwriting local state
  useEffect(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setLocal(value);
    setDirty(false);
  }, [value]);

  const commit = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    onCommitRef.current(local);
    setDirty(false);
  }, [local]);

  const update = useCallback(
    (v: T) => {
      setLocal(v);
      setDirty(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        onCommitRef.current(v);
        setDirty(false);
      }, delay);
    },
    [delay]
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return [local, update, commit, dirty];
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
  // R3-P3: capture `dirty` for each field to drive the "未保存" indicator dot.
  const [label, setLabel, commitLabel, labelDirty] = useDebouncedField(node?.label ?? "", (v) => node && onUpdate(node.id, { label: v }));
  const [desc, setDesc, commitDesc, descDirty] = useDebouncedField(node?.desc ?? "", (v) => node && onUpdate(node.id, { desc: v }));
  const [model, setModel, commitModel, modelDirty] = useDebouncedField(node?.model ?? "", (v) => node && onUpdate(node.id, { model: v || undefined }));

  // 高级参数 — local state for the tag-input text + debounced validation_commands.
  const [expectedFilesInput, setExpectedFilesInput] = useState("");
  const [valCommands, setValCommands, commitValCommands] = useDebouncedField(
    node?.params?.validation_commands ?? "",
    (v) => node && onUpdate(node.id, { params: { validation_commands: v } })
  );

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
          <h2 style={{ fontSize: 13, fontWeight: 500, color: colors.text.secondary, margin: 0 }}>
            点击节点查看属性
          </h2>
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
  const ss = statusMeta(statusKey);  // #3: unified status lookup (was STATUS_STYLE[...])
  const activeProfile = PROFILE_OPTIONS.find((p) => p.value === node.profile);

  const handleProfileClick = useCallback(
    (e: React.MouseEvent) => {
      const value = (e.currentTarget as HTMLButtonElement).dataset.profileValue;
      if (value) onUpdate(node.id, { profile: value as Profile });
    },
    [node?.id, onUpdate]
  );

  const handleBudgetChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(node.id, { params: { max_budget: parseFloat(e.target.value) || 0 } });
    },
    [node?.id, onUpdate]
  );

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
        <h2 style={headerStyle}>
          <span>{node.icon || "🤖"}</span> {node.label || "未命名"}
          <span style={{ fontSize: 10, color: colors.text.tertiary, fontWeight: 400, marginLeft: 4 }}>
            #{node.id.slice(-6)}
          </span>
        </h2>

        {/* D7 — 基本信息 */}
        <SectionHeader>基本信息</SectionHeader>

        <div style={fieldStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={labelStyle} htmlFor="insp-label">标签</label>
            <UnsavedDot show={labelDirty} />
          </div>
          <input
            id="insp-label"
            className="af-inspector-input"
            style={inputStyle}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={commitLabel}
            aria-describedby="insp-label-help"
          />
          <FieldHelp id="insp-label-help">显示在节点卡片标题栏的名称。</FieldHelp>
        </div>

        <div style={fieldStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={labelStyle} htmlFor="insp-desc">描述</label>
            <UnsavedDot show={descDirty} />
          </div>
          <textarea
            id="insp-desc"
            className="af-inspector-input"
            style={{ ...inputStyle, resize: "vertical", minHeight: 44, lineHeight: 1.5 }}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={commitDesc}
            aria-describedby="insp-desc-help"
          />
          <FieldHelp id="insp-desc-help">向 Agent 说明本步骤的目标与产出（支持多行）。</FieldHelp>
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
                  className="af-profile-btn"
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={labelStyle} htmlFor="insp-model">模型</label>
            <UnsavedDot show={modelDirty} />
          </div>
          <input
            id="insp-model"
            className="af-inspector-input"
            style={inputStyle}
            value={model}
            placeholder="默认模型"
            onChange={(e) => setModel(e.target.value)}
            onBlur={commitModel}
            aria-describedby="insp-model-help"
          />
          <FieldHelp id="insp-model-help">留空使用系统默认模型；可填如 claude-sonnet-4 等。</FieldHelp>
        </div>

        {/* ── 高级参数（可折叠） ── */}
        <CollapsibleSection title="高级参数">
          {/* expected_files — tag-style input */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="insp-expected-files">期望产物文件</label>
            {(node.params?.expected_files?.length ?? 0) > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
                {(node.params?.expected_files || []).map((f) => (
                  <span
                    key={f}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      padding: "2px 4px 2px 8px",
                      borderRadius: radius.sm,
                      background: colors.bg[4],
                      color: colors.text.secondary,
                      border: `1px solid ${colors.border.default}`,
                    }}
                  >
                    {f}
                    <button
                      type="button"
                      aria-label={`移除 ${f}`}
                      onClick={() =>
                        onUpdate(node.id, {
                          params: {
                            expected_files: (node.params?.expected_files || []).filter((x) => x !== f),
                          },
                        })
                      }
                      style={{
                        background: "none",
                        border: "none",
                        color: colors.text.tertiary,
                        cursor: "pointer",
                        padding: 0,
                        fontSize: 13,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              id="insp-expected-files"
              className="af-inspector-input"
              style={inputStyle}
              placeholder="文件名，逗号或回车添加"
              value={expectedFilesInput}
              onChange={(e) => setExpectedFilesInput(e.target.value)}
              onBlur={() => {
                const val = expectedFilesInput.trim().replace(/,$/, "");
                if (val) {
                  onUpdate(node.id, {
                    params: {
                      expected_files: [
                        ...(node.params?.expected_files || []),
                        ...val.split(",").map((s) => s.trim()).filter(Boolean),
                      ],
                    },
                  });
                  setExpectedFilesInput("");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  const val = expectedFilesInput.trim().replace(/,$/, "");
                  if (val) {
                    const parts = val.split(",").map((s) => s.trim()).filter(Boolean);
                    onUpdate(node.id, {
                      params: { expected_files: [...(node.params?.expected_files || []), ...parts] },
                    });
                    setExpectedFilesInput("");
                  }
                } else if (e.key === "Backspace" && !expectedFilesInput) {
                  const files = node.params?.expected_files || [];
                  if (files.length > 0) {
                    onUpdate(node.id, { params: { expected_files: files.slice(0, -1) } });
                  }
                }
              }}
            />
          </div>

          {/* validation_commands — multi-line textarea */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="insp-valcmd">验证命令</label>
            <textarea
              id="insp-valcmd"
              className="af-inspector-input"
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 60,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                lineHeight: 1.5,
              }}
              placeholder="每行一条 shell 验证命令"
              value={valCommands}
              onChange={(e) => setValCommands(e.target.value)}
              onBlur={commitValCommands}
              aria-describedby="insp-valcmd-help"
            />
            <FieldHelp id="insp-valcmd-help">节点完成后将逐行执行；任意一行返回非零视为失败。</FieldHelp>
          </div>

          {/* max_budget — number input */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="insp-budget">预算上限 ($)</label>
            <input
              id="insp-budget"
              type="number"
              step="0.1"
              min="0"
              className="af-inspector-input"
              style={inputStyle}
              value={node.params?.max_budget ?? 0.5}
              onChange={handleBudgetChange}
            />
          </div>

          {/* agent_type — dropdown */}
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="insp-agent-type">Agent 类型</label>
            <select
              id="insp-agent-type"
              className="af-inspector-input"
              style={{ ...inputStyle, cursor: "pointer" }}
              value={node.params?.agent_type || "standard"}
              onChange={(e) =>
                onUpdate(node.id, {
                  params: { agent_type: e.target.value as NodeParams["agent_type"] },
                })
              }
            >
              <option value="standard">standard</option>
              <option value="claude-code">AgentFlow-Code</option>
            </select>
          </div>
        </CollapsibleSection>

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
              borderRadius: radius.full,  // #2: was hardcoded 999 — now uses token
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
          className="af-delete-btn"
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
    <h3
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
    </h3>
  );
}

/**
 * R3-P3 #7 — "未保存" indicator dot. Renders a small pulsing orange dot when
 * `show` is true (local edits not yet flushed to the parent via debounce).
 * Returns null when there is nothing pending so layout doesn't shift.
 */
function UnsavedDot({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      aria-hidden
      title="未保存（停止输入后将自动提交）"
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: colors.status.timed_out,
        boxShadow: `0 0 0 2px ${colors.bg[3]}`,
        animation: "af-unsaved-pulse 1.4s ease-in-out infinite",
        flexShrink: 0,
      }}
    />
  );
}

/**
 * R3-P3 #1 — small helper-text element rendered below an input. The id
 * passed in is what the input's `aria-describedby` points to so screen
 * readers announce the hint when the field receives focus.
 */
function FieldHelp({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      style={{
        marginTop: 3,
        fontSize: 10,
        lineHeight: 1.4,
        color: colors.text.tertiary,
      }}
    >
      {children}
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginTop: 4 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`collapsible-${title}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          padding: "6px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: colors.text.secondary,
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-block",
            transition: `transform ${transition.fast}`,
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            fontSize: 10,
          }}
        >
          ▶
        </span>
        <span>{title}</span>
        <span style={{ flex: 1, height: 1, background: colors.border.subtle }} />
      </button>
      {open && <div id={`collapsible-${title}`} style={{ marginTop: 2 }}>{children}</div>}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: colors.bg[3],
  borderLeft: `1px solid ${colors.border.subtle}`,
  padding: `${spacing[16]}px ${spacing[16]}px`,  // #7: was 16px — slightly tighter to widen content area
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
  padding: `${spacing[8]}px ${spacing[10]}px`,
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
  padding: `${spacing[10]}px 0`,
  borderTop: `1px solid ${colors.border.subtle}`,
  fontSize: 11,
  color: colors.text.secondary,
  lineHeight: 1.8,
};
