# AgentFlow 设计文档

## 📌 文档状态说明

这些文档描述了 AgentFlow 在 **设计阶段** 的完整架构愿景。
当前代码实现了其中的核心子集，部分功能尚在规划中。

| 目录 | 内容 | 代码状态 |
|------|------|----------|
| 01-vision-and-philosophy | 产品愿景与设计理念 | ✅ 已实现 |
| 02-system-architecture | 系统架构层 | ✅ 核心已实现 |
| 03-data-contracts | WorkflowJSON / PromptTask / EnvelopeJSON | ✅ 已实现 (`agentflow_schema.py`) |
| 04-prompt-compiler-agent | Compiler + 模板系统 | ✅ 已实现 (`prompt_compiler.py`) |
| 05-orchestrator | Orchestrator 核心循环 | ⏳ 部分实现 (`agentflow-backend.py` handle_execute) |
| 06-agent-runtime | Agent 注册表 + 安全 | ⏳ 部分实现 (`agent_runner.py` + `output_validator.py`) |
| 07-ui-and-canvas | React Flow 画布 | ⏳ Canvas demo (HTML) |
| 08-implementation-roadmap | 路线图 | ✅ 参考 |

### 30年可维护性原则
- **零外部依赖**: 全部 Python stdlib（json / http.server 等）
- **文件持久化**: 无需数据库，`ArtifactStore` 用 JSON 文件
- **模块边界**: 每个 .py 文件一个职责
- **模板格式**: JSON（比 YAML 更稳定，30年后也能解析）
