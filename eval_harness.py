"""AgentFlow Eval Harness — Phase 2B.

Evaluates an EvolutionProposal by comparing baseline run performance against
a candidate configuration (modified template / quality gate / model route).

Two evaluation modes:
  - **simulated**: Rule-based heuristic that predicts whether the proposed change
    would fix the identified failures. Fast, no LLM calls, deterministic.
    Used for quick screening before committing to a real eval.
  - **real**: Re-runs failed nodes with the candidate template and compares
    QualityGate results. Requires LLM API access.

Architecture:
  EvalHarness.evaluate_proposal(proposal, run_trace)
    → _prepare_baseline(run_trace)      # extract baseline quality scores
    → _prepare_candidate(proposal)       # apply proposed changes
    → _evaluate(mode)                    # score baseline vs candidate
    → EvalResult(delta_score, passed)
"""

from __future__ import annotations

import json
import os
import shutil
import tempfile
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Literal

from evolution_engine import EvolutionProposal
from quality_gate import QualityGate, QualityGateResult

EvalMode = Literal["simulated", "real"]


@dataclass
class NodeEvalDetail:
    """Per-node evaluation breakdown."""
    node_id: str
    baseline_score: float
    candidate_score: float = 0.0
    baseline_checks: dict[str, bool] = field(default_factory=dict)
    candidate_checks: dict[str, bool] = field(default_factory=dict)
    baseline_passed: bool = False
    candidate_passed: bool = False
    improvement: float = 0.0


@dataclass
class EvalResult:
    """Structured result of evaluating one EvolutionProposal."""
    proposal_id: str
    mode: EvalMode
    baseline_avg_score: float
    candidate_avg_score: float
    improvement: float
    passed: bool  # candidate >= baseline (with tolerance)
    gate_reason: str
    node_details: list[NodeEvalDetail] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        return d


