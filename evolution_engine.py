"""AgentFlow Evolution Engine — safe, evidence-driven self-improvement primitives.

Phase 1 intentionally limits itself to trace analysis and proposal generation.
It does not mutate production code or templates automatically; candidates can be
validated by evals before any human/upgrade gate accepts them.
"""

from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Literal

FailureClass = Literal[
    "template_defect",
    "dag_defect",
    "runtime_defect",
    "tool_defect",
    "model_defect",
    "eval_defect",
    "context_defect",
    "unknown",
]
ProposalTarget = Literal["template", "quality_gate", "runtime", "dag_planner", "model_route", "eval"]
RiskLevel = Literal["low", "medium", "high"]


@dataclass
class FailureAttribution:
    """Structured diagnosis distilled from a run trace."""

    failure_class: FailureClass
    root_cause: str
    evidence: list[str] = field(default_factory=list)
    confidence: float = 0.0
    affected_nodes: list[str] = field(default_factory=list)


@dataclass
class EvolutionProposal:
    """A bounded, testable upgrade hypothesis."""

    proposal_id: str
    target: ProposalTarget
    title: str
    rationale: str
    expected_benefit: str
    risk: RiskLevel
    affected_files: list[str] = field(default_factory=list)
    validation_commands: list[str] = field(default_factory=list)
    rollback: str = "Discard candidate workspace; do not merge generated patch."


