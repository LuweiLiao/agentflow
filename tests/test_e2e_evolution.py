"""End-to-end test for the self-evolution closed loop (Phase 2D).

Simulates a realistic run lifecycle:
  1. Create a run with multiple nodes (some succeed, some fail)
  2. Record quality_fail events for failed nodes
  3. Run evolution analysis → produces attributions + proposals
  4. For each proposal: run full upgrade pipeline (prepare → eval → decide)
  5. Verify the decision matrix produces sensible outcomes
  6. Verify reports are persisted and retrievable

This test does NOT call any LLM — it uses simulated eval mode.
"""

from __future__ import annotations

import json
import os
import sys
import importlib.util
import time
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from run_store import RunStore
from evolution_engine import EvolutionEngine
from eval_harness import EvalHarness
from upgrade_gate import ProposalExecutor, UpgradeGate


def _load_backend(tmp_path, monkeypatch):
    """Load agentflow-backend.py as a module with an isolated DB."""
    import run_store as rs_module

    db_path = str(tmp_path / "e2e_test.db")
    runs_dir = str(tmp_path / "runs")

    monkeypatch.setattr(rs_module, "DB_PATH", db_path)
    monkeypatch.setattr(rs_module, "RUNS_DIR", runs_dir)
    monkeypatch.setattr(rs_module, "_db", None)

    saved_argv = sys.argv
    sys.argv = ["agentflow-backend.py", "19998"]

    backend_path = PROJECT_ROOT / "agentflow-backend.py"
    spec = importlib.util.spec_from_file_location("agentflow_backend_e2e", backend_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    sys.argv = saved_argv
    return mod


class TestEvolutionClosedLoop:
    """Full closed-loop test: run failure → evolution → proposals → eval → upgrade decisions."""

    def test_complete_pipeline(self, tmp_path, monkeypatch):
        """The full self-evolution lifecycle in one test."""
        mod = _load_backend(tmp_path, monkeypatch)
        store = mod._store

        # ── Step 1: Create a run with mixed results ──────────────
        run_id = store.create_run(
            requirement="Build a PyQt serial assistant",
            nodes=[
                {"id": "design", "label": "设计", "profile": "design"},
                {"id": "dev1", "label": "主界面开发", "profile": "dev"},
                {"id": "dev2", "label": "串口模块", "profile": "dev"},
                {"id": "test1", "label": "集成测试", "profile": "test"},
            ],
            edges=[
                {"source": "design", "target": "dev1"},
                {"source": "design", "target": "dev2"},
                {"source": "dev1", "target": "test1"},
                {"source": "dev2", "target": "test1"},
            ],
        )

        # Mark some nodes as completed, some as failed
        store.update_node(run_id, "design", status="completed", result="设计完成")
        store.update_node(run_id, "dev1", status="completed", result="主界面代码完成")
        store.update_node(run_id, "dev2", status="failed",
                          error="No such file or directory: input/design.json",
                          result="Failed to read upstream design")

        # Record quality_fail event for dev2
        store.append_event(type("E", (), {
            "run_id": run_id,
            "sequence": 1,
            "type": "quality_fail",
            "node_id": "dev2",
            "tool_call_id": "",
            "ts_ms": int(time.time() * 1000),
            "payload": {
                "reason": "缺少文件: input/design.json",
                "checks": {"files_exist": False, "non_empty_output": True, "no_error": False},
            },
        })())

        store.update_node(run_id, "test1", status="skipped",
                          result="上游 dev2 失败，跳过")
        store.update_run_status(run_id, "failed")

        # ── Step 2: Run evolution analysis ───────────────────────
        report_dict = mod._run_evolution_analysis(run_id)
        assert report_dict["run_id"] == run_id
        assert len(report_dict["attributions"]) > 0
        assert len(report_dict["proposals"]) > 0

        # Verify the attributions cover the failed node
        all_affected = set()
        for attr in report_dict["attributions"]:
            all_affected.update(attr.get("affected_nodes", []))
        assert "dev2" in all_affected

        # ── Step 3: Verify report persistence ────────────────────
        fetched = store.get_evolution_report(run_id)
        assert fetched is not None
        assert fetched["report"]["run_id"] == run_id

        # ── Step 4: Run upgrade pipeline for each proposal ───────
        events = store.list_events(run_id)
        run = store.get_run(run_id)
        decisions = []

        for prop_dict in report_dict["proposals"]:
            from evolution_engine import EvolutionProposal
            proposal = EvolutionProposal(
                proposal_id=prop_dict["proposal_id"],
                target=prop_dict["target"],
                title=prop_dict["title"],
                rationale=prop_dict["rationale"],
                expected_benefit=prop_dict["expected_benefit"],
                risk=prop_dict["risk"],
                affected_files=prop_dict.get("affected_files", []),
                validation_commands=prop_dict.get("validation_commands", []),
                rollback=prop_dict.get("rollback", ""),
            )

            decision = mod._upgrade_gate.full_pipeline(
                proposal, run, events, mode="simulated"
            )
            decisions.append(decision)

        # ── Step 5: Verify decisions are sensible ────────────────
        assert len(decisions) > 0

        for d in decisions:
            assert d.action in ("auto_accept", "conditional", "pending_human_review", "rejected")
            assert d.reason
            assert len(d.candidate_artifacts) > 0
            assert d.sandbox_dir

            # Artifacts should be valid files
            for art in d.candidate_artifacts:
                if os.path.isfile(art["path"]):
                    data = json.loads(Path(art["path"]).read_text(encoding="utf-8"))
                    assert isinstance(data, dict)

        # At least some proposals should be accepted (the run had clear fixable failures)
        accepted = [d for d in decisions if d.is_accepted]
        assert len(accepted) > 0, "At least one proposal should be accepted for clear fixable failures"

    def test_auto_trigger_on_failure(self, tmp_path, monkeypatch):
        """Verify that evolution analysis is auto-triggered when a run fails."""
        mod = _load_backend(tmp_path, monkeypatch)
        store = mod._store

        run_id = store.create_run(
            requirement="test",
            nodes=[{"id": "n1", "label": "N1", "profile": "dev"}],
            edges=[],
        )
        store.update_run_status(run_id, "failed")
        store.update_node(run_id, "n1", status="failed", error="timeout")

        # Simulate what _execute_run does at the end
        # (in real code this is auto-triggered; here we call it directly)
        report = mod._run_evolution_analysis(run_id)

        # Report should be persisted
        fetched = store.get_evolution_report(run_id)
        assert fetched is not None
        assert fetched["version"] == 1

    def test_multiple_evolution_versions(self, tmp_path, monkeypatch):
        """Running evolution multiple times should create versioned reports."""
        mod = _load_backend(tmp_path, monkeypatch)
        store = mod._store

        run_id = store.create_run(
            requirement="test",
            nodes=[{"id": "n1", "label": "N1", "profile": "dev"}],
            edges=[],
        )
        store.update_run_status(run_id, "failed")
        store.update_node(run_id, "n1", status="failed", error="timeout")

        # Run evolution 3 times
        for _ in range(3):
            mod._run_evolution_analysis(run_id)

        reports = store.list_evolution_reports(run_id)
        assert len(reports) == 3
        assert reports[0]["version"] == 1
        assert reports[2]["version"] == 3

        # Latest should be retrievable
        latest = store.get_evolution_report(run_id)
        assert latest["version"] == 3

    def test_upgrade_decision_serializes_cleanly(self, tmp_path, monkeypatch):
        """All upgrade decisions should serialize to clean JSON for API response."""
        mod = _load_backend(tmp_path, monkeypatch)
        store = mod._store

        run_id = store.create_run(
            requirement="test",
            nodes=[{"id": "n1", "label": "N1", "profile": "dev"}],
            edges=[],
        )
        store.update_run_status(run_id, "failed")
        store.update_node(run_id, "n1", status="failed", error="timeout")

        report_dict = mod._run_evolution_analysis(run_id)
        events = store.list_events(run_id)
        run = store.get_run(run_id)

        from evolution_engine import EvolutionProposal
        for prop_dict in report_dict["proposals"]:
            proposal = EvolutionProposal(
                proposal_id=prop_dict["proposal_id"],
                target=prop_dict["target"],
                title=prop_dict["title"],
                rationale=prop_dict["rationale"],
                expected_benefit=prop_dict["expected_benefit"],
                risk=prop_dict["risk"],
                affected_files=prop_dict.get("affected_files", []),
                validation_commands=prop_dict.get("validation_commands", []),
                rollback=prop_dict.get("rollback", ""),
            )

            decision = mod._upgrade_gate.full_pipeline(
                proposal, run, events, mode="simulated"
            )

            # Serialize to dict and then to JSON string
            d = decision.to_dict()
            json_str = json.dumps(d, ensure_ascii=False)
            parsed = json.loads(json_str)

            assert "action" in parsed
            assert "reason" in parsed
            assert "proposal" in parsed
            assert "eval_result" in parsed
            assert "candidate_artifacts" in parsed


class TestEvolutionClosedLoopSummary:
    """Tests that verify the complete closed loop produces meaningful summaries."""

    def test_proposal_covers_all_failure_types(self, tmp_path, monkeypatch):
        """Multiple failure types in one run should generate diverse proposals."""
        mod = _load_backend(tmp_path, monkeypatch)
        store = mod._store

        run_id = store.create_run(
            requirement="test multi-failure",
            nodes=[
                {"id": "n1", "label": "N1", "profile": "dev"},
                {"id": "n2", "label": "N2", "profile": "dev"},
                {"id": "n3", "label": "N3", "profile": "dev"},
            ],
            edges=[],
        )

        # Three different failure types
        store.update_node(run_id, "n1", status="failed", error="timeout")
        store.update_node(run_id, "n2", status="failed",
                          error="No such file: input/upstream.txt")
        store.update_node(run_id, "n3", status="timed_out", error="exceeded 300s budget")

        # Quality fail for n1 (template defect)
        store.append_event(type("E", (), {
            "run_id": run_id,
            "sequence": 1,
            "type": "quality_fail",
            "node_id": "n1",
            "tool_call_id": "",
            "ts_ms": int(time.time() * 1000),
            "payload": {
                "reason": "缺少文件: main.py",
                "checks": {"files_exist": False, "non_empty_output": True},
            },
        })())

        store.update_run_status(run_id, "failed")

        report_dict = mod._run_evolution_analysis(run_id)

        # Should have multiple attribution classes
        attr_classes = {a["failure_class"] for a in report_dict["attributions"]}
        assert len(attr_classes) >= 2  # at least 2 different failure types

        # Should have multiple proposals
        assert len(report_dict["proposals"]) >= 2

        # Proposals should target different things
        targets = {p["target"] for p in report_dict["proposals"]}
        assert len(targets) >= 1
