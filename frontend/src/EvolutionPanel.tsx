import { useState, useCallback, useEffect } from "react";
import { api } from "./api";

/* ── Types ────────────────────────────────────────────────────── */

interface Attribution {
  failure_class: string;
  root_cause: string;
  evidence: string[];
  confidence: number;
  affected_nodes: string[];
}

interface Proposal {
  proposal_id: string;
  target: string;
  title: string;
  rationale: string;
  risk: string;
}

interface UpgradeDecision {
  action: string;
  reason: string;
  proposal: any;
  eval_result: any;
  candidate_artifacts: any[];
}

interface Promotion {
  promotion_id: string;
  template_name: string;
  diff_summary: string;
  rolled_back: boolean;
}

interface EvolutionStats {
  total_runs_analyzed: number;
  total_attributions: number;
  total_proposals: number;
  total_promotions: number;
  total_rollbacks: number;
  failure_class_counts: Record<string, number>;
  proposal_acceptance_rate: number;
  recurring_patterns: any[];
  template_improvement_trend: Record<string, number>;
}

/* ── Styles ───────────────────────────────────────────────────── */

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: "60px",
  right: "0",
  width: "440px",
  maxHeight: "calc(100vh - 60px)",
  overflowY: "auto",
  background: "rgba(20, 22, 30, 0.97)",
  borderLeft: "1px solid rgba(255,255,255,0.1)",
  padding: "16px",
  zIndex: 100,
  color: "#e0e0e0",
  fontSize: "13px",
  backdropFilter: "blur(8px)",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "16px",
  padding: "12px",
  background: "rgba(255,255,255,0.04)",
  borderRadius: "8px",
};

const btnStyle: React.CSSProperties = {
  padding: "6px 14px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
  marginRight: "6px",
  marginBottom: "6px",
};

const actionColors: Record<string, string> = {
  auto_accept: "#22c55e",
  conditional: "#eab308",
  pending_human_review: "#f97316",
  rejected: "#ef4444",
};

