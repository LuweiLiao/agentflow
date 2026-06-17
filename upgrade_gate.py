"""AgentFlow Upgrade Gate — Phase 2C.

The UpgradeGate is the final decision point in the self-evolution loop:

  QualityGate(✅) → Trace(✅) → FailureAttributor(✅) → ProposalGenerator(✅)
    → ProposalExecutor(2C) → EvalHarness(2B) → UpgradeGate(2C)

Pipeline:
  1. ProposalExecutor.prepare_candidate() — apply proposal to a sandbox workspace
  2. EvalHarness.evaluate_proposal() — score baseline vs candidate (from Phase 2B)
  3. UpgradeGate.decide() — four-state decision based on eval + risk

Decision matrix:
  ┌──────────────┬───────────┬───────────┬───────────┐
  │              │  eval ✅  │  eval ≈   │  eval ❌  │
  ├──────────────┼───────────┼───────────┼───────────┤
  │ risk=low     │ auto_accept│ conditional│ rejected │
  │ risk=medium  │ conditional│ human_review│ rejected │
  │ risk=high    │ human_review│ human_review│ rejected │
  └──────────────┴───────────┴───────────┴───────────┘
"""

from __future__ import annotations

import json
import os
import shutil
import tempfile
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Literal

from eval_harness import EvalHarness, EvalResult, NodeEvalDetail
from evolution_engine import EvolutionProposal

UpgradeAction = Literal["auto_accept", "conditional", "pending_human_review", "rejected"]


@dataclass
class CandidateArtifact:
    """A candidate artifact produced by ProposalExecutor."""
    kind: str  # "template", "quality_gate_rule", "config"
    path: str
    original_path: str = ""
    description: str = ""


@dataclass
class UpgradeDecision:
    """The final decision for one proposal."""
    action: UpgradeAction
    reason: str
    proposal: dict[str, Any] = field(default_factory=dict)
    eval_result: dict[str, Any] = field(default_factory=dict)
    candidate_artifacts: list[dict[str, Any]] = field(default_factory=list)
    sandbox_dir: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @property
    def is_accepted(self) -> bool:
        return self.action in ("auto_accept", "conditional")


