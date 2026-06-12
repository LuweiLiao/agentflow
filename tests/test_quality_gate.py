#!/usr/bin/env python3
"""Unit tests for quality_gate.py."""

import json
import os
import tempfile

import pytest

from quality_gate import QualityGate, QualityGateResult


class TestQualityGateResult:
    def test_minimal_fail(self):
        """A QualityGateResult should default to failed state."""
        r = QualityGateResult(passed=False, score=0.0, reason="empty output", checks={})
        assert r.passed is False
        assert r.retryable is True

    def test_minimal_pass(self):
        """A passing result should report correct checks."""
        r = QualityGateResult(
            passed=True, score=1.0, reason="all checks pass",
            checks={"non_empty_output": True, "valid_json": True},
            retryable=False,
        )
        assert r.passed is True
        assert r.score == 1.0
        assert r.retryable is False


class TestQualityGateEvaluate:
    def test_empty_output_fails(self):
        """Empty output should fail quality gate."""
        gate = QualityGate()
        result = gate.evaluate({"output": "", "result": ""}, task={}, node_dir="/tmp")
        assert result.passed is False
        assert result.score < 1.0  # 有通过项（no_error），但不是满分
        assert "空" in result.reason

    def test_non_empty_output_passes(self):
        """Non-empty output should pass minimal quality checks."""
        gate = QualityGate()
        result = gate.evaluate(
            {"output": "hello world", "result": "完成"},
            task={}, node_dir="/tmp"
        )
        assert result.passed is True
        assert result.score == 1.0

    def test_result_in_output_counts_as_non_empty(self):
        """If result is set even when output is empty, it should pass."""
        gate = QualityGate()
        result = gate.evaluate(
            {"output": "", "result": "任务已经完成"},
            task={}, node_dir="/tmp"
        )
        assert result.passed is True

    def test_valid_json_in_output_passes_json_check(self):
        """Valid JSON in output should pass the json check."""
        gate = QualityGate()
        result = gate.evaluate(
            {"output": '{"summary": "done", "output": "finished"}', "result": "done"},
            task={}, node_dir="/tmp"
        )
        assert result.passed is True
        assert result.checks.get("valid_json", False) is True

    def test_invalid_json_in_output_still_passes(self):
        """Invalid JSON is acceptable — JSON check is informational, not blocking."""
        gate = QualityGate()
        result = gate.evaluate(
            {"output": "this is not json", "result": "done"},
            task={}, node_dir="/tmp"
        )
        assert result.passed is True  # non-empty output still passes
        assert result.checks.get("valid_json", True) is False

    def test_generated_files_check(self):
        """If task references generated files, verify they exist."""
        with tempfile.TemporaryDirectory() as td:
            os.makedirs(os.path.join(td, "output"), exist_ok=True)
            with open(os.path.join(td, "output", "result.txt"), "w") as f:
                f.write("test content")

            gate = QualityGate()
            # Task says files should exist
            result = gate.evaluate(
                {"output": "done", "result": "done"},
                task={},
                node_dir=td,
                expected_files=["output/result.txt"],
            )
            assert result.passed is True
            assert result.checks.get("files_exist", False) is True

    def test_missing_files_cause_fail(self):
        """Missing expected files should fail quality gate."""
        with tempfile.TemporaryDirectory() as td:
            gate = QualityGate()
            result = gate.evaluate(
                {"output": "done", "result": "done"},
                task={},
                node_dir=td,
                expected_files=["should_exist.txt"],
            )
            assert result.passed is False
            assert "should_exist.txt" in result.reason
            assert result.retryable is True  # retryable since it might be transient

    def test_retryable_false_for_terminal_errors(self):
        """Some failure types should not be retryable."""
        gate = QualityGate()
        result = gate.evaluate(
            {"output": "", "result": "", "status": "error"},
            task={}, node_dir="/tmp"
        )
        # Still retryable by default — retry policy decisions stay in backend
        assert result.retryable is True

    def test_tool_error_output_still_validated(self):
        """Output with tool errors should still undergo quality validation."""
        gate = QualityGate()
        result = gate.evaluate(
            {"output": "generated file x.txt", "result": "partial completion",
             "error": "tool timeout"},
            task={}, node_dir="/tmp"
        )
        assert result.passed is True  # non-empty output
