# AgentFlow Agent Loop Runtime Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task after 廖博士 confirms execution.

**Goal:** Upgrade AgentFlow from a DAG batch executor into an event-driven agent-loop runtime with streaming turns, quality gates, retry/fallback, and visible closed-loop execution.

**Architecture:** Keep the existing React Flow canvas, PromptCompiler, SQLite RunStore, and AgentRunner. Add a workflow-level event bus and convert the node runner from one-shot return into a streamable loop. Then insert quality gates between node completion and downstream scheduling so the workflow can retry, fallback, skip, or continue based on verified observations.

**Tech Stack:** Python 3.12, ThreadingHTTPServer, SQLite RunStore, Server-Sent Events, existing `AgentRunner`, existing `PromptCompiler`, pytest, mypy for selected modules, Vite/TypeScript frontend.

---

## Phase 0 — Current Baseline

### Existing facts

- Node-level mini loop already exists in `agent_runner.py`: `AgentRunner.execute()` performs `LLM -> tool_calls -> tool_result -> next turn`.
- Workflow-level execution exists in `agentflow-backend.py`: `_execute_run()` finds ready DAG nodes, runs them in a thread pool, updates SQLite, and skips downstream on failure.
- SSE endpoint already exists for run updates, but it is not backed by a first-class runtime event bus.
- Prompt compilation already exists in `prompt_compiler.py`: `WorkflowJSON -> PromptTask[]` with upstream summaries.
- Artifact publishing already exists through `artifact_broker.py`.

### Design target

```text
User requirement
  -> Source orchestration / DAG
  -> PromptCompiler
  -> WorkflowController loop
      -> schedule ready nodes
      -> stream NodeAgentLoop events
      -> persist events and snapshots
      -> QualityGate verifies output
      -> retry / fallback / skip / continue
  -> React Flow status and logs
```

---

## Phase 1 — Introduce Runtime Event Contract

### Task 1.1: Define runtime event dataclasses

**Objective:** Add a typed event contract shared by backend execution, store, and SSE.

**Files:**
- Create: `runtime_events.py`
- Test: `tests/test_runtime_events.py`

**Implementation notes:**

Define these event types:

```python
from __future__ import annotations

from dataclasses import asdict, dataclass, field
import time
from typing import Any, Literal

EventType = Literal[
    "run_start", "run_done", "run_failed",
    "node_start", "node_delta", "node_complete", "node_failed",
    "tool_start", "tool_end",
    "quality_start", "quality_pass", "quality_fail",
    "retry_scheduled", "fallback_scheduled",
]

@dataclass
class RuntimeEvent:
    run_id: str
    type: EventType
    sequence: int
    ts_ms: int = field(default_factory=lambda: int(time.time() * 1000))
    node_id: str | None = None
    tool_call_id: str | None = None
    payload: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def sse_event_name(self) -> str:
        return self.type
```

**Verification:**

Run:

```bash
python -m pytest tests/test_runtime_events.py -v
```

Expected: event serialization preserves `run_id`, `type`, `sequence`, and `payload`.

### Task 1.2: Add in-memory RunEventBus

**Objective:** Provide append-only event publishing and per-run subscription without changing existing DB behavior yet.

**Files:**
- Create: `run_event_bus.py`
- Test: `tests/test_run_event_bus.py`

**Implementation notes:**

Implement:

- `publish(run_id, event_type, node_id=None, tool_call_id=None, payload=None) -> RuntimeEvent`
- `get_events(run_id, after_sequence=0) -> list[RuntimeEvent]`
- `subscribe(run_id, after_sequence=0, timeout_s=30) -> Iterator[RuntimeEvent]`
- Per-run sequence numbers must be monotonic.
- Use `threading.Condition` for SSE consumers.
- Keep bounded memory, e.g. last 2000 events per run.

**Verification:**

Run:

```bash
python -m pytest tests/test_run_event_bus.py -v
```

Expected: publish order is stable, subscribers receive future events, timeout exits cleanly.

### Task 1.3: Persist event snapshots in RunStore

**Objective:** Ensure events are not lost if SSE reconnects after a backend delay.

**Files:**
- Modify: `run_store.py`
- Test: `tests/test_run_store.py` or create `tests/test_run_events_persistence.py`

