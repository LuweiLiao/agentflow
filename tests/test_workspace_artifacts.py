"""Regression tests for AgentFlow durable workspaces, artifact materialization, and validation gates."""

import importlib.util
import json
import os
import sys
import tempfile
from pathlib import Path
from unittest import mock

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
_backend_path = PROJECT_ROOT / "agentflow-backend.py"
_saved_argv = sys.argv
sys.argv = ["agentflow-backend.py", "19600"]
_spec = importlib.util.spec_from_file_location("agentflow_backend_workspace", _backend_path)
agentflow_backend = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(agentflow_backend)
sys.argv = _saved_argv


def test_materialize_upstream_artifacts_copies_exact_files():
    with tempfile.TemporaryDirectory() as td:
        run_id = "run_unit"
        workspace = Path(td)
        upstream = workspace / "node_a"
        upstream.mkdir()
        (upstream / "main.py").write_text("print('from upstream')\n", encoding="utf-8")
        (upstream / "pkg").mkdir()
        (upstream / "pkg" / "core.py").write_text("VALUE=42\n", encoding="utf-8")
        (upstream / "input").mkdir()
        (upstream / "input" / "old.txt").write_text("skip recursive input\n", encoding="utf-8")

        node_dir = workspace / "node_b"
        node_dir.mkdir()
        store = mock.Mock()
        store.get_upstream.return_value = ["a"]

        agentflow_backend._materialize_upstream_artifacts(
            store, run_id, "b", str(workspace), str(node_dir)
        )

        assert (node_dir / "main.py").read_text(encoding="utf-8") == "print('from upstream')\n"
        assert (node_dir / "pkg" / "core.py").read_text(encoding="utf-8") == "VALUE=42\n"
        assert (node_dir / "input" / "node_a" / "main.py").is_file()
        assert not (node_dir / "input" / "old.txt").exists()


def test_publish_node_artifacts_emits_manifest():
    with tempfile.TemporaryDirectory() as td:
        Path(td, "a.txt").write_text("hello", encoding="utf-8")
        Path(td, "sub").mkdir()
        Path(td, "sub", "b.py").write_text("print(1)\n", encoding="utf-8")
        with mock.patch.object(agentflow_backend, "_publish_event") as pub:
            manifest = agentflow_backend._publish_node_artifacts("run_x", "n1", td)
        paths = {m["path"] for m in manifest}
        assert {"a.txt", "sub/b.py"} <= paths
        pub.assert_called_once()
        payload = pub.call_args.kwargs["payload"]
        assert payload["workspace"] == td
        assert any(f["path"] == "a.txt" for f in payload["files"])


def test_quality_gate_validation_commands_fail_on_nonzero():
    from quality_gate import QualityGate

    with tempfile.TemporaryDirectory() as td:
        result = QualityGate().evaluate(
            {"output": "done", "result": "done", "status": "ok"},
            task={"validation_commands": ["python3 -c 'import sys;sys.exit(7)'"]},
            node_dir=td,
        )
    assert result.passed is False
    assert result.checks["validation_commands"] is False
    assert "exit 7" in result.reason


def test_quality_gate_validation_commands_pass_on_zero():
    from quality_gate import QualityGate

    with tempfile.TemporaryDirectory() as td:
        result = QualityGate().evaluate(
            {"output": "done", "result": "done", "status": "ok"},
            task={"validation_commands": ["python3 -c 'print(123)'"]},
            node_dir=td,
        )
    assert result.passed is True
    assert result.checks["validation_commands"] is True


def test_runstore_persists_workspace_and_node_params(monkeypatch):
    with tempfile.TemporaryDirectory() as td:
        monkeypatch.setenv("AGENTFLOW_RUNS_DIR", td)
        import importlib
        import run_store as run_store_module

        importlib.reload(run_store_module)
        store = run_store_module.RunStore()
        run_id = store.create_run(
            "req",
            [{
                "id": "n1",
                "profile": "test",
                "params": {
                    "expected_files": ["app.py"],
                    "validation_commands": ["python3 app.py"],
                },
            }],
            [],
        )
        store.set_run_workspace(run_id, "/tmp/example-workspace")
        run = store.get_run(run_id)
        assert run["workspace_path"] == "/tmp/example-workspace"
        assert run["nodes"][0]["params"]["expected_files"] == ["app.py"]
        assert run["nodes"][0]["params"]["validation_commands"] == ["python3 app.py"]

        # Restore module globals for the rest of the suite.
        monkeypatch.delenv("AGENTFLOW_RUNS_DIR", raising=False)
        importlib.reload(run_store_module)