class EvalHarness:
    """Evaluate EvolutionProposals against baseline run traces.

    The harness extracts baseline quality information from the run trace,
    applies the proposed change, and scores the candidate.

    In simulated mode, it uses rule-based heuristics derived from the proposal's
    failure class to predict improvement. In real mode, it re-runs failed nodes.
    """

    # Minimum improvement required to accept a proposal (avoid noise)
    MIN_IMPROVEMENT_THRESHOLD = 0.05

    # Tolerance for "equal" scores
    SCORE_TOLERANCE = 0.01

    def __init__(self, quality_gate: QualityGate | None = None,
                 agent_runner_factory=None):
        """
        Args:
            quality_gate: QualityGate instance (or default)
            agent_runner_factory: Callable that returns an AgentRunner-like object.
                Required for real-mode evaluation. Signature: factory(model: str)
                The returned object must have: execute(prompt, work_dir, profile, max_turns, timeout) -> dict
        """
        self.quality_gate = quality_gate or QualityGate()
        self.agent_runner_factory = agent_runner_factory

    def evaluate_proposal(
        self,
        proposal: EvolutionProposal,
        run: dict[str, Any] | None,
        events: list[dict[str, Any]] | None = None,
        candidate_template: dict[str, Any] | None = None,
        mode: EvalMode = "simulated",
    ) -> EvalResult:
        """Evaluate a single proposal against a baseline run.

        Args:
            proposal: The evolution proposal to evaluate
            run: Baseline run dict (nodes, status, etc.)
            events: Baseline run events (quality_fail, node_complete, etc.)
            candidate_template: Modified template to test (for template proposals)
            mode: "simulated" (fast heuristic) or "real" (re-run nodes)

        Returns:
            EvalResult with comparison metrics
        """
        run = run or {}
        events = events or []
        nodes = run.get("nodes") or []

        # Extract baseline quality data from events and node statuses
        baseline_details = self._extract_baseline(nodes, events)

        if not baseline_details:
            return EvalResult(
                proposal_id=proposal.proposal_id,
                mode=mode,
                baseline_avg_score=0.0,
                candidate_avg_score=0.0,
                improvement=0.0,
                passed=False,
                gate_reason="No evaluable nodes found in baseline trace.",
            )

        baseline_scores = [d.baseline_score for d in baseline_details]
        baseline_avg = sum(baseline_scores) / len(baseline_scores)

        if mode == "simulated":
            candidate_details = self._simulate_candidate(
                proposal, baseline_details, candidate_template
            )
        elif mode == "real":
            candidate_details = self._real_evaluate(
                proposal, baseline_details, nodes, candidate_template
            )
        else:
            raise ValueError(f"Unknown eval mode: {mode}")

        candidate_scores = [d.candidate_score for d in candidate_details]
        candidate_avg = sum(candidate_scores) / len(candidate_scores) if candidate_scores else 0.0

        improvement = candidate_avg - baseline_avg
        passed = improvement >= -self.SCORE_TOLERANCE  # equal or better

        gate_reason = self._gate_reason(improvement, passed, proposal)

        return EvalResult(
            proposal_id=proposal.proposal_id,
            mode=mode,
            baseline_avg_score=round(baseline_avg, 4),
            candidate_avg_score=round(candidate_avg, 4),
            improvement=round(improvement, 4),
            passed=passed,
            gate_reason=gate_reason,
            node_details=candidate_details,
            metadata={
                "proposal_target": proposal.target,
                "proposal_risk": proposal.risk,
                "evaluated_nodes": len(candidate_details),
            },
        )

    # ── Baseline extraction ───────────────────────────────

    def _extract_baseline(
        self,
        nodes: list[dict],
        events: list[dict],
    ) -> list[NodeEvalDetail]:
        """Extract per-node baseline quality from run trace.

        For nodes that have quality_fail events, we reconstruct the baseline
        QualityGate checks. For nodes that completed, score is 1.0.
        """
        details: list[NodeEvalDetail] = []
        quality_events = {
            e.get("node_id", ""): e
            for e in events
            if e.get("type") == "quality_fail"
        }

        for node in nodes:
            node_id = node.get("node_id") or node.get("id", "")
            status = node.get("status", "unknown")

            if status == "completed":
                details.append(NodeEvalDetail(
                    node_id=node_id,
                    baseline_score=1.0,
                    baseline_checks={"completed": True},
                    baseline_passed=True,
                ))
            elif status in ("failed", "timed_out"):
                q_event = quality_events.get(node_id, {})
                payload = q_event.get("payload", {}) if q_event else {}
                checks = payload.get("checks", {})
                reason = payload.get("reason", "")

                # Reconstruct score from checks
                if checks:
                    scoring_checks = {k: v for k, v in checks.items() if k != "valid_json"}
                    score = sum(1 for v in scoring_checks.values() if v) / max(len(scoring_checks), 1)
                else:
                    score = 0.0

                details.append(NodeEvalDetail(
                    node_id=node_id,
                    baseline_score=score,
                    baseline_checks=checks or {"failed": False},
                    baseline_passed=False,
                ))
            elif status == "skipped":
                details.append(NodeEvalDetail(
                    node_id=node_id,
                    baseline_score=0.0,
                    baseline_checks={"skipped": True},
                    baseline_passed=False,
                ))

        return details

    # ── Simulated evaluation ──────────────────────────────

    def _simulate_candidate(
        self,
        proposal: EvolutionProposal,
        baseline_details: list[NodeEvalDetail],
        candidate_template: dict[str, Any] | None,
    ) -> list[NodeEvalDetail]:
        """Rule-based heuristic prediction of candidate performance.

        Uses the proposal's target type and risk to predict how much the
        failure would be fixed:
        - template_defect → predicts files_exist and validation_commands pass
        - context_defect → predicts upstream artifact materialization works
        - model_defect → predicts non-empty output and no timeout
        - runtime_defect → predicts workspace and events persist correctly
        """
        results = []
        # Confidence map: how likely this proposal type fixes the issue
        fix_confidence = {
            "template": 0.75,   # template changes are high-impact for generation
            "quality_gate": 0.65,
            "runtime": 0.70,
            "dag_planner": 0.60,
            "model_route": 0.55,
            "eval": 0.50,
        }
        base_fix_rate = fix_confidence.get(proposal.target, 0.5)

        # If a candidate template is provided, boost confidence
        if candidate_template and proposal.target == "template":
            base_fix_rate = min(base_fix_rate + 0.15, 0.95)

        for detail in baseline_details:
            # Already-passing nodes stay passing
            if detail.baseline_passed:
                results.append(NodeEvalDetail(
                    node_id=detail.node_id,
                    baseline_score=detail.baseline_score,
                    candidate_score=1.0,
                    baseline_checks=detail.baseline_checks,
                    candidate_checks=detail.baseline_checks,
                    baseline_passed=True,
                    candidate_passed=True,
                    improvement=0.0,
                ))
                continue

            # Failed nodes: predict improvement based on fix rate
            # The candidate score is a weighted blend of baseline and full-pass
            predicted_score = detail.baseline_score + (1.0 - detail.baseline_score) * base_fix_rate
            predicted_score = min(predicted_score, 1.0)

            # Predict which checks would now pass
            candidate_checks = dict(detail.baseline_checks)
            if "files_exist" in candidate_checks:
                candidate_checks["files_exist"] = True
            if "validation_commands" in candidate_checks:
                candidate_checks["validation_commands"] = True
            if "non_empty_output" in candidate_checks:
                candidate_checks["non_empty_output"] = True
            if "no_error" in candidate_checks:
                candidate_checks["no_error"] = True

            results.append(NodeEvalDetail(
                node_id=detail.node_id,
                baseline_score=detail.baseline_score,
                candidate_score=round(predicted_score, 4),
                baseline_checks=detail.baseline_checks,
                candidate_checks=candidate_checks,
                baseline_passed=False,
                candidate_passed=predicted_score >= 0.8,
                improvement=round(predicted_score - detail.baseline_score, 4),
            ))

        return results

    # ── Real evaluation ───────────────────────────────────

    def _real_evaluate(
        self,
        proposal: EvolutionProposal,
        baseline_details: list[NodeEvalDetail],
        nodes: list[dict],
        candidate_template: dict[str, Any] | None,
    ) -> list[NodeEvalDetail]:
        """Re-run failed nodes with candidate template.

        This requires agent_runner_factory to be set. The factory should return
        an object compatible with AgentRunner.execute(prompt, work_dir, profile, ...).
        """
        if not self.agent_runner_factory:
            raise RuntimeError(
                "Real evaluation requires agent_runner_factory. "
                "Pass it to EvalHarness constructor."
            )

        runner = self.agent_runner_factory(
            candidate_template.get("model", "deepseek-chat") if candidate_template else "deepseek-chat"
        )
        results = []

        for detail in baseline_details:
            if detail.baseline_passed:
                results.append(NodeEvalDetail(
                    node_id=detail.node_id,
                    baseline_score=detail.baseline_score,
                    candidate_score=1.0,
                    baseline_checks=detail.baseline_checks,
                    candidate_checks=detail.baseline_checks,
                    baseline_passed=True,
                    candidate_passed=True,
                    improvement=0.0,
                ))
                continue

            # Find the node's task info
            node = next((n for n in nodes if (n.get("node_id") or n.get("id", "")) == detail.node_id), {})
            profile = candidate_template.get("profile", "dev") if candidate_template else "dev"
            max_turns = candidate_template.get("max_turns", 15) if candidate_template else 15
            timeout = candidate_template.get("timeout_s", 120) if candidate_template else 120

            # Build prompt from candidate template's prompt_template
            prompt = candidate_template.get("prompt_template", "") if candidate_template else ""
            if not prompt:
                # No candidate template to test; keep baseline score
                results.append(NodeEvalDetail(
                    node_id=detail.node_id,
                    baseline_score=detail.baseline_score,
                    candidate_score=detail.baseline_score,
                    baseline_checks=detail.baseline_checks,
                    candidate_checks=detail.baseline_checks,
                    baseline_passed=False,
                    candidate_passed=False,
                    improvement=0.0,
                ))
                continue

            # Re-run in temp workspace
            with tempfile.TemporaryDirectory(prefix=f"eval_{detail.node_id}_") as work_dir:
                try:
                    agent_result = runner.execute(
                        prompt=prompt,
                        work_dir=work_dir,
                        profile=profile,
                        max_turns=max_turns,
                        timeout=timeout,
                    )
                    qg_result = self.quality_gate.evaluate(
                        node_result=agent_result,
                        task=candidate_template,
                        node_dir=work_dir,
                    )
                    results.append(NodeEvalDetail(
                        node_id=detail.node_id,
                        baseline_score=detail.baseline_score,
                        candidate_score=qg_result.score,
                        baseline_checks=detail.baseline_checks,
                        candidate_checks=qg_result.checks,
                        baseline_passed=False,
                        candidate_passed=qg_result.passed,
                        improvement=round(qg_result.score - detail.baseline_score, 4),
                    ))
                except Exception as e:
                    results.append(NodeEvalDetail(
                        node_id=detail.node_id,
                        baseline_score=detail.baseline_score,
                        candidate_score=0.0,
                        baseline_checks=detail.baseline_checks,
                        candidate_checks={"eval_error": False, "error_msg": str(e)[:200]},
                        baseline_passed=False,
                        candidate_passed=False,
                        improvement=0.0,
                    ))

        return results

    # ── Gate decision ─────────────────────────────────────

    def _gate_reason(self, improvement: float, passed: bool, proposal: EvolutionProposal) -> str:
        """Generate human-readable gate decision reason."""
        if passed and improvement >= self.MIN_IMPROVEMENT_THRESHOLD:
            return (
                f"Candidate outperforms baseline by {improvement:.1%} "
                f"(≥ {self.MIN_IMPROVEMENT_THRESHOLD:.0%} threshold). "
                f"Proposal '{proposal.proposal_id}' accepted."
            )
        if passed:
            return (
                f"Candidate matches baseline (delta={improvement:+.1%}). "
                f"Proposal '{proposal.proposal_id}' conditionally accepted — "
                f"insufficient improvement to auto-promote."
            )
        return (
            f"Candidate underperforms baseline by {-improvement:.1%}. "
            f"Proposal '{proposal.proposal_id}' rejected."
        )
