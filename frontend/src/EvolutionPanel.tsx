import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "./api";
import type { EvolutionStatsResponse, UpgradeResponse } from "./api";
import type {
  FailureAttribution,
  EvolutionProposal,
  UpgradeDecision,
  Promotion,
  UpgradeSummary,
  EvolutionStats,
  RecurringPattern,
  EvolutionReport,
} from "./types";
import { colors, fontSize, radius, shadow, spacing, transition, zIndex, TOOLBAR_HEIGHT } from "./theme";

/* ── Styles ───────────────────────────────────────────────────── */

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: TOOLBAR_HEIGHT,
  right: 0,
  width: 460,
  maxHeight: `calc(100vh - ${TOOLBAR_HEIGHT}px)`,
  overflowY: "auto",
  background: "rgba(15, 17, 23, 0.97)",
  borderLeft: `1px solid ${colors.border.subtle}`,
  padding: spacing[16],
  zIndex: zIndex.overlay,
  color: colors.text.primary,
  fontSize: fontSize.base,
  backdropFilter: "blur(10px)",
  boxShadow: shadow.lg,
};

const backdropStyle: React.CSSProperties = {
  position: "absolute",
  top: TOOLBAR_HEIGHT,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.35)",
  zIndex: zIndex.backdrop,
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: 12,
  background: "rgba(255,255,255,0.07)",
  borderRadius: radius.lg,
};

const btnStyle: React.CSSProperties = {
  padding: "6px 14px",
  border: "none",
  borderRadius: radius.md,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  marginRight: 6,
  marginBottom: 6,
  transition: `background ${transition.fast}, transform ${transition.fast}`,
};

const actionColors: Record<string, string> = {
  auto_accept: colors.status.completed,
  conditional: colors.status.timed_out,
  pending_human_review: colors.accent.orange,
  rejected: colors.status.failed,
};

const classColors: Record<string, string> = {
  template_defect: colors.status.failed,
  dag_defect: "#fb923c",
  runtime_defect: colors.status.timed_out,
  tool_defect: colors.accent.purple,
  model_defect: colors.status.running,
  eval_defect: colors.status.completed,
  context_defect: "#22d3ee",
  unknown: colors.text.secondary,
};

/* ── Component ────────────────────────────────────────────────── */

interface EvolutionPanelProps {
  runId: string | null;
  onClose: () => void;
}

