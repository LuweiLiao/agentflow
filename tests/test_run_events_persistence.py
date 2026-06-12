#!/usr/bin/env python3
"""Unit tests for RunStore event persistence."""

import json
import os
import tempfile

import pytest

from runtime_events import RuntimeEvent
from run_store import RunStore


@pytest.fixture
def store_with_temp_db():
    """Create a RunStore with a temporary database directory."""
    original = os.environ.get("AGENTFLOW_RUNS_DIR")
    tmpdir = tempfile.mkdtemp()
    os.environ["AGENTFLOW_RUNS_DIR"] = tmpdir
    s = RunStore()
    yield s
    if original:
        os.environ["AGENTFLOW_RUNS_DIR"] = original
    else:
        os.environ.pop("AGENTFLOW_RUNS_DIR", None)


class TestRunStoreEventPersistence:
    def test_append_event(self, store_with_temp_db):
        """append_event should store an event and it should be retrievable."""
        store = store_with_temp_db
        ev = RuntimeEvent(
            run_id="run_test_1",
            type="run_start",
            sequence=0,
            node_id=None,
            tool_call_id=None,
            payload={"goal": "write hello.txt"},
        )
        store.append_event(ev)
        events = store.list_events("run_test_1")
        assert len(events) == 1
        assert events[0]["type"] == "run_start"
        assert events[0]["sequence"] == 0

    def test_multiple_events(self, store_with_temp_db):
        """Multiple events for the same run should be stored and returned in order."""
        store = store_with_temp_db
        for i, t in enumerate(["run_start", "node_start", "node_complete", "run_done"]):
            store.append_event(RuntimeEvent(
                run_id="run_multi", type=t, sequence=i
            ))

        events = store.list_events("run_multi")
        assert len(events) == 4
        assert [e["type"] for e in events] == [
            "run_start", "node_start", "node_complete", "run_done"
        ]

    def test_after_sequence_filter(self, store_with_temp_db):
        """list_events with after_sequence should filter correctly."""
        store = store_with_temp_db
        for i in range(5):
            store.append_event(RuntimeEvent(
                run_id="run_filter", type=f"ev_{i}", sequence=i
            ))

        events = store.list_events("run_filter", after_sequence=2)
        assert len(events) == 2
        assert [e["type"] for e in events] == ["ev_3", "ev_4"]

    def test_run_isolation(self, store_with_temp_db):
        """Events from different runs should not mix."""
        store = store_with_temp_db
        store.append_event(RuntimeEvent(run_id="r1", type="run_start", sequence=0))
        store.append_event(RuntimeEvent(run_id="r2", type="run_start", sequence=0))
        store.append_event(RuntimeEvent(run_id="r1", type="run_done", sequence=1))

        r1_events = store.list_events("r1")
        r2_events = store.list_events("r2")
        assert len(r1_events) == 2
        assert len(r2_events) == 1

    def test_empty_run_returns_empty(self, store_with_temp_db):
        """A run with no events should return an empty list."""
        store = store_with_temp_db
        events = store.list_events("nonexistent")
        assert events == []

    def test_payload_roundtrip(self, store_with_temp_db):
        """Event payloads with complex dicts should survive store/retrieve."""
        store = store_with_temp_db
        ev = RuntimeEvent(
            run_id="run_payload",
            type="tool_end",
            sequence=5,
            node_id="n1",
            tool_call_id="tc_abc",
            payload={"name": "read_file", "result": {"content": "hello", "lines": 3}},
        )
        store.append_event(ev)
        events = store.list_events("run_payload")
        assert len(events) == 1
        d = events[0]
        assert d["run_id"] == "run_payload"
        assert d["type"] == "tool_end"
        assert d["sequence"] == 5
        assert d["node_id"] == "n1"
        assert d["tool_call_id"] == "tc_abc"
        assert d["payload"]["name"] == "read_file"
        assert d["payload"]["result"]["content"] == "hello"

    def test_survives_store_reopen(self, store_with_temp_db):
        """Events should survive store re-initialization (persisted to SQLite)."""
        # Write
        store_with_temp_db.append_event(RuntimeEvent(
            run_id="run_persist", type="run_start", sequence=0
        ))
        store_with_temp_db.append_event(RuntimeEvent(
            run_id="run_persist", type="run_done", sequence=1
        ))

        # Re-read with a new store pointing to the same DB
        store2 = RunStore()
        events = store2.list_events("run_persist")
        assert len(events) == 2
        assert events[0]["type"] == "run_start"
        assert events[1]["type"] == "run_done"
