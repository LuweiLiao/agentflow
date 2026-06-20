"""Regression tests for AgentFlow Evolution Engine phase 1."""

from pathlib import Path

from evolution_engine import EvolutionEngine, FailureAttributor, ProposalGenerator


def test_missing_workspace_and_empty_events_generate_runtime_proposal(tmp_path):
    run = {
        "run_id": "run_missing_trace",
        "status": "failed",
        "workspace_path": "",
        "nodes": [],
    }

    report = EvolutionEngine(output_dir=tmp_path).analyze_trace("run_missing_trace", run, [])

    assert report.trace_summary["event_count"] == 0
    assert any(a.failure_class == "runtime_defect" for a in report.attributions)
    assert any(p.proposal_id == "trace_reliability_gate" for p in report.proposals)

    out = tmp_path / "run_missing_trace.json"
    report.write_json(out)
    assert out.is_file()
    assert "trace_reliability_gate" in out.read_text(encoding="utf-8")


def test_quality_gate_missing_file_generates_template_upgrade_proposal(tmp_path):
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    run = {
        "run_id": "run_quality",
        "status": "failed",
        "workspace_path": str(workspace),
        "nodes": [
            {"node_id": "dev", "status": "failed", "error": "缺少文件: app.py", "output": "done"},
        ],
    }
    events = [
        {
            "run_id": "run_quality",
            "type": "quality_fail",
            "sequence": 3,
            "node_id": "dev",
            "payload": {
                "reason": "缺少文件: app.py",
                "checks": {"non_empty_output": True, "files_exist": False, "no_error": True},
            },
        }
    ]

    report = EvolutionEngine().analyze_trace("run_quality", run, events)

    assert report.trace_summary["quality_fail_count"] == 1
    assert report.attributions[0].failure_class == "template_defect"
    proposal_ids = {p.proposal_id for p in report.proposals}
    assert "template_quality_constraints" in proposal_ids
    template_proposal = next(p for p in report.proposals if p.proposal_id == "template_quality_constraints")
    assert "templates/dev.json" in template_proposal.affected_files
    assert template_proposal.risk == "low"


def test_validation_command_failure_for_qt_is_template_defect():
    attribution = FailureAttributor().analyze(
        {"status": "failed", "workspace_path": __import__("os").getcwd(), "nodes": []},
        [
            {
                "type": "quality_fail",
                "node_id": "test",
                "payload": {
                    "reason": "验证命令失败: pytest exit 1: QWidget: Must construct a QApplication before a QWidget",
                    "checks": {"validation_commands": False},
                },
            }
        ],
    )[0]

    assert attribution.failure_class == "template_defect"
    assert "PyQt" in attribution.root_cause or "PySide" in attribution.root_cause


def test_unknown_failure_is_preserved_for_manual_triage():
    proposals = ProposalGenerator().generate([
        __import__("evolution_engine").FailureAttribution(
            failure_class="unknown",
            root_cause="new unexplained signature",
            evidence=["raw evidence"],
            confidence=0.1,
        )
    ])

    assert proposals[0].proposal_id == "manual_triage_required"
    assert proposals[0].target == "eval"
