"""ArtifactStore — AgentFlow 节点输出状态存储

职责:
  1. 持久化每个节点的执行结果 (EnvelopeJSON)
  2. 下游节点可按 node_id 查询真实上游输出
  3. 支持 run_id 隔离，保留执行历史
"""

import json
import os
import shutil
import time
from dataclasses import asdict
from typing import Optional

from agentflow_schema import EnvelopeJSON, ResultMetrics

# 默认存储根目录
DEFAULT_STORE_ROOT = os.path.join(
    os.path.dirname(__file__), ".agentflow", "runs"
)


class ArtifactStore:
    """文件型 Artifact Store，每个 run 一个目录。"""

    def __init__(self, run_id: str, store_root: str = DEFAULT_STORE_ROOT):
        self.run_id = run_id
        self.store_root = store_root
        self.run_dir = os.path.join(store_root, run_id)
        self.envelopes_dir = os.path.join(self.run_dir, "envelopes")
        os.makedirs(self.envelopes_dir, exist_ok=True)

    # ── 写入 ────────────────────────────────────────────

    def save(self, node_id: str, envelope: EnvelopeJSON):
        """保存节点执行结果。"""
        path = os.path.join(self.envelopes_dir, f"{node_id}.json")
        with open(path, "w") as f:
            json.dump(asdict(envelope), f, ensure_ascii=False, indent=2)

    def save_raw(self, node_id: str, result: dict):
        """从 raw result dict 构造 EnvelopeJSON 并保存。"""
        envelope = EnvelopeJSON(
            task_id=f"task_{node_id}",
            node_id=node_id,
            status=result.get("status", "error"),
            summary=result.get("result", ""),
            payload={"output": result.get("output", "")},
            metrics=ResultMetrics(
                cost=result.get("cost", 0),
                duration_ms=result.get("duration", 0),
                turns=result.get("turns", 0),
                model=result.get("model", ""),
                provider=result.get("provider", ""),
            ),
            errors=[] if result.get("status") in ("ok",) else [result.get("result", "")],
            timestamp=time.time(),
        )
        self.save(node_id, envelope)
        return envelope

    # ── 读取 ────────────────────────────────────────────

    def load(self, node_id: str) -> Optional[EnvelopeJSON]:
        """读取节点执行结果。"""
        path = os.path.join(self.envelopes_dir, f"{node_id}.json")
        if not os.path.isfile(path):
            return None
        with open(path) as f:
            data = json.load(f)
        return EnvelopeJSON(
            task_id=data.get("task_id", ""),
            node_id=data.get("node_id", node_id),
            status=data.get("status", "pending"),
            summary=data.get("summary", ""),
            payload=data.get("payload", {}),
            metrics=ResultMetrics(**data.get("metrics", {})),
            errors=data.get("errors", []),
            timestamp=data.get("timestamp", 0),
        )

    def upstream_context(self, node_id: str,
                         upstream_ids: list[str],
                         format: str = "summary") -> str:
        """为下游节点构建上游上下文文本。"""
        parts = []
        for uid in upstream_ids:
            env = self.load(uid)
            if env is None:
                parts.append(f"## {uid}\n(等待执行)")
                continue

            if format == "summary":
                parts.append(
                    f"## {uid}\n- 状态: {env.status}\n- 总结: {env.summary or '(空)'}\n- 成本: ${env.metrics.cost:.4f}")
            elif format == "full":
                output = env.payload.get("output", "")[:2000] or "(无输出)"
                parts.append(f"## {uid}\n- 状态: {env.status}\n- 总结: {env.summary or '(空)'}\n- 输出:\n{output}")
            elif format == "minimal":
                text = env.summary or env.payload.get("output", "")[:200] or "(空)"
                parts.append(f"[{uid}] {text[:300]}")
        return "\n\n".join(parts) if parts else "无上游依赖"

    # ── 管理 ────────────────────────────────────────────

    @classmethod
    def list_runs(cls, store_root: str = DEFAULT_STORE_ROOT) -> list[dict]:
        """列出所有 run 历史。"""
        run_dir = os.path.join(store_root)
        if not os.path.isdir(run_dir):
            return []
        runs = []
        for name in sorted(os.listdir(run_dir), reverse=True):
            meta_path = os.path.join(run_dir, name, "meta.json")
            if os.path.isfile(meta_path):
                with open(meta_path) as f:
                    meta = json.load(f)
                runs.append(meta)
            else:
                runs.append({"run_id": name, "created": os.path.getctime(
                    os.path.join(run_dir, name))})
        return runs

    def save_meta(self, meta: dict):
        """保存 run 元数据。"""
        path = os.path.join(self.run_dir, "meta.json")
        meta["run_id"] = self.run_id
        meta["updated"] = time.time()
        with open(path, "w") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

    def cleanup(self):
        """删除此 run 的存储。"""
        if os.path.isdir(self.run_dir):
            shutil.rmtree(self.run_dir, ignore_errors=True)
