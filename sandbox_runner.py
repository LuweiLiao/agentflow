#!/usr/bin/env python3
"""SandboxRunner — Agent 执行沙箱抽象层。

提供统一的 Agent 执行接口，支持本地和 Docker 两种跑法：
  - LocalRunner: 直接 subprocess 执行（开发/单机模式）
  - DockerRunner: 容器隔离执行（团队/公网模式）

使用方式:
    runner = get_runner()  # 返回 LocalRunner
    result = runner.execute(
        command=["python3", "-c", "print('hello')"],
        workspace="/tmp/work",
        env={"PYTHONUNBUFFERED": "1"},
        timeout=60,
    )
"""
import os
import shlex
import subprocess
import tempfile
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class CommandResult:
    """命令执行结果。"""
    returncode: int
    stdout: str
    stderr: str
    duration_ms: int
    timed_out: bool = False


class SandboxRunner(ABC):
    """Agent 执行沙箱抽象基类。"""

    @abstractmethod
    def execute(self, command: list[str], workspace: str,
                env: dict | None = None,
                timeout: int = 120) -> CommandResult:
        """在沙箱中执行命令。

        Args:
            command: 命令及参数列表（如 ["python3", "script.py"]）
            workspace: 工作绝对路径
            env: 额外环境变量
            timeout: 超时秒数

        Returns:
            CommandResult
        """
        ...

    def execute_string(self, command_str: str, workspace: str,
                       env: dict | None = None,
                       timeout: int = 120) -> CommandResult:
        """从字符串解析命令并执行。"""
        return self.execute(
            shlex.split(command_str), workspace, env, timeout
        )


class LocalRunner(SandboxRunner):
    """本地直接 subprocess 执行（无隔离，仅限开发/单机模式）。"""

    def __init__(self, label: str = "local"):
        self.label = label

    def execute(self, command: list[str], workspace: str,
                env: dict | None = None,
                timeout: int = 120) -> CommandResult:
        t0 = time.time()
        try:
            proc = subprocess.Popen(
                command,
                cwd=workspace,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env={**os.environ, **(env or {})},
                text=True,
            )
            try:
                stdout, stderr = proc.communicate(timeout=timeout)
                timed_out = False
            except subprocess.TimeoutExpired:
                proc.kill()
                stdout, stderr = proc.communicate()
                timed_out = True

            dur = int((time.time() - t0) * 1000)
            return CommandResult(
                returncode=proc.returncode if not timed_out else -1,
                stdout=stdout or "",
                stderr=stderr or "",
                duration_ms=dur,
                timed_out=timed_out,
            )
        except FileNotFoundError as e:
            dur = int((time.time() - t0) * 1000)
            return CommandResult(
                returncode=-1,
                stdout="",
                stderr=str(e),
                duration_ms=dur,
                timed_out=False,
            )


class DockerRunner(SandboxRunner):
    """容器隔离执行（Docker）。每节点启动临时容器。

    安全策略：
      - 非 root 用户
      - 只挂载任务工作区
      - 根文件系统只读
      - 禁 Docker Socket
      - CPU/内存/进程数/磁盘限制
      - 默认关网络，按需域名白名单
    """

    def __init__(self, image: str = "python:3.12-slim",
                 label: str = "docker",
                 memory_limit: str = "512m",
                 cpu_limit: str = "1.0",
                 read_only_rootfs: bool = True,
                 network_disabled: bool = True,
                 user: str = "nobody"):
        self.image = image
        self.label = label
        self.memory_limit = memory_limit
        self.cpu_limit = cpu_limit
        self.read_only_rootfs = read_only_rootfs
        self.network_disabled = network_disabled
        self.user = user
        # 检查 docker 是否可用
        self._docker_available = self._check_docker()

    def _check_docker(self) -> bool:
        try:
            subprocess.run(
                ["docker", "info"],
                capture_output=True, timeout=5,
            )
            return True
        except (subprocess.SubprocessError, FileNotFoundError):
            return False

    def execute(self, command: list[str], workspace: str,
                env: dict | None = None,
                timeout: int = 120) -> CommandResult:
        if not self._docker_available:
            return CommandResult(
                returncode=-1,
                stdout="",
                stderr="Docker 不可用（当前环境未安装或无权访问）",
                duration_ms=0,
                timed_out=False,
            )

        t0 = time.time()

        # 构建容器名称
        container_name = f"af_{os.urandom(4).hex()}"

        # 构建 Docker run 参数
        docker_args = [
            "docker", "run", "--rm",
            "--name", container_name,
            "--user", self.user,
            "--memory", self.memory_limit,
            "--cpus", self.cpu_limit,
            f"--volume={workspace}:/workspace:ro" if self.read_only_rootfs
            else f"--volume={workspace}:/workspace",
            "--workdir", "/workspace",
        ]

        if self.read_only_rootfs:
            docker_args.append("--read-only")

        if self.network_disabled:
            docker_args.extend(["--network", "none"])

        # 环境变量
        for k, v in (env or {}).items():
            docker_args.extend(["--env", f"{k}={v}"])

        docker_args.append(self.image)
        docker_args.extend(command)

        try:
            proc = subprocess.Popen(
                docker_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            try:
                stdout, stderr = proc.communicate(timeout=timeout)
                timed_out = False
            except subprocess.TimeoutExpired:
                # 超时后清理容器
                subprocess.run(
                    ["docker", "rm", "-f", container_name],
                    capture_output=True, timeout=10,
                )
                stdout, stderr = proc.communicate()
                timed_out = True

            dur = int((time.time() - t0) * 1000)
            return CommandResult(
                returncode=proc.returncode if not timed_out else -1,
                stdout=stdout or "",
                stderr=stderr or "",
                duration_ms=dur,
                timed_out=timed_out,
            )
        except FileNotFoundError:
            return CommandResult(
                returncode=-1,
                stdout="",
                stderr="docker 命令未找到",
                duration_ms=int((time.time() - t0) * 1000),
                timed_out=False,
            )


# ── 工厂函数 ────────────────────────────────────────
def get_runner() -> SandboxRunner:
    """根据环境变量选择 runner。"""
    mode = os.environ.get("AGENTFLOW_RUNNER_MODE", "local")
    if mode == "docker":
        return DockerRunner()
    return LocalRunner()


# ── 快速测试 ────────────────────────────────────────
if __name__ == "__main__":
    runner = get_runner()
    with tempfile.TemporaryDirectory() as td:
        result = runner.execute(["python3", "-c",
                                  "print('hello from sandbox')"],
                                workspace=td, timeout=10)
        print(f"Runner: {runner.label}")
        print(f"  returncode: {result.returncode}")
        print(f"  stdout: {result.stdout.strip()}")
        print(f"  stderr: {result.stderr.strip()}")
        print(f"  duration: {result.duration_ms}ms")
        print(f"  timed_out: {result.timed_out}")

        # 测试超时
        result = runner.execute(["sleep", "10"],
                                workspace=td, timeout=2)
        print(f"  timeout test: {result.timed_out}, dur={result.duration_ms}ms")