class ProposalExecutor:
    """Apply an EvolutionProposal in a sandbox workspace.

    For each proposal type, this creates a candidate artifact:
    - template: Modified template JSON with enhanced constraints
    - quality_gate: New quality gate check rules
    - runtime: Config change record (no code modification)
    - model_route: Updated model routing config
    - dag_planner: DAG validation rules
    - eval: New eval test case
    """

    # Template enhancements per failure class (from ProposalGenerator logic)
    TEMPLATE_ENHANCEMENTS = {
        "template_defect": {
            "extra_constraints": [
                "必须生成所有声明的文件，禁止只输出描述。",
                "生成的代码必须通过 py_compile 或等效语法检查。",
                "GUI 应用必须支持 QT_QPA_PLATFORM=offscreen 无头测试。",
            ],
        },
        "context_defect": {
            "extra_constraints": [
                "必须检查 input/ 目录是否存在上游文件，如果缺失则在输出中明确报告。",
                "禁止假设上游文件内容，必须实际读取。",
            ],
        },
        "model_defect": {
            "extra_constraints": [
                "必须输出非空结果，空输出视为失败。",
                "如遇超时，输出部分结果而非完全空白。",
            ],
        },
    }

    def __init__(self, template_dir: str | None = None):
        self.template_dir = Path(template_dir) if template_dir else None

    def prepare_candidate(
        self,
        proposal: EvolutionProposal,
        sandbox_dir: str | None = None,
    ) -> tuple[list[CandidateArtifact], str]:
        """Apply proposal in a sandbox. Returns (artifacts, sandbox_path).

        Args:
            proposal: The evolution proposal to apply
            sandbox_dir: Optional sandbox directory. If None, a temp dir is created.

        Returns:
            Tuple of (candidate artifacts list, sandbox directory path)
        """
        if sandbox_dir is None:
            sandbox_dir = tempfile.mkdtemp(prefix=f"upgrade_{proposal.proposal_id}_")
        else:
            os.makedirs(sandbox_dir, exist_ok=True)

        sandbox = Path(sandbox_dir)
        artifacts: list[CandidateArtifact] = []

        if proposal.target == "template":
            artifacts.extend(self._prepare_template_candidate(proposal, sandbox))
        elif proposal.target == "quality_gate":
            artifacts.extend(self._prepare_quality_gate_candidate(proposal, sandbox))
        elif proposal.target == "model_route":
            artifacts.extend(self._prepare_model_route_candidate(proposal, sandbox))
        elif proposal.target == "runtime":
            artifacts.extend(self._prepare_runtime_candidate(proposal, sandbox))
        else:
            # dag_planner, eval, etc.
            artifacts.extend(self._prepare_generic_candidate(proposal, sandbox))

        return artifacts, str(sandbox)

    def _prepare_template_candidate(
        self, proposal: EvolutionProposal, sandbox: Path
    ) -> list[CandidateArtifact]:
        """Create candidate templates with enhanced constraints."""
        artifacts = []
        enhancement_applied = False

        for affected_file in proposal.affected_files:
            filename = os.path.basename(affected_file)
            # Load original template
            original_path = None
            if self.template_dir:
                original_path = self.template_dir / filename
            if original_path is None or not original_path.exists():
                # Try common locations
                for search in [
                    Path("templates") / filename,
                    Path(affected_file),
                ]:
                    if search.exists():
                        original_path = search
                        break

            if original_path and original_path.exists():
                template = json.loads(original_path.read_text(encoding="utf-8"))
            else:
                # Create a minimal template if original not found
                template = {
                    "profile": filename.replace(".json", ""),
                    "system_prompt": "You are an AgentFlow worker.",
                    "prompt_template": "",
                }

            # Apply enhancements
            constraints_added = []
            for cls_name, enhancement in self.TEMPLATE_ENHANCEMENTS.items():
                if cls_name in proposal.rationale.lower() or cls_name in proposal.title.lower():
                    existing_prompt = template.get("prompt_template", "")
                    for constraint in enhancement["extra_constraints"]:
                        if constraint not in existing_prompt:
                            constraints_added.append(constraint)

            # Always add a general safety constraint from the proposal rationale
            if not constraints_added:
                general_constraint = (
                    f"质量约束（来自进化分析）: {proposal.rationale[:200]}"
                )
                constraints_added.append(general_constraint)

            existing_prompt = template.get("prompt_template", "")
            if constraints_added:
                addition = "\n".join(f"- {c}" for c in constraints_added)
                template["prompt_template"] = (
                    f"{existing_prompt}\n\n## 进化增强约束\n{addition}\n"
                ).strip()
                enhancement_applied = True

            # Save candidate template
            candidate_path = sandbox / filename
            candidate_path.write_text(
                json.dumps(template, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            artifacts.append(CandidateArtifact(
                kind="template",
                path=str(candidate_path),
                original_path=str(original_path) if original_path else "",
                description=f"Enhanced template for {filename}: added {len(constraints_added)} constraints",
            ))

        return artifacts

    def _prepare_quality_gate_candidate(
        self, proposal: EvolutionProposal, sandbox: Path
    ) -> list[CandidateArtifact]:
        """Create candidate quality gate rules."""
        rules = {
            "extra_checks": [
                {
                    "name": "downstream_artifact_materialization",
                    "description": "Verify upstream artifacts are accessible to downstream nodes",
                    "check_type": "file_exists",
                    "pattern": "input/",
                },
                {
                    "name": "tool_failure_evidence",
                    "description": "Tool failures must include actionable repair evidence",
                    "check_type": "output_contains",
                    "pattern": "error",
                },
            ],
            "rationale": proposal.rationale,
        }
        candidate_path = sandbox / "quality_gate_rules.json"
        candidate_path.write_text(
            json.dumps(rules, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return [CandidateArtifact(
            kind="quality_gate_rule",
            path=str(candidate_path),
            description="Enhanced quality gate rules with artifact materialization checks",
        )]

    def _prepare_model_route_candidate(
        self, proposal: EvolutionProposal, sandbox: Path
    ) -> list[CandidateArtifact]:
        """Create candidate model routing config."""
        config = {
            "route_adjustments": [
                {
                    "condition": "code_generation",
                    "preferred_model": "deepseek-chat",
                    "fallback": "glm-4-plus",
                    "max_retries": 3,
                    "timeout_override_s": 600,
                },
            ],
            "rationale": proposal.rationale,
        }
        candidate_path = sandbox / "model_routes.json"
        candidate_path.write_text(
            json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return [CandidateArtifact(
            kind="config",
            path=str(candidate_path),
            description="Adjusted model routing for fragile nodes",
        )]

    def _prepare_runtime_candidate(
        self, proposal: EvolutionProposal, sandbox: Path
    ) -> list[CandidateArtifact]:
        """Create runtime config change record."""
        config = {
            "changes": [
                "Ensure workspace_path is always persisted before node execution",
                "Fail loudly if events cannot be persisted",
            ],
            "rationale": proposal.rationale,
        }
        candidate_path = sandbox / "runtime_config.json"
        candidate_path.write_text(
            json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return [CandidateArtifact(
            kind="config",
            path=str(candidate_path),
            description="Runtime persistence hardening",
        )]

    def _prepare_generic_candidate(
        self, proposal: EvolutionProposal, sandbox: Path
    ) -> list[CandidateArtifact]:
        """Generic candidate for unhandled proposal types."""
        candidate_path = sandbox / "proposal_record.json"
        record = {
            "proposal_id": proposal.proposal_id,
            "target": proposal.target,
            "rationale": proposal.rationale,
            "validation_commands": proposal.validation_commands,
        }
        candidate_path.write_text(
            json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return [CandidateArtifact(
            kind="config",
            path=str(candidate_path),
            description=f"Candidate record for {proposal.target} proposal",
        )]


class UpgradeGate:
    """Decision gate that combines ProposalExecutor + EvalHarness.

    Full pipeline:
      1. Prepare candidate artifacts (ProposalExecutor)
      2. Evaluate candidate vs baseline (EvalHarness)
      3. Make upgrade decision (decision matrix)
    """

    def __init__(
        self,
        executor: ProposalExecutor | None = None,
        harness: EvalHarness | None = None,
    ):
        self.executor = executor or ProposalExecutor()
        self.harness = harness or EvalHarness()

    def full_pipeline(
        self,
        proposal: EvolutionProposal,
        run: dict[str, Any] | None = None,
        events: list[dict[str, Any]] | None = None,
        mode: Literal["simulated", "real"] = "simulated",
    ) -> UpgradeDecision:
        """Execute the full upgrade pipeline for one proposal.

        Args:
            proposal: The proposal to evaluate
            run: Baseline run trace
            events: Baseline run events
            mode: "simulated" (fast) or "real" (re-run with LLM)

        Returns:
            UpgradeDecision with action, reason, and all artifacts
        """
        # 1. Prepare candidate
        artifacts, sandbox = self.executor.prepare_candidate(proposal)

        # 2. Load candidate template if available
        candidate_template = None
        for art in artifacts:
            if art.kind == "template" and os.path.isfile(art.path):
                try:
                    candidate_template = json.loads(
                        Path(art.path).read_text(encoding="utf-8")
                    )
                except (json.JSONDecodeError, OSError):
                    pass

        # 3. Evaluate
        eval_result = self.harness.evaluate_proposal(
            proposal, run, events,
            candidate_template=candidate_template,
            mode=mode,
        )

        # 4. Decide
        decision = self.decide(proposal, eval_result)

        # Enrich decision with artifacts
        decision.candidate_artifacts = [asdict(a) for a in artifacts]
        decision.sandbox_dir = sandbox

        return decision

    def decide(
        self,
        proposal: EvolutionProposal,
        eval_result: EvalResult,
    ) -> UpgradeDecision:
        """Make upgrade decision based on eval result and proposal risk.

        Decision matrix:
          eval_result.passed + improvement → auto_accept (low risk) / conditional (medium)
          eval_result.passed + marginal → conditional / pending_human_review
          eval_result not passed → rejected
        """
        # Rejected: candidate underperforms baseline
        if not eval_result.passed:
            return UpgradeDecision(
                action="rejected",
                reason=(
                    f"Candidate regression detected (delta={eval_result.improvement:+.1%}). "
                    f"{eval_result.gate_reason}"
                ),
                proposal=asdict(proposal),
                eval_result=eval_result.to_dict(),
            )

        significant = eval_result.improvement >= self.harness.MIN_IMPROVEMENT_THRESHOLD
        risk = proposal.risk

        if risk == "low":
            if significant:
                action: UpgradeAction = "auto_accept"
                reason = (
                    f"Low risk + significant improvement (+{eval_result.improvement:.1%}). "
                    f"Auto-accepted for promotion."
                )
            else:
                action = "conditional"
                reason = (
                    f"Low risk + marginal improvement (+{eval_result.improvement:.1%}). "
                    f"Conditionally accepted; monitor for regression."
                )
        elif risk == "medium":
            if significant:
                action = "conditional"
                reason = (
                    f"Medium risk + improvement (+{eval_result.improvement:.1%}). "
                    f"Conditionally accepted; requires integration test before promotion."
                )
            else:
                action = "pending_human_review"
                reason = (
                    f"Medium risk + marginal improvement (+{eval_result.improvement:.1%}). "
                    f"Human review required before promotion."
                )
        else:  # high risk
            action = "pending_human_review"
            reason = (
                f"High risk proposal requires human review regardless of eval result "
                f"(improvement={eval_result.improvement:+.1%})."
            )

        return UpgradeDecision(
            action=action,
            reason=reason,
            proposal=asdict(proposal),
            eval_result=eval_result.to_dict(),
        )
