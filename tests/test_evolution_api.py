"""Tests for the evolution API endpoints (Phase 2A).

Verifies:
- RunStore save/get/list evolution report methods
- EvolutionEngine integration with real RunStore data
- _run_evolution_analysis helper function
- Report persistence and retrieval
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


def _mk_node(nid: str, label: str = "N1") -> dict:
    """Create a node dict matching run_store's expected schema (uses 'id' key)."""
    return {"id": nid, "label": label, "profile": "dev"}


def _make_store(tmp_path) -> "RunStore":
    """Create an isolated RunStore with a temp DB."""
    from run_store import RunStore
    db_path = str(tmp_path / "test.db")
    return RunStore(db_path=db_path)


# ── RunStore evolution report persistence ──────────────────────

class TestEvolutionReportStore:

    def test_save_and_get_report(self, tmp_path):
        store = _make_store(tmp_path)
        run_id = store.create_run(requirement="test", nodes=[_mk_node("n1")], edges=[])

        report = {
            "run_id": run_id,
            "attributions": [
                {"failure_class": "template_defect", "root_cause": "test", "confidence": 0.8}
            ],
            "proposals": [{"proposal_id": "p1", "title": "test proposal"}],
            "trace_summary": {"run_status": "failed"},
        }

        v1 = store.save_evolution_report(run_id, report)
        assert v1 == 1

        fetched = store.get_evolution_report(run_id)
        assert fetched is not None
        assert fetched["version"] == 1
        assert fetched["report"]["run_id"] == run_id
        assert len(fetched["report"]["attributions"]) == 1

    def test_multiple_versions(self, tmp_path):
        store = _make_store(tmp_path)
        run_id = store.create_run(requirement="test", nodes=[_mk_node("n1")], edges=[])

        for i in range(3):
            store.save_evolution_report(run_id, {"run_id": run_id, "iteration": i})

        latest = store.get_evolution_report(run_id)
        assert latest["version"] == 3
        assert latest["report"]["iteration"] == 2

        v2 = store.get_evolution_report(run_id, version=2)
        assert v2["version"] == 2
        assert v2["report"]["iteration"] == 1

    def test_list_reports(self, tmp_path):
        store = _make_store(tmp_path)
        run_id = store.create_run(requirement="test", nodes=[_mk_node("n1")], edges=[])

        store.save_evolution_report(run_id, {"run_id": run_id, "v": 1})
        store.save_evolution_report(run_id, {"run_id": run_id, "v": 2})

        reports = store.list_evolution_reports(run_id)
        assert len(reports) == 2
        assert reports[0]["version"] == 1
        assert reports[1]["version"] == 2

    def test_get_nonexistent_report(self, tmp_path):
        store = _make_store(tmp_path)
        run_id = store.create_run(requirement="test", nodes=[_mk_node("n1")], edges=[])

        assert store.get_evolution_report(run_id) is None
        assert store.get_evolution_report("nonexistent") is None


# ── EvolutionEngine integration with RunStore ──────────────────

