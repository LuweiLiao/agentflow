"""Tests for TemplatePromoter (Phase 3A)."""

from __future__ import annotations

import json
import os
import sys
import shutil
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from template_promoter import TemplatePromoter, PromotionRecord


def _setup_templates(tmp_path):
    """Create a minimal template dir with one template."""
    tdir = tmp_path / "templates"
    tdir.mkdir()
    template = {
        "profile": "dev",
        "system_prompt": "You are a dev agent.",
        "prompt_template": "Write code for {node.label}.",
    }
    (tdir / "dev.json").write_text(json.dumps(template), encoding="utf-8")
    return tdir


def _mk_decision(action: str = "auto_accept", artifacts: list | None = None) -> dict:
    return {
        "action": action,
        "proposal": {"proposal_id": "test_proposal"},
        "candidate_artifacts": artifacts or [],
    }


class TestPromotion:

    def test_promote_modifies_production(self, tmp_path):
        tdir = _setup_templates(tmp_path)
        promoter = TemplatePromoter(template_dir=str(tdir), backups_dir=str(tmp_path / "backups"))

        # Create candidate with enhanced template (must match template name)
        candidate = tmp_path / "dev.json"
        enhanced = {
            "profile": "dev",
            "system_prompt": "You are a dev agent.",
            "prompt_template": "Write code for {node.label}.\n\nExtra constraint: must create files.",
        }
        candidate.write_text(json.dumps(enhanced), encoding="utf-8")

        record = promoter.promote(
            candidate_path=str(candidate),
            run_id="run_001",
            proposal_id="prop_001",
            decision_action="auto_accept",
        )

        assert record is not None
        assert record.template_name == "dev.json"
        assert record.promotion_id.startswith("promo_")

        # Production file should be updated
        prod = json.loads((tdir / "dev.json").read_text())
        assert "Extra constraint" in prod["prompt_template"]

        # Backup should exist
        assert Path(record.backup_path).exists()
        backup = json.loads(Path(record.backup_path).read_text())
        assert "Extra constraint" not in backup.get("prompt_template", "")

    def test_dry_run_does_not_modify(self, tmp_path):
        tdir = _setup_templates(tmp_path)
        promoter = TemplatePromoter(template_dir=str(tdir), backups_dir=str(tmp_path / "backups"))

        original = (tdir / "dev.json").read_text()

        candidate = tmp_path / "candidate_dev.json"
        enhanced = {"profile": "dev", "prompt_template": "Enhanced!"}
        candidate.write_text(json.dumps(enhanced), encoding="utf-8")

        record = promoter.promote(
            candidate_path=str(candidate),
            run_id="run_001",
            proposal_id="prop_001",
            decision_action="auto_accept",
            dry_run=True,
        )

        assert record is not None
        assert "dry run" in record.backup_path or record.promotion_id.startswith("dryrun")
        # Production should be unchanged
        assert (tdir / "dev.json").read_text() == original

    def test_no_change_returns_none(self, tmp_path):
        tdir = _setup_templates(tmp_path)
        promoter = TemplatePromoter(template_dir=str(tdir))

        # Candidate identical to production
        candidate = tmp_path / "dev.json"
        original = json.loads((tdir / "dev.json").read_text())
        candidate.write_text(json.dumps(original), encoding="utf-8")

        record = promoter.promote(
            candidate_path=str(candidate),
            run_id="run_001",
            proposal_id="prop_001",
            decision_action="auto_accept",
        )
        assert record is None

    def test_wrong_action_skipped(self, tmp_path):
        tdir = _setup_templates(tmp_path)
        promoter = TemplatePromoter(template_dir=str(tdir))

        candidate = tmp_path / "dev.json"
        candidate.write_text(json.dumps({"profile": "dev", "prompt_template": "new"}), encoding="utf-8")

        record = promoter.promote(
            candidate_path=str(candidate),
            run_id="run_001",
            proposal_id="prop_001",
            decision_action="rejected",
        )
        assert record is None

    def test_diff_summary(self, tmp_path):
        tdir = _setup_templates(tmp_path)
        promoter = TemplatePromoter(template_dir=str(tdir))

        candidate = tmp_path / "dev.json"
        enhanced = {
            "profile": "dev",
            "system_prompt": "Updated system prompt.",
            "prompt_template": "Write code. New constraint added here.",
            "max_turns": 30,
        }
        candidate.write_text(json.dumps(enhanced), encoding="utf-8")

        record = promoter.promote(
            candidate_path=str(candidate),
            run_id="run_001",
            proposal_id="prop_001",
            decision_action="auto_accept",
        )
        assert record is not None
        assert "prompt_template" in record.diff_summary
        assert "system_prompt" in record.diff_summary