@dataclass
class EvolutionReport:
    """Self-evolution report for one run or eval."""

    run_id: str
    attributions: list[FailureAttribution]
    proposals: list[EvolutionProposal]
    trace_summary: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "run_id": self.run_id,
            "attributions": [asdict(item) for item in self.attributions],
            "proposals": [asdict(item) for item in self.proposals],
            "trace_summary": self.trace_summary,
        }

    def write_json(self, path: str | os.PathLike[str]) -> None:
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(self.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")


class FailureAttributor:
    """Classify run failures from persisted run/events/workspace evidence."""

    def analyze(self, run: dict[str, Any] | None, events: list[dict[str, Any]] | None = None) -> list[FailureAttribution]:
        run = run or {}
        events = events or []
        nodes = run.get("nodes") or []
        attributions: list[FailureAttribution] = []

        workspace_path = run.get("workspace_path") or ""
        if self._workspace_missing(workspace_path):
            attributions.append(FailureAttribution(
                failure_class="runtime_defect",
                root_cause="Run workspace is missing or was not persisted, so downstream nodes cannot consume upstream artifacts.",
                evidence=[
                    f"runs.workspace_path={workspace_path!r}",
                    "Durable workspaces are required for materialized upstream files.",
                ],
                confidence=0.95,
            ))

        if not events:
            attributions.append(FailureAttribution(
                failure_class="runtime_defect",
                root_cause="No run events were persisted; trace evidence is incomplete.",
                evidence=["run_events is empty", "Self-evolution requires durable trace data."],
                confidence=0.8,
            ))

        quality_failures = [e for e in events if e.get("type") == "quality_fail"]
        for event in quality_failures:
            payload = event.get("payload") or {}
            reason = str(payload.get("reason") or "")
            checks = payload.get("checks") or {}
            node_id = event.get("node_id") or ""
            attributions.append(self._attribute_quality_failure(node_id, reason, checks))

        for node in nodes:
            status = node.get("status")
            if status not in ("failed", "timed_out"):
                continue
            node_id = node.get("node_id") or ""
            error = node.get("error") or node.get("result") or ""
            if self._already_covered(attributions, node_id, error):
                continue
            attributions.append(self._attribute_node_failure(node_id, error, node))

        if not attributions and run.get("status") in ("failed", "cancelled"):
            attributions.append(FailureAttribution(
                failure_class="unknown",
                root_cause=f"Run ended with status={run.get('status')} but trace evidence did not match known patterns.",
                evidence=[str(run.get("error") or "no run error recorded")],
                confidence=0.2,
            ))

        return self._dedupe(attributions)

    def _workspace_missing(self, workspace_path: str) -> bool:
        return not workspace_path or not os.path.isdir(workspace_path)

    def _attribute_quality_failure(self, node_id: str, reason: str, checks: dict[str, Any]) -> FailureAttribution:
        reason_l = reason.lower()
        evidence = [f"node={node_id}", f"reason={reason}", f"checks={checks}"]
        failed_checks = {k for k, v in checks.items() if v is False}

        if "files_exist" in failed_checks or "缺少文件" in reason:
            failure_class: FailureClass = "template_defect"
            root_cause = "Node produced text but missed expected files; generation template/tool instructions are too weak."
            confidence = 0.85
        elif "validation_commands" in failed_checks or "验证命令失败" in reason:
            if "qapplication" in reason_l or "qwidget" in reason_l or "qt" in reason_l:
                failure_class = "template_defect"
                root_cause = "Generated GUI code violates known PyQt/PySide testability constraints."
                confidence = 0.85
            else:
                failure_class = "eval_defect"
                root_cause = "Validation command failed and produced actionable repair evidence."
                confidence = 0.7
        elif "输出为空" in reason:
            failure_class = "model_defect"
            root_cause = "Agent returned empty output; model/tool loop may have stopped without producing an artifact."
            confidence = 0.65
        else:
            failure_class = "unknown"
            root_cause = "Quality gate failed with an unclassified reason."
            confidence = 0.35

        return FailureAttribution(failure_class, root_cause, evidence, confidence, [node_id] if node_id else [])

    def _attribute_node_failure(self, node_id: str, error: str, node: dict[str, Any]) -> FailureAttribution:
        text = f"{error}\n{node.get('output', '')}".lower()
        evidence = [f"node={node_id}", f"status={node.get('status')}", f"error={error[:500]}"]
        if "timeout" in text or node.get("status") == "timed_out":
            return FailureAttribution("model_defect", "Node timed out; route, budget, or prompt granularity needs adjustment.", evidence, 0.65, [node_id])
        if "no such file" in text or "file not found" in text or "input/" in text:
            return FailureAttribution("context_defect", "Node expected upstream files that were not materialized into its workspace.", evidence, 0.8, [node_id])
        if "permission" in text or "sandbox" in text:
            return FailureAttribution("tool_defect", "Tool execution was blocked by permission or sandbox policy.", evidence, 0.75, [node_id])
        return FailureAttribution("unknown", "Node failed without a recognized failure signature.", evidence, 0.3, [node_id])

    def _already_covered(self, attributions: list[FailureAttribution], node_id: str, error: str) -> bool:
        if not node_id:
            return False
        return any(node_id in item.affected_nodes for item in attributions)

    def _dedupe(self, attributions: list[FailureAttribution]) -> list[FailureAttribution]:
        seen: set[tuple[str, str, tuple[str, ...]]] = set()
        unique: list[FailureAttribution] = []
        for item in attributions:
            key = (item.failure_class, item.root_cause, tuple(item.affected_nodes))
            if key in seen:
                continue
            seen.add(key)
            unique.append(item)
        return unique


class ProposalGenerator:
    """Convert attributions into bounded upgrade hypotheses."""

    def generate(self, attributions: list[FailureAttribution]) -> list[EvolutionProposal]:
        proposals: list[EvolutionProposal] = []
        seen: set[str] = set()
        for attribution in attributions:
            proposal = self._proposal_for(attribution)
            if proposal.proposal_id in seen:
                continue
            seen.add(proposal.proposal_id)
            proposals.append(proposal)
        return proposals

    def _proposal_for(self, attribution: FailureAttribution) -> EvolutionProposal:
        cls = attribution.failure_class
        if cls == "template_defect":
            return EvolutionProposal(
                proposal_id="template_quality_constraints",
                target="template",
                title="Strengthen generation templates with concrete artifact and GUI safety constraints",
                rationale=attribution.root_cause,
                expected_benefit="Known app-generation failures are prevented before QualityGate retries are needed.",
                risk="low",
                affected_files=["templates/dev.json", "templates/test.json"],
                validation_commands=["python3 -m pytest tests/test_templates_contract.py tests/test_quality_gate.py -q"],
            )
        if cls == "runtime_defect":
            return EvolutionProposal(
                proposal_id="trace_reliability_gate",
                target="runtime",
                title="Make workspace and event persistence fail loudly",
                rationale=attribution.root_cause,
                expected_benefit="Self-evolution receives complete run evidence instead of silently missing traces.",
                risk="medium",
                affected_files=["agentflow-backend.py", "run_store.py"],
                validation_commands=["python3 -m pytest tests/test_workspace_artifacts.py tests/test_run_events_persistence.py -q"],
            )
        if cls == "context_defect":
            return EvolutionProposal(
                proposal_id="artifact_materialization_regression",
                target="quality_gate",
                title="Add downstream artifact materialization checks to evals",
                rationale=attribution.root_cause,
                expected_benefit="Detects semantic data-flow breakage even when DAG scheduling succeeds.",
                risk="low",
                affected_files=["tests/test_workspace_artifacts.py", "evals/"],
                validation_commands=["python3 -m pytest tests/test_workspace_artifacts.py -q"],
            )
        if cls == "dag_defect":
            return EvolutionProposal(
                proposal_id="dag_planner_validation",
                target="dag_planner",
                title="Tighten planner validation for dependencies and review/test insertion",
                rationale=attribution.root_cause,
                expected_benefit="Invalid or under-specified DAGs are corrected before execution.",
                risk="medium",
                affected_files=["supervisor.py", "agentflow_schema.py", "tests/test_schema.py"],
                validation_commands=["python3 -m pytest tests/test_schema.py tests/test_api.py -q"],
            )
        if cls == "tool_defect":
            return EvolutionProposal(
                proposal_id="tool_policy_constraints",
                target="quality_gate",
                title="Constrain tool use and add explicit failure evidence to repair prompts",
                rationale=attribution.root_cause,
                expected_benefit="Tool failures become repairable evidence rather than ambiguous node failures.",
                risk="medium",
                affected_files=["agent_runner.py", "quality_gate.py"],
                validation_commands=["python3 -m pytest tests/test_repair_retry.py tests/test_quality_gate.py -q"],
            )
        if cls == "model_defect":
            return EvolutionProposal(
                proposal_id="model_route_or_budget_adjustment",
                target="model_route",
                title="Route fragile nodes to stronger model or raise per-node budget",
                rationale=attribution.root_cause,
                expected_benefit="Reduces empty outputs and timeout failures on code-generation nodes.",
                risk="low",
                affected_files=["provider_registry.py", "templates/*.json"],
                validation_commands=["python3 -m pytest tests/test_runner.py tests/test_compiler.py -q"],
            )
        if cls == "eval_defect":
            return EvolutionProposal(
                proposal_id="eval_command_feedback_upgrade",
                target="eval",
                title="Promote validation command failures into reusable eval cases",
                rationale=attribution.root_cause,
                expected_benefit="Every new failure becomes a regression test before future upgrades are accepted.",
                risk="low",
                affected_files=["evals/", "tests/test_quality_gate.py"],
                validation_commands=["python3 -m pytest tests/test_quality_gate.py -q"],
            )
        return EvolutionProposal(
            proposal_id="manual_triage_required",
            target="eval",
            title="Archive unknown failure for manual triage and future classifier training",
            rationale=attribution.root_cause,
            expected_benefit="Unknown cases are preserved as training data instead of being lost.",
            risk="low",
            affected_files=[".agentflow/evolution/"],
            validation_commands=[],
        )


class EvolutionEngine:
    """High-level facade for trace-driven self-evolution reports."""

    def __init__(self, store: Any | None = None, output_dir: str | os.PathLike[str] | None = None):
        self.store = store
        self.output_dir = Path(output_dir) if output_dir else None
        self.attributor = FailureAttributor()
        self.proposal_generator = ProposalGenerator()

    def analyze_run(self, run_id: str) -> EvolutionReport:
        if self.store is None:
            raise ValueError("EvolutionEngine requires a RunStore-like object for analyze_run().")
        run = self.store.get_run(run_id)
        events = self.store.list_events(run_id) if hasattr(self.store, "list_events") else []
        report = self.analyze_trace(run_id, run, events)
        if self.output_dir:
            report.write_json(self.output_dir / f"{run_id}.json")
        return report

    def analyze_trace(
        self,
        run_id: str,
        run: dict[str, Any] | None,
        events: list[dict[str, Any]] | None = None,
    ) -> EvolutionReport:
        events = events or []
        attributions = self.attributor.analyze(run, events)
        proposals = self.proposal_generator.generate(attributions)
        trace_summary = self._summarize_trace(run or {}, events)
        return EvolutionReport(run_id, attributions, proposals, trace_summary)

    def _summarize_trace(self, run: dict[str, Any], events: list[dict[str, Any]]) -> dict[str, Any]:
        nodes = run.get("nodes") or []
        return {
            "run_status": run.get("status", "unknown"),
            "workspace_path": run.get("workspace_path", ""),
            "event_count": len(events),
            "node_count": len(nodes),
            "node_status_counts": self._count_node_status(nodes),
            "quality_fail_count": sum(1 for event in events if event.get("type") == "quality_fail"),
        }

    def _count_node_status(self, nodes: list[dict[str, Any]]) -> dict[str, int]:
        counts: dict[str, int] = {}
        for node in nodes:
            status = str(node.get("status") or "unknown")
            counts[status] = counts.get(status, 0) + 1
        return counts
