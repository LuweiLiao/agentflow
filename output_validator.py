"""
Output Validator — Agent 结构化输出校验与容错解析

功能:
  1. JSON 解析（带 fuzzy 匹配和重试）
  2. Schema 校验（必需字段、类型、值范围）
  3. 容错回退（解析失败 → 修正 → 重试 → 最终 fallback）
"""

import json, re
from typing import Any, Optional


def extract_json(text: str) -> Optional[Any]:
    """从文本中提取并解析 JSON。

    策略:
      1. 直接尝试 json.loads()
      2. 匹配 ```json ... ``` 代码块
      3. 匹配 [...] 或 {...} 括号块
      4. 尝试移除尾随逗号后重试
    """
    text = text.strip()

    # 策略 1: 直接解析
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 策略 2: 代码块
    block_match = re.search(
        r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL
    )
    if block_match:
        try:
            return json.loads(block_match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # 策略 3: 最外层的 [...] 或 {...}
    for bracket in (('[', ']'), ('{', '}')):
        start = text.find(bracket[0])
        if start == -1:
            continue
        depth = 0
        for i in range(start, len(text)):
            ch = text[i]
            if ch == bracket[0]:
                depth += 1
            elif ch == bracket[1]:
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(text[start:i+1])
                    except json.JSONDecodeError:
                        # 策略 3b: 修正后重试
                        fixed = fix_json(text[start:i+1])
                        if fixed is not None:
                            try:
                                return json.loads(fixed)
                            except json.JSONDecodeError:
                                pass
                        break
        if depth == 0:
            break

    return None


def fix_json(text: str) -> Optional[str]:
    """尝试修复常见 JSON 错误。"""
    # 修复 key 缺少引号
    text = re.sub(r"(?<!\w)(\w+)(?=\s*:)", r'"\1"', text)
    # 移除尾随逗号
    text = re.sub(r",\s*([}\]])", r"\1", text)
    # 修复单引号为双引号
    text = text.replace("'", '"')
    # 修复末尾多余的逗号
    text = text.rstrip().rstrip(",")
    return text


def validate_node_schema(nodes: list[dict]) -> list[str]:
    """校验编排节点列表的 schema。"""
    errors = []
    required_fields = ["id", "label", "profile"]
    valid_profiles = {"analysis", "design", "dev", "test", "doc", "deploy"}

    for i, node in enumerate(nodes):
        for field in required_fields:
            if field not in node:
                errors.append(f"节点 #{i}: 缺少必需字段 '{field}'")
        nid = node.get("id", "")
        if not nid or not isinstance(nid, str):
            errors.append(f"节点 #{i}: id 必须是非空字符串")
        profile = node.get("profile", "")
        if profile and profile not in valid_profiles:
            errors.append(f"节点 #{i}: 未知 profile '{profile}'")

    # 检查重复 id
    ids = [n.get("id", "") for n in nodes if n.get("id")]
    duplicates = set([nid for nid in ids if ids.count(nid) > 1])
    if duplicates:
        errors.append(f"重复 node id: {list(duplicates)}")

    return errors


def safe_parse_agent_result(result: dict) -> dict:
    """安全解析 Agent 执行结果，确保关键字段存在。"""
    status = result.get("status", "error")
    if status == "error":
        return {
            "result": result.get("result", "执行失败"),
            "output": "",
            "cost": result.get("cost", 0),
            "duration_ms": result.get("duration_ms", 0),
            "status": "error",
            "turns": result.get("turns", 0),
            "model": result.get("model", ""),
            "provider": result.get("provider", ""),
        }

    output = result.get("output") or result.get("result") or ""
    return {
        "result": result.get("result", "完成"),
        "output": str(output)[:2000],
        "cost": float(result.get("cost", 0)),
        "duration_ms": int(result.get("duration_ms", 0)),
        "status": status,
        "turns": int(result.get("turns", 1)),
        "model": str(result.get("model", "")),
        "provider": str(result.get("provider", "")),
    }
