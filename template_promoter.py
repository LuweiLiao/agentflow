"""AgentFlow Template Promoter — Phase 3A.

Applies auto-accepted candidate templates to the production templates/ directory.

Safety guarantees:
  1. Every promotion creates a timestamped backup of the original template
  2. Backups are stored in .agentflow/template_backups/ with full provenance
  3. Rollback restores the exact previous version
  4. Promotions are logged to a promotion_history.json ledger
  5. Dry-run mode lets you preview changes without writing

Usage:
  promoter = TemplatePromoter(template_dir="templates/")
  result = promoter.promote(candidate_path, decision, dry_run=False)
  promoter.rollback(promotion_id)
"""

from __future__ import annotations

import json
import os
import shutil
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class PromotionRecord:
    """Record of one template promotion."""
    promotion_id: str
    timestamp: float
    template_name: str
    source_run_id: str
    proposal_id: str
    decision_action: str
    backup_path: str
    promoted_path: str
    diff_summary: str = ""
    rolled_back: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class TemplatePromoter:
    """Promote auto-accepted candidate templates to production.

    Architecture:
      templates/dev.json          ← production (modified in-place)
      .agentflow/template_backups/
        dev_20260618_003015.json  ← timestamped backup
      .agentflow/promotion_history.json  ← append-only ledger
    """

    def __init__(self, template_dir: str, backups_dir: str | None = None):
        self.template_dir = Path(template_dir)
        self.backups_dir = Path(backups_dir) if backups_dir else (
            self.template_dir.parent / ".agentflow" / "template_backups"
        )
        self.history_path = self.backups_dir.parent / "promotion_history.json"

    def promote(
        self,
        candidate_path: str,
        run_id: str,
        proposal_id: str,
        decision_action: str,
        dry_run: bool = False,
    ) -> PromotionRecord | None:
        """Promote a candidate template to production.

        Args:
            candidate_path: Path to the candidate template JSON file
            run_id: Source run that triggered this evolution
            proposal_id: Evolution proposal that generated this candidate
            decision_action: The UpgradeGate decision (must be auto_accept or conditional)
            dry_run: If True, compute the diff but don't write anything

        Returns:
            PromotionRecord if promoted, None if skipped (wrong action / no change)
        """
        if decision_action not in ("auto_accept", "conditional"):
            return None

        candidate = Path(candidate_path)
        if not candidate.is_file():
            return None

        template_name = candidate.name
        production_path = self.template_dir / template_name

        # Load candidate content
        candidate_content = json.loads(candidate.read_text(encoding="utf-8"))

        # Check if there's an actual change
        if production_path.exists():
            current_content = json.loads(production_path.read_text(encoding="utf-8"))
            if current_content == candidate_content:
                return None  # No change needed
        else:
            current_content = None

        # Compute diff summary
        diff_summary = self._compute_diff(current_content, candidate_content)

        if dry_run:
            return PromotionRecord(
                promotion_id=f"dryrun_{int(time.time())}",
                timestamp=time.time(),
                template_name=template_name,
                source_run_id=run_id,
                proposal_id=proposal_id,
                decision_action=decision_action,
                backup_path="(dry run)",
                promoted_path=str(production_path),
                diff_summary=diff_summary,
            )

        # Create backup
        self.backups_dir.mkdir(parents=True, exist_ok=True)
        ts_str = time.strftime("%Y%m%d_%H%M%S", time.localtime())
        backup_name = f"{template_name.replace('.json', '')}_{ts_str}.json"
        backup_path = self.backups_dir / backup_name

        if production_path.exists():
            shutil.copy2(production_path, backup_path)
        else:
            # New template — record as such
            backup_path.write_text(
                json.dumps({"_note": "New template, no previous version"}, indent=2),
                encoding="utf-8",
            )

        # Apply candidate to production
        production_path.write_text(
            json.dumps(candidate_content, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

        # Record promotion
        promotion_id = f"promo_{ts_str}_{template_name.replace('.json', '')}"
        record = PromotionRecord(
            promotion_id=promotion_id,
            timestamp=time.time(),
            template_name=template_name,
            source_run_id=run_id,
            proposal_id=proposal_id,
            decision_action=decision_action,
            backup_path=str(backup_path),
            promoted_path=str(production_path),
            diff_summary=diff_summary,
        )
        self._append_history(record)
        return record

    def rollback(self, promotion_id: str) -> bool:
        """Rollback a promotion by restoring the backup.

        Returns True if rollback succeeded.
        """
        history = self._read_history()
        record = next((r for r in history if r.get("promotion_id") == promotion_id), None)
        if not record:
            return False
        if record.get("rolled_back"):
            return True  # Already rolled back

        backup_path = Path(record["backup_path"])
        production_path = self.template_dir / record["template_name"]

        if backup_path.exists():
            backup_content = json.loads(backup_path.read_text(encoding="utf-8"))
            # Don't restore the _note marker
            if "_note" not in backup_content:
                production_path.write_text(
                    json.dumps(backup_content, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )
            else:
                # Template was new; remove it on rollback
                if production_path.exists():
                    production_path.unlink()

        # Mark as rolled back in history
        record["rolled_back"] = True
        self._write_history(history)
        return True

    def list_promotions(self, include_rolled_back: bool = True) -> list[dict]:
        """List all promotion records."""
        history = self._read_history()
        if not include_rolled_back:
            history = [r for r in history if not r.get("rolled_back")]
        return history

    def promote_from_decision(
        self,
        decision: dict[str, Any],
        run_id: str,
        dry_run: bool = False,
    ) -> list[PromotionRecord]:
        """Promote all accepted artifacts from an UpgradeDecision dict.

        Args:
            decision: UpgradeDecision.to_dict() output
            run_id: Source run ID
            dry_run: If True, preview without writing

        Returns:
            List of PromotionRecords for successfully promoted templates
        """
        if decision.get("action") not in ("auto_accept", "conditional"):
            return []

        proposal_id = decision.get("proposal", {}).get("proposal_id", "unknown")
        action = decision["action"]
        records = []

        for artifact in decision.get("candidate_artifacts", []):
            if artifact.get("kind") == "template":
                record = self.promote(
                    candidate_path=artifact["path"],
                    run_id=run_id,
                    proposal_id=proposal_id,
                    decision_action=action,
                    dry_run=dry_run,
                )
                if record:
                    records.append(record)

        return records

    # ── Internal helpers ──────────────────────────────────

    def _compute_diff(
        self,
        old: dict[str, Any] | None,
        new: dict[str, Any],
    ) -> str:
        """Compute a human-readable diff summary between two template dicts."""
        if old is None:
            return f"New template with keys: {list(new.keys())}"

        changes = []
        for key in set(list(old.keys()) + list(new.keys())):
            old_val = old.get(key)
            new_val = new.get(key)
            if old_val != new_val:
                if key == "prompt_template":
                    old_len = len(str(old_val or ""))
                    new_len = len(str(new_val or ""))
                    changes.append(f"prompt_template: {old_len}→{new_len} chars (+{new_len - old_len})")
                elif old_val is None:
                    changes.append(f"{key}: added")
                elif new_val is None:
                    changes.append(f"{key}: removed")
                else:
                    changes.append(f"{key}: changed")

        if not changes:
            return "No changes"
        return "; ".join(changes)

    def _append_history(self, record: PromotionRecord) -> None:
        """Append a promotion record to the ledger."""
        self.backups_dir.mkdir(parents=True, exist_ok=True)
        history = self._read_history()
        history.append(record.to_dict())
        self._write_history(history)

    def _read_history(self) -> list[dict]:
        if not self.history_path.exists():
            return []
        try:
            return json.loads(self.history_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return []

    def _write_history(self, history: list[dict]) -> None:
        self.backups_dir.mkdir(parents=True, exist_ok=True)
        self.history_path.write_text(
            json.dumps(history, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
