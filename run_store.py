#!/usr/bin/env python3
"""RunStore — SQLite 持久化层，替代 ArtifactStore 文件存储。"""
import os
import sqlite3
import time

RUNS_DIR = os.environ.get(
    "AGENTFLOW_RUNS_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), ".agentflow")
)
DB_PATH = os.path.join(RUNS_DIR, "runs.db")


def _init():
    """初始化数据库（建表）。幂等，多次调用安全。"""
    os.makedirs(RUNS_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")  # 读写不互斥
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS runs (
            run_id      TEXT PRIMARY KEY,
            requirement TEXT NOT NULL DEFAULT '',
            status      TEXT NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending','running','completed','failed')),
            total_cost  REAL NOT NULL DEFAULT 0.0,
            total_dur   REAL NOT NULL DEFAULT 0.0,
            created_at  REAL NOT NULL,
            updated_at  REAL NOT NULL,
            error       TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS nodes (
            run_id      TEXT NOT NULL,
            node_id     TEXT NOT NULL,
            label       TEXT DEFAULT '',
            icon        TEXT DEFAULT '',
            description TEXT DEFAULT '',
            color       TEXT DEFAULT '',
            profile     TEXT NOT NULL DEFAULT 'dev',
            status      TEXT NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending','running','completed','failed','skipped')),
            result      TEXT DEFAULT '',
            output      TEXT DEFAULT '',
            cost        REAL NOT NULL DEFAULT 0.0,
            duration_ms REAL NOT NULL DEFAULT 0,
            turns       INTEGER NOT NULL DEFAULT 0,
            model       TEXT DEFAULT '',
            provider    TEXT DEFAULT '',
            depends_on  TEXT DEFAULT '',   -- 逗号分隔的上游节点 ID
            error       TEXT DEFAULT '',
            PRIMARY KEY (run_id, node_id),
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );

        CREATE INDEX IF NOT EXISTS idx_nodes_run ON nodes(run_id);
    """)
    conn.commit()
    return conn


class RunStore:
    """单个 run 的增删查改操作。"""

    def __init__(self):
        self._conn = _init()

    # ── Run 层面 ────────────────────────────────────

    def create_run(self, requirement: str, nodes: list) -> str:
        """创建新 run，返回 run_id。"""
        run_id = f"run_{os.urandom(6).hex()}"
        now = time.time()
        self._conn.execute(
            ("INSERT INTO runs (run_id, requirement, status, created_at, updated_at)"
             " VALUES (?,?,?,?,?)"),
            (run_id, requirement[:500], "pending", now, now),
        )
        for n in nodes:
            raw_deps = n.get("depends_on", [])
            deps = ",".join(raw_deps) if isinstance(raw_deps, list) else ""
            self._conn.execute(
                """INSERT INTO nodes
                   (run_id, node_id, label, icon, description, color, profile, depends_on)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (run_id, n["id"], n.get("label", ""), n.get("icon", ""),
                 n.get("desc", ""), n.get("color", ""), n.get("profile", "dev"), deps),
            )
        self._conn.commit()
        return run_id

    def get_run(self, run_id: str) -> dict | None:
        row = self._conn.execute(
            "SELECT * FROM runs WHERE run_id=?", (run_id,)
        ).fetchone()
        if not row:
            return None
        run = dict(row)
        run["nodes"] = [dict(r) for r in self._conn.execute(
            "SELECT * FROM nodes WHERE run_id=? ORDER BY rowid", (run_id,)
        ).fetchall()]
        return run

    def list_runs(self, limit: int = 50) -> list:
        rows = self._conn.execute(
            "SELECT run_id, requirement, status, total_cost, total_dur, created_at, updated_at "
            "FROM runs ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]

    def update_run_status(self, run_id: str, status: str, error: str = ""):
        self._conn.execute(
            "UPDATE runs SET status=?, updated_at=?, error=? WHERE run_id=?",
            (status, time.time(), error, run_id),
        )
        self._conn.commit()

    def update_run_totals(self, run_id: str, total_cost: float, total_dur: float):
        self._conn.execute(
            "UPDATE runs SET total_cost=?, total_dur=?, updated_at=? WHERE run_id=?",
            (total_cost, total_dur, time.time(), run_id),
        )
        self._conn.commit()

    # ── Node 层面 ───────────────────────────────────

    def update_node(self, run_id: str, node_id: str, **kwargs):
        """更新节点字段。kwargs 为 {字段名: 值}。"""
        fields = {k: v for k, v in kwargs.items() if v is not None}
        if not fields:
            return
        sets = ", ".join(f"{k}=?" for k in fields)
        vals = list(fields.values())
        vals.extend([run_id, node_id])
        self._conn.execute(
            f"UPDATE nodes SET {sets} WHERE run_id=? AND node_id=?", vals
        )
        self._conn.commit()

    def get_pending_nodes(self, run_id: str) -> list:
        """获取所有依赖已就绪的 pending 节点。"""
        all_nodes = self._conn.execute(
            "SELECT * FROM nodes WHERE run_id=? AND status='pending'", (run_id,)
        ).fetchall()
        ready = []
        for n in all_nodes:
            deps = [d.strip() for d in (n["depends_on"] or "").split(",") if d.strip()]
            if not deps:
                ready.append(dict(n))
                continue
            # 检查所有上游是否 completed
            placeholders = ",".join("?" for _ in deps)
            dep_rows = self._conn.execute(
                f"SELECT status FROM nodes WHERE run_id=? AND node_id IN ({placeholders})",
                [run_id] + deps,
            ).fetchall()
            if all(r["status"] == "completed" for r in dep_rows):
                ready.append(dict(n))
        return ready

    def all_nodes_done(self, run_id: str) -> bool:
        """检查是否所有节点都已结束。"""
        pending = self._conn.execute(
            "SELECT COUNT(*) FROM nodes WHERE run_id=?"
            " AND status NOT IN ('completed','failed','skipped')",
            (run_id,),
        ).fetchone()[0]
        return pending == 0

    def get_dependents(self, run_id: str, node_id: str) -> list:
        """获取依赖指定节点的所有下游节点。"""
        rows = self._conn.execute(
            "SELECT node_id FROM nodes WHERE run_id=? AND depends_on LIKE ?",
            (run_id, f"%{node_id}%"),
        ).fetchall()
        return [r["node_id"] for r in rows]

    def count_status(self, run_id: str) -> dict:
        rows = self._conn.execute(
            "SELECT status, COUNT(*) as cnt FROM nodes WHERE run_id=? GROUP BY status",
            (run_id,),
        ).fetchall()
        return {r["status"]: r["cnt"] for r in rows}

    def close(self):
        self._conn.close()

    # ── 兼容旧 artfact_store 的 helper ─────────────

    def envelopes_dir(self, run_id: str) -> str:
        return os.path.join(RUNS_DIR, run_id, "envelopes")


# 全局单例（模块级，进程内共享）
_db: RunStore | None = None


def get_store() -> RunStore:
    global _db
    if _db is None:
        _db = RunStore()
    return _db


# 工具: 括号配平 JSON 提取
def extract_json(text: str) -> str:
    """从文本中提取第一个平衡的 JSON 数组或对象。
    处理嵌套括号，替代非贪婪正则。"""
    # 找第一个 [ 或 {
    start_idx = -1
    for ch in ("[", "{"):
        idx = text.find(ch)
        if idx >= 0 and (start_idx < 0 or idx < start_idx):
            start_idx = idx
            bracket = ch
    if start_idx < 0:
        return text
    close = "]" if bracket == "[" else "}"
    depth = 0
    for i in range(start_idx, len(text)):
        c = text[i]
        if c == bracket:
            depth += 1
        elif c == close:
            depth -= 1
            if depth == 0:
                return text[start_idx:i + 1]
    return text[start_idx:]  # 未闭合，返回尽可能多


if __name__ == "__main__":
    # 快速测试
    s = get_store()
    rid = s.create_run("test", [{"id": "n1", "profile": "dev"}])
    print(f"Created: {rid}")
    r = s.get_run(rid)
    print(f"Run: {r['status']}, nodes: {len(r['nodes'])}")
    s.update_node(rid, "n1", status="completed", result="ok", cost=0.001)
    s.update_run_status(rid, "completed")
    r2 = s.get_run(rid)
    print(f"After update: {r2['status']}, node: {r2['nodes'][0]['status']}")
    print(f"List runs: {len(s.list_runs())}")
    print(f"extract_json test: {extract_json('some text [a, [b, c], d] more')}")
    print(f"extract_json nested: {extract_json('text {a: {b: 1}} end')}")
