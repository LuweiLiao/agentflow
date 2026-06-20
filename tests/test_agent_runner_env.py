"""AgentRunner environment loading regressions."""

import importlib
import os
from pathlib import Path


def test_load_env_files_once_loads_project_env_without_overriding(monkeypatch, tmp_path):
    import agent_runner

    env_file = tmp_path / ".env"
    env_file.write_text("AGENTFLOW_ENV_TEST_KEY=from_file\nKEEP_EXISTING=from_file\n", encoding="utf-8")
    monkeypatch.setenv("KEEP_EXISTING", "already")
    monkeypatch.delenv("AGENTFLOW_ENV_TEST_KEY", raising=False)
    monkeypatch.setattr(agent_runner.os.path, "dirname", lambda _p: str(tmp_path))

    agent_runner._load_env_files_once()

    assert os.environ["AGENTFLOW_ENV_TEST_KEY"] == "from_file"
    assert os.environ["KEEP_EXISTING"] == "already"
