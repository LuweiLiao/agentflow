"""Tests for EvalHarness (Phase 2B).

Verifies:
- Baseline extraction from run traces
- Simulated evaluation predicts improvements
- Gate decision logic (accept/reject/conditional)
- Edge cases: empty traces, all-passing runs, no template
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from eval_harness import EvalHarness, EvalResult, NodeEvalDetail
from evolution_engine import EvolutionProposal


def _mk_proposal(
    proposal_id: str = "test_proposal",
    target: str = "template",
    risk: str = "low",
) -> EvolutionProposal:
    return EvolutionProposal(
        proposal_id=proposal_id,
        target=target,  # type: ignore
        title="Test proposal",
        rationale="test rationale",
        expected_benefit="test benefit",
        risk=risk,  # type: ignore
        affected_files=["templates/dev.json"],
        validation_commands=["echo ok"],
    )


def _mk_failed_node(node_id: str, error: str = "timeout") -> dict:
    return {"node_id": node_id, "label": node_id, "status": "failed", "error": error}


def _mk_completed_node(node_id: str) -> dict:
    return {"node_id": node_id, "label": node_id, "status": "completed"}


def _mk_quality_fail_event(node_id: str, reason: str = "缺少文件",
                           checks: dict | None = None) -> dict:
    return {
        "type": "quality_fail",
        "node_id": node_id,
        "payload": {
            "reason": reason,
            "checks": checks or {"files_exist": False, "non_empty_output": True},
        },
    }


# ── Baseline extraction ────────────────────────────────────────

class TestBaselineExtraction:

    def test_completed_nodes_get_full_score(self):
        harness = EvalHarness()
        run = {"nodes": [_mk_completed_node("n1"), _mk_completed_node("n2")]}
        details = harness._extract_baseline(run["nodes"], [])
        assert len(details) == 2
        assert all(d.baseline_score == 1.0 for d in details)
        assert all(d.baseline_passed for d in details)

    def test_failed_nodes_without_quality_event(self):
        harness = EvalHarness()
        run = {"nodes": [_mk_failed_node("n1")]}
        details = harness._extract_baseline(run["nodes"], [])
        assert len(details) == 1
        assert details[0].baseline_score == 0.0
        assert not details[0].baseline_passed

    def test_failed_nodes_with_quality_event(self):
        harness = EvalHarness()
        run = {"nodes": [_mk_failed_node("n1")]}
        events = [_mk_quality_fail_event("n1", checks={
            "files_exist": False, "non_empty_output": True, "no_error": True
        })]
        details = harness._extract_baseline(run["nodes"], events)
        assert len(details) == 1
        # 2 of 3 checks passed (excluding valid_json)
        assert 0 < details[0].baseline_score < 1.0

    def test_skipped_nodes(self):
        harness = EvalHarness()
        run = {"nodes": [{"node_id": "n1", "status": "skipped"}]}
        details = harness._extract_baseline(run["nodes"], [])
        assert details[0].baseline_score == 0.0

    def test_empty_trace(self):
        harness = EvalHarness()
        details = harness._extract_baseline([], [])
        assert details == []


# ── Simulated evaluation ───────────────────────────────────────

class TestSimulatedEval:

    def test_failed_nodes_improve_with_template_proposal(self):
        harness = EvalHarness()
        proposal = _mk_proposal(target="template")
        run = {"nodes": [_mk_failed_node("n1")]}
        events = [_mk_quality_fail_event("n1", checks={"files_exist": False})]
        baseline = harness._extract_baseline(run["nodes"], events)

        candidate = harness._simulate_candidate(proposal, baseline, candidate_template=None)
        assert len(candidate) == 1
        assert candidate[0].candidate_score > candidate[0].baseline_score
        # files_exist should be predicted to pass
        assert candidate[0].candidate_checks.get("files_exist") is True

    def test_completed_nodes_unchanged(self):
        harness = EvalHarness()
        proposal = _mk_proposal(target="template")
        run = {"nodes": [_mk_completed_node("n1"), _mk_failed_node("n2")]}
        events = [_mk_quality_fail_event("n2")]
        baseline = harness._extract_baseline(run["nodes"], events)

        candidate = harness._simulate_candidate(proposal, baseline, None)
        # Completed node should stay at 1.0
        n1 = next(c for c in candidate if c.node_id == "n1")
        assert n1.candidate_score == 1.0
        assert n1.improvement == 0.0

    def test_candidate_template_boosts_confidence(self):
        harness = EvalHarness()
        proposal = _mk_proposal(target="template")

        run = {"nodes": [_mk_failed_node("n1")]}
        events = [_mk_quality_fail_event("n1", checks={"files_exist": False})]
        baseline = harness._extract_baseline(run["nodes"], events)

        # Without candidate template
        no_template = harness._simulate_candidate(proposal, baseline, None)

        # With candidate template
        fresh_baseline = harness._extract_baseline(run["nodes"], events)
        with_template = harness._simulate_candidate(
            proposal, fresh_baseline, {"prompt_template": "improved"}
        )

        assert with_template[0].candidate_score >= no_template[0].candidate_score


# ── Full evaluate_proposal flow ────────────────────────────────

class TestEvaluateProposal:

    def test_simulated_mode_all_failed(self):
        harness = EvalHarness()
        proposal = _mk_proposal(target="template", risk="low")
        run = {
            "nodes": [_mk_failed_node("n1"), _mk_failed_node("n2")],
            "status": "failed",
        }
        events = [
            _mk_quality_fail_event("n1", checks={"files_exist": False}),
            _mk_quality_fail_event("n2", checks={"validation_commands": False}),
        ]

        result = harness.evaluate_proposal(proposal, run, events, mode="simulated")
        assert result.mode == "simulated"
        assert result.baseline_avg_score < result.candidate_avg_score
        assert result.improvement > 0
        assert result.passed

    def test_simulated_mode_all_passed(self):
        harness = EvalHarness()
        proposal = _mk_proposal()
        run = {"nodes": [_mk_completed_node("n1")], "status": "completed"}

        result = harness.evaluate_proposal(proposal, run, [], mode="simulated")
        assert result.baseline_avg_score == 1.0
        assert result.candidate_avg_score == 1.0
        assert result.improvement == 0.0
        assert result.passed  # equal is acceptable

    def test_empty_trace_returns_failed(self):
        harness = EvalHarness()
        proposal = _mk_proposal()

        result = harness.evaluate_proposal(proposal, {"nodes": []}, [], mode="simulated")
        assert not result.passed
        assert "No evaluable nodes" in result.gate_reason

    def test_result_has_node_details(self):
        harness = EvalHarness()
        proposal = _mk_proposal()
        run = {"nodes": [_mk_failed_node("n1"), _mk_completed_node("n2")]}
        events = [_mk_quality_fail_event("n1")]

        result = harness.evaluate_proposal(proposal, run, events, mode="simulated")
        assert len(result.node_details) == 2
        node_ids = {d.node_id for d in result.node_details}
        assert node_ids == {"n1", "n2"}

    def test_metadata_includes_proposal_info(self):
        harness = EvalHarness()
        proposal = _mk_proposal(target="quality_gate", risk="medium")
        run = {"nodes": [_mk_failed_node("n1")]}
        events = [_mk_quality_fail_event("n1")]

        result = harness.evaluate_proposal(proposal, run, events, mode="simulated")
        assert result.metadata["proposal_target"] == "quality_gate"
        assert result.metadata["proposal_risk"] == "medium"
        assert result.metadata["evaluated_nodes"] == 1


# ── Gate decision logic ────────────────────────────────────────

class TestGateDecision:

    def test_improvement_above_threshold_accepted(self):
        harness = EvalHarness()
        proposal = _mk_proposal()
        # Simulate: 2 failed nodes, baseline 0.0, candidate should be > 0.05
        run = {"nodes": [_mk_failed_node("n1"), _mk_failed_node("n2")]}
        events = [
            _mk_quality_fail_event("n1", checks={"files_exist": False}),
            _mk_quality_fail_event("n2", checks={"files_exist": False}),
        ]

        result = harness.evaluate_proposal(proposal, run, events, mode="simulated")
        assert result.passed
        assert "accepted" in result.gate_reason.lower()

    def test_gate_reason_contains_proposal_id(self):
        harness = EvalHarness()
        proposal = _mk_proposal(proposal_id="my_special_proposal")
        run = {"nodes": [_mk_failed_node("n1")]}
        events = [_mk_quality_fail_event("n1")]

        result = harness.evaluate_proposal(proposal, run, events, mode="simulated")
        assert "my_special_proposal" in result.gate_reason

    def test_result_serializable(self):
        """EvalResult should be serializable to dict/JSON."""
        harness = EvalHarness()
        proposal = _mk_proposal()
        run = {"nodes": [_mk_failed_node("n1")]}
        events = [_mk_quality_fail_event("n1")]

        result = harness.evaluate_proposal(proposal, run, events, mode="simulated")
        d = result.to_dict()
        import json
        json_str = json.dumps(d)  # should not raise
        assert json.loads(json_str)["proposal_id"] == proposal.proposal_id


# ── Real mode (without actual LLM — should raise gracefully) ────

class TestRealMode:

    def test_real_mode_without_runner_raises(self):
        harness = EvalHarness()  # no agent_runner_factory
        proposal = _mk_proposal()
        run = {"nodes": [_mk_failed_node("n1")]}
        events = [_mk_quality_fail_event("n1")]

        with pytest.raises(RuntimeError, match="agent_runner_factory"):
            harness.evaluate_proposal(proposal, run, events, mode="real")

    def test_real_mode_with_mock_runner(self):
        """Real eval with a mock runner that always succeeds."""
        class MockRunner:
            def execute(self, prompt, work_dir=None, profile="dev", max_turns=10, timeout=120):
                # Simulate creating a file in work_dir and returning success
                if work_dir:
                    Path(work_dir, "main.py").write_text("print('hello')")
                return {"output": "Generated main.py", "result": "success", "status": "ok"}

        def factory(model):
            return MockRunner()

        harness = EvalHarness(agent_runner_factory=factory)
        proposal = _mk_proposal(target="template")
        run = {"nodes": [_mk_failed_node("n1")]}
        events = [_mk_quality_fail_event("n1", checks={"files_exist": False})]

        candidate_template = {
            "profile": "dev",
            "prompt_template": "Create main.py with hello world.",
            "expected_files": ["main.py"],
        }

        result = harness.evaluate_proposal(
            proposal, run, events,
            candidate_template=candidate_template,
            mode="real",
        )
        assert result.mode == "real"
        assert result.candidate_avg_score > result.baseline_avg_score

    def test_real_mode_runner_exception_handled(self):
        """If the runner raises an exception, eval should capture the error gracefully."""
        class FailingRunner:
            def execute(self, **kwargs):
                raise RuntimeError("API timeout")

        harness = EvalHarness(agent_runner_factory=lambda m: FailingRunner())
        proposal = _mk_proposal(target="template")
        run = {"nodes": [_mk_failed_node("n1")]}
        events = [_mk_quality_fail_event("n1")]

        result = harness.evaluate_proposal(
            proposal, run, events,
            candidate_template={"prompt_template": "test", "profile": "dev"},
            mode="real",
        )
        # Error should be captured, not propagated
        assert result.mode == "real"
        detail = result.node_details[0]
        assert detail.candidate_checks.get("eval_error") is False
        assert "API timeout" in detail.candidate_checks.get("error_msg", "")
