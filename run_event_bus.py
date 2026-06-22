"""
AgentFlow RunEventBus — in-memory event bus with per-run sequence, subscription, and bounded memory.

Thread safety:
  - Uses threading.Condition (re-entrant lock) for concurrent publish/subscribe.
  - Subscribers iterate in a lock-atomic way: they see events in publish order.
  - subscribe() yields events one at a time, blocking on Condition.wait().

Usage:
    bus = RunEventBus()
    bus.publish("run_1", "run_start")
    for event in bus.subscribe("run_1", timeout_s=30):
        print(event.to_dict())
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict
from typing import Iterator

from runtime_events import RuntimeEvent


class RunEventBus:
    """In-memory event bus per run with monotonic sequences and subscription."""

    # P2 FIX: events for a completed run are retained for this long before cleanup.
    RUN_TTL_SECONDS = 1800  # 30 minutes

    def __init__(self, max_events_per_run: int = 2000):
        self._max_events = max_events_per_run
        # run_id -> list[RuntimeEvent]
        self._events: dict[str, list[RuntimeEvent]] = defaultdict(list)
        # per-run monotonic sequence counters
        self._sequences: dict[str, int] = defaultdict(int)
        # threading condition for subscriber notification
        self._cv = threading.Condition()
        # P2 FIX: per-run completion timestamps for TTL cleanup
        self._completed_at: dict[str, float] = {}
        self._last_cleanup = 0.0
        self._cleanup_interval = 300.0  # check at most every 5 minutes

    # ── Publishing ──────────────────────────────────

    def publish(
        self,
        run_id: str,
        event_type: str,
        node_id: str | None = None,
        tool_call_id: str | None = None,
        payload: dict | None = None,
    ) -> RuntimeEvent:
        """Publish an event to the bus. Returns the created RuntimeEvent.

        Thread-safe: may be called from any thread.
        """
        with self._cv:
            seq = self._sequences[run_id]
            self._sequences[run_id] = seq + 1

            ev = RuntimeEvent(
                run_id=run_id,
                type=event_type,  # type: ignore
                sequence=seq,
                node_id=node_id,
                tool_call_id=tool_call_id,
                payload=payload or {},
            )

            run_events = self._events[run_id]
            run_events.append(ev)

            # bounded memory: prune oldest events
            if len(run_events) > self._max_events:
                excess = len(run_events) - self._max_events
                self._events[run_id] = run_events[excess:]

            # P2 FIX: record completion timestamp for TTL cleanup
            if event_type in ("run_done", "run_failed", "run_cancelled"):
                self._completed_at[run_id] = time.monotonic()

            self._cv.notify_all()

        # P2 FIX: opportunistically clean up stale completed runs
        self._maybe_cleanup()
        return ev

    # ── Querying ────────────────────────────────────

    def get_events(
        self, run_id: str, after_sequence: int = -1
    ) -> list[RuntimeEvent]:
        """Return events for *run_id* with sequence > *after_sequence*.

        Default *after_sequence* = -1 returns all events (no sequence is < 0).
        Pass *after_sequence* = N to get events strictly newer than seq N.
        Returns a copy; thread-safe.
        """
        with self._cv:
            events = list(self._events.get(run_id, []))
        return [e for e in events if e.sequence > after_sequence]

    def get_latest_sequence(self, run_id: str) -> int:
        """Return the highest sequence number for *run_id*, or -1 if empty."""
        with self._cv:
            events = self._events.get(run_id)
            if not events:
                return -1
            return events[-1].sequence

    # ── TTL Cleanup (P2 FIX) ──────────────────────

    def _maybe_cleanup(self):
        """Periodically prune events for runs completed more than TTL ago.

        Called opportunistically from publish(). Uses a monotonic clock
        so it is immune to wall-clock adjustments. Thread-safe.
        """
        now = time.monotonic()
        if now - self._last_cleanup < self._cleanup_interval:
            return
        self._last_cleanup = now
        with self._cv:
            expired = [
                rid
                for rid, ts in self._completed_at.items()
                if now - ts > self.RUN_TTL_SECONDS
            ]
            for rid in expired:
                self._events.pop(rid, None)
                self._sequences.pop(rid, None)
                self._completed_at.pop(rid, None)

    def force_cleanup_run(self, run_id: str):
        """Immediately remove all in-memory state for *run_id*.

        Useful for tests or explicit memory management.
        """
        with self._cv:
            self._events.pop(run_id, None)
            self._sequences.pop(run_id, None)
            self._completed_at.pop(run_id, None)

    # ── Subscription ────────────────────────────────

    def subscribe(
        self,
        run_id: str,
        after_sequence: int | None = None,
        timeout_s: float = 30.0,
    ) -> Iterator[RuntimeEvent]:
        """Yield events for *run_id* as they are published.

        If *after_sequence* is None, start from the latest known sequence
        of that run (i.e., only future events). Otherwise start from
        *after_sequence* + 1, replaying past events first.

        Yields events one by one. Blocks on empty queue via Condition.wait().
        Exits after *timeout_s* seconds of inactivity, or immediately after
        a terminal event (run_done / run_failed).
        """
        if after_sequence is None:
            after_sequence = self.get_latest_sequence(run_id)

        while True:
            events = self.get_events(run_id, after_sequence=after_sequence)
            for ev in events:
                yield ev
                after_sequence = ev.sequence
                if ev.type in ("run_done", "run_failed"):
                    return

            # Wait for new events
            with self._cv:
                # Double-check: events may have arrived between get_events and lock
                latest = self.get_latest_sequence(run_id)
                if latest > after_sequence:
                    continue
                if self._cv.wait(timeout=timeout_s):
                    # Condition was notified; loop to check for new events
                    continue
                else:
                    # Timeout — no more events expected
                    return