class TestEvolutionEngineIntegration:

    def test_analyze_failed_run(self, tmp_path):
        from evolution_engine import EvolutionEngine

        store = _make_store(tmp_path)
        run_id = store.create_run(
            requirement="test",
            nodes=[_mk_node("n1", "Node 1"), _mk_node("n2", "Node 2")],
            edges=[{"source": "n1", "target": "n2"}],
        )
        store.update_run_status(run_id, "failed")
        store.update_node(run_id, "n1", status="failed", error="timeout: no output produced")

        engine = EvolutionEngine(store=store)
        report = engine.analyze_run(run_id)

        assert report.run_id == run_id
        assert len(report.attributions) > 0
        assert len(report.proposals) > 0
        all_affected = set()
        for attr in report.attributions:
            all_affected.update(attr.affected_nodes)
        assert "n1" in all_affected

    def test_analyze_run_with_events(self, tmp_path):
        """Evolution engine should pick up quality_fail events."""
        from evolution_engine import EvolutionEngine

        store = _make_store(tmp_path)
        run_id = store.create_run(
            requirement="test", nodes=[_mk_node("n1")], edges=[])
        store.update_run_status(run_id, "failed")

        store.append_event(type(
            "FakeEvent", (), {
                "run_id": run_id,
                "sequence": 1,
                "type": "quality_fail",
                "node_id": "n1",
                "tool_call_id": "",
                "ts_ms": int(time.time() * 1000),
                "payload": {
                    "reason": "缺少文件: main.py",
                    "checks": {"files_exist": False},
                },
            }
        )())

        engine = EvolutionEngine(store=store)
        report = engine.analyze_run(run_id)

        classes = [a.failure_class for a in report.attributions]
        assert "template_defect" in classes

    def test_report_persistence_via_store(self, tmp_path):
        from evolution_engine import EvolutionEngine

        store = _make_store(tmp_path)
        run_id = store.create_run(
            requirement="test", nodes=[_mk_node("n1")], edges=[])
        store.update_run_status(run_id, "failed")
        store.update_node(run_id, "n1", status="failed", error="timeout")

        engine = EvolutionEngine(store=store)
        report = engine.analyze_run(run_id)
        report_dict = report.to_dict()

        v = store.save_evolution_report(run_id, report_dict)
        assert v == 1

        fetched = store.get_evolution_report(run_id)
        assert fetched["report"]["run_id"] == run_id
        assert len(fetched["report"]["proposals"]) == len(report_dict["proposals"])

    def test_writing_to_file(self, tmp_path):
        from evolution_engine import EvolutionEngine

        store = _make_store(tmp_path)
        run_id = store.create_run(
            requirement="test", nodes=[_mk_node("n1")], edges=[])
        store.update_run_status(run_id, "failed")

        engine = EvolutionEngine(store=store)
        report = engine.analyze_run(run_id)

        out_path = tmp_path / "subdir" / f"{run_id}.json"
        report.write_json(str(out_path))
        assert out_path.exists()

        data = json.loads(out_path.read_text(encoding="utf-8"))
        assert data["run_id"] == run_id


# ── Backend helper function tests ──────────────────────────────

def _load_backend(tmp_path, monkeypatch):
    """Load agentflow-backend.py as a module with an isolated DB."""
    import run_store as rs_module

    db_path = str(tmp_path / "agentflow_test.db")
    runs_dir = str(tmp_path / "runs")

    monkeypatch.setattr(rs_module, "DB_PATH", db_path)
    monkeypatch.setattr(rs_module, "RUNS_DIR", runs_dir)
    monkeypatch.setattr(rs_module, "_db", None)

    # Mock sys.argv to prevent PORT parsing error
    saved_argv = sys.argv
    sys.argv = ["agentflow-backend.py", "19999"]

    backend_path = PROJECT_ROOT / "agentflow-backend.py"
    spec = importlib.util.spec_from_file_location("agentflow_backend_ev", backend_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    sys.argv = saved_argv
    return mod


class TestEvolutionHelper:

    def test_run_evolution_analysis(self, tmp_path, monkeypatch):
        mod = _load_backend(tmp_path, monkeypatch)
        store = mod._store

        run_id = store.create_run(
            requirement="test", nodes=[_mk_node("n1")], edges=[])
        store.update_run_status(run_id, "failed")
        store.update_node(run_id, "n1", status="failed", error="timeout")

        report = mod._run_evolution_analysis(run_id)
        assert report["run_id"] == run_id
        assert report["_version"] == 1

        fetched = store.get_evolution_report(run_id)
        assert fetched is not None
        assert fetched["report"]["run_id"] == run_id

    def test_multiple_evolve_calls_increment_version(self, tmp_path, monkeypatch):
        mod = _load_backend(tmp_path, monkeypatch)
        store = mod._store

        run_id = store.create_run(
            requirement="test", nodes=[_mk_node("n1")], edges=[])
        store.update_run_status(run_id, "failed")

        r1 = mod._run_evolution_analysis(run_id)
        assert r1["_version"] == 1

        r2 = mod._run_evolution_analysis(run_id)
        assert r2["_version"] == 2

        reports = store.list_evolution_reports(run_id)
        assert len(reports) == 2

    def test_evolution_report_has_proposals(self, tmp_path, monkeypatch):
        """Evolution report should contain actionable proposals."""
        mod = _load_backend(tmp_path, monkeypatch)
        store = mod._store

        run_id = store.create_run(
            requirement="test", nodes=[_mk_node("n1")], edges=[])
        store.update_run_status(run_id, "failed")
        store.update_node(run_id, "n1", status="failed", error="No such file or directory: input/data.txt")

        report = mod._run_evolution_analysis(run_id)
        assert len(report["proposals"]) > 0
        # context_defect from "no such file" pattern
        classes = [a["failure_class"] for a in report["attributions"]]
        assert "context_defect" in classes