const classColors: Record<string, string> = {
  template_defect: "#f87171",
  dag_defect: "#fb923c",
  runtime_defect: "#fbbf24",
  tool_defect: "#a78bfa",
  model_defect: "#60a5fa",
  eval_defect: "#34d399",
  context_defect: "#22d3ee",
  unknown: "#94a3b8",
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

  // Report state
  const [report, setReport] = useState<any>(null);

  // Upgrade state
  const [decisions, setDecisions] = useState<UpgradeDecision[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Global stats
  const [stats, setStats] = useState<EvolutionStats | null>(null);

  const loadReport = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEvolution(runId);
      if (data.ok) {
        setReport(data.report);
      } else {
        setReport(null);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [runId]);

  const runEvolve = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.evolve(runId);
      if (data.ok) {
        setReport(data.report);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [runId]);

  const runUpgrade = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.upgrade(runId);
      if (data.ok) {
        setDecisions(data.decisions || []);
        setPromotions(data.promotions || []);
        setSummary(data.summary || null);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [runId]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEvolutionStats();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "report" && runId) loadReport();
    if (tab === "global") loadStats();
  }, [tab, runId]);

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "15px" }}>🧬 Self-Evolution</h3>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "18px" }}
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
        {([
          ["report", "📋 Report"],
          ["upgrade", "⚡ Upgrade"],
          ["global", "📊 Global"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              ...btnStyle,
              background: tab === key ? "#3b82f6" : "rgba(255,255,255,0.1)",
              color: "#fff",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>⏳ Loading...</div>}
      {error && <div style={{ color: "#ef4444", padding: "8px" }}>⚠️ {error}</div>}

      {/* ── Report Tab ──────────────────────────────────────── */}
      {tab === "report" && !loading && (
        <div>
          {!report ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p style={{ color: "#888", marginBottom: "12px" }}>No evolution report yet for this run.</p>
              <button
                onClick={runEvolve}
                style={{ ...btnStyle, background: "#8b5cf6", color: "#fff" }}
              >
                🔍 Run Evolution Analysis
              </button>
            </div>
          ) : (
            <div>
              {/* Attributions */}
              <div style={sectionStyle}>
                <h4 style={{ margin: "0 0 8px", fontSize: "13px", color: "#aaa" }}>
                  Failure Attributions ({report.attributions?.length || 0})
                </h4>
                {(report.attributions || []).map((attr: Attribution, i: number) => (
                  <div key={i} style={{
                    marginBottom: "8px",
                    padding: "8px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "6px",
                    borderLeft: `3px solid ${classColors[attr.failure_class] || "#666"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{
                        color: classColors[attr.failure_class] || "#aaa",
                        fontWeight: 600,
                        fontSize: "11px",
                        textTransform: "uppercase",
                      }}>
                        {attr.failure_class}
                      </span>
                      <span style={{ color: "#666", fontSize: "11px" }}>
                        {(attr.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <p style={{ margin: "4px 0", fontSize: "12px", color: "#ccc" }}>{attr.root_cause}</p>
                    {attr.affected_nodes?.length > 0 && (
                      <div style={{ fontSize: "11px", color: "#888" }}>
                        Nodes: {attr.affected_nodes.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Proposals */}
              <div style={sectionStyle}>
                <h4 style={{ margin: "0 0 8px", fontSize: "13px", color: "#aaa" }}>
                  Proposals ({report.proposals?.length || 0})
                </h4>
                {(report.proposals || []).map((prop: Proposal, i: number) => (
                  <div key={i} style={{
                    marginBottom: "6px",
                    padding: "6px 8px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "4px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, fontSize: "12px" }}>{prop.title}</span>
                      <span style={{
                        fontSize: "10px",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: prop.risk === "low" ? "#22c55e33" :
                                   prop.risk === "medium" ? "#eab30833" : "#ef444433",
                        color: prop.risk === "low" ? "#22c55e" :
                              prop.risk === "medium" ? "#eab308" : "#ef4444",
                      }}>
                        {prop.risk}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#888" }}>→ {prop.target}</div>
                  </div>
                ))}
              </div>

              {/* Run Upgrade button */}
              <button
                onClick={runUpgrade}
                style={{ ...btnStyle, background: "#f59e0b", color: "#000", width: "100%" }}
              >
                ⚡ Run Full Upgrade Pipeline
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
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <StatBadge label="Total" value={summary.total} color="#60a5fa" />
                <StatBadge label="Accepted" value={summary.accepted} color="#22c55e" />
                <StatBadge label="Rejected" value={summary.rejected} color="#ef4444" />
                <StatBadge label="Review" value={summary.pending_review} color="#f97316" />
                <StatBadge label="Promoted" value={summary.promoted} color="#a78bfa" />
              </div>
            </div>
          )}

          {decisions.map((d, i) => (
            <div key={i} style={{
              ...sectionStyle,
              borderLeft: `3px solid ${actionColors[d.action] || "#666"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  color: actionColors[d.action] || "#aaa",
                }}>
                  {d.action.replace(/_/g, " ")}
                </span>
              </div>
              <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#ccc" }}>{d.reason}</p>
              {d.proposal && (
                <div style={{ fontSize: "11px", color: "#888" }}>
                  {d.proposal.title} → {d.proposal.target}
                </div>
              )}
              {d.eval_result && (
                <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                  Score: {(d.eval_result.baseline_avg_score * 100).toFixed(0)}% → {(d.eval_result.candidate_avg_score * 100).toFixed(0)}%
                  {" "}({d.eval_result.improvement >= 0 ? "+" : ""}{(d.eval_result.improvement * 100).toFixed(1)}%)
                </div>
              )}
            </div>
          ))}

          {promotions.length > 0 && (
            <div style={sectionStyle}>
              <h4 style={{ margin: "0 0 8px", fontSize: "13px", color: "#aaa" }}>Promotions ({promotions.length})</h4>
              {promotions.map((p, i) => (
                <div key={i} style={{ fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: p.rolled_back ? "#ef4444" : "#22c55e" }}>
                    {p.rolled_back ? "↩️" : "✅"}
                  </span>
                  {" "}<strong>{p.template_name}</strong>
                  <span style={{ color: "#888", marginLeft: "8px" }}>{p.diff_summary}</span>
                </div>
              ))}
            </div>
          )}

          {decisions.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
              Run the upgrade pipeline to see decisions.
            </div>
          )}
        </div>
      )}

      {/* ── Global Stats Tab ────────────────────────────────── */}
      {tab === "global" && !loading && (
        <div>
          {stats ? (
            <div>
              <div style={sectionStyle}>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <StatBadge label="Runs" value={stats.total_runs_analyzed} color="#60a5fa" />
                  <StatBadge label="Attributions" value={stats.total_attributions} color="#f87171" />
                  <StatBadge label="Proposals" value={stats.total_proposals} color="#fbbf24" />
                  <StatBadge label="Promotions" value={stats.total_promotions} color="#a78bfa" />
                  <StatBadge label="Rollbacks" value={stats.total_rollbacks} color="#ef4444" />
                </div>
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#888" }}>
                  Acceptance rate: <strong style={{ color: "#22c55e" }}>
                    {(stats.proposal_acceptance_rate * 100).toFixed(1)}%
                  </strong>
                </div>
              </div>

              {/* Failure class distribution */}
              {Object.keys(stats.failure_class_counts).length > 0 && (
                <div style={sectionStyle}>
                  <h4 style={{ margin: "0 0 8px", fontSize: "13px", color: "#aaa" }}>Failure Distribution</h4>
                  {Object.entries(stats.failure_class_counts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cls, count]) => (
                      <div key={cls} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: classColors[cls] || "#666",
                          flexShrink: 0,
                        }} />
                        <span style={{ fontSize: "12px", flex: 1 }}>{cls}</span>
                        <span style={{ fontSize: "12px", fontWeight: 600 }}>{count}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* Recurring patterns */}
              {stats.recurring_patterns.length > 0 && (
                <div style={sectionStyle}>
                  <h4 style={{ margin: "0 0 8px", fontSize: "13px", color: "#aaa" }}>Top Recurring Patterns</h4>
                  {stats.recurring_patterns.slice(0, 5).map((p: any, i: number) => (
                    <div key={i} style={{
                      marginBottom: "6px",
                      padding: "6px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "4px",
                      borderLeft: `3px solid ${classColors[p.failure_class] || "#666"}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{
                          color: classColors[p.failure_class] || "#aaa",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}>
                          {p.failure_class}
                        </span>
                        <span style={{ fontSize: "11px", color: "#888" }}>×{p.occurrence_count}</span>
                      </div>
                      <p style={{ margin: "2px 0", fontSize: "11px", color: "#aaa" }}>
                        {p.root_cause_fragment}
                      </p>
                      <div style={{ fontSize: "10px", color: "#666" }}>
                        {p.affected_runs?.length || 0} runs affected
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Template improvement trend */}
              {Object.keys(stats.template_improvement_trend).length > 0 && (
                <div style={sectionStyle}>
                  <h4 style={{ margin: "0 0 8px", fontSize: "13px", color: "#aaa" }}>Template Improvements</h4>
                  {Object.entries(stats.template_improvement_trend).map(([name, count]) => (
                    <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span>{name}</span>
                      <span style={{ color: "#a78bfa" }}>{count} promotions</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
              No evolution data yet. Run some workflows to accumulate insights.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Helper ──────────────────────────────────────────────────── */

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minWidth: "60px",
    }}>
      <span style={{ fontSize: "18px", fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: "10px", color: "#888", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}
