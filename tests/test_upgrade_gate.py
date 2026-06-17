"""Tests for UpgradeGate + ProposalExecutor (Phase 2C).

Verifies:
- ProposalExecutor creates valid candidate artifacts for each proposal type
- UpgradeGate decision matrix (4-state: auto_accept / conditional / pending_human_review / rejected)
- full_pipeline() end-to-end: execute → eval → decide
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from eval_harness import EvalHarness
from evolution_engine import EvolutionProposal
from upgrade_gate import (
    CandidateArtifact,
    ProposalExecutor,
    UpgradeDecision,
    UpgradeGate,
)


def _mk_proposal(
    proposal_id: str = "test_proposal",
    target: str = "template",
    risk: str = "low",
    rationale: str = "template_defect: fix missing files",
    affected_files: list[str] | None = None,
) -> EvolutionProposal:
    return EvolutionProposal(
        proposal_id=proposal_id,
        target=target,  # type: ignore
        title="Test proposal",
        rationale=rationale,
        expected_benefit="test benefit",
        risk=risk,  # type: ignore
        affected_files=affected_files or ["templates/dev.json"],
        validation_commands=["echo ok"],
    )


# ── ProposalExecutor ───────────────────────────────────────────

class TestProposalExecutor:

    def test_template_candidate_created(self, tmp_path):
        executor = ProposalExecutor(template_dir=str(PROJECT_ROOT / "templates"))
        proposal = _mk_proposal(target="template")
        artifacts, sandbox = executor.prepare_candidate(proposal)

        assert len(artifacts) >= 1
        assert artifacts[0].kind == "template"
        assert os.path.isfile(artifacts[0].path)

        # Verify candidate template is valid JSON with enhanced prompt
        candidate = json.loads(Path(artifacts[0].path).read_text())
        assert "prompt_template" in candidate
        assert "进化增强约束" in candidate["prompt_template"]

    def test_template_candidate_uses_sandbox(self, tmp_path):
        executor = ProposalExecutor()
        proposal = _mk_proposal(target="template")
        sandbox_dir = str(tmp_path / "mysandbox")
        artifacts, sandbox = executor.prepare_candidate(proposal, sandbox_dir=sandbox_dir)

        assert sandbox == sandbox_dir
        assert os.path.isdir(sandbox)

    def test_quality_gate_candidate(self, tmp_path):
        executor = ProposalExecutor()
        proposal = _mk_proposal(target="quality_gate")
        artifacts, sandbox = executor.prepare_candidate(proposal)

        assert artifacts[0].kind == "quality_gate_rule"
        candidate = json.loads(Path(artifacts[0].path).read_text())
        assert "extra_checks" in candidate

    def test_model_route_candidate(self, tmp_path):
        executor = ProposalExecutor()
        proposal = _mk_proposal(target="model_route")
        artifacts, _ = executor.prepare_candidate(proposal)

        assert artifacts[0].kind == "config"
        candidate = json.loads(Path(artifacts[0].path).read_text())
        assert "route_adjustments" in candidate

    def test_runtime_candidate(self, tmp_path):
        executor = ProposalExecutor()
        proposal = _mk_proposal(target="runtime")
        artifacts, _ = executor.prepare_candidate(proposal)

        assert artifacts[0].kind == "config"
        candidate = json.loads(Path(artifacts[0].path).read_text())
        assert "changes" in candidate

    def test_generic_candidate_for_unknown_target(self, tmp_path):
        executor = ProposalExecutor()
        proposal = _mk_proposal(target="dag_planner")
        artifacts, _ = executor.prepare_candidate(proposal)

        assert len(artifacts) >= 1
        candidate = json.loads(Path(artifacts[0].path).read_text())
        assert "proposal_id" in candidate


# ── UpgradeGate decision matrix ────────────────────────────────

class TestUpgradeGateDecision:

    def _mk_eval_result(self, passed: bool, improvement: float) -> "EvalResult":
        from eval_harness import EvalResult
        return EvalResult(
            proposal_id="test",
            mode="simulated",
            baseline_avg_score=0.3,
            candidate_avg_score=0.3 + improvement,
            improvement=improvement,
            passed=passed,
            gate_reason="test",
            node_details=[],
            metadata={},
        )

    def test_low_risk_significant_improvement_auto_accepted(self):
        gate = UpgradeGate()
        proposal = _mk_proposal(risk="low")
        eval_result = self._mk_eval_result(passed=True, improvement=0.3)

        decision = gate.decide(proposal, eval_result)
        assert decision.action == "auto_accept"
        assert decision.is_accepted

    def test_low_risk_marginal_improvement_conditional(self):
        gate = UpgradeGate()
        proposal = _mk_proposal(risk="low")
        eval_result = self._mk_eval_result(passed=True, improvement=0.01)

        decision = gate.decide(proposal, eval_result)
        assert decision.action == "conditional"
        assert decision.is_accepted

    def test_medium_risk_significant_improvement_conditional(self):
        gate = UpgradeGate()
        proposal = _mk_proposal(risk="medium")
        eval_result = self._mk_eval_result(passed=True, improvement=0.3)

        decision = gate.decide(proposal, eval_result)
        assert decision.action == "conditional"

    def test_medium_risk_marginal_improvement_human_review(self):
        gate = UpgradeGate()
        proposal = _mk_proposal(risk="medium")
        eval_result = self._mk_eval_result(passed=True, improvement=0.01)

        decision = gate.decide(proposal, eval_result)
        assert decision.action == "pending_human_review"
        assert not decision.is_accepted

    def test_high_risk_always_human_review(self):
        gate = UpgradeGate()
        proposal = _mk_proposal(risk="high")
        eval_result = self._mk_eval_result(passed=True, improvement=0.9)

        decision = gate.decide(proposal, eval_result)
        assert decision.action == "pending_human_review"

    def test_rejected_on_regression(self):
        gate = UpgradeGate()
        proposal = _mk_proposal(risk="low")
        eval_result = self._mk_eval_result(passed=False, improvement=-0.3)

        decision = gate.decide(proposal, eval_result)
        assert decision.action == "rejected"
        assert not decision.is_accepted

    def test_decision_has_proposal_and_eval_data(self):
        gate = UpgradeGate()
        proposal = _mk_proposal(risk="low")
        eval_result = self._mk_eval_result(passed=True, improvement=0.2)

        decision = gate.decide(proposal, eval_result)
        assert decision.proposal["proposal_id"] == "test_proposal"
        assert decision.eval_result["improvement"] == 0.2

    def test_decision_serializable(self):
        gate = UpgradeGate()
        proposal = _mk_proposal(risk="low")
        eval_result = self._mk_eval_result(passed=True, improvement=0.2)

        decision = gate.decide(proposal, eval_result)
        d = decision.to_dict()
        json_str = json.dumps(d)  # should not raise
        assert "action" in json.loads(json_str)


# ── Full pipeline ──────────────────────────────────────────────

class TestFullPipeline:

    def test_full_pipeline_simulated(self, tmp_path):
        """Full pipeline: prepare → eval → decide."""
        executor = ProposalExecutor(template_dir=str(PROJECT_ROOT / "templates"))
        gate = UpgradeGate(
            executor=executor,
            harness=EvalHarness(),
        )
        proposal = _mk_proposal(risk="low", rationale="template_defect: fix missing files")

        run = {
            "nodes": [
                {"node_id": "n1", "status": "failed", "error": "timeout"},
                {"node_id": "n2", "status": "completed"},
            ],
            "status": "failed",
        }
        events = [
            {
                "type": "quality_fail",
                "node_id": "n1",
                "payload": {"reason": "缺少文件", "checks": {"files_exist": False}},
            }
        ]

        decision = gate.full_pipeline(proposal, run, events, mode="simulated")

        assert decision.action in ("auto_accept", "conditional", "pending_human_review", "rejected")
        assert decision.reason
        assert len(decision.candidate_artifacts) > 0
        assert decision.sandbox_dir

    def test_full_pipeline_empty_trace(self, tmp_path):
        """Empty trace should still produce a decision."""
        gate = UpgradeGate()
        proposal = _mk_proposal()

        decision = gate.full_pipeline(proposal, {"nodes": []}, [], mode="simulated")
        # Empty trace → no evaluable nodes → eval fails → rejected
        assert decision.action == "rejected"

    def test_full_pipeline_with_completed_run(self, tmp_path):
        """All-passing run → no improvement possible → conditional/rejected."""
        gate = UpgradeGate()
        proposal = _mk_proposal(risk="low")

        run = {"nodes": [{"node_id": "n1", "status": "completed"}], "status": "completed"}
        decision = gate.full_pipeline(proposal, run, [], mode="simulated")
        # Baseline is perfect; candidate can't improve → marginal → conditional
        assert decision.action in ("conditional", "auto_accept")

    def test_artifacts_are_valid_json(self, tmp_path):
        """All candidate artifacts should be valid JSON files."""
        executor = ProposalExecutor(template_dir=str(PROJECT_ROOT / "templates"))
        gate = UpgradeGate(executor=executor)
        proposal = _mk_proposal(target="template")

        decision = gate.full_pipeline(proposal, {"nodes": []}, [], mode="simulated")

        for art in decision.candidate_artifacts:
            if os.path.isfile(art["path"]):
                data = json.loads(Path(art["path"]).read_text(encoding="utf-8"))
                assert isinstance(data, dict)
