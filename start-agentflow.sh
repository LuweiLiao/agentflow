#!/bin/bash
# AgentFlow 后端启动脚本
# 支持的模型（设置对应环境变量即可切换）：
#   DEEPSEEK_API_KEY + DEEPSEEK_BASE_URL  → deepseek-chat
#   ZAI_API_KEY + ZAI_BASE_URL            → glm-5-turbo （默认）
#   OPENAI_API_KEY + OPENAI_BASE_URL      → gpt-4o
#   XAI_API_KEY + XAI_BASE_URL            → grok-3
#   DASHSCOPE_API_KEY + DASHSCOPE_BASE_URL → qwen-max
#   MOONSHOT_API_KEY + MOONSHOT_BASE_URL  → moonshot-v1-8k
#   SILICONFLOW_API_KEY                   → Pro/deepseek-ai/DeepSeek-V3
#   YI_API_KEY + YI_BASE_URL              → yi-large
#   MINIMAX_API_KEY + MINIMAX_BASE_URL    → minimax-4
#   BAIDU_API_KEY + BAIDU_BASE_URL        → ernie-4.5
#   TENCENT_API_KEY + TENCENT_BASE_URL    → hunyuan-turbo
#   STEP_API_KEY + STEP_BASE_URL          → step-2
#
# 切换模型：export AGENT_MODEL="deepseek-chat" 然后重启

export ZAI_API_KEY="ZAI_API_KEY_REVOKED_PLEASE_SET_VIA_ENV"
export ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-""}
export AGENT_MODEL="${AGENT_MODEL:-glm-5-turbo}"

cd /home/llw
echo "=== AgentFlow v3 ==="
echo "Model: $AGENT_MODEL"
echo "Port: 9600"

exec python3 -u agentflow-backend.py 9600
