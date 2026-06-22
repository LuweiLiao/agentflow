#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# AgentFlow — 智能启动脚本
#
# 自动检测：
#   - CC 引擎可用性（验证 bun + 入口文件）
#   - 前端构建产物（缺失则构建）
#   - 环境变量完整性
#
# 用法：
#   ./start-agentflow.sh              # 直接启动
#   AGENTFLOW_PORT=8080 ./start.sh    # 指定端口
# ═══════════════════════════════════════════════════════════
set -euo pipefail

# ── 颜色 ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ── 配置（环境变量覆盖） ──
HOST="${AGENTFLOW_HOST:-0.0.0.0}"
PORT="${AGENTFLOW_PORT:-9600}"
CC_ENGINE_DIR="${AGENTFLOW_CC_ENGINE_DIR:-/opt/claude-code-engine}"
BUN="${BUN_PATH:-$(which bun 2>/dev/null || true)}"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"
DIST_DIR="${FRONTEND_DIR}/dist"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         AgentFlow v5.0 — 启动诊断          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. 检测 CC 引擎 ──
echo -e "${CYAN}── ① Claude Code 引擎 ──${NC}"
if [ -d "$CC_ENGINE_DIR" ]; then
    ENTRY="${CC_ENGINE_DIR}/src/entrypoints/cli.tsx"
    if [ -f "$ENTRY" ]; then
        ok "引擎目录: ${CC_ENGINE_DIR}"
        ok "入口文件: ${ENTRY}"
    else
        warn "引擎目录存在但缺少入口文件: ${ENTRY}"
        warn "Agent 类型 'claude-code' 不可用，将回退到 LLM API"
        CC_ENGINE_DIR=""
    fi
else
    warn "未找到引擎目录: ${CC_ENGINE_DIR}"
    warn "Agent 类型 'claude-code' 不可用，将回退到 LLM API"
    CC_ENGINE_DIR=""
fi

if [ -n "$BUN" ] && [ -x "$BUN" ]; then
    ok "Bun: ${BUN} ($($BUN --version 2>/dev/null || echo 'unknown'))"
else
    warn "Bun 未安装或不可执行，CC 引擎无法启动"
    BUN=""
fi

# ── 2. 检测/构建前端 ──
echo ""
echo -e "${CYAN}── ② 前端 ──${NC}"
if [ -d "$DIST_DIR" ] && [ -f "${DIST_DIR}/index.html" ]; then
    ok "前端已构建: ${DIST_DIR}"
    JS_SIZE=$(du -sh "${DIST_DIR}/assets/"*.js 2>/dev/null | awk '{print $1}' || echo "?")
    CSS_SIZE=$(du -sh "${DIST_DIR}/assets/"*.css 2>/dev/null | awk '{print $1}' || echo "?")
    ok "   JS: ${JS_SIZE}  |  CSS: ${CSS_SIZE}"
else
    warn "前端未构建，尝试构建..."
    if command -v node &>/dev/null; then
        info "node $(node --version) 已安装"
        if [ -f "${SCRIPT_DIR}/package.json" ]; then
            npm ci && npm run build
            ok "前端构建完成"
        else
            fail "package.json 缺失，跳过前端构建"
        fi
    else
        warn "Node.js 未安装，无法构建前端"
        warn "请先安装 Node.js 22+: https://nodejs.org/"
        warn "然后执行: npm ci && npm run build"
    fi
fi

# ── 3. 检测 API Key ──
echo ""
echo -e "${CYAN}── ③ API 密钥 ──${NC}"
KEY_FOUND=false
for var in ZAI_API_KEY DEEPSEEK_API_KEY OPENAI_API_KEY XAI_API_KEY DASHSCOPE_API_KEY; do
    if [ -n "${!var:-}" ]; then
        ok "${var}=***${!var: -4}"
        KEY_FOUND=true
    fi
done
if [ "$KEY_FOUND" = false ]; then
    warn "未检测到任何 API Key！AgentFlow 将启动但无法执行工作流。"
    warn "请在 .env 文件中设置至少一个 API Key"
fi

# ── 4. 启动后端 ──
echo ""
echo -e "${CYAN}── ④ 启动后端 ──${NC}"

# 确保数据目录存在
mkdir -p "${SCRIPT_DIR}/.agentflow"

# 设置 CC 引擎环境变量（供 claude_code_adapter.py 读取）
export AGENTFLOW_CC_ENGINE_DIR="${CC_ENGINE_DIR}"
export BUN_PATH="${BUN}"

info "监听: http://${HOST}:${PORT}"
info "健康检查: http://${HOST}:${PORT}/health"
echo ""

# 启动 Python 后端
exec python3 "${SCRIPT_DIR}/agentflow-backend.py" "${PORT}"
