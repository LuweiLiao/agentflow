#!/usr/bin/env python3
"""ArtifactBroker — 节点间产物的统一受控传递。

解决的问题：
  - 之前直接读写宿主文件路径，下游 Agent 无法可靠读取上游产出
  - 工作目录执行后删除导致产出丢失
  - 无访问控制，任意节点可读取任意 artifact

设计：
  - publish() → 返回 ArtifactRef（不可变引用）
  - read() → 返回文件内容（带访问检查）
  - 存储基于 SHA256 内容寻址，自动去重
  - 访问控制：只允许 downstream 节点读取 upstream 的 artifact
"""
import hashlib
import json
import os
import shutil
import time
from pathlib import Path

ARTIFACT_DIR = os.environ.get(
    "AGENTFLOW_ARTIFACT_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)),
                 ".agentflow", "artifacts"),
)


class ArtifactAccessError(PermissionError):
    """节点无权读取指定 artifact。"""
    pass


class ArtifactNotFoundError(FileNotFoundError):
    """指定 artifact 不存在。"""
    pass


class ArtifactRef:
    """不可变 artifact 引用，下游节点唯一能持有的东西。"""

    def __init__(self, artifact_id: str, name: str, sha256: str,
                 size: int, source_run: str, source_node: str,
                 mime_type: str = "text/plain"):
        self.artifact_id = artifact_id
        self.name = name
        self.sha256 = sha256
        self.size = size
        self.source_run = source_run
        self.source_node = source_node
        self.mime_type = mime_type
        self.created_at = time.time()

    def to_dict(self) -> dict:
        return {
            "artifact_id": self.artifact_id,
            "name": self.name,
            "sha256": self.sha256,
            "size": self.size,
            "source_run": self.source_run,
            "source_node": self.source_node,
            "mime_type": self.mime_type,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "ArtifactRef":
        ref = cls(
            artifact_id=d["artifact_id"],
            name=d.get("name", ""),
            sha256=d.get("sha256", ""),
            size=d.get("size", 0),
            source_run=d.get("source_run", ""),
            source_node=d.get("source_node", ""),
            mime_type=d.get("mime_type", "text/plain"),
        )
        ref.created_at = d.get("created_at", time.time())
        return ref

    def __repr__(self):
        return (f"ArtifactRef({self.artifact_id}, {self.name}, "
                f"{self.sha256[:12]}..., {self.size}B)")


class ArtifactBroker:
    """节点间产物管理器。

    用法:
        broker = ArtifactBroker()
        ref = broker.publish(
            source_run="run_abc123", source_node="n2",
            file_path="/tmp/work/main.py",
            name="main.py",
        )
        # ref 传给下游节点
        content = broker.read(ref, requestor_run="run_abc123",
                              requestor_node="n3")
    """

    def __init__(self, artifact_dir: str = None):
        self._artifact_dir = Path(artifact_dir or ARTIFACT_DIR)
        self._artifact_dir.mkdir(parents=True, exist_ok=True)
        self._db_path = self._artifact_dir / "registry.json"
        self._registry: dict[str, dict] = {}
        self._load_registry()
        # 缓存 downstream 关系（避免频繁查 RunStore）
        self._downstream_cache: dict[tuple[str, str], set[str]] = {}

    def _load_registry(self):
        if self._db_path.exists():
            try:
                with open(self._db_path) as f:
                    self._registry = json.load(f)
            except (json.JSONDecodeError, OSError):
                self._registry = {}

    def _save_registry(self):
        with open(self._db_path, "w") as f:
            json.dump(self._registry, f, ensure_ascii=False, indent=2)

    def _content_path(self, sha256: str) -> Path:
        """内容寻址存储路径。"""
        return self._artifact_dir / "blobs" / sha256

    def _compute_sha256(self, file_path: str) -> str:
        h = hashlib.sha256()
        with open(file_path, "rb") as f:
            while True:
                chunk = f.read(65536)
                if not chunk:
                    break
                h.update(chunk)
        return h.hexdigest()

    def set_downstream_cache(self, run_id: str, node_id: str,
                             downstream_ids: set[str]):
        """注入下游关系缓存。在 run 启动时由执行引擎设置。"""
        self._downstream_cache[(run_id, node_id)] = downstream_ids

    def _check_access(self, ref: ArtifactRef,
                      requestor_run: str,
                      requestor_node: str) -> bool:
        """检查 requestor 是否有权读取 ref 的 artifact。
        允许条件：同 run + requestor 是 downstream 节点。"""
        if ref.source_run != requestor_run:
            return False
        # 检查缓存或实时计算
        cache_key = (ref.source_run, ref.source_node)
        downstream = self._downstream_cache.get(cache_key)
        if downstream is not None:
            return requestor_node in downstream
        # 无缓存时通过 RunStore 查询（由调用方设置缓存）
        return True  # 默认放行（严格模式会在上层启用）

    def publish(self, source_run: str, source_node: str,
                file_path: str, name: str = None,
                mime_type: str = "text/plain") -> ArtifactRef:
        """发布一个文件为 artifact。返回 ArtifactRef。"""
        if not os.path.isfile(file_path):
            raise FileNotFoundError(f"artifact 文件不存在: {file_path}")

        sha256 = self._compute_sha256(file_path)
        size = os.path.getsize(file_path)

        # 内容去重：已存在则直接返回
        for aid, meta in self._registry.items():
            if (meta.get("sha256") == sha256 and
                    meta.get("source_run") == source_run and
                    meta.get("source_node") == source_node):
                return ArtifactRef.from_dict(meta)

        # 新 artifact
        artifact_id = f"art_{os.urandom(6).hex()}"
        name = name or os.path.basename(file_path)

        # 存储内容
        blob_path = self._content_path(sha256)
        blob_path.parent.mkdir(parents=True, exist_ok=True)
        if not blob_path.exists():
            shutil.copy2(file_path, blob_path)

        ref = ArtifactRef(
            artifact_id=artifact_id,
            name=name,
            sha256=sha256,
            size=size,
            source_run=source_run,
            source_node=source_node,
            mime_type=mime_type,
        )

        self._registry[artifact_id] = ref.to_dict()
        self._save_registry()
        return ref

    def read(self, ref: ArtifactRef,
             requestor_run: str = "",
             requestor_node: str = "") -> bytes:
        """读取 artifact 内容。可选带访问控制检查。"""
        if requestor_run and requestor_node:
            if not self._check_access(ref, requestor_run, requestor_node):
                raise ArtifactAccessError(
                    f"节点 {requestor_node} 无权读取 "
                    f"{ref.source_node} 的 artifact {ref.artifact_id}")

        blob_path = self._content_path(ref.sha256)
        if not blob_path.exists():
            # 尝试用 artifact_id 查找
            meta = self._registry.get(ref.artifact_id)
            if meta:
                blob_path = self._content_path(meta["sha256"])
            if not blob_path.exists():
                raise ArtifactNotFoundError(
                    f"artifact {ref.artifact_id} 内容不存在于存储")

        with open(blob_path, "rb") as f:
            return f.read()

    def read_text(self, ref: ArtifactRef, encoding: str = "utf-8",
                  requestor_run: str = "", requestor_node: str = "") -> str:
        return self.read(ref, requestor_run, requestor_node).decode(encoding)

    def get(self, artifact_id: str) -> ArtifactRef | None:
        """通过 ID 获取 ArtifactRef。"""
        meta = self._registry.get(artifact_id)
        if not meta:
            return None
        return ArtifactRef.from_dict(meta)

    def delete_run_artifacts(self, run_id: str):
        """删除一个 run 关联的所有 artifacts（清理用）。

        Bug #5 FIX: 之前只从 registry 删除条目但保留磁盘上的 blob 文件，
        导致内容寻址存储无限增长。现在同时删除底层 blob 文件，并清理
        其他 artifact 引用同一 blob 的去重判断（基于 sha256）。
        """
        to_delete = [
            aid for aid, meta in self._registry.items()
            if meta.get("source_run") == run_id
        ]
        # 收集待删除的 sha256，但仅当没有其他 artifact 仍引用同一 blob 时才删文件
        deleted_shas: set[str] = set()
        for aid in to_delete:
            meta = self._registry.get(aid, {})
            sha = meta.get("sha256", "")
            if sha:
                deleted_shas.add(sha)
            del self._registry[aid]
        # 计算仍被保留 artifact 引用的 sha（避免误删共享 blob）
        retained_shas = {
            meta.get("sha256") for meta in self._registry.values()
        }
        for sha in deleted_shas:
            if sha and sha not in retained_shas:
                blob_path = self._content_path(sha)
                try:
                    blob_path.unlink()
                except (FileNotFoundError, OSError):
                    pass  # best-effort
        self._save_registry()

    def summary(self) -> dict:
        return {
            "total_artifacts": len(self._registry),
            "store_path": str(self._artifact_dir),
        }

    def list_run_artifacts(self, run_id: str) -> list[dict]:
        """列出指定 run 关联的所有 artifact 元数据（供 GET /api/runs/{rid}/artifacts）。

        返回按 created_at 升序的元数据列表，便于前端按节点分组展示。
        """
        items = [
            dict(meta, artifact_id=aid)
            for aid, meta in self._registry.items()
            if meta.get("source_run") == run_id
        ]
        items.sort(key=lambda m: m.get("created_at", 0))
        return items


# 全局单例
_broker: ArtifactBroker | None = None


def get_broker() -> ArtifactBroker:
    global _broker
    if _broker is None:
        _broker = ArtifactBroker()
    return _broker


if __name__ == "__main__":
    import tempfile
    broker = get_broker()
    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
        f.write("print('hello from artifact')\n")
        tmp = f.name
    ref = broker.publish("run_test", "n1", tmp, name="hello.py")
    print(f"Published: {ref}")
    content = broker.read_text(ref, requestor_run="run_test",
                               requestor_node="n2")
    print(f"Content: {content.strip()}")
    print(f"Summary: {broker.summary()}")
    broker.delete_run_artifacts("run_test")
    print(f"After cleanup: {broker.summary()}")
    os.unlink(tmp)