**Implementation notes:**

Add table:

```sql
CREATE TABLE IF NOT EXISTS run_events (
    run_id TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    type TEXT NOT NULL,
    node_id TEXT,
    tool_call_id TEXT,
    ts_ms INTEGER NOT NULL,
    payload_json TEXT NOT NULL,
    PRIMARY KEY (run_id, sequence)
)
```

Add methods:

- `append_event(event: RuntimeEvent) -> None`
- `list_events(run_id: str, after_sequence: int = 0, limit: int = 500) -> list[dict]`

**Verification:**

Run:

```bash
python -m pytest tests/test_run_events_persistence.py -v
```

Expected: events survive store re-instantiation and can be fetched by sequence.

---

## Phase 2 — Convert Node AgentRunner to Streaming Loop

### Task 2.1: Add non-breaking streaming API

**Objective:** Add `AgentRunner.stream_execute()` while keeping `execute()` backward compatible.

**Files:**
- Modify: `agent_runner.py`
- Test: `tests/test_runner.py`

**Implementation notes:**

Do not remove `execute()`. Implement `stream_execute()` as a generator yielding dictionaries:

```python
{"type": "node_delta", "payload": {"turn": 1, "content": "..."}}
{"type": "tool_start", "tool_call_id": "...", "payload": {"name": "read_file", "args": {...}}}
{"type": "tool_end", "tool_call_id": "...", "payload": {"result": {...}, "is_error": false}}
{"type": "node_complete", "payload": {"result": final_result}}
```

Then rewrite `execute()` as a collector over `stream_execute()` to preserve current return schema.

**Verification:**

Run:

```bash
python -m pytest tests/test_runner.py -v
```

Expected: all existing tests still pass; new tests verify event order for mocked tool calls.

### Task 2.2: Emit tool-level events

**Objective:** Make every tool call visible to the workflow event bus and frontend logs.

**Files:**
- Modify: `agent_runner.py`
- Test: `tests/test_runner.py`

**Implementation notes:**

Inside the tool loop:

1. Yield `tool_start` before `_run_tool()`.
2. Yield `tool_end` after `_run_tool()`.
3. Mark `is_error=True` if tool result contains `error`.
4. Continue appending tool result to messages exactly as before.

**Verification:**

Run:

```bash
python -m pytest tests/test_runner.py::TestRunTool -v
```

Expected: blocked commands still return safe errors and streaming events report them as tool errors.

### Task 2.3: Add abort/timeout checks between turns

**Objective:** Let workflow-level controller cancel a node between turns without killing the whole backend thread.

**Files:**
- Modify: `agent_runner.py`
- Test: `tests/test_runner.py`

**Implementation notes:**

Add optional callback:

```python
def stream_execute(..., should_abort: Callable[[], bool] | None = None):
    ...
```

Check it:

- before each LLM call
- before each tool call
- after each tool result

Yield `node_failed` with status `aborted` when set.

**Verification:**

Run:

```bash
python -m pytest tests/test_runner.py -v
```

Expected: abort callback stops before the second turn in a controlled test.

---

## Phase 3 — Wire Workflow-Level Event Loop

### Task 3.1: Publish run and node events from `_execute_run()`

**Objective:** Make workflow execution observable through `RunEventBus`.

**Files:**
- Modify: `agentflow-backend.py`
- Modify: `run_event_bus.py` if persistence hook is not yet added
- Test: `tests/test_api.py`

**Implementation notes:**

In `_execute_run()`:

- Publish `run_start` after `store.update_run_status(run_id, "running")`.
- Publish `node_start` when node status becomes `running`.
- Publish `node_complete` or `node_failed` after `_execute_one_node_streaming()` finishes.
- Publish `run_done` or `run_failed` at final settlement.

**Verification:**

Run:

```bash
python -m pytest tests/test_api.py -v
```

Expected: existing API behavior unchanged; event list contains lifecycle events for a submitted run.

### Task 3.2: Replace node execution call with streaming bridge

**Objective:** Forward `AgentRunner.stream_execute()` events into `RunEventBus` while preserving final node result persistence.

**Files:**
- Modify: `agentflow-backend.py`
- Test: `tests/test_api.py`

**Implementation notes:**

Create helper:

