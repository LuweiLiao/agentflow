#!/usr/bin/env python3
"""Tests for AgentRunner.stream_execute()."""

import json
import os
import tempfile
from unittest import mock

import pytest

from agent_runner import AgentRunner


def _mock_llm_response(content: str, tool_calls: list | None = None) -> dict:
    """Build a mock LLM response dict."""
    msg = {"role": "assistant", "content": content}
    if tool_calls:
        msg["tool_calls"] = tool_calls
    return {
        "choices": [{"message": msg}],
        "usage": {"prompt_tokens": 10, "completion_tokens": 5},
    }


def _make_tool_call(name: str, args: dict, id: str = "tc_1") -> dict:
    return {
        "id": id,
        "type": "function",
        "function": {"name": name, "arguments": json.dumps(args)},
    }


class TestStreamExecute:
    @pytest.fixture(autouse=True)
    def _setup(self):
        """Create a runner with mocked API key."""
        with mock.patch.dict(os.environ, {
            "DEEPSEEK_API_KEY": "sk-test",
            "DEEPSEEK_BASE_URL": "https://api.test.local/v1",
        }):
            self.runner = AgentRunner(model="deepseek-chat")
            # Replace the real adapter with a mock
            self.runner.adapter = mock.MagicMock()
            self.runner.api_key = "sk-test"

    def test_completion_without_tools_ends_immediately(self):
        """A completion with no tool calls should yield node_complete."""
        self.runner.adapter.chat_completion.return_value = _mock_llm_response(
            "Hello, I'm done."
        )
        events = list(self.runner.stream_execute("write hello.txt"))
        types = [e["type"] for e in events]
        assert "node_complete" in types
        assert "tool_start" not in types

    def test_tool_emits_start_end(self):
        """Tool calls should emit tool_start and tool_end events."""
        self.runner.adapter.chat_completion.side_effect = [
            _mock_llm_response("", tool_calls=[
                _make_tool_call("write_file", {"path": "test.txt", "content": "hello"})
            ]),
            _mock_llm_response("Done writing."),
        ]
        with tempfile.TemporaryDirectory() as td:
            events = list(self.runner.stream_execute(
                "write a file", work_dir=td
            ))

        types = [e["type"] for e in events]
        assert "tool_start" in types
        assert "tool_end" in types
        tool_start = [e for e in events if e["type"] == "tool_start"][0]
        assert tool_start["payload"]["name"] == "write_file"
        tool_end = [e for e in events if e["type"] == "tool_end"][0]
        assert tool_end["payload"]["result"]["written"] is True

    def test_node_delta_emitted(self):
        """Text content turns should emit node_delta events."""
        self.runner.adapter.chat_completion.return_value = _mock_llm_response(
            "Starting work...\nMore details..."
        )
        events = list(self.runner.stream_execute("do something"))
        deltas = [e for e in events if e["type"] == "node_delta"]
        assert len(deltas) == 1
        assert "Starting work..." in deltas[0]["payload"]["content"]

    def test_execute_collects_from_stream(self):
        """The existing execute() should still produce the same result shape."""
        self.runner.adapter.chat_completion.return_value = _mock_llm_response(
            '{\"summary\":\"完成\",\"output\":\"任务结束\"}'
        )
        with tempfile.TemporaryDirectory() as td:
            result = self.runner.execute("do it", work_dir=td)

        assert isinstance(result, dict)
        assert "result" in result
        assert "status" in result
        assert "cost" in result
        assert "turns" in result

    def test_stream_multiple_turns(self):
        """Multiple LLM turns should yield multiple node_delta events."""
        self.runner.adapter.chat_completion.side_effect = [
            _mock_llm_response(
                "First turn",
                tool_calls=[_make_tool_call("write_file", {"path": "a.txt", "content": "a"})],
            ),
            _mock_llm_response("Second turn"),
        ]
        with tempfile.TemporaryDirectory() as td:
            events = list(self.runner.stream_execute("two turns", work_dir=td))

        types = [e["type"] for e in events]
        # There should be 2 turns, each generating a node_delta
        deltas = [e for e in events if e["type"] == "node_delta"]
        assert len(deltas) == 2

    def test_node_failed_on_llm_error(self):
        """LLM error should yield node_failed event."""
        self.runner.adapter.chat_completion.side_effect = RuntimeError("API timeout")
        events = list(self.runner.stream_execute("do something"))
        types = [e["type"] for e in events]
        assert "node_failed" in types
        failed = [e for e in events if e["type"] == "node_failed"][0]
        assert "API timeout" in failed["payload"]["error"]

    def test_stream_execute_honors_max_turns(self):
        """Even with repeated tool calls, max_turns should cap iterations."""
        self.runner.adapter.chat_completion.side_effect = [
            _mock_llm_response("", tool_calls=[
                _make_tool_call("execute_command", {"command": "echo hi"})
            ])
        ] * 5  # Always returns a tool call
        with tempfile.TemporaryDirectory() as td:
            events = list(self.runner.stream_execute(
                "loop test", work_dir=td, max_turns=2
            ))
        deltas = [e for e in events if e["type"] == "node_delta"]
        assert len(deltas) <= 2
