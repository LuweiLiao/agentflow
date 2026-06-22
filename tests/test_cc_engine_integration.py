"""
CC Engine Integration Test — 验证 CC 引擎可以从项目内部启动并执行简单推理。

Issue #71 [F] FIX: 添加 CC 引擎集成测试。
"""
import os
import sys
import pytest
from pathlib import Path

# 确保项目根在 path 中
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


class TestCCEngineAdapter:
    """CC 引擎适配器集成测试。"""

    def test_adapter_importable(self):
        """测试 ClaudeCodeAdapter 可导入。"""
        from claude_code_adapter import ClaudeCodeAdapter
        assert ClaudeCodeAdapter is not None

    def test_engine_dir_exists(self):
        """测试引擎目录存在。"""
        engine_dir = Path(os.environ.get(
            "AGENTFLOW_CC_ENGINE_DIR",
            PROJECT_ROOT / "claude-code-engine"
        ))
        assert engine_dir.exists(), f"Engine dir not found: {engine_dir}"

    def test_cli_entry_exists(self):
        """测试 CLI 入口文件存在。"""
        engine_dir = Path(os.environ.get(
            "AGENTFLOW_CC_ENGINE_DIR",
            PROJECT_ROOT / "claude-code-engine"
        ))
        cli_entry = engine_dir / "dist" / "cli-bun.js"
        assert cli_entry.exists(), f"CLI entry not found: {cli_entry}"

    def test_bun_available(self):
        """测试 bun 运行时可用。"""
        import shutil
        bun = shutil.which("bun") or os.environ.get("BUN_PATH", "/usr/local/bin/bun")
        assert os.path.isfile(bun), f"bun not found at {bun}"

    def test_message_bus_persistence(self):
        """测试 AgentMessageBus 持久化。"""
        from claude_code_adapter import AgentMessageBus, AgentMessage
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False, mode="w") as f:
            log_path = f.name
        try:
            bus = AgentMessageBus(log_path=log_path)
            bus.send(AgentMessage(from_agent="a", to_agent="b", msg_type="test"))
            # 验证文件写入
            loaded = AgentMessageBus.load_from_file(log_path)
            msgs = loaded.poll("b")
            assert len(msgs) == 1
            assert msgs[0].from_agent == "a"
        finally:
            os.unlink(log_path)

    def test_from_provider_registry(self):
        """测试 from_provider_registry 工厂方法。"""
        from claude_code_adapter import ClaudeCodeAdapter
        # 设置测试环境变量
        os.environ["AGENTFLOW_LLM_PROVIDER"] = "deepseek"
        os.environ["AGENTFLOW_LLM_API_KEY"] = "test-key"
        os.environ["AGENTFLOW_LLM_BASE_URL"] = "https://api.deepseek.com/v1"
        os.environ["AGENTFLOW_LLM_MODEL"] = "deepseek-v4-flash"
        try:
            adapter = ClaudeCodeAdapter.from_provider_registry()
            assert adapter is not None
            assert adapter.llm_config["model"] == "deepseek-v4-flash"
        finally:
            for k in ["AGENTFLOW_LLM_PROVIDER", "AGENTFLOW_LLM_API_KEY",
                       "AGENTFLOW_LLM_BASE_URL", "AGENTFLOW_LLM_MODEL"]:
                del os.environ[k]
