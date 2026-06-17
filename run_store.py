#!/usr/bin/env python3
"""RunStore — SQLite 持久化层 v2：规范化 edges + 快照 + 线程安全 + Heartbeat。

v2 核心改进：
  - 规范化 workflow_edges 表（替代逗号分隔的 depends_on）
  - workflow_snapshots 表（完整不可变工作流快照）
  - workflows 表（可复用工作流定义 + webhook token）
  - 每次操作独立连接 + threading.Lock（替代单例长连接 check_same_thread=False）
  - 节点级别 lease/heartbeat/attempt 字段
  - startup_scan() 重启恢复
  - get_dependents() 改用 edges 表查询（修复 LIKE 模糊匹配 bug）
"""
import json
import os
import sqlite3
import threading
import time

RUNS_DIR = os.environ.get(
    "AGENTFLOW_RUNS_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), ".agentflow")
)
DB_PATH = os.path.join(RUNS_DIR, "runs.db")
_HEARTBEAT_TTL = int(os.environ.get("AGENTFLOW_HEARTBEAT_TTL", "300"))  # 5 min stale
_COMPILER_VERSION = "2.0.0"

# ── 锁 —— 所有写操作受此保护 ──────────────────────────
_write_lock = threading.Lock()


def _get_conn() -> sqlite3.Connection:
    """每次调用创建独立连接。读操作无需锁，写操作在调用方加 _write_lock。"""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def _init():
    """初始化数据库（建表）。幂等。"""
    os.makedirs(RUNS_DIR, exist_ok=True)
    conn = _get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS runs (
            run_id      TEXT PRIMARY KEY,
            requirement TEXT NOT NULL DEFAULT '',
            status      TEXT NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending','running','completed','failed','cancelled')),
            total_cost  REAL NOT NULL DEFAULT 0.0,
            total_dur   REAL NOT NULL DEFAULT 0.0,
            created_at  REAL NOT NULL,
            updated_at  REAL NOT NULL,
            error       TEXT DEFAULT '',
            workspace_path TEXT DEFAULT ''
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
                        CHECK(status IN ('pending','running','completed','failed',
                                         'skipped','timed_out','cancelled')),
            result      TEXT DEFAULT '',
            output      TEXT DEFAULT '',
            cost        REAL NOT NULL DEFAULT 0.0,
            duration_ms REAL NOT NULL DEFAULT 0,
            turns       INTEGER NOT NULL DEFAULT 0,
            model       TEXT DEFAULT '',
            provider    TEXT DEFAULT '',
            error       TEXT DEFAULT '',
            depends_on  TEXT DEFAULT '',   -- 兼容旧字段（边信息以 workflow_edges 为准）
            -- v2 新增
            attempt     INTEGER NOT NULL DEFAULT 0,
            heartbeat_at REAL,
            lease_owner  TEXT DEFAULT '',
            lease_expires_at REAL,
            params_json TEXT DEFAULT '{}',
            PRIMARY KEY (run_id, node_id),
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );

        -- 规范化边表（替代 comma-separated depends_on）
        CREATE TABLE IF NOT EXISTS workflow_edges (
            run_id          TEXT NOT NULL,
            source_node_id  TEXT NOT NULL,
            target_node_id  TEXT NOT NULL,
            PRIMARY KEY (run_id, source_node_id, target_node_id),
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );

        -- 工作流快照（完整不可变副本）
        CREATE TABLE IF NOT EXISTS workflow_snapshots (
            run_id           TEXT PRIMARY KEY,
            workflow_json    TEXT NOT NULL,
            compiler_version TEXT,
            created_at       REAL NOT NULL,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );

        -- 索引
        CREATE INDEX IF NOT EXISTS idx_nodes_run ON nodes(run_id);
        CREATE INDEX IF NOT EXISTS idx_edges_run ON workflow_edges(run_id);

        CREATE TABLE IF NOT EXISTS workflows (
            workflow_id   TEXT PRIMARY KEY,
            name          TEXT NOT NULL DEFAULT '',
            requirement   TEXT NOT NULL DEFAULT '',
            nodes_json    TEXT NOT NULL DEFAULT '[]',
            edges_json    TEXT NOT NULL DEFAULT '[]',
            webhook_token TEXT UNIQUE NOT NULL,
            created_at    REAL NOT NULL,
            updated_at    REAL NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_workflows_updated ON workflows(updated_at DESC);

        -- 运行时事件表（P1: agent-loop runtime events）
        CREATE TABLE IF NOT EXISTS run_events (
            run_id      TEXT NOT NULL,
            sequence    INTEGER NOT NULL,
            type        TEXT NOT NULL,
            node_id     TEXT,
            tool_call_id TEXT,
            ts_ms       INTEGER NOT NULL,
            payload_json TEXT NOT NULL DEFAULT '{}',
            PRIMARY KEY (run_id, sequence)
        );

        CREATE INDEX IF NOT EXISTS idx_run_events_run ON run_events(run_id);

        -- 进化报告表（Phase 2A: self-evolution persistence）
        CREATE TABLE IF NOT EXISTS evolution_reports (
            run_id      TEXT NOT NULL,
            version     INTEGER NOT NULL,
            report_json TEXT NOT NULL DEFAULT '{}',
            created_at  REAL NOT NULL,
            PRIMARY KEY (run_id, version),
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        );

        CREATE INDEX IF NOT EXISTS idx_evolution_run ON evolution_reports(run_id);
    """)
    # 迁移：runs 表增加 workflow_id / workspace_path / node params
    try:
        conn.execute("ALTER TABLE runs ADD COLUMN workflow_id TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute("ALTER TABLE runs ADD COLUMN workspace_path TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute("ALTER TABLE nodes ADD COLUMN params_json TEXT DEFAULT '{}'")
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute("ALTER TABLE runs ADD COLUMN dag_version INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()


class RunStore:
    """SQLite 持久化操作，每次写操作新建连接 + _write_lock 保护。"""

    def __init__(self, db_path: str | None = None):
        self.db_path = db_path or DB_PATH
        self.runs_dir = os.path.dirname(self.db_path)
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        os.makedirs(self.runs_dir, exist_ok=True)
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def _init_db(self):
        # Preserve legacy global initialization for production DB, but allow
        # tests to use isolated temp DBs without mutating module globals.
        if self.db_path == DB_PATH:
            _init()
            return
        old_db_path = globals()["DB_PATH"]
        old_runs_dir = globals()["RUNS_DIR"]
        try:
            globals()["DB_PATH"] = self.db_path
            globals()["RUNS_DIR"] = self.runs_dir
            _init()
        finally:
            globals()["DB_PATH"] = old_db_path
            globals()["RUNS_DIR"] = old_runs_dir

    # ── 连接管理 ────────────────────────────────────

    def _read(self, sql: str, params: list = None) -> list[sqlite3.Row]:
        """只读查询，无锁。"""
        conn = self._get_conn()
        try:
            cur = conn.execute(sql, params or [])
            return cur.fetchall()
        finally:
            conn.close()

    def _write(self, sql: str, params: list = None) -> sqlite3.Cursor:
        """写操作，加锁 + 自动 commit。"""
        with _write_lock:
            conn = self._get_conn()
            try:
                cur = conn.execute(sql, params or [])
                conn.commit()
                return cur
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()

    def _executemany(self, sql: str, params_list: list[list]):
        """批量写入，加锁 + 自动 commit。"""
        with _write_lock:
            conn = self._get_conn()
            try:
                cur = conn.executemany(sql, params_list)
                conn.commit()
                return cur
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()

    def _execute_script(self, script: str):
        """执行多语句脚本。"""
        with _write_lock:
            conn = self._get_conn()
            try:
                conn.executescript(script)
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()

    # ── Run 层面 ────────────────────────────────────

    def create_run(self, requirement: str, nodes: list,
                   edges: list | None = None, workflow_id: str = "") -> str:
        """创建新 run，返回 run_id。同时存储边信息和快照。"""
        run_id = f"run_{os.urandom(6).hex()}"
        now = time.time()
        with _write_lock:
            conn = self._get_conn()
            try:
                conn.execute(
                    ("INSERT INTO runs (run_id, requirement, status, created_at, updated_at, workflow_id)"
                     " VALUES (?,?,?,?,?,?)"),
                    (run_id, requirement[:500], "pending", now, now, workflow_id or ""),
                )
                # 写入节点
                for n in nodes:
                    deps_raw = n.get("depends_on", [])
                    deps_str = ",".join(deps_raw) if isinstance(deps_raw, list) else ""
                    conn.execute(
                        """INSERT INTO nodes
                           (run_id, node_id, label, icon, description, color, profile, depends_on, params_json)
                           VALUES (?,?,?,?,?,?,?,?,?)""",
                        (run_id, n["id"], n.get("label", ""), n.get("icon", ""),
                         n.get("desc", ""), n.get("color", ""),
                         n.get("profile", "dev"), deps_str,
                         json.dumps(n.get("params", {}), ensure_ascii=False)),
                    )
                # 写入边表
                if edges:
                    edge_rows = [
                        (run_id, e["source"], e["target"])
                        for e in edges
                        if e.get("source") and e.get("target")
                    ]
                    if edge_rows:
                        conn.executemany(
                            "INSERT INTO workflow_edges (run_id, source_node_id, target_node_id)"
                            " VALUES (?,?,?)",
                            edge_rows,
                        )
                # 写入快照
                snapshot = {
                    "run_id": run_id,
                    "version": "2.0.0",
                    "requirement": requirement[:500],
                    "nodes": [
                        {
                            "id": n["id"],
                            "icon": n.get("icon", ""),
                            "label": n.get("label", ""),
                            "desc": n.get("desc", ""),
                            "color": n.get("color", ""),
                            "profile": n.get("profile", "dev"),
                            "params": n.get("params", {}),
                        }
                        for n in nodes
                    ],
                    "edges": edges or [],
                    "compiler_version": _COMPILER_VERSION,
                    "created_at": now,
                }
                conn.execute(
                    "INSERT INTO workflow_snapshots (run_id, workflow_json, compiler_version, created_at)"
                    " VALUES (?,?,?,?)",
                    (run_id, json.dumps(snapshot, ensure_ascii=False),
                     _COMPILER_VERSION, now),
                )
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()
        return run_id

    def get_run(self, run_id: str) -> dict | None:
        rows = self._read("SELECT * FROM runs WHERE run_id=?", [run_id])
        if not rows:
            return None
        run = dict(rows[0])
        node_rows = self._read(
            "SELECT * FROM nodes WHERE run_id=? ORDER BY rowid", [run_id]
        )
        nodes = []
        for r in node_rows:
            d = dict(r)
            try:
                d["params"] = json.loads(d.get("params_json") or "{}")
            except (json.JSONDecodeError, TypeError):
                d["params"] = {}
            nodes.append(d)
        run["nodes"] = nodes
        return run

    def get_run_edges(self, run_id: str) -> list:
        """从 workflow_edges 表获取边。"""
        rows = self._read(
            "SELECT source_node_id, target_node_id FROM workflow_edges"
            " WHERE run_id=? ORDER BY rowid",
            [run_id],
        )
        return [{"source": r["source_node_id"], "target": r["target_node_id"]}
                for r in rows]

    def get_workflow_snapshot(self, run_id: str) -> dict | None:
        """获取工作流快照。"""
        rows = self._read(
            "SELECT * FROM workflow_snapshots WHERE run_id=?", [run_id]
        )
        if not rows:
            return None
        snap = dict(rows[0])
        try:
            snap["workflow"] = json.loads(snap["workflow_json"])
        except (json.JSONDecodeError, TypeError):
            snap["workflow"] = None
        return snap

    def list_runs(self, limit: int = 50) -> list:
        rows = self._read(
            "SELECT run_id, requirement, status, total_cost, total_dur,"
            " created_at, updated_at"
            " FROM runs ORDER BY created_at DESC LIMIT ?",
            [limit],
        )
        return [dict(r) for r in rows]

    def list_pending_runs(self) -> list:
        """获取所有 pending 状态的 run。"""
        rows = self._read(
            "SELECT run_id FROM runs WHERE status='pending' ORDER BY created_at"
        )
        return [r["run_id"] for r in rows]

    def list_stale_runs(self, timeout: int = None) -> list:
        """获取无 heartbeat 超时的 running run。"""
        ttl = timeout or _HEARTBEAT_TTL
        cutoff = time.time() - ttl
        rows = self._read(
            "SELECT r.run_id FROM runs r"
            " WHERE r.status='running'"
            " AND (SELECT MAX(n.heartbeat_at) FROM nodes n"
            "      WHERE n.run_id=r.run_id) IS NULL"
            " OR (SELECT MAX(n.heartbeat_at) FROM nodes n"
            "      WHERE n.run_id=r.run_id) < ?",
            [cutoff],
        )
        return [r["run_id"] for r in rows]

    def update_run_status(self, run_id: str, status: str, error: str = ""):
        self._write(
            "UPDATE runs SET status=?, updated_at=?, error=? WHERE run_id=?",
            [status, time.time(), error, run_id],
        )

    def update_run_totals(self, run_id: str, total_cost: float, total_dur: float):
        self._write(
            "UPDATE runs SET total_cost=?, total_dur=?, updated_at=? WHERE run_id=?",
            [total_cost, total_dur, time.time(), run_id],
        )

    def set_run_workspace(self, run_id: str, workspace_path: str):
        self._write(
            "UPDATE runs SET workspace_path=?, updated_at=? WHERE run_id=?",
            [workspace_path, time.time(), run_id],
        )

    # ── Node 层面 ───────────────────────────────────

    def update_node(self, run_id: str, node_id: str, **kwargs):
        """更新节点字段。支持 versioned_status 乐观锁。"""
        fields = {k: v for k, v in kwargs.items() if v is not None}
        if not fields:
            return
        sets = ", ".join(f"{k}=?" for k in fields)
        vals = list(fields.values())
        vals.extend([run_id, node_id])
        self._write(
            f"UPDATE nodes SET {sets} WHERE run_id=? AND node_id=?", vals
        )

    def transition_node_status(self, run_id: str, node_id: str,
                               from_status: str, to_status: str) -> bool:
        """乐观锁状态迁移：仅当 current=from_status 时才更新为 to_status。"""
        with _write_lock:
            conn = self._get_conn()
            try:
                cur = conn.execute(
                    "UPDATE nodes SET status=? WHERE run_id=? AND node_id=? AND status=?",
                    [to_status, run_id, node_id, from_status],
                )
                conn.commit()
                return cur.rowcount > 0
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()

    def update_heartbeat(self, run_id: str, node_id: str,
                         lease_owner: str = "", lease_duration: int = 60):
        """更新节点 heartbeat + lease。"""
        now = time.time()
        self._write(
            "UPDATE nodes SET heartbeat_at=?, lease_owner=?, lease_expires_at=?"
            " WHERE run_id=? AND node_id=?",
            [now, lease_owner, now + lease_duration, run_id, node_id],
        )

    def get_pending_nodes(self, run_id: str) -> list:
        """获取所有依赖已就绪的 pending 节点（使用 workflow_edges 表）。"""
        all_nodes = self._read(
            "SELECT * FROM nodes WHERE run_id=? AND status='pending'",
            [run_id],
        )
        ready = []
        for n in all_nodes:
            # 查 workflow_edges 表找本节点的上游
            upstream_rows = self._read(
                "SELECT source_node_id FROM workflow_edges"
                " WHERE run_id=? AND target_node_id=?",
                [run_id, n["node_id"]],
            )
            if not upstream_rows:
                ready.append(dict(n))
                continue
            # 检查所有上游是否 completed
            upstream_ids = [r["source_node_id"] for r in upstream_rows]
            placeholders = ",".join("?" for _ in upstream_ids)
            dep_rows = self._read(
                f"SELECT status FROM nodes WHERE run_id=? AND node_id IN ({placeholders})"
                f" AND status='completed'",
                [run_id] + upstream_ids,
            )
            if len(dep_rows) == len(upstream_ids):
                ready.append(dict(n))
        return ready

    def all_nodes_done(self, run_id: str) -> bool:
        pending = self._read(
            "SELECT COUNT(*) FROM nodes WHERE run_id=?"
            " AND status NOT IN ('completed','failed','skipped','timed_out')",
            [run_id],
        )[0][0]
        return pending == 0

    def get_dependents(self, run_id: str, node_id: str) -> list:
        """获取依赖指定节点的所有下游节点（使用 workflow_edges 表，修复 LIKE 模糊匹配）。"""
        rows = self._read(
            "SELECT target_node_id FROM workflow_edges"
            " WHERE run_id=? AND source_node_id=?",
            [run_id, node_id],
        )
        return [r["target_node_id"] for r in rows]

    def get_upstream(self, run_id: str, node_id: str) -> list[str]:
        """获取指定节点的所有上游节点。"""
        rows = self._read(
            "SELECT source_node_id FROM workflow_edges"
            " WHERE run_id=? AND target_node_id=?",
            [run_id, node_id],
        )
        return [r["source_node_id"] for r in rows]

    def count_status(self, run_id: str) -> dict:
        rows = self._read(
            "SELECT status, COUNT(*) as cnt FROM nodes WHERE run_id=? GROUP BY status",
            [run_id],
        )
        return {r["status"]: r["cnt"] for r in rows}

    # ── DAG 版本号 ─────────────────────────────────
    def get_dag_version(self, run_id: str) -> int:
        rows = self._read(
            "SELECT dag_version FROM runs WHERE run_id=?", [run_id]
        )
        return rows[0]["dag_version"] if rows else 0

    def increment_dag_version(self, run_id: str) -> int:
        """原子递增 DAG 版本号，返回新版本。"""
        with _write_lock:
            conn = self._get_conn()
            try:
                cur = conn.execute(
                    "UPDATE runs SET dag_version = dag_version + 1 WHERE run_id=?",
                    [run_id],
                )
                if cur.rowcount == 0:
                    return 0
                new_version = conn.execute(
                    "SELECT dag_version FROM runs WHERE run_id=?", [run_id]
                ).fetchone()[0]
                conn.commit()
                return new_version
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()

    # ── 运行时 DAG 突变 CRUD ───────────────────────

    def add_node(self, run_id: str, node_data: dict) -> bool:
        """动态插入新节点到运行中的 run。返回是否成功。"""
        nid = node_data.get("id", "")
        if not nid:
            return False
        deps_raw = node_data.get("depends_on", [])
        deps_str = ",".join(deps_raw) if isinstance(deps_raw, list) else ""
        with _write_lock:
            conn = self._get_conn()
            try:
                # 检查节点是否已存在
                existing = conn.execute(
                    "SELECT 1 FROM nodes WHERE run_id=? AND node_id=?", [run_id, nid]
                ).fetchone()
                if existing:
                    conn.close()
                    return False
                conn.execute(
                    """INSERT INTO nodes
                       (run_id, node_id, label, icon, description, color, profile,
                        depends_on, status, result, output, cost, duration_ms, turns,
                        params_json)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (
                        run_id,
                        nid,
                        node_data.get("label", ""),
                        node_data.get("icon", ""),
                        node_data.get("desc", ""),
                        node_data.get("color", ""),
                        node_data.get("profile", "dev"),
                        deps_str,
                        "pending",
                        "",
                        "",
                        0, 0, 0,
                        "{}",
                    ),
                )
                # 写入依赖边
                if isinstance(deps_raw, list):
                    for dep in deps_raw:
                        if dep:
                            conn.execute(
                                "INSERT OR IGNORE INTO workflow_edges"
                                " (run_id, source_node_id, target_node_id) VALUES (?,?,?)",
                                [run_id, dep, nid],
                            )
                conn.execute(
                    "UPDATE runs SET dag_version = dag_version + 1, updated_at=? WHERE run_id=?",
                    [time.time(), run_id],
                )
                conn.commit()
                return True
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()

    def remove_node(self, run_id: str, node_id: str) -> bool:
        """从运行中的 run 删除节点及其边。返回是否成功。"""
        with _write_lock:
            conn = self._get_conn()
            try:
                # 删除本节点作为 target 或 source 的边
                conn.execute(
                    "DELETE FROM workflow_edges WHERE run_id=? AND (source_node_id=? OR target_node_id=?)",
                    [run_id, node_id, node_id],
                )
                # 重连：本节点的上游 → 本节点的下游
                upstream = conn.execute(
                    "SELECT source_node_id FROM workflow_edges WHERE run_id=? AND target_node_id=?",
                    [run_id, node_id],
                ).fetchall()
                downstream = conn.execute(
                    "SELECT target_node_id FROM workflow_edges WHERE run_id=? AND source_node_id=?",
                    [run_id, node_id],
                ).fetchall()
                for src_row in upstream:
                    src = src_row["source_node_id"]
                    for tgt_row in downstream:
                        tgt = tgt_row["target_node_id"]
                        conn.execute(
                            "INSERT OR IGNORE INTO workflow_edges"
                            " (run_id, source_node_id, target_node_id) VALUES (?,?,?)",
                            [run_id, src, tgt],
                        )
                # 删除本节点作为 source 和 target 的边（再删一次确保清理干净）
                conn.execute(
                    "DELETE FROM workflow_edges WHERE run_id=? AND (source_node_id=? OR target_node_id=?)",
                    [run_id, node_id, node_id],
                )
                # 删除本节点
                cur = conn.execute(
                    "DELETE FROM nodes WHERE run_id=? AND node_id=?", [run_id, node_id]
                )
                if cur.rowcount == 0:
                    conn.close()
                    return False
                conn.execute(
                    "UPDATE runs SET dag_version = dag_version + 1, updated_at=? WHERE run_id=?",
                    [time.time(), run_id],
                )
                conn.commit()
                return True
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()

    def add_edge(self, run_id: str, source_id: str, target_id: str) -> bool:
        """动态添加依赖边。返回是否成功。"""
        with _write_lock:
            conn = self._get_conn()
            try:
                # 验证两个节点都存在
                nodes = conn.execute(
                    "SELECT COUNT(*) FROM nodes WHERE run_id=? AND node_id IN (?,?)",
                    [run_id, source_id, target_id],
                ).fetchone()[0]
                if nodes < 2:
                    return False
                # 检查是否已存在
                existing = conn.execute(
                    "SELECT 1 FROM workflow_edges WHERE run_id=? AND source_node_id=? AND target_node_id=?",
                    [run_id, source_id, target_id],
                ).fetchone()
                if existing:
                    return False
                conn.execute(
                    "INSERT INTO workflow_edges (run_id, source_node_id, target_node_id) VALUES (?,?,?)",
                    [run_id, source_id, target_id],
                )
                conn.execute(
                    "UPDATE runs SET dag_version = dag_version + 1, updated_at=? WHERE run_id=?",
                    [time.time(), run_id],
                )
                conn.commit()
                return True
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()

    def remove_edge(self, run_id: str, source_id: str, target_id: str) -> bool:
        """删除依赖边。"""
        with _write_lock:
            conn = self._get_conn()
            try:
                cur = conn.execute(
                    "DELETE FROM workflow_edges WHERE run_id=? AND source_node_id=? AND target_node_id=?",
                    [run_id, source_id, target_id],
                )
                if cur.rowcount == 0:
                    return False
                conn.execute(
                    "UPDATE runs SET dag_version = dag_version + 1, updated_at=? WHERE run_id=?",
                    [time.time(), run_id],
                )
                conn.commit()
                return True
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()

    def retry_node(self, run_id: str, node_id: str,
                   modify_desc: str = None, modify_params: dict = None) -> bool:
        """重置节点状态为 pending 用于重跑。可选的修改 desc / params。"""
        with _write_lock:
            conn = self._get_conn()
            try:
                sets = "status='pending', result='', output='', error='', attempt=attempt+1"
                vals = []
                if modify_desc:
                    sets += ", description=?"
                    vals.append(modify_desc)
                if modify_params:
                    new_params = json.dumps(modify_params, ensure_ascii=False)
                    sets += ", params_json=?"
                    vals.append(new_params)
                vals += [run_id, node_id]
                cur = conn.execute(
                    f"UPDATE nodes SET {sets} WHERE run_id=? AND node_id=?", vals
                )
                if cur.rowcount == 0:
                    conn.close()
                    return False
                conn.execute(
                    "UPDATE runs SET dag_version = dag_version + 1, updated_at=? WHERE run_id=?",
                    [time.time(), run_id],
                )
                conn.commit()
                return True
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()

    def append_feedback(self, run_id: str, feedback_data: dict) -> int:
        """追加 feedback 到 run 的 feedback 列表，返回 event sequence。"""
        import json
        sequence = int(time.time() * 1000) % 1000000
        with _write_lock:
            conn = self._get_conn()
            try:
                conn.execute(
                    "INSERT INTO run_events (run_id, sequence, type, node_id, ts_ms, payload_json)"
                    " VALUES (?,?,?,?,?,?)",
                    [
                        run_id,
                        sequence,
                        "agent_feedback",
                        feedback_data.get("from_node", ""),
                        int(time.time() * 1000),
                        json.dumps(feedback_data, ensure_ascii=False),
                    ],
                )
                conn.commit()
                return sequence
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()

    def close(self):
        pass  # noop — 不再维护长连接

    # ── 兼容旧 interfaces ──────────────────────────

    def envelopes_dir(self, run_id: str) -> str:
        return os.path.join(RUNS_DIR, run_id, "envelopes")

    # ── Workflow 定义（n8n Workflows 对标） ───────────

    def create_workflow(
        self, name: str, requirement: str, nodes: list, edges: list | None = None
    ) -> dict:
        workflow_id = f"wf_{os.urandom(6).hex()}"
        webhook_token = os.urandom(12).hex()
        now = time.time()
        self._write(
            """INSERT INTO workflows
               (workflow_id, name, requirement, nodes_json, edges_json,
                webhook_token, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?)""",
            (
                workflow_id,
                name[:200] or "未命名工作流",
                requirement[:500],
                json.dumps(nodes, ensure_ascii=False),
                json.dumps(edges or [], ensure_ascii=False),
                webhook_token,
                now,
                now,
            ),
        )
        return self.get_workflow(workflow_id)

    def get_workflow(self, workflow_id: str) -> dict | None:
        rows = self._read(
            "SELECT * FROM workflows WHERE workflow_id=?", [workflow_id]
        )
        if not rows:
            return None
        wf = dict(rows[0])
        wf["nodes"] = json.loads(wf.pop("nodes_json") or "[]")
        wf["edges"] = json.loads(wf.pop("edges_json") or "[]")
        return wf

    def get_workflow_by_token(self, webhook_token: str) -> dict | None:
        rows = self._read(
            "SELECT workflow_id FROM workflows WHERE webhook_token=?",
            [webhook_token],
        )
        if not rows:
            return None
        return self.get_workflow(rows[0]["workflow_id"])

    def list_workflows(self, limit: int = 50) -> list:
        rows = self._read(
            """SELECT workflow_id, name, requirement, webhook_token,
                      created_at, updated_at
               FROM workflows ORDER BY updated_at DESC LIMIT ?""",
            [limit],
        )
        return [dict(r) for r in rows]

    def update_workflow(self, workflow_id: str, **kwargs) -> dict | None:
        allowed = {"name", "requirement", "nodes", "edges"}
        fields: dict = {}
        for k, v in kwargs.items():
            if k not in allowed or v is None:
                continue
            if k == "nodes":
                fields["nodes_json"] = json.dumps(v, ensure_ascii=False)
            elif k == "edges":
                fields["edges_json"] = json.dumps(v, ensure_ascii=False)
            else:
                fields[k] = v[:500] if k == "requirement" else v[:200]
        if not fields:
            return self.get_workflow(workflow_id)
        fields["updated_at"] = time.time()
        sets = ", ".join(f"{k}=?" for k in fields)
        vals = list(fields.values()) + [workflow_id]
        cur = self._write(f"UPDATE workflows SET {sets} WHERE workflow_id=?", vals)
        if cur.rowcount == 0:
            return None
        return self.get_workflow(workflow_id)

    def delete_workflow(self, workflow_id: str) -> bool:
        cur = self._write(
            "DELETE FROM workflows WHERE workflow_id=?", [workflow_id]
        )
        return cur.rowcount > 0

    # ── 进化报告持久化 (Phase 2A) ──────────────────────────────────

    def save_evolution_report(self, run_id: str, report: dict) -> int:
        """Persist an evolution report. Returns the new version number."""
        import time
        existing = self._read(
            "SELECT MAX(version) AS v FROM evolution_reports WHERE run_id=?",
            [run_id],
        )
        next_version = (existing[0]["v"] + 1) if existing and existing[0]["v"] is not None else 1
        self._write(
            "INSERT INTO evolution_reports (run_id, version, report_json, created_at)"
            " VALUES (?,?,?,?)",
            [run_id, next_version, json.dumps(report, ensure_ascii=False), time.time()],
        )
        return next_version

    def get_evolution_report(self, run_id: str, version: int | None = None) -> dict | None:
        """Retrieve the latest (or specific) evolution report for *run_id*."""
        if version is not None:
            rows = self._read(
                "SELECT run_id, version, report_json, created_at"
                " FROM evolution_reports WHERE run_id=? AND version=?",
                [run_id, version],
            )
        else:
            rows = self._read(
                "SELECT run_id, version, report_json, created_at"
                " FROM evolution_reports WHERE run_id=?"
                " ORDER BY version DESC LIMIT 1",
                [run_id],
            )
        if not rows:
            return None
        r = dict(rows[0])
        try:
            r["report"] = json.loads(r.pop("report_json"))
        except (json.JSONDecodeError, TypeError):
            r["report"] = {}
        return r

    def list_evolution_reports(self, run_id: str) -> list[dict]:
        """List all evolution report versions for *run_id* (oldest first)."""
        rows = self._read(
            "SELECT run_id, version, created_at"
            " FROM evolution_reports WHERE run_id=?"
            " ORDER BY version ASC",
            [run_id],
        )
        return [dict(r) for r in rows]

    # ── 事件持久化 (P1: agent-loop runtime events) ─────────────────

    def append_event(self, event) -> None:
        """Persist a RuntimeEvent to the run_events table.

        Thread-safe: uses _write lock.
        """
        import json

        payload_json = json.dumps(event.payload, ensure_ascii=False)
        self._write(
            "INSERT OR REPLACE INTO run_events"
            " (run_id, sequence, type, node_id, tool_call_id, ts_ms, payload_json)"
            " VALUES (?,?,?,?,?,?,?)",
            [
                event.run_id,
                event.sequence,
                event.type,
                event.node_id,
                event.tool_call_id,
                event.ts_ms,
                payload_json,
            ],
        )

    def list_events(
        self, run_id: str, after_sequence: int = -1, limit: int = 1000
    ) -> list[dict]:
        """Retrieve persisted events for *run_id* with sequence > *after_sequence*.

        Default *after_sequence* = -1 returns all events.
        Events are returned in sequence order (oldest first).
        """
        import json

        rows = self._read(
            "SELECT run_id, sequence, type, node_id, tool_call_id, ts_ms, payload_json"
            " FROM run_events WHERE run_id=? AND sequence>?"
            " ORDER BY sequence ASC LIMIT ?",
            [run_id, after_sequence, limit],
        )
        result = []
        for r in rows:
            d = dict(r)
            try:
                d["payload"] = json.loads(d.pop("payload_json"))
            except (json.JSONDecodeError, TypeError):
                d["payload"] = {}
            result.append(d)
        return result