class TestRollback:

    def test_rollback_restores_original(self, tmp_path):
        tdir = _setup_templates(tmp_path)
        promoter = TemplatePromoter(template_dir=str(tdir), backups_dir=str(tmp_path / "backups"))

        original = (tdir / "dev.json").read_text()

        # Promote
        candidate = tmp_path / "dev.json"
        candidate.write_text(json.dumps({"profile": "dev", "prompt_template": "CHANGED"}), encoding="utf-8")
        record = promoter.promote(
            candidate_path=str(candidate), run_id="r1", proposal_id="p1",
            decision_action="auto_accept",
        )
        assert record is not None

        # Verify it changed
        assert (tdir / "dev.json").read_text() != original

        # Rollback
        ok = promoter.rollback(record.promotion_id)
        assert ok
        # Compare semantically (not byte-for-byte, since formatting may differ)
        restored = json.loads((tdir / "dev.json").read_text())
        assert restored == json.loads(original)

    def test_rollback_already_rolled_back(self, tmp_path):
        tdir = _setup_templates(tmp_path)
        promoter = TemplatePromoter(template_dir=str(tdir), backups_dir=str(tmp_path / "b"))

        candidate = tmp_path / "c.json"
        candidate.write_text(json.dumps({"profile": "dev", "prompt_template": "X"}), encoding="utf-8")
        record = promoter.promote(
            candidate_path=str(candidate), run_id="r", proposal_id="p",
            decision_action="auto_accept",
        )

        assert promoter.rollback(record.promotion_id) is True
        # Second rollback should also return True (idempotent)
        assert promoter.rollback(record.promotion_id) is True

    def test_rollback_nonexistent_id(self, tmp_path):
        tdir = _setup_templates(tmp_path)
        promoter = TemplatePromoter(template_dir=str(tdir))
        assert promoter.rollback("nonexistent") is False


class TestHistory:

    def test_history_records_promotion(self, tmp_path):
        tdir = _setup_templates(tmp_path)
        promoter = TemplatePromoter(template_dir=str(tdir), backups_dir=str(tmp_path / "b"))

        candidate = tmp_path / "c.json"
        candidate.write_text(json.dumps({"profile": "dev", "prompt_template": "v2"}), encoding="utf-8")
        promoter.promote(str(candidate), "r1", "p1", "auto_accept")

        history = promoter.list_promotions()
        assert len(history) == 1
        assert history[0]["proposal_id"] == "p1"
        assert history[0]["source_run_id"] == "r1"

    def test_multiple_promotions_tracked(self, tmp_path):
        tdir = _setup_templates(tmp_path)
        promoter = TemplatePromoter(template_dir=str(tdir), backups_dir=str(tmp_path / "b"))

        for i in range(3):
            candidate = tmp_path / f"c{i}.json"
            candidate.write_text(
                json.dumps({"profile": "dev", "prompt_template": f"version {i}"}),
                encoding="utf-8",
            )
            promoter.promote(str(candidate), "r1", f"p{i}", "auto_accept")

        history = promoter.list_promotions()
        assert len(history) == 3

    def test_rolled_back_flag_in_history(self, tmp_path):
        tdir = _setup_templates(tmp_path)
        promoter = TemplatePromoter(template_dir=str(tdir), backups_dir=str(tmp_path / "b"))

        candidate = tmp_path / "c.json"
        candidate.write_text(json.dumps({"profile": "dev", "prompt_template": "v2"}), encoding="utf-8")
        record = promoter.promote(str(candidate), "r1", "p1", "auto_accept")

        promoter.rollback(record.promotion_id)

        active = promoter.list_promotions(include_rolled_back=False)
        assert len(active) == 0

        all_records = promoter.list_promotions()
        assert len(all_records) == 1
        assert all_records[0]["rolled_back"] is True


class TestPromoteFromDecision:

    def test_promote_from_auto_accept(self, tmp_path):
        tdir = _setup_templates(tmp_path)
        promoter = TemplatePromoter(template_dir=str(tdir), backups_dir=str(tmp_path / "b"))

        # Create candidate template artifact
        candidate = tmp_path / "dev.json"
        candidate.write_text(json.dumps({
            "profile": "dev",
            "prompt_template": "Enhanced template.",
        }), encoding="utf-8")

        decision = _mk_decision(
            action="auto_accept",
            artifacts=[{"kind": "template", "path": str(candidate)}],
        )

        records = promoter.promote_from_decision(decision, run_id="r1")
        assert len(records) == 1
        assert records[0].template_name == "dev.json"

    def test_promote_skips_non_template_artifacts(self, tmp_path):
        tdir = _setup_templates(tmp_path)
        promoter = TemplatePromoter(template_dir=str(tdir))

        decision = _mk_decision(
            action="auto_accept",
            artifacts=[
                {"kind": "config", "path": "/tmp/some_config.json"},
                {"kind": "template", "path": str(tmp_path / "nope.json")},  # doesn't exist
            ],
        )
        records = promoter.promote_from_decision(decision, run_id="r1")
        assert len(records) == 0  # config skipped, nonexistent template skipped
