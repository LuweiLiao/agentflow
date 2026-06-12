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
from dataclasses import dataclass, field


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
            for fname in expected_files:
                filepath = os.path.join(node_dir, fname)
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
