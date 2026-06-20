"""Regression tests for workflow-level feedback loop behavior."""

import importlib.util
import json
import sqlite3
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
_backend_path = PROJECT_ROOT / "agentflow-backend.py"
_saved_argv = sys.argv
sys.argv = ["agentflow-backend.py", "19600"]
_spec = importlib.util.spec_from_file_location("agentflow_backend_loop", _backend_path)
agentflow_backend = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(agentflow_backend)
sys.argv = _saved_argv

from run_store import RunStore


class FakeStore:
    def __init__(self):
        self.nodes = {
            "dev": {
                "node_id": "dev",
                "status": "completed",
                "params": {"existing": True},
                "params_json": json.dumps({"existing": True}),
                "result": "old",
                "output": "old",
                "error": "",
            },
            "test": {
                "node_id": "test",
                "status": "running",
                "params": {"loop_to": "dev", "max_loop_iterations": 2},
                "params_json": json.dumps({"loop_to": "dev", "max_loop_iterations": 2}),
                "result": "",
                "output": "",
                "error": "",
            },
            "doc": {
                "node_id": "doc",
                "status": "pending",
                "params": {},
                "params_json": "{}",
                "result": "",
                "output": "",
                "error": "",
            },
        }
        self.edges = {"dev": ["test"], "test": ["doc"], "doc": []}
        self.updates = []

    def get_dependents(self, run_id, node_id):
        return list(self.edges.get(node_id, []))

    def update_node(self, run_id, node_id, **kwargs):
        self.updates.append((node_id, kwargs))
        self.nodes[node_id].update(kwargs)
        if "params_json" in kwargs:
            self.nodes[node_id]["params"] = json.loads(kwargs["params_json"])


def test_feedback_loop_resets_target_and_downstream_and_records_feedback():
    store = FakeStore()
    published = []

    scheduled = agentflow_backend._schedule_feedback_loop(
        store=store,
        run_id="run_loop",
        source_node_id="test",
        source_params={"loop_to": "dev", "max_loop_iterations": 2},
        quality_reason="pytest failed: missing reconnect behavior",
        checks={"validation_commands": False},
        publish_event=lambda *args, **kwargs: published.append((args, kwargs)),
    )

    assert scheduled is True
    assert store.nodes["dev"]["status"] == "pending"
    assert store.nodes["test"]["status"] == "pending"
    assert store.nodes["doc"]["status"] == "pending"
    feedback = store.nodes["dev"]["params"]["feedback_history"]
    assert len(feedback) == 1
    assert feedback[0]["from_node"] == "test"
    assert "missing reconnect" in feedback[0]["reason"]
    assert store.nodes["test"]["params"]["_loop_iterations"] == 1
    assert any(args[1] == "workflow_feedback" for args, _ in published)


def test_feedback_loop_stops_after_max_iterations():
    store = FakeStore()
    scheduled = agentflow_backend._schedule_feedback_loop(
        store=store,
        run_id="run_loop",
        source_node_id="test",
        source_params={"loop_to": "dev", "max_loop_iterations": 2, "_loop_iterations": 2},
        quality_reason="still failing",
        checks={"validation_commands": False},
        publish_event=lambda *args, **kwargs: None,
    )

    assert scheduled is False
    assert store.nodes["dev"]["status"] == "completed"


def test_append_feedback_to_prompt_includes_loop_history():
    prompt = agentflow_backend._append_feedback_to_prompt(
        "原始开发任务",
        {
            "feedback_history": [
                {
                    "from_node": "test",
                    "reason": "HEX显示切换失败",
                    "checks": {"validation_commands": False},
                }
            ]
        },
    )

    assert "# 闭环反馈输入" in prompt
    assert "HEX显示切换失败" in prompt
    assert "原始开发任务" in prompt


def test_pending_node_becomes_ready_after_feedback_target_completed(tmp_path):
    db = tmp_path / "runs.db"
    store = RunStore(str(db))
    run_id = store.create_run(
        "loop ready",
        nodes=[
            {"id": "dev", "label": "dev", "profile": "dev", "params": {}},
            {"id": "test", "label": "test", "profile": "test", "params": {"_loop_iterations": 2}},
        ],
        edges=[{"source": "dev", "target": "test"}],
    )
    store.update_node(run_id, "dev", status="completed")
    store.update_node(run_id, "test", status="pending")

    ready = store.get_pending_nodes(run_id)

    assert [n["node_id"] for n in ready] == ["test"]


def test_deadlock_guard_marks_unready_pending_nodes_failed(tmp_path):
    db = tmp_path / "runs.db"
    store = RunStore(str(db))
    run_id = store.create_run(
        "deadlock",
        nodes=[
            {"id": "dev", "label": "dev", "profile": "dev", "params": {}},
            {"id": "test", "label": "test", "profile": "test", "params": {}},
        ],
        edges=[{"source": "dev", "target": "test"}],
    )
    store.update_node(run_id, "dev", status="running")
    store.update_node(run_id, "test", status="pending")

    changed = agentflow_backend._fail_unready_pending_nodes(
        store, run_id, "deadlock guard triggered"
    )

    assert changed is True
    run = store.get_run(run_id)
    test = next(n for n in run["nodes"] if n["node_id"] == "test")
    assert test["status"] == "failed"
    assert "deadlock guard" in test["error"]