# ── 全局单例 ────────────────────────────────────────
_db: RunStore | None = None


def get_store() -> RunStore:
    global _db
    if _db is None:
        _db = RunStore()
    return _db


# ── 启动扫描 ──────────────────────────────────────────
def startup_scan(store: RunStore | None = None) -> dict:
    """启动时扫描残留状态并恢复。返回操作摘要。"""
    s = store or get_store()
    action_log = {"pending_resumed": [], "stale_marked": [], "errors": []}

    # 1. 恢复 pending 的 run（它们会在 executor_queue 中重新入队）
    pending_ids = s.list_pending_runs()
    action_log["pending_resumed"] = pending_ids

    # 2. 标记无 heartbeat 的 running run 为 failed
    stale_ids = s.list_stale_runs()
    for rid in stale_ids:
        try:
            s.update_run_status(rid, "failed", "process_restart_no_heartbeat")
            action_log["stale_marked"].append(rid)
        except Exception as e:
            action_log["errors"].append(f"{rid}: {e}")

    return action_log


# ── 工具：括号配平 JSON 提取 ─────────────────────────
def extract_json(text: str) -> str:
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
    return text[start_idx:]


# ── 快速测试 ────────────────────────────────────────
if __name__ == "__main__":
    s = get_store()
    rid = s.create_run("test", [{"id": "n1", "profile": "dev"}],
                       edges=[{"source": "n2", "target": "n1"}])
    print(f"Created: {rid}")
    r = s.get_run(rid)
    print(f"Run: {r['status']}, nodes: {len(r['nodes'])}")
    edges = s.get_run_edges(rid)
    print(f"Edges: {edges}")
    s.update_node(rid, "n1", status="completed", result="ok", cost=0.001)
    s.update_run_status(rid, "completed")
    r2 = s.get_run(rid)
    print(f"After update: {r2['status']}, node: {r2['nodes'][0]['status']}")
    snap = s.get_workflow_snapshot(rid)
    print(f"Snapshot: {snap is not None}, edges: {len(snap['workflow']['edges']) if snap else 0}")
    print(f"List runs: {len(s.list_runs())}")
    print(f"Startup scan: {startup_scan(s)}")
    print(f"Extract JSON: {extract_json('text [a, [b, c], d] more')}")
