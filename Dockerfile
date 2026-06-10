# === Stage 1: Builder ===
FROM python:3.12-slim AS builder

RUN pip install --no-cache-dir pyyaml

WORKDIR /app

COPY pyproject.toml ./
COPY agentflow-backend.py agent_runner.py agentflow_schema.py prompt_compiler.py artifact_store.py ./
COPY templates/ templates/
COPY *.html ./
COPY *.png ./
COPY .env.example ./
COPY start-agentflow.sh ./

RUN chmod +x start-agentflow.sh

# === Stage 2: Runtime ===
FROM python:3.12-slim AS runtime

RUN pip install --no-cache-dir pyyaml

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 9600

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:9600/')"

CMD ["./start-agentflow.sh"]