export default function EvolutionPanel({ runId, onClose }: EvolutionPanelProps) {
  const [tab, setTab] = useState<"report" | "upgrade" | "global">("report");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // #26 — Escape key to close panel (handled inside focus trap for reliable focus restore)
  // Focus trap — confine Tab/Shift+Tab within the panel, focus the
  // panel on open, and restore focus to the trigger on close.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const items = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    // Move focus into the panel on open
    const first = items()[0];
    if (first) first.focus();
    else panel.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const els = items();
      if (els.length === 0) return;
      const firstEl = els[0];
      const lastEl = els[els.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    panel.addEventListener("keydown", onKey);
    return () => {
      panel.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [onClose]); // include onClose so Escape handler has latest callback

  // Report state (G4 — typed, no `any`)
  const [report, setReport] = useState<EvolutionReport["report"]>(null);

  // Upgrade state
  const [decisions, setDecisions] = useState<UpgradeDecision[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [summary, setSummary] = useState<UpgradeSummary | null>(null);
  const [upgradeLoaded, setUpgradeLoaded] = useState(false);

  // Global stats
  const [stats, setStats] = useState<EvolutionStats | null>(null);

  const loadReport = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    setError(null);
    try {
      const data: EvolutionReport = await api.getEvolution(runId);
      setReport(data.ok ? data.report : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  }, [runId]);

  const runEvolve = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    setError(null);
    try {
      const data: EvolutionReport = await api.evolve(runId);
      if (data.ok) setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  }, [runId]);

  const runUpgrade = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    setError(null);
    try {
      const data: UpgradeResponse = await api.upgrade(runId);
      if (data.ok) {
        setDecisions(data.decisions || []);
        setPromotions(data.promotions || []);
        setSummary(data.summary || null);
        setUpgradeLoaded(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  }, [runId]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: EvolutionStatsResponse = await api.getEvolutionStats();
      if (data.ok) setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  }, []);

  // F1 — include loadReport / loadStats in dependency array.
  // F2 — auto-load upgrade data when entering the upgrade tab if empty.
  useEffect(() => {
    if (tab === "report" && runId) loadReport();
    if (tab === "upgrade" && runId && !upgradeLoaded && decisions.length === 0) runUpgrade();
    if (tab === "global") loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, runId, loadReport, loadStats, runUpgrade, upgradeLoaded, decisions.length]);

  return (
    <>
      {/* F3 — semi-transparent backdrop */}
      <div style={backdropStyle} onClick={onClose} aria-hidden />

      <div
        ref={panelRef}
        className="agentflow-slide-in"
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-label="自我进化面板"
        tabIndex={-1}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: fontSize.lg, fontWeight: 700 }}>🧬 自我进化</h2>  {/* #39: was "Self-Evolution" */}
          <button
            onClick={onClose}
            aria-label="关闭自我进化面板"
            title="关闭"
            style={{ background: "none", border: "none", color: colors.text.tertiary, cursor: "pointer", fontSize: fontSize.xl, lineHeight: 1 }}
            className="af-panel-close-btn"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div role="tablist" style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {([
            ["report", "📋 报告"],
            ["upgrade", "⚡ 升级"],
            ["global", "📊 全局"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              className="af-evo-tab-btn"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              style={{
                ...btnStyle,
                background: tab === key ? colors.accent.blue : "rgba(255,255,255,0.08)",
                color: tab === key ? "#0b0d12" : colors.text.secondary,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* F4 — skeleton loading */}
        {loading && <LoadingSkeleton />}

        {error && <div style={{ color: colors.status.failed, padding: 8 }}>⚠️ {error}</div>}

        {/* ── Report Tab ──────────────────────────────────────── */}
        {tab === "report" && !loading && (
          <div>
            {!report ? (
              <EmptyState
                icon="🧬"
                title="暂无进化报告"
                hint="对此运行执行进化分析以发现失败归因与改进建议"
                action={<button onClick={runEvolve} className="af-evo-btn" style={{ ...btnStyle, background: colors.accent.purple, color: "#fff" }}>🔍 执行进化分析</button>}
              />
            ) : (
              <div>
                {/* Attributions */}
                <div style={sectionStyle}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 13, color: colors.text.secondary }}>
                    失败归因 ({report.attributions?.length || 0})
                  </h4>
                  {(report.attributions || []).map((attr: FailureAttribution) => (
                    <div
                      key={`attr-${attr.failure_class}-${attr.root_cause}`}
                      style={{
                        marginBottom: 8,
                        padding: 8,
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: radius.md,
                        borderLeft: `3px solid ${classColors[attr.failure_class] || colors.text.tertiary}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span
                          style={{
                            color: classColors[attr.failure_class] || colors.text.secondary,
                            fontWeight: 600,
                            fontSize: 11,
                            textTransform: "uppercase",
                          }}
                        >
                          {attr.failure_class}
                        </span>
                        <span style={{ color: colors.text.tertiary, fontSize: 11 }}>
                          {Math.round((attr.confidence || 0) * 100)}% 置信度
                        </span>
                      </div>
                      <p style={{ margin: "4px 0", fontSize: 12, color: colors.text.secondary }}>{attr.root_cause}</p>
                      {attr.affected_nodes?.length > 0 && (
                        <div style={{ fontSize: 11, color: colors.text.tertiary }}>
                          影响节点: {attr.affected_nodes.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Proposals */}
                <div style={sectionStyle}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 13, color: colors.text.secondary }}>
                    改进建议 ({report.proposals?.length || 0})
                  </h4>
                  {(report.proposals || []).map((prop: EvolutionProposal) => (
                    <div
                      key={prop.proposal_id}
                      style={{ marginBottom: 6, padding: "6px 8px", background: "rgba(255,255,255,0.03)", borderRadius: radius.sm }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600, fontSize: 12 }}>{prop.title}</span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "1px 6px",
                            borderRadius: radius.sm,
                            background: prop.risk === "low" ? "rgba(52,211,153,0.2)" : prop.risk === "medium" ? "rgba(251,191,36,0.2)" : "rgba(248,113,113,0.2)",
                            color: prop.risk === "low" ? colors.accent.green : prop.risk === "medium" ? colors.accent.yellow : colors.accent.red,
                          }}
                        >
                          {prop.risk}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: colors.text.tertiary }}>→ {prop.target}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={runUpgrade}
                  className="af-evo-btn"
                  style={{ ...btnStyle, background: colors.status.timed_out, color: "#000", width: "100%" }}
                >
                  ⚡ 执行完整升级管线
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Upgrade Tab ─────────────────────────────────────── */}
        {tab === "upgrade" && !loading && (
          <div>
            {summary && (
              <div style={sectionStyle}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <StatBadge label="总计" value={summary.total} color={colors.accent.blue} />
                  <StatBadge label="接受" value={summary.accepted} color={colors.status.completed} />
                  <StatBadge label="拒绝" value={summary.rejected} color={colors.status.failed} />
                  <StatBadge label="待审" value={summary.pending_review} color={colors.status.timed_out} />
                  <StatBadge label="已晋升" value={summary.promoted} color={colors.accent.purple} />
                </div>
              </div>
            )}

            {decisions.map((d, i) => (
              <div key={d.proposal?.proposal_id ?? `dec-${i}-${d.action}`} style={{ ...sectionStyle, borderLeft: `3px solid ${actionColors[d.action] || colors.text.tertiary}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 11,
                      textTransform: "uppercase",
                      color: actionColors[d.action] || colors.text.secondary,
                    }}
                  >
                    {d.action.replace(/_/g, " ")}
                  </span>
                </div>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: colors.text.secondary }}>{d.reason}</p>
                {d.proposal && (
                  <div style={{ fontSize: 11, color: colors.text.tertiary }}>
                    {d.proposal.title} → {d.proposal.target}
                  </div>
                )}
                {d.eval_result && (
                  <div style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 4 }}>
                    得分: {Math.round((d.eval_result.baseline_avg_score || 0) * 100)}% →{" "}
                    {Math.round((d.eval_result.candidate_avg_score || 0) * 100)}% ({d.eval_result.improvement >= 0 ? "+" : ""}
                    {(d.eval_result.improvement * 100).toFixed(1)}%)
                  </div>
                )}
              </div>
            ))}

            {promotions.length > 0 && (
              <div style={sectionStyle}>
                <h4 style={{ margin: "0 0 8px", fontSize: 13, color: colors.text.secondary }}>晋升 ({promotions.length})</h4>
                {promotions.map((p) => (
                  <div key={p.promotion_id} style={{ fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: p.rolled_back ? colors.status.failed : colors.status.completed }}>
                      {p.rolled_back ? "↩️" : "✅"}
                    </span>{" "}
                    <strong>{p.template_name}</strong>
                    <span style={{ color: colors.text.tertiary, marginLeft: 8 }}>{p.diff_summary}</span>
                  </div>
                ))}
              </div>
            )}

            {/* F6 — empty state */}
            {decisions.length === 0 && (
              <EmptyState
                icon="⚡"
                title="暂无升级决策"
                hint="执行升级管线以查看自动化改进决策"
                action={runId ? <button onClick={runUpgrade} className="af-evo-btn" style={{ ...btnStyle, background: colors.status.timed_out, color: "#000" }}>⚡ 执行升级管线</button> : undefined}
              />
            )}
          </div>
        )}

        {/* ── Global Stats Tab ────────────────────────────────── */}
        {tab === "global" && !loading && (
          <div>
            {stats ? (
              <div>
                <div style={sectionStyle}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <StatBadge label="运行" value={stats.total_runs_analyzed} color={colors.accent.blue} />
                    <StatBadge label="归因" value={stats.total_attributions} color={colors.status.failed} />
                    <StatBadge label="建议" value={stats.total_proposals} color={colors.status.timed_out} />
                    <StatBadge label="晋升" value={stats.total_promotions} color={colors.accent.purple} />
                    <StatBadge label="回滚" value={stats.total_rollbacks} color={colors.status.failed} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: colors.text.tertiary }}>
                    接受率:{" "}
                    <strong style={{ color: colors.status.completed }}>
                      {(stats.proposal_acceptance_rate * 100).toFixed(1)}%
                    </strong>
                  </div>
                </div>

                {/* Failure class distribution */}
                {Object.keys(stats.failure_class_counts).length > 0 && (
                  <div style={sectionStyle}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 13, color: colors.text.secondary }}>失败分布</h4>
                    {Object.entries(stats.failure_class_counts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cls, count]) => (
                        <div key={cls} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span
                            style={{ width: 8, height: 8, borderRadius: "50%", background: classColors[cls] || colors.text.tertiary, flexShrink: 0 }}
                          />
                          <span style={{ fontSize: 12, flex: 1 }}>{cls}</span>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{count}</span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Recurring patterns */}
                {stats.recurring_patterns.length > 0 && (
                  <div style={sectionStyle}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 13, color: colors.text.secondary }}>高频复发模式</h4>
                    {stats.recurring_patterns.slice(0, 5).map((p: RecurringPattern) => (
                      <div
                        key={`pat-${p.failure_class}-${p.root_cause_fragment}`}
                        style={{
                          marginBottom: 6,
                          padding: 6,
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: radius.sm,
                          borderLeft: `3px solid ${classColors[p.failure_class] || colors.text.tertiary}`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: classColors[p.failure_class] || colors.text.secondary, fontSize: 11, fontWeight: 600 }}>
                            {p.failure_class}
                          </span>
                          <span style={{ fontSize: 11, color: colors.text.tertiary }}>×{p.occurrence_count}</span>
                        </div>
                        <p style={{ margin: "2px 0", fontSize: 11, color: colors.text.secondary }}>{p.root_cause_fragment}</p>
                        <div style={{ fontSize: 10, color: colors.text.tertiary }}>
                          影响 {p.affected_runs?.length || 0} 次运行
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Template improvement trend */}
                {Object.keys(stats.template_improvement_trend).length > 0 && (
                  <div style={sectionStyle}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 13, color: colors.text.secondary }}>模板改进</h4>
                    {Object.entries(stats.template_improvement_trend).map(([name, count]) => (
                      <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span>{name}</span>
                        <span style={{ color: colors.accent.purple }}>{count} 次晋升</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* F6 — empty state */
              <EmptyState
                icon="📊"
                title="暂无全局进化数据"
                hint="运行一些工作流以积累进化洞察"
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */

/** F4 — skeleton loading composed of shimmering blocks. */
function LoadingSkeleton() {
  return (
    <div>
      {[90, 60, 75, 50, 80].map((w) => (
        <div
          key={`skel-${w}`}
          className="agentflow-skeleton"
          style={{ height: 16, width: `${w}%`, margin: "10px 0", borderRadius: radius.md }}
        />
      ))}
      <div style={{ textAlign: "center", color: colors.text.tertiary, fontSize: 11, marginTop: 8 }}>加载中…</div>
    </div>
  );
}

/** F6 — reusable empty state with an illustrative glyph. */
function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: string;
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: "center", padding: "32px 16px" }}>
      <div
        style={{
          fontSize: 40,
          marginBottom: 12,
          opacity: 0.6,
          filter: "grayscale(0.3)",
        }}
        aria-hidden
      >
        {icon}
      </div>
      <p style={{ color: colors.text.secondary, margin: "0 0 6px", fontWeight: 600 }}>{title}</p>
      <p style={{ color: colors.text.tertiary, fontSize: 12, margin: "0 0 14px", lineHeight: 1.5 }}>{hint}</p>
      {action}
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 60 }}>
      <span style={{ fontSize: 18, fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: 10, color: colors.text.tertiary, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}
