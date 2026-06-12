"""
AgentFlow Runtime Events — typed event contract shared by backend, store, and SSE.

EventType literals cover the full lifecycle:
  run lifecycle:     run_start, run_done, run_failed
  node lifecycle:    node_start, node_delta, node_complete, node_failed
  tool lifecycle:    tool_start, tool_end
  quality gate:      quality_start, quality_pass, quality_fail
  retry/fallback:    retry_scheduled, fallback_scheduled
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
import time
from typing import Any, Literal

# All supported event types as a literal union
EventType = Literal[
    "run_start", "run_done", "run_failed",
    "node_start", "node_delta", "node_complete", "node_failed",
    "tool_start", "tool_end",
    "quality_start", "quality_pass", "quality_fail",
    "retry_scheduled", "fallback_scheduled",
]

# Runtime sequence of event types for validation
EVENT_LIFECYCLE = [
    "run_start",
    "node_start", "node_delta", "tool_start", "tool_end", "node_complete", "node_failed",
    "quality_start", "quality_pass", "quality_fail",
    "retry_scheduled", "fallback_scheduled",
    "run_done", "run_failed",
]

TERMINAL_EVENTS = frozenset({"run_done", "run_failed"})


@dataclass
class RuntimeEvent:
    """A single runtime event in the AgentFlow execution lifecycle.

    Every event carries:
      run_id:   workflow execution identifier
      type:     typed event name for SSE and filtering
      sequence: monotonic integer per-run (0-based)
      ts_ms:    unix timestamp in milliseconds
      node_id, tool_call_id: optional scope identifiers
      payload:  free-form dict with event-specific data
    """

    run_id: str
    type: EventType
    sequence: int = 0
    ts_ms: int = field(default_factory=lambda: int(time.time() * 1000))
    node_id: str | None = None
    tool_call_id: str | None = None
    payload: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a plain dict for JSON delivery."""
        return {
            "run_id": self.run_id,
            "type": self.type,
            "sequence": self.sequence,
            "ts_ms": self.ts_ms,
            "node_id": self.node_id,
            "tool_call_id": self.tool_call_id,
            "payload": self.payload,
        }

    def sse_event_name(self) -> str:
        """Return the event name string used for SSE event: field."""
        return self.type
