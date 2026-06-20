"""Regression tests for AgentFlow scheduling and repair retry behavior."""

import importlib.util
import sys
from pathlib import Path
from types import SimpleNamespace

PROJECT_ROOT = Path(__file__).resolve().parents[1]
_backend_path = PROJECT_ROOT / "agentflow-backend.py"
_saved_argv = sys.argv
sys.argv = ["agentflow-backend.py", "19600"]
_spec = importlib.util.spec_from_file_location("agentflow_backend_repair", _backend_path)
agentflow_backend = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(agentflow_backend)
sys.argv = _saved_argv


def test_build_repair_task_includes_quality_evidence_and_workspace_files(tmp_path):
    (tmp_path / "app.py").write_text("print('old')\n", encoding="utf-8")
    (tmp_path / "tests").mkdir()
    (tmp_path / "tests" / "test_app.py").write_text("def test_x(): pass\n", encoding="utf-8")
    task = SimpleNamespace(prompt="原始任务", max_turns=3, timeout_s=30)

    repair = agentflow_backend._build_repair_task(
        task,
        "missing expected file: README.md",
        {"expected_files": False, "validation_commands": False},
        str(tmp_path),
    )

    assert "质量门控失败" in repair.prompt
    assert "missing expected file: README.md" in repair.prompt
    assert "validation_commands" in repair.prompt
    assert "app.py" in repair.prompt
    assert "tests/test_app.py" in repair.prompt
    assert repair.max_turns >= 8
    assert repair.timeout_s >= 180


def test_workspace_file_snapshot_is_bounded_and_relative(tmp_path):
    for i in range(5):
        (tmp_path / f"f{i}.txt").write_text(str(i), encoding="utf-8")
    files = agentflow_backend._workspace_file_snapshot(str(tmp_path), limit=3)
    assert len(files) == 3
    assert all(not f.startswith(str(tmp_path)) for f in files)
