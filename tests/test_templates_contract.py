"""Template contract regressions for real app generation tasks."""

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _template(name: str) -> dict:
    return json.loads((PROJECT_ROOT / "templates" / f"{name}.json").read_text(encoding="utf-8"))


def test_dev_template_requires_real_files_and_gui_offscreen_validation():
    prompt = _template("dev")["prompt_template"]
    assert "真实可运行代码文件" in prompt
    assert "if __name__ == \"__main__\"" in prompt
    assert "QT_QPA_PLATFORM=offscreen" in prompt
    assert "input/" in prompt


def test_test_template_requires_materialized_artifacts_and_nonblocking_gui_smoke():
    prompt = _template("test")["prompt_template"]
    assert "input/" in prompt
    assert "真实上游产物" in prompt
    assert "QT_QPA_PLATFORM=offscreen" in prompt
    assert "禁止启动阻塞事件循环" in prompt
