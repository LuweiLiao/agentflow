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

# 复制 CC 引擎源码（已在项目目录内）
COPY claude-code-engine/package.json claude-code-engine/bun.lock claude-code-engine/bunfig.toml ./
COPY claude-code-engine/src/ src/
COPY claude-code-engine/dist/ dist/
COPY claude-code-engine/tsconfig.json claude-code-engine/tsconfig.base.json ./
COPY claude-code-engine/vite.config.ts ./

# 安装生产依赖
RUN bun install --production --frozen-lockfile

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

# ── CC 引擎（从 Stage 2 复制，含已安装的 node_modules） ──
COPY --from=cc-engine-builder /engine/ /opt/claude-code-engine/

# ── Bun 二进制 ──
COPY --from=oven/bun:1.3 /usr/local/bin/bun /usr/local/bin/bun

# ── Python 后端 ──
COPY *.py ./
COPY templates/ templates/
COPY start-agentflow.sh .
COPY .env.example .

RUN chmod +x start-agentflow.sh

ENV AGENTFLOW_HOST=0.0.0.0
ENV AGENTFLOW_PORT=9600
ENV AGENT_MODEL=deepseek-v4-flash
ENV AGENTFLOW_CC_ENGINE_DIR=/opt/claude-code-engine
ENV BUN_PATH=/usr/local/bin/bun

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:9600/health')" || exit 1

EXPOSE 9600

CMD ["./start-agentflow.sh"]
