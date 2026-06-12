#!/usr/bin/env python3
"""Unit tests for run_event_bus.py."""

import threading
import time

import pytest

from runtime_events import RuntimeEvent
from run_event_bus import RunEventBus


class TestRunEventBus:
    def test_new_run_has_empty_events(self):
        """A freshly queried run id should have zero events."""
        bus = RunEventBus()
        assert bus.get_events("run_1") == []

    def test_publish_returns_event_with_incremented_sequence(self):
        """publish should return a RuntimeEvent with sequence starting at 0."""
        bus = RunEventBus()
        ev = bus.publish("run_1", "run_start")
        assert isinstance(ev, RuntimeEvent)
        assert ev.run_id == "run_1"
        assert ev.type == "run_start"
        assert ev.sequence == 0

    def test_sequence_increments_per_run(self):
        """Each run has its own sequence counter."""
        bus = RunEventBus()
        e1 = bus.publish("run_a", "run_start")
        e2 = bus.publish("run_a", "node_start", node_id="n1")
        e3 = bus.publish("run_b", "run_start")
        assert e1.sequence == 0
        assert e2.sequence == 1
        assert e3.sequence == 0  # separate counter per run

    def test_get_events_returns_all_events(self):
        """get_events returns all events for a run in order."""
        bus = RunEventBus()
        bus.publish("run_x", "run_start")
        bus.publish("run_x", "node_start", node_id="n1")
        bus.publish("run_x", "node_complete", node_id="n1")
        bus.publish("run_x", "run_done")

        events = bus.get_events("run_x")
        assert len(events) == 4
        assert [e.type for e in events] == [
            "run_start", "node_start", "node_complete", "run_done"
        ]

    def test_get_events_after_sequence(self):
        """get_events with after_sequence returns only newer events."""
        bus = RunEventBus()
        bus.publish("run_y", "run_start")       # seq 0
        bus.publish("run_y", "node_start")       # seq 1
        bus.publish("run_y", "node_complete")    # seq 2
        bus.publish("run_y", "run_done")         # seq 3

        events = bus.get_events("run_y", after_sequence=1)
        assert len(events) == 2
        assert [e.type for e in events] == ["node_complete", "run_done"]

    def test_subscribe_gets_future_events(self):
        """subscribe should yield events published after subscription."""
        bus = RunEventBus()
        results = []

        def subscriber():
            for ev in bus.subscribe("run_z", timeout_s=2):
                results.append(ev.type)

        t = threading.Thread(target=subscriber, daemon=True)
        t.start()
        time.sleep(0.05)  # let subscriber start

        bus.publish("run_z", "run_start")
        bus.publish("run_z", "run_done")
        time.sleep(0.1)
        assert "run_start" in results
        assert "run_done" in results

    def test_subscribe_timeout_returns(self):
        """subscribe should exit cleanly when no events arrive before timeout."""
        bus = RunEventBus()
        ev_count = 0
        for _ in bus.subscribe("run_empty", timeout_s=0.3):
            ev_count += 1
        assert ev_count == 0

    def test_subscribe_catches_up_past_events(self):
        """subscribe with after_sequence should catch up past events then wait."""
        bus = RunEventBus()
        bus.publish("run_c", "run_start")        # seq 0
        bus.publish("run_c", "node_start")        # seq 1
        results = []

        def subscriber():
            for ev in bus.subscribe("run_c", after_sequence=-1, timeout_s=2):
                results.append(ev.type)

        t = threading.Thread(target=subscriber, daemon=True)
        t.start()
        time.sleep(0.05)

        bus.publish("run_c", "node_complete")     # seq 2
        time.sleep(0.1)

        assert results == ["run_start", "node_start", "node_complete"]

    def test_duplicate_run_isolation(self):
        """Events from different runs should not mix."""
        bus = RunEventBus()
        bus.publish("r1", "run_start")
        bus.publish("r2", "run_start")
        bus.publish("r1", "run_done")
        assert len(bus.get_events("r1")) == 2
        assert len(bus.get_events("r2")) == 1

    def test_bounded_memory(self):
        """The event bus should keep at most MAX_EVENTS_PER_RUN events."""
        bus = RunEventBus(max_events_per_run=5)
        for i in range(10):
            bus.publish("run_mem", "node_delta", payload={"i": i})
        events = bus.get_events("run_mem")
        assert len(events) == 5
        # The earliest events (seq 0-4) should be pruned; events from seq 5-9 remain
        assert events[0].sequence == 5
        assert events[-1].sequence == 9

    def test_get_latest_sequence(self):
        """get_latest_sequence returns the highest sequence for a run, or -1."""
        bus = RunEventBus()
        assert bus.get_latest_sequence("nonexistent") == -1
        bus.publish("run_s", "run_start")
        assert bus.get_latest_sequence("run_s") == 0
        bus.publish("run_s", "node_start")
        assert bus.get_latest_sequence("run_s") == 1
