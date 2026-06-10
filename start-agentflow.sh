#!/bin/bash
# AgentFlow 后端启动脚本
# 用法: ./start-agentflow.sh [port]
#
# 先复制 .env.example 为 .env 并填入 API Key:
#   cp .env.example .env
#   # 编辑 .env 填入你的 API Key
#   ./start-agentflow.sh
#
# 或通过环境变量传入:
#   ZAI_API_KEY="sk-xxx" ./start-agentflow.sh
#
# 支持的模型及对应环境变量，见 .env.example

set -a
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 加载 .env（如果存在）
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
fi
set +a

AGENT_MODEL="${AGENT_MODEL:-glm-5-turbo}"
PORT="${1:-9600}"

echo "=== AgentFlow ==="
echo "Model: $AGENT_MODEL"
echo "Port: $PORT"
echo "WorkDir: $SCRIPT_DIR"

exec python3 -u "$SCRIPT_DIR/agentflow-backend.py" "$PORT"
