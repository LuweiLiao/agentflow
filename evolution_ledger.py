"""AgentFlow Evolution Ledger — Phase 3D.

Aggregates evolution data across runs to build cumulative knowledge:
  - Which failure patterns recur most frequently?
  - Which proposals have been accepted/rejected across history?
  - What is the overall system improvement trend?
  - Which templates have accumulated the most enhancements?

This transforms per-run snapshots into a longitudinal knowledge base.
"""

from __future__ import annotations

import json
import os
import time
from collections import Counter
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class FailurePattern:
    """A recurring failure pattern identified across runs."""
    pattern_id: str
    failure_class: str
    root_cause_fragment: str
    occurrence_count: int
    affected_runs: list[str] = field(default_factory=list)
    affected_nodes: list[str] = field(default_factory=list)
    last_seen: float = 0.0


@dataclass
class EvolutionStats:
    """Aggregate evolution statistics across all runs."""
    total_runs_analyzed: int = 0
    total_attributions: int = 0
    total_proposals: int = 0
    total_promotions: int = 0
    total_rollbacks: int = 0
    failure_class_counts: dict[str, int] = field(default_factory=dict)
    proposal_acceptance_rate: float = 0.0
    recurring_patterns: list[dict] = field(default_factory=list)
    template_improvement_trend: dict[str, int] = field(default_factory=dict)


class EvolutionLedger:
    """Persistent ledger that accumulates evolution insights across runs.

    Storage:
      .agentflow/evolution/ledger.json  — append-only event log
      .agentflow/evolution/patterns.json — deduplicated failure patterns
    """

    def __init__(self, data_dir: str | None = None):
        self.data_dir = Path(data_dir) if data_dir else Path(".agentflow") / "evolution"
        self.ledger_path = self.data_dir / "ledger.json"
        self.patterns_path = self.data_dir / "patterns.json"
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def record_analysis(self, run_id: str, report: dict[str, Any]) -> None:
        """Record an evolution analysis result into the ledger."""
        entry = {
            "timestamp": time.time(),
            "run_id": run_id,
            "attributions": report.get("attributions", []),
            "proposals": [
                {"proposal_id": p.get("proposal_id"), "target": p.get("target"),
                 "risk": p.get("risk"), "title": p.get("title")}
                for p in report.get("proposals", [])
            ],
            "trace_summary": report.get("trace_summary", {}),
        }
        ledger = self._read_ledger()
        ledger.append(entry)
        self._write_ledger(ledger)

        # Update patterns
        self._update_patterns(entry)

    def record_promotion(self, promotion: dict[str, Any]) -> None:
        """Record a template promotion."""
        entry = {
            "timestamp": time.time(),
            "event_type": "promotion",
            "promotion_id": promotion.get("promotion_id"),
            "template_name": promotion.get("template_name"),
            "source_run_id": promotion.get("source_run_id"),
            "proposal_id": promotion.get("proposal_id"),
            "diff_summary": promotion.get("diff_summary", ""),
            "rolled_back": False,
        }
        ledger = self._read_ledger()
        ledger.append(entry)
        self._write_ledger(ledger)

    def record_rollback(self, promotion_id: str) -> None:
        """Record a rollback."""
        entry = {
            "timestamp": time.time(),
            "event_type": "rollback",
            "promotion_id": promotion_id,
        }
        ledger = self._read_ledger()
        ledger.append(entry)
        self._write_ledger(ledger)

    def get_stats(self) -> EvolutionStats:
        """Compute aggregate statistics from the ledger."""
        ledger = self._read_ledger()
        analyses = [e for e in ledger if "attributions" in e]
        promotions = [e for e in ledger if e.get("event_type") == "promotion"]
        rollbacks = [e for e in ledger if e.get("event_type") == "rollback"]

        total_attributions = sum(len(e.get("attributions", [])) for e in analyses)
        total_proposals = sum(len(e.get("proposals", [])) for e in analyses)

        # Failure class distribution
        failure_counts: Counter = Counter()
        for e in analyses:
            for attr in e.get("attributions", []):
                failure_counts[attr.get("failure_class", "unknown")] += 1

        # Proposal acceptance rate (from promotions vs total proposals)
        active_promotions = [p for p in promotions if not p.get("rolled_back")]
        acceptance_rate = (
            len(active_promotions) / max(total_proposals, 1)
            if total_proposals > 0 else 0.0
        )

        # Template improvement trend (how many times each template was promoted)
        template_trend: Counter = Counter()
        for p in promotions:
            if not p.get("rolled_back"):
                template_trend[p.get("template_name", "unknown")] += 1

        # Recurring patterns
        patterns = self._read_patterns()
        recurring = sorted(
            patterns,
            key=lambda p: p.get("occurrence_count", 0),
            reverse=True,
        )[:10]

        return EvolutionStats(
            total_runs_analyzed=len(analyses),
            total_attributions=total_attributions,
            total_proposals=total_proposals,
            total_promotions=len(promotions),
            total_rollbacks=len(rollbacks),
            failure_class_counts=dict(failure_counts),
            proposal_acceptance_rate=round(acceptance_rate, 4),
            recurring_patterns=recurring,
            template_improvement_trend=dict(template_trend),
        )

    def get_history(self, limit: int = 50) -> list[dict]:
        """Get recent ledger entries."""
        ledger = self._read_ledger()
        return ledger[-limit:] if ledger else []

    # ── Pattern extraction ────────────────────────────────

    def _update_patterns(self, entry: dict) -> None:
        """Merge new attributions into the recurring patterns store."""
        patterns = self._read_patterns()
        run_id = entry.get("run_id", "")

        for attr in entry.get("attributions", []):
            failure_class = attr.get("failure_class", "unknown")
            root_cause = attr.get("root_cause", "")
            # Normalize: take first 80 chars as pattern signature
            cause_fragment = root_cause[:80].strip()
            # Bug #7 FIX: use deterministic hashlib instead of non-deterministic Python hash()
            import hashlib
            cause_hash = hashlib.sha256(cause_fragment.encode("utf-8")).hexdigest()[:8]
            pattern_id = f"{failure_class}:{cause_hash}"

            existing = next((p for p in patterns if p.get("pattern_id") == pattern_id), None)
            if existing:
                existing["occurrence_count"] += 1
                existing["last_seen"] = entry.get("timestamp", time.time())
                if run_id not in existing.get("affected_runs", []):
                    existing["affected_runs"].append(run_id)
                for node in attr.get("affected_nodes", []):
                    if node not in existing.get("affected_nodes", []):
                        existing["affected_nodes"].append(node)
            else:
                patterns.append({
                    "pattern_id": pattern_id,
                    "failure_class": failure_class,
                    "root_cause_fragment": cause_fragment,
                    "occurrence_count": 1,
                    "affected_runs": [run_id],
                    "affected_nodes": attr.get("affected_nodes", []),
                    "last_seen": entry.get("timestamp", time.time()),
                })

        self._write_patterns(patterns)

    # ── Storage helpers ───────────────────────────────────

    def _read_ledger(self) -> list[dict]:
        if not self.ledger_path.exists():
            return []
        try:
            return json.loads(self.ledger_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return []

    def _write_ledger(self, ledger: list[dict]) -> None:
        self.ledger_path.write_text(
            json.dumps(ledger, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def _read_patterns(self) -> list[dict]:
        if not self.patterns_path.exists():
            return []
        try:
            return json.loads(self.patterns_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return []

    def _write_patterns(self, patterns: list[dict]) -> None:
        self.patterns_path.write_text(
            json.dumps(patterns, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