```python
def _execute_one_node_streaming(node_row, task, node_dir, default_model, run_id, event_bus) -> dict:
    agent = AgentRunner(model=agent_model)
    final_result = None
    for event in agent.stream_execute(...):
        event_bus.publish(run_id, event["type"], node_id=node_id, payload=event.get("payload", {}))
        if event["type"] in ("node_complete", "node_failed"):
            final_result = event["payload"].get("result")
    return normalize_final_result(final_result)
```

Keep old `_execute_one_node()` as compatibility fallback until tests pass.

**Verification:**

Run:

```bash
python -m pytest tests/test_api.py tests/test_runner.py -v
```

Expected: run status and node status match previous behavior, with extra event visibility.

### Task 3.3: Make SSE consume event bus first

**Objective:** SSE should stream real runtime events instead of only polling run snapshots.

**Files:**
- Modify: `agentflow-backend.py`
- Test: `tests/test_api.py`

**Implementation notes:**

Update `_handle_run_events(run_id)`:

- Read `Last-Event-ID` header if present.
- Replay persisted events after that sequence.
- Subscribe to `RunEventBus` for future events.
- Send SSE format:

```text
id: 12
event: node_start
data: {"run_id":"...","node_id":"..."}

```

**Verification:**

Run:

```bash
python -m pytest tests/test_api.py -v
```

Expected: SSE endpoint returns ordered events with `id`, `event`, and JSON `data`.

---

## Phase 4 — Add QualityGate

### Task 4.1: Define quality gate result model

**Objective:** Standardize node verification results.

**Files:**
- Create: `quality_gate.py`
- Test: `tests/test_quality_gate.py`

**Implementation notes:**

Define:

```python
@dataclass
class QualityGateResult:
    passed: bool
    score: float
    reason: str
    checks: dict[str, bool]
    retryable: bool = True
```

Implement initial checks:

- Non-empty output.
- If output contains final JSON block, parse it.
- If task has output schema later, validate against schema.
- If generated files are listed, check they exist in node workspace.

**Verification:**

Run:

```bash
python -m pytest tests/test_quality_gate.py -v
```

Expected: empty output fails; valid summary JSON passes; missing files fail.

### Task 4.2: Insert quality gate after node execution

**Objective:** Do not mark a node completed until quality gate passes.

**Files:**
- Modify: `agentflow-backend.py`
- Modify: `quality_gate.py`
- Test: `tests/test_api.py`

**Implementation notes:**

After final node result is produced:

1. Publish `quality_start`.
2. Run `QualityGate.evaluate(task, result, node_dir)`.
3. Publish `quality_pass` or `quality_fail`.
4. If fail and retryable, return status `quality_failed` internally for retry policy.
5. If fail and non-retryable, mark node `failed` with reason.

**Verification:**

Run:

```bash
python -m pytest tests/test_api.py tests/test_quality_gate.py -v
```

Expected: old successful cases pass quality gate; intentionally empty output fails.

### Task 4.3: Add retry/fallback policy

**Objective:** Let the workflow loop recover from quality failures without manual rerun.

**Files:**
- Modify: `agentflow_schema.py`
- Modify: `agentflow-backend.py`
- Test: `tests/test_schema.py`
- Test: `tests/test_api.py`

**Implementation notes:**

Extend node/task config with conservative defaults:

```python
retry: int = 1
fallback_model: str | None = None
quality_required: bool = True
```

Behavior:

- On retryable quality failure, retry the same node up to `retry`.
- Publish `retry_scheduled` before retry.
- If retries exhausted and `fallback_model` exists, run once with fallback and publish `fallback_scheduled`.
- If still failing, mark node failed and propagate downstream skip as today.

**Verification:**

Run:

```bash
python -m pytest tests/test_schema.py tests/test_api.py -v
```

Expected: retry count is honored and no infinite retry loop is possible.

---

## Phase 5 — Frontend Runtime Visibility

### Task 5.1: Extend frontend event parser

**Objective:** Show loop-level events in React Flow without changing backend semantics.

**Files:**
- Modify: `frontend/src/api.ts`
- Modify: `frontend/src/App.tsx` or existing SSE handler file
- Test: TypeScript build

**Implementation notes:**

Map events:

- `node_start` -> node status `running`
- `node_delta` -> append log line
- `tool_start` -> append log line with tool name
- `tool_end` -> append success/error tool log
- `quality_start` -> badge `verifying`
- `quality_pass` -> badge `completed`
- `quality_fail` -> badge `retrying` or `failed`
- `retry_scheduled` -> increment retry display

**Verification:**

Run:

```bash
PATH=/home/llw/.nvm/versions/node/v24.14.1/bin:$PATH npm run typecheck
```

Expected: zero TypeScript errors.

### Task 5.2: Add node runtime detail panel

**Objective:** Let users inspect turns, tool calls, quality checks, and retry attempts per node.

**Files:**
- Modify: `frontend/src/InspectorPanel.tsx`
- Modify: `frontend/src/types.ts` if present, or current type definitions in `App.tsx`

**Implementation notes:**

Add display fields:

- `turns`
- `tool_calls`
- `quality_score`
- `quality_reason`
- `retry_count`
- `last_event_sequence`

Do not redesign the whole UI. Only add compact runtime sections.

**Verification:**

Run:

```bash
PATH=/home/llw/.nvm/versions/node/v24.14.1/bin:$PATH npm run build
```

Expected: Vite build succeeds.

---

## Phase 6 — End-to-End Verification

### Task 6.1: Backend test suite

**Objective:** Verify Python behavior after runtime loop changes.

**Files:**
- No code unless tests reveal issues.

**Commands:**

```bash
python -m pytest -q
python -m mypy agentflow_schema.py artifact_store.py
```

Expected:

- All pytest tests pass.
- Mypy status remains at current CI expectation.

### Task 6.2: Frontend type/build verification

**Objective:** Verify React Flow UI remains buildable.

**Commands:**

```bash
PATH=/home/llw/.nvm/versions/node/v24.14.1/bin:$PATH npm run typecheck
PATH=/home/llw/.nvm/versions/node/v24.14.1/bin:$PATH npm run build
```

Expected:

- TypeScript passes.
- Vite build succeeds.

### Task 6.3: Manual API smoke test

**Objective:** Verify one real workflow produces lifecycle, tool, and quality events.

**Commands:**

Start backend with env loaded:

```bash
source .env && python agentflow-backend.py 18080
```

Submit small workflow:

```bash
curl -s http://127.0.0.1:18080/api/execute \
  -H 'Content-Type: application/json' \
  -d '{"requirement":"写一个 hello.txt 文件，内容为 hello agent loop","nodes":[{"id":"a1","label":"写文件","desc":"创建 hello.txt","profile":"dev"}],"edges":[]}'
```

Inspect events:

```bash
curl -N http://127.0.0.1:18080/api/runs/<run_id>/events
```

Expected event order includes:

```text
run_start
node_start
tool_start
tool_end
quality_start
quality_pass
node_complete
run_done
```

---

## Acceptance Criteria

- Existing 110-test baseline remains passing or increases with new tests.
- `AgentRunner.execute()` remains backward compatible for current callers.
- SSE emits typed event names with monotonic event IDs.
- A workflow can show node turns/tool calls/quality checks live in frontend logs.
- Quality gate can fail a node and trigger bounded retry without infinite loops.
- Failed node behavior remains safe: downstream nodes are skipped unless future policy explicitly allows partial continuation.
- No secrets are written to events, logs, artifacts, or test snapshots.

---

## Risk Points

- `AgentRunner.execute()` compatibility is load-bearing; implement `stream_execute()` first and make `execute()` collect it.
- SSE must support reconnect via event sequence, otherwise browser refresh loses runtime history.
- Retry policy must be bounded by explicit counters stored in run/node state.
- Event payloads must truncate large content to avoid SQLite and SSE bloat.
- Tool arguments/results may contain sensitive content; redact `.env`, API keys, and absolute home paths before persistence.
- Frontend should not introduce another state store; reuse current React Flow node data and log panel.

---

## Implementation Order Summary

1. `runtime_events.py` + `run_event_bus.py`
2. RunStore event persistence
3. `AgentRunner.stream_execute()` compatibility layer
4. Backend bridge from node stream to event bus
5. SSE replay/subscription from event bus
6. `quality_gate.py`
7. Retry/fallback policy
8. Frontend event rendering
9. Full pytest, mypy, typecheck, build, smoke test
