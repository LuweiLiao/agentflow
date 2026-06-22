# AgentFlow + AgentFlow-Code Engine — 一体化 Docker 构建
#
# AgentFlow-Code 引擎源码已内置于项目 claude-code-engine/ 目录。
# git clone 后直接 docker compose build 即可，无需外部依赖。
#
# Stage 1: 前端构建 (Node.js 22)
# Stage 2: CC 引擎依赖安装 (Bun)
# Stage 3: Python 运行时聚合

# ═══════════════════════════════════════════════════════════
# Stage 1 — 前端构建
# ═══════════════════════════════════════════════════════════
FROM node:22-slim AS frontend-builder

WORKDIR /build

COPY package.json package-lock.json ./
COPY frontend/ frontend/
RUN npm ci && npm run build

# ═══════════════════════════════════════════════════════════
# Stage 2 — CC 引擎依赖安装
# ═══════════════════════════════════════════════════════════
FROM oven/bun:1.3 AS cc-engine-builder

WORKDIR /engine

# ① 先复制 manifest（最大化 layer 缓存命中率）
COPY claude-code-engine/package.json claude-code-engine/bun.lock claude-code-engine/bunfig.toml ./

# ② 复制 workspace 成员、原生二进制、构建脚本
#    bun install --frozen-lockfile 需要这些就位才能：
#      - 解析 packages/* 中的 workspace:* 依赖（monorepo 链接）
#      - 执行 postinstall 钩子（scripts/run-parallel.mjs → postinstall.cjs / setup-chrome-mcp.mjs）
#      - 让 vendor/*.node（audio-capture 等原生模块）在运行时可用
COPY claude-code-engine/packages/ packages/
COPY claude-code-engine/vendor/   vendor/
COPY claude-code-engine/scripts/  scripts/

# ③ 安装生产依赖
RUN bun install --production --frozen-lockfile

# ④ 安装后再复制源码与构建产物（源码变动不触发重新安装）
COPY claude-code-engine/src/ src/
COPY claude-code-engine/dist/ dist/
COPY claude-code-engine/tsconfig.json claude-code-engine/tsconfig.base.json ./
COPY claude-code-engine/vite.config.ts ./

# ═══════════════════════════════════════════════════════════
# Stage 3 — 最终运行时
# ═══════════════════════════════════════════════════════════
FROM python:3.12-slim

LABEL org.opencontainers.image.title="AgentFlow"
LABEL org.opencontainers.image.description="AgentFlow — multi-agent workflow with built-in AgentFlow-Code executor"
LABEL org.opencontainers.image.version="5.0"

WORKDIR /app

RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

# ── 前端 ──
COPY --from=frontend-builder /build/frontend/dist/ /app/frontend/dist/

# ── CC 引擎（从 Stage 2 复制，含已安装的 node_modules / packages / vendor） ──
COPY --from=cc-engine-builder /engine/ /opt/claude-code-engine/

# ── Bun 二进制 ──
COPY --from=oven/bun:1.3 /usr/local/bin/bun /usr/local/bin/bun

# ── Python 后端 ──
COPY *.py ./
COPY templates/ templates/
COPY start-agentflow.sh ./
COPY .env.example ./

RUN chmod +x start-agentflow.sh

# ── 运行时环境变量 ──
ENV AGENTFLOW_HOST=0.0.0.0
ENV AGENTFLOW_PORT=9600
ENV AGENT_MODEL=deepseek-v4-flash
ENV AGENTFLOW_CC_ENGINE_DIR=/opt/claude-code-engine
ENV BUN_PATH=/usr/local/bin/bun

# ── LLM 配置：OpenAI 兼容模式 ──
# CLAUDE_CODE_USE_OPENAI=1 让 CC 引擎走 OpenAI provider（由 OPENAI_API_KEY/OPENAI_BASE_URL 提供凭证）
ENV CLAUDE_CODE_USE_OPENAI=1
ENV OPENAI_MODEL=gpt-4o

# 健康检查：shell form + 环境变量端口（不再硬编码 9600，随 AGENTFLOW_PORT 自适应）
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD-SHELL "curl -fsS http://localhost:${AGENTFLOW_PORT:-9600}/health || exit 1"

EXPOSE 9600

CMD ["./start-agentflow.sh"]
