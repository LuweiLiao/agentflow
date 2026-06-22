"""
AgentFlow QualityGate — 节点输出质量验证。

QualityGate 在节点执行完成后、标记为 completed 之前运行。
验证包括：
- 输出非空
- JSON 可解析（如果有）
- 预期文件存在（如果指定）
- 返回分数和重试建议
"""

from __future__ import annotations

import json
import os
import re
import shlex
import subprocess
from dataclasses import dataclass, field

# Bug #3 FIX: import blocklist from agent_runner for validation command safety
try:
    from agent_runner import _is_command_safe
except ImportError:
    # Fallback: minimal blocklist if agent_runner not available
    _BLOCKED = frozenset({"rm -rf", "curl ", "wget ", "nc ", "mkfs", "dd if=", "> /dev/sd",
                          "shutdown", "reboot", ":(){", "chmod 777"})
    def _is_command_safe(cmd: str) -> bool:
        cmd_l = cmd.lower()
        return not any(b in cmd_l for b in _BLOCKED)


@dataclass
class QualityGateResult:
    """质量门控结果。"""

    passed: bool
    score: float
    reason: str
    checks: dict[str, bool] = field(default_factory=dict)
    retryable: bool = True


class QualityGate:
    """可配置的质量验证器。"""

    def evaluate(
        self,
        node_result: dict,
        task: dict | None = None,
        node_dir: str | None = None,
        expected_files: list[str] | None = None,
        validation_commands: list[str] | None = None,
    ) -> QualityGateResult:
        """对节点输出执行质量验证。

        Args:
            node_result: AgentRunner 执行结果（含 output, result, status 等字段）
            task: 可选的 PromptTask 字典（含 output_schema 等元数据）
            node_dir: 节点工作目录（用于文件存在检查）
            expected_files: 可选，预期生成的文件列表（相对于 node_dir）

        Returns:
            QualityGateResult
        """
        task = task or {}
        expected_files = expected_files or task.get("expected_files", [])
        validation_commands = validation_commands or task.get("validation_commands", [])
        checks = {}
        reasons = []

        # 1. 非空输出检查
        output = node_result.get("output", "") or ""
        result = node_result.get("result", "") or ""
        has_content = bool(output.strip()) or bool(result.strip())
        checks["non_empty_output"] = has_content
        if not has_content:
            reasons.append("输出为空")

        # 2. JSON 有效性检查（信息性，不阻塞）
        if has_content:
            json_found = self._has_valid_json(output) or self._has_valid_json(result)
            checks["valid_json"] = json_found
        else:
            checks["valid_json"] = False

        # 3. 文件存在检查（如果指定了预期文件）
        if expected_files and node_dir:
            all_exist = True
            missing: list[str] = []
            node_dir_norm = os.path.normpath(node_dir)
            for fname in expected_files:
                # P1 FIX: 防止路径遍历 — expected_files 必须是 node_dir 的相对子路径。
                # 拒绝绝对路径和包含 ".." 的路径，规范化后再次校验未越出 node_dir。
                norm_parts = fname.replace("\\", "/").split("/")
                if os.path.isabs(fname) or ".." in norm_parts:
                    all_exist = False
                    missing.append(f"{fname} (illegal path)")
                    continue
                filepath = os.path.normpath(os.path.join(node_dir, fname))
                if filepath != node_dir_norm and not filepath.startswith(node_dir_norm + os.sep):
                    all_exist = False
                    missing.append(f"{fname} (out of bounds)")
                    continue
                if not os.path.isfile(filepath):
                    all_exist = False
                    missing.append(fname)
            checks["files_exist"] = all_exist
            if not all_exist:
                reasons.append(f"缺少文件: {', '.join(missing[:5])}")

        # 4. 容器内错误检查
        status = node_result.get("status", "")
        if status in ("error", "timeout"):
            checks["no_error"] = False
            reasons.append(f"节点状态: {status}")
        else:
            checks["no_error"] = True

        # 5. 验证命令检查（阻塞）：任何非零退出码都必须失败。
        if validation_commands and node_dir:
            commands_ok = True
            failed_msgs: list[str] = []
            for cmd in validation_commands:
                # Bug #3 FIX: safety check before shell execution
                if not _is_command_safe(cmd):
                    commands_ok = False
                    failed_msgs.append(f"{cmd}: blocked by safety policy")
                    continue
                try:
                    # P1 FIX: shell=False + shlex.split() 杜绝 shell 注入。
                    # 原先 shell=True 会把 cmd 交给 /bin/sh -c 执行，恶意
                    # validation_commands（如 "ls; rm -rf /"）会被直接解释。
                    # 现在命令被拆分为 argv，第一个元素是可执行文件，其余为参数，
                    # 不再经过 shell，元字符（; | & $ `）失去特殊含义。
                    r = subprocess.run(
                        shlex.split(cmd),
                        cwd=node_dir,
                        shell=False,
                        capture_output=True,
                        text=True,
                        timeout=60,
                    )
                except Exception as e:
                    commands_ok = False
                    failed_msgs.append(f"{cmd}: {e}")
                    continue
                if r.returncode != 0:
                    commands_ok = False
                    detail = (r.stdout or "") + ("\n" + r.stderr if r.stderr else "")
                    failed_msgs.append(f"{cmd}: exit {r.returncode}: {detail[:500]}")
            checks["validation_commands"] = commands_ok
            if not commands_ok:
                reasons.append("验证命令失败: " + "; ".join(failed_msgs[:3]))

        # 计算分数和最终结论。valid_json 是信息性检查，不计入分数。
        scoring_checks = {k: v for k, v in checks.items() if k != "valid_json"}
        total_checks = len(scoring_checks)
        passed_checks = sum(1 for v in scoring_checks.values() if v)
        score = passed_checks / max(total_checks, 1)
        passed = has_content and not reasons  # 必须有内容且无阻塞错误
        # JSON 错误和文件缺失是保底检查
        if not checks.get("files_exist", True):
            passed = False

        reason = "; ".join(reasons) if reasons else "全部检查通过"

        return QualityGateResult(
            passed=passed,
            score=score,
            reason=reason,
            checks=checks,
            retryable=True,  # 默认可重试
        )

    def _has_valid_json(self, text: str) -> bool:
        """检查文本中是否包含有效的 JSON。"""
        if not text:
            return False
        # Try parsing the whole text
        text = text.strip()
        # Extract JSON block from markdown fences
        json_blocks = re.findall(r"```(?:json)?\s*({.*?}|\[.*?\])\s*```", text, re.DOTALL)
        for block in json_blocks:
            try:
                json.loads(block)
                return True
            except (json.JSONDecodeError, ValueError):
                continue
        # Try parsing the whole text
        try:
            json.loads(text)
            return True
        except (json.JSONDecodeError, ValueError):
            pass
        return False
