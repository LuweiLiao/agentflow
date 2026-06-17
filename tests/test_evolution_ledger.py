"""Tests for EvolutionLedger (Phase 3D)."""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from evolution_ledger import EvolutionLedger, EvolutionStats


class TestLedgerBasics:

    def test_record_analysis(self, tmp_path):
        ledger = EvolutionLedger(data_dir=str(tmp_path / "ev"))
        report = {
            "run_id": "r1",
            "attributions": [
                {"failure_class": "template_defect", "root_cause": "missing files",
                 "affected_nodes": ["n1"]},
            ],
            "proposals": [{"proposal_id": "p1", "target": "template", "risk": "low"}],
            "trace_summary": {"run_status": "failed"},
        }
        ledger.record_analysis("r1", report)

        history = ledger.get_history()
        assert len(history) == 1
        assert history[0]["run_id"] == "r1"

    def test_record_multiple_analyses(self, tmp_path):
        ledger = EvolutionLedger(data_dir=str(tmp_path / "ev"))
        for i in range(3):
            ledger.record_analysis(f"run_{i}", {
                "run_id": f"run_{i}",
                "attributions": [{"failure_class": "model_defect", "root_cause": "timeout"}],
                "proposals": [{"proposal_id": "p", "target": "model_route"}],
            })
        assert len(ledger.get_history()) == 3

    def test_empty_stats(self, tmp_path):
        ledger = EvolutionLedger(data_dir=str(tmp_path / "ev"))
        stats = ledger.get_stats()
        assert stats.total_runs_analyzed == 0
        assert stats.total_promotions == 0


class TestStats:

    def test_stats_after_multiple_runs(self, tmp_path):
        ledger = EvolutionLedger(data_dir=str(tmp_path / "ev"))

        # Run 1: template defect
        ledger.record_analysis("r1", {
            "attributions": [{"failure_class": "template_defect", "root_cause": "missing files", "affected_nodes": ["n1"]}],
            "proposals": [{"proposal_id": "p1", "target": "template"}],
        })

        # Run 2: same defect (recurring)
        ledger.record_analysis("r2", {
            "attributions": [{"failure_class": "template_defect", "root_cause": "missing files", "affected_nodes": ["n2"]}],
            "proposals": [{"proposal_id": "p2", "target": "template"}],
        })

        # Run 3: different defect
        ledger.record_analysis("r3", {
            "attributions": [{"failure_class": "model_defect", "root_cause": "timeout", "affected_nodes": ["n3"]}],
            "proposals": [{"proposal_id": "p3", "target": "model_route"}],
        })

        stats = ledger.get_stats()
        assert stats.total_runs_analyzed == 3
        assert stats.total_attributions == 3
        assert stats.failure_class_counts.get("template_defect") == 2
        assert stats.failure_class_counts.get("model_defect") == 1

    def test_promotion_tracking(self, tmp_path):
        ledger = EvolutionLedger(data_dir=str(tmp_path / "ev"))
        ledger.record_promotion({
            "promotion_id": "promo_1",
            "template_name": "dev.json",
            "source_run_id": "r1",
            "proposal_id": "p1",
            "diff_summary": "added constraints",
        })
        stats = ledger.get_stats()
        assert stats.total_promotions == 1
        assert stats.template_improvement_trend.get("dev.json") == 1

    def test_rollback_tracking(self, tmp_path):
        ledger = EvolutionLedger(data_dir=str(tmp_path / "ev"))
        ledger.record_promotion({"promotion_id": "p1", "template_name": "dev.json"})
        ledger.record_rollback("p1")
        stats = ledger.get_stats()
        assert stats.total_promotions == 1
        assert stats.total_rollbacks == 1


class TestRecurringPatterns:

    def test_pattern_accumulates(self, tmp_path):
        ledger = EvolutionLedger(data_dir=str(tmp_path / "ev"))
        cause = "Node produced text but missed expected files"
        for i in range(5):
            ledger.record_analysis(f"r{i}", {
                "attributions": [{"failure_class": "template_defect", "root_cause": cause, "affected_nodes": [f"n{i}"]}],
                "proposals": [],
            })

        stats = ledger.get_stats()
        recurring = stats.recurring_patterns
        assert len(recurring) > 0
        top = recurring[0]
        assert top["occurrence_count"] == 5
        assert top["failure_class"] == "template_defect"
        assert len(top["affected_runs"]) == 5

    def test_different_patterns_dont_merge(self, tmp_path):
        ledger = EvolutionLedger(data_dir=str(tmp_path / "ev"))
        ledger.record_analysis("r1", {
            "attributions": [{"failure_class": "template_defect", "root_cause": "AAA"}],
            "proposals": [],
        })
        ledger.record_analysis("r2", {
            "attributions": [{"failure_class": "model_defect", "root_cause": "BBB"}],
            "proposals": [],
        })

        stats = ledger.get_stats()
        assert len(stats.recurring_patterns) >= 2

    def test_patterns_persist_across_instances(self, tmp_path):
        """Patterns should survive restart (persisted to disk)."""
        data_dir = str(tmp_path / "ev")
        ledger1 = EvolutionLedger(data_dir=data_dir)
        ledger1.record_analysis("r1", {
            "attributions": [{"failure_class": "template_defect", "root_cause": "test"}],
            "proposals": [],
        })

        # New instance, same dir
        ledger2 = EvolutionLedger(data_dir=data_dir)
        stats = ledger2.get_stats()
        assert stats.total_runs_analyzed == 1


class TestHistoryLimit:

    def test_history_limit(self, tmp_path):
        ledger = EvolutionLedger(data_dir=str(tmp_path / "ev"))
        for i in range(10):
            ledger.record_analysis(f"r{i}", {"attributions": [], "proposals": []})

        full = ledger.get_history(limit=100)
        assert len(full) == 10

        limited = ledger.get_history(limit=3)
        assert len(limited) == 3
