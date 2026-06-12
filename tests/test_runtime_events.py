#!/usr/bin/env python3
"""Unit tests for runtime_events.py."""

import time

import pytest

from runtime_events import RuntimeEvent


class TestRuntimeEventDataclass:
    def test_minimal_event(self):
        """Minimal create should succeed with required fields."""
        ev = RuntimeEvent(run_id="run_abc", type="run_start")
        assert ev.run_id == "run_abc"
        assert ev.type == "run_start"
        assert ev.sequence == 0
        assert ev.node_id is None
        assert ev.tool_call_id is None
        assert ev.payload == {}

    def test_full_event(self):
        """Event with all fields populated."""
        ev = RuntimeEvent(
            run_id="run_xyz",
            type="tool_end",
            sequence=7,
            node_id="n1",
            tool_call_id="tc_1",
            payload={"name": "read_file", "result": {"content": "hello"}},
        )
        assert ev.run_id == "run_xyz"
        assert ev.type == "tool_end"
        assert ev.sequence == 7
        assert ev.node_id == "n1"
        assert ev.tool_call_id == "tc_1"
        assert ev.payload["name"] == "read_file"

    def test_auto_timestamp(self):
        """Event without explicit ts_ms should get an auto timestamp."""
        before = int(time.time() * 1000)
        ev = RuntimeEvent(run_id="r", type="run_start")
        after = int(time.time() * 1000)
        assert before <= ev.ts_ms <= after

    def test_to_dict_serialization(self):
        """to_dict should return a plain dict with expected keys."""
        ev = RuntimeEvent(
            run_id="r1",
            type="node_start",
            sequence=3,
            node_id="n2",
            payload={"turns": 5},
        )
        d = ev.to_dict()
        assert d["run_id"] == "r1"
        assert d["type"] == "node_start"
        assert d["sequence"] == 3
        assert d["node_id"] == "n2"
        assert d["payload"]["turns"] == 5
        assert "ts_ms" in d
        assert d["tool_call_id"] is None

    def test_sse_event_name(self):
        """sse_event_name should return the event type."""
        ev = RuntimeEvent(run_id="r", type="quality_fail")
        assert ev.sse_event_name() == "quality_fail"

    def test_event_type_literals(self):
        """All supported event types should be constructable."""
        types = [
            "run_start", "run_done", "run_failed",
            "node_start", "node_delta", "node_complete", "node_failed",
            "tool_start", "tool_end",
            "quality_start", "quality_pass", "quality_fail",
            "retry_scheduled", "fallback_scheduled",
        ]
        for t in types:
            ev = RuntimeEvent(run_id="r", type=t)
            assert ev.type == t

    def test_sequence_monotonic(self):
        """Events with increasing sequences should sort correctly."""
        ev1 = RuntimeEvent(run_id="r", type="run_start", sequence=0)
        ev2 = RuntimeEvent(run_id="r", type="node_start", sequence=1)
        ev3 = RuntimeEvent(run_id="r", type="node_complete", sequence=2)
        events = [ev3, ev1, ev2]
        events.sort(key=lambda e: e.sequence)
        assert [e.type for e in events] == ["run_start", "node_start", "node_complete"]
