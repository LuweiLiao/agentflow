# AgentFlow + Claude Code — 多阶段 Docker 构建
# 
# Stage 1: 前端构建 (Node.js)
# Stage 2: CC 引擎准备 (Bun)
# Stage 3: Python 运行时聚合
#
# 构建: docker compose build
# 运行: docker compose up -d
# 访问: http://localhost:9600

# ═══════════════════════════════════════════════════════════
# Stage 1 — 前端构建
# ═══════════════════════════════════════════════════════════
FROM node:22-slim AS frontend-builder

WORKDIR /build

# 1) 复制依赖清单并安装（利用 Docker 缓存层）
COPY package.json package-lock.json ./
COPY frontend/ frontend/
RUN npm ci

# 2) 构建生产包
RUN npm run build

# ═══════════════════════════════════════════════════════════
# Stage 2 — CC 引擎准备
# ═══════════════════════════════════════════════════════════
FROM oven/bun:1.3 AS cc-engine-builder

WORKDIR /engine

# 1) 复制 CC 引擎源码（含 bun.lock 锁文件，确保可复现安装）
COPY claude-code-engine/package.json claude-code-engine/bun.lock claude-code-engine/bunfig.toml ./

# 2) 安装生产依赖（利用 bun 的快）
RUN bun install --production --frozen-lockfile

# 3) 复制源码 + dist（按引擎实际结构）
COPY claude-code-engine/src/ src/
COPY claude-code-engine/dist/ dist/
COPY claude-code-engine/tsconfig.json ./
COPY claude-code-engine/vite.config.ts ./

# ═══════════════════════════════════════════════════════════
# Stage 3 — 最终运行时
# ═══════════════════════════════════════════════════════════
FROM python:3.12-slim

LABEL org.opencontainers.image.title="AgentFlow"
LABEL org.opencontainers.image.description="AI-powered multi-agent workflow orchestration with Claude Code engine"
LABEL org.opencontainers.image.version="5.0"

WORKDIR /app

# ── 安装系统依赖 ──
# Bun 运行时需要 glibc 2.28+，slim 镜像已包含
# Node 运行时仅用于 CC 引擎的 cli-wrapper（可选降级方案）
RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

# ── 从 Stage 1 复制前端 ──
COPY --from=frontend-builder /build/frontend/dist/ /app/frontend/dist/

# ── 从 Stage 2 复制 CC 引擎 ──
COPY --from=cc-engine-builder /engine/ /opt/claude-code-engine/
# 复制 bun 二进制
COPY --from=oven/bun:1.3 /usr/local/bin/bun /usr/local/bin/bun

# ── 复制 Python 后端 ──
COPY agentflow-backend.py agent_runner.py agentflow_schema.py ./
COPY claude_code_adapter.py cc_agent_runner.py ./
COPY prompt_compiler.py artifact_store.py artifact_broker.py ./
COPY run_store.py run_event_bus.py ./
COPY provider_adapter.py output_validator.py ./
COPY evolution_engine.py evolution_ledger.py eval_harness.py ./
COPY quality_gate.py supervisor.py ./
COPY templates/ templates/
COPY start-agentflow.sh .
COPY .env.example .

# ── 设置权限 ──
RUN chmod +x start-agentflow.sh

# ── 环境变量（默认值，可在 docker-compose.yml/.env 中覆盖） ──
ENV AGENTFLOW_HOST=0.0.0.0
ENV AGENTFLOW_PORT=9600
ENV AGENT_MODEL=deepseek-v4-flash
# CC 引擎路径（指向 Stage 2 复制的位置）
ENV AGENTFLOW_CC_ENGINE_DIR=/opt/claude-code-engine
ENV BUN_PATH=/usr/local/bin/bun

# ── 健康检查 ──
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:9600/health')" || exit 1

EXPOSE 9600

CMD ["./start-agentflow.sh"]
