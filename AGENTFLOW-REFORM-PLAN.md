# AgentFlow 重构方案

> 基于廖博士 Staff Engineer Code Review + n8n (55K⭐) 架构分析

## 总体判断

**当前状态：** 单机版 Agent DAG 开发原型
**目标状态：** 核心语义可信的 Agent 编排平台
**核心缺陷：** 表面上跑通，语义上不可靠。DAG 调度顺序正确但 Prompt 数据流被切断，
UI 展示与真实状态不一致，安全边界不完整。

---

## 第一批 — 修复会直接失真的问题（3-5 天）

### 1. Dockerfile 补齐 + 容器监听修复

**问题：** Dockerfile 缺 `run_store.py` `provider_adapter.py` `output_validator.py`，
容器内监听 `127.0.0.1` 无法从宿主机访问。

**操作：**
```python
# agentflow-backend.py
HOST = os.environ.get("AGENTFLOW_HOST", "127.0.0.1")
```

```dockerfile
COPY agentflow-backend.py agent_runner.py agentflow_schema.py \
     prompt_compiler.py artifact_store.py run_store.py \
     provider_adapter.py output_validator.py ./
```

```yaml
# docker-compose.yml
environment:
  - AGENTFLOW_HOST=0.0.0.0
```

**验证：** CI 中新增 docker build + smoke test

**优先级：** P0 — 当前镜像无法启动

---

### 2. 统一异步协议 + 前端接入真实 SSE

**问题：** 后端已改成异步（返回 `{run_id, status: "pending"}`），
前端仍按同步处理，`data.nodes` 不存在时可能显示 0 Agents 完成。
失败后自动进入模拟执行并伪装成功。

**API 协议统一为：**

```text
POST /api/runs                         → 202 { run_id }
GET  /api/runs/{run_id}/events         → SSE 持续推送
GET  /api/runs/{run_id}                → 最终状态快照
```

**前端状态机：**
```
pending → queued → running → completed
                       → failed
                       → skipped
                       → cancelled
```

**模拟模式保留但必须标记：**
```
Demo Mode：当前结果为模拟数据，未执行真实 Agent
```

**参考 n8n：** n8n 前端通过 `push` (WebSocket) 接收实时执行事件，
后端 `Push` 类管理连接。AgentFlow 先走 SSE（更简单），后续可升 WebSocket。

**优先级：** P0 — 前后端状态不一致导致误报成功

---

### 3. Compiler 恢复真实 edges[]（最关键！）

**问题：** `agentflow-backend.py` 构造 WorkflowJSON 时硬编码 `edges=[]`，
导致 Compiler 认为所有节点无上游依赖。执行顺序正确但 Prompt 数据流被切断。

**这是最隐蔽的架构 Bug。** n8n 的 `Workflow` 类同时保存
`connectionsBySourceNode` 和 `connectionsByDestinationNode`，
执行器依赖这些信息构建节点上下文。AgentFlow 丢失了边信息。

**修复：**

```python
# 1. RunStore 持久化完整 workflow 快照
CREATE TABLE workflow_snapshots (
    run_id TEXT PRIMARY KEY,
    workflow_json TEXT NOT NULL,  -- 完整 WorkflowJSON 序列化
    created_at TEXT DEFAULT (datetime('now'))
);

# 2. 执行时从快照恢复
snapshot = store.load_workflow_snapshot(run_id)
compiler.compile_node(
    workflow=snapshot.workflow,
    node_id=nid,
    upstream_results=results,
)
```

**参考 n8n：** n8n 的 `runExecutionData` 保存完整 `nodeExecutionStack`，
节点执行时通过 `Workflow` 对象查询上下游。每次执行前重建完整上下文。

**优先级：** P0 — 语义正确性，当前每个节点几乎独立运行

---

### 4. DAG 校验器接入执行链路

**问题：** `validate_workflow()` 没有被 `/api/execute` 调用。
`all([]) == True` 导致缺失上游节点的任务被误判为 ready。

**修复：**

```python
# 执行前强制校验
wf = WorkflowJSON(nodes=nodes, requirement=req, edges=edges)
errors = validate_workflow(wf)
if errors:
    return 422, {"error": "invalid_workflow", "details": errors}

# ready 判断补全
def _get_ready_nodes(self, run_id):
    pending = self._query("... WHERE run_id=? AND status='pending'", [run_id])
    ready = []
    for n in pending:
        deps = n[5].split(",") if n[5] else []
        if not deps:
            ready.append(n)
            continue
        dep_rows = self._query(
            "SELECT status FROM nodes WHERE run_id=? AND node_id IN ({})".format(
                ",".join("?" * len(deps))
            ),
            [run_id] + deps,
        )
        dep_statuses = {r[0] for r in dep_rows}
        if len(dep_rows) == len(deps) and all(
            s == "completed" for s in dep_statuses
        ):
            ready.append(n)
    return ready
```

**优先级：** P0 — 存在误判 ready 的风险

---

### 5. DOM XSS 修复

**问题：** LLM 生成的节点名称、描述直接拼接 `innerHTML`。

**修复：**
```javascript
// 所有 LLM 数据使用 textContent
element.textContent = node.label;

// 图标/颜色走白名单
const SAFE_ICONS = { "🔍":"search", "⚙️":"gear", "📝":"doc", ... };
const SAFE_COLORS = { "blue","green","purple","orange","red","teal" };

// CSP
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'">
```

**参考 n8n：** n8n 前端使用 Vue 3 模板语法 `{{ value }}`，
天然转义 HTML。AgentFlow 在升级 UI 框架前先用 textContent 兜底。

**优先级：** P0 — 用户需求可注入恶意内容

---

### 6. 节点状态机修复

**问题：** 失败状态先被归一化为 `"failed"`，随后传播逻辑却判断 `"error"/"timeout"`，
条件不命中。

**修复：** 全系统统一状态枚举 + 单一状态转换入口：

```python
class NodeStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    CANCELLED = "cancelled"
    TIMED_OUT = "timed_out"

def transition_node_status(run_id, node_id, expected, next_status):
    cur = db.execute(
        "UPDATE nodes SET status=? WHERE run_id=? AND node_id=? AND status=?",
        [next_status, run_id, node_id, expected]
    )
    if cur.rowcount == 0:
        raise StatusConflictError(...)
```

失败传播直接用 `set(['failed', 'timed_out', 'cancelled'])` 判断。

**优先级：** P0 — 状态机逻辑错误导致失败不传播

---

## 第二批 — 单机执行 → 可靠执行（1-2 周）

### 7. Workflow 快照 + 规范化 edges 表

**问题：** 依赖关系存为逗号分隔字符串，`LIKE '%n1%'` 可能误匹配。
没有完整工作流快照，无法复现历史执行。

**参考 n8n：** n8n 的 `Workflow` 对象同时保存两个方向的连接索引
（`connectionsBySourceNode` + `connectionsByDestinationNode`），
执行器通过 `workflow.getParentNodes()` / `getChildNodes()` 查询。

**修复：**
```sql
CREATE TABLE workflow_edges (
    run_id TEXT NOT NULL,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    PRIMARY KEY (run_id, source_node_id, target_node_id)
);

CREATE TABLE workflow_snapshots (
    run_id TEXT PRIMARY KEY,
    workflow_json TEXT NOT NULL,
    compiler_version TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
```

---

### 8. SQLite 并发管理

**问题：** 单例连接 + `check_same_thread=False`，多线程写可能争用。

**修复：**
```python
class RunStore:
    def __init__(self, db_path):
        self._lock = threading.Lock()
        self._path = db_path

    def _get_conn(self):
        conn = sqlite3.connect(self._path)
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

    def update_node_status(self, run_id, node_id, from_status, to_status):
        with self._lock:
            conn = self._get_conn()
            try:
                cur = conn.execute(
                    "UPDATE nodes SET status=? WHERE run_id=? AND node_id=? AND status=?",
                    [to_status, run_id, node_id, from_status]
                )
                conn.commit()
                return cur.rowcount > 0
            finally:
                conn.close()
```

**关键：** 每次操作独立连接 + 锁保护，比长连接更安全。

---

### 9. 启动扫描 + Lease/Heartbeat

**问题：** 进程内 Queue 重启后丢失，`pending`/`running` 状态残留。

**参考 n8n：** n8n 使用 `active-workflow-manager.ts` 管理持久化工作流，
重启时扫描数据库恢复触发器和运行状态。

**修复：**
```python
def startup_scan():
    """启动时扫描残留状态"""
    # pending → re-enqueue
    for rid in store.get_pending_runs():
        work_queue.put(rid)
    # running 且无 heartbeat → timeout
    for rid in store.get_stale_runs(timeout=300):
        store.mark_run_failed(rid, "process_restart")
```

节点表增加：
```sql
ALTER TABLE nodes ADD COLUMN attempt INTEGER DEFAULT 0;
ALTER TABLE nodes ADD COLUMN heartbeat_at TEXT;
ALTER TABLE nodes ADD COLUMN lease_owner TEXT;
ALTER TABLE nodes ADD COLUMN lease_expires_at TEXT;
```

---

### 10. ArtifactBroker

**问题：** 下游 Agent 无法读取上游 artifact（路径在 work_dir 之外），
工作目录执行后删除导致产出丢失。

**参考 n8n：** n8n 的 `binary-data` 模块管理二进制数据，
支持 database/filesystem/S3 后端。通过 `IBinaryData` 接口访问。

**修复：**
```python
class ArtifactBroker:
    def publish(self, source_run, source_node, path, metadata):
        artifact_id = f"art_{uuid4().hex[:12]}"
        sha256 = hashlib.sha256(open(path, 'rb').read()).hexdigest()
        dest = self._store / artifact_id
        shutil.copy2(path, dest)
        self._db.execute("INSERT INTO artifacts (...) VALUES (...)")
        return ArtifactRef(artifact_id=artifact_id, sha256=sha256, ...)

    def read(self, artifact_id, requestor_run, requestor_node):
        ref = self._get(artifact_id)
        if not self._check_access(ref, requestor_run, requestor_node):
            raise PermissionError(...)
        return open(self._store / artifact_id, 'rb')
```

下游收到的不再是宿主路径，而是受控引用：
```json
{
    "artifact_id": "art_a1b2c3d4",
    "name": "main.py",
    "sha256": "...",
    "source_node": "a3"
}
```

---

## 第三批 — 原型 → 团队平台（2-4 周）

### 11. SandboxRunner 抽象

**参考 n8n：** n8n 使用 `@n8n/task-runner` 包实现 JS/Python 沙箱执行。
`sandbox-runner` 在独立进程中运行，通过 stdin/stdout JSON-RPC 通信，
支持模块白名单、超时、内存限制。

```python
class SandboxRunner(ABC):
    @abstractmethod
    def execute(self, command: list[str], workspace: str, env: dict) -> CommandResult:
        ...

class LocalRunner(SandboxRunner):
    """无隔离，仅限本地开发"""

class DockerRunner(SandboxRunner):
    """容器隔离，每节点启动临时容器"""
```

本地模式用 `LocalRunner`（显式命名标记风险），
团队/公网模式必须用 `DockerRunner`。

**DockerRunner 默认策略：**
- 非 root 用户
- 只挂载任务工作区
- 根文件系统只读
- 禁 Docker Socket
- CPU/内存/进程数/磁盘/时间限制
- 默认关网络，按需域名白名单
- 清理环境变量
- Secret 通过短期凭证注入
- 审计每种工具调用

---

### 12. Provider 平台化

**当前状态：** 熔断器按 model 维度。
**目标状态：** 熔断/限流维度扩展为：

```text
provider → endpoint → model → credential → tenant → region
```

每个 Provider 声明能力矩阵：

```python
ProviderCapability(
    supports_tools=True,
    supports_streaming=True,
    max_context=128000,
    timeout_sec=120,
    rate_limit="10/1s",
    cost_per_1k_input=0.0005,
    cost_per_1k_output=0.0015,
    fallback_model="deepseek-chat",
)
```

README 标记区分 `supported` / `beta` / `experimental` / `untested`。

---

### 13. Eval Harness（评测框架）

**参考 n8n：** n8n 有完整的 `evaluations/` 体系——80+ 文件，
覆盖二进制检查、LLM Judge、Pairwise、程序化验证、相似度、执行验证。

**参考 n8n 的评测层次：**

| 层次 | n8n 方法 | AgentFlow 方法 |
|------|----------|---------------|
| 确定性检查 | 代码检查（所有节点连接？可到达？） | schema 校验 + DAG 验证 |
| LLM Judge | 独立 LLM 评分 | 用另一个 Provider 评估 DAG 质量 |
| 执行验证 | 自动运行 + 检查输出 | 运行后检查 artifact 完整性 |
| 成本/时延 | 记录 Token/耗时 | 相同指标 |
| 回归基准 | CSV 持久化 | SQLite 持久化历史 |

**第一步：** 把 README 中 4 个案例升级为自动回归

```
evals/
  serial_tool/       # PyQt5 串口调试助手
  todo_webapp/       # Todo 网页应用
  quadrotor_adrc/    # 四旋翼 ADRC Simulink
  quadruped_vmc/     # 四足 VMC 控制
```

每次 CI 自动运行，输出：
```json
{
  "success_rate": 0.95,
  "avg_cost_usd": 0.12,
  "avg_latency_sec": 180,
  "provider_error_rate": 0.02
}
```

---

### 14. Supervisor 多 Agent 路由（源编排增强）

**参考 n8n：** n8n 的 `@n8n/ai-workflow-builder.ee` 使用 4 Agent + 1 Supervisor 架构：

```
Supervisor (Router)
  ├── Discovery   — 挖掘需求，问细节
  ├── Planner     — 出方案，等着人类审批
  ├── Builder     — 用 tools 构建 DAG
  └── Responder   — 回答用户
```

**AgentFlow 当前：** `handle_decompose()` 一步出全部方案，没有多轮对话。

**改进方向：**

```
Supervisor Agent
  ├── Discovery Agent   — 用户需求模糊时追问细节
  ├── Planner Agent     — 生成结构化方案（Plan Mode）
  ├── Builder Agent     — 逐个创建节点 + 连接边
  └── Responder Agent   — 回答用户问题
```

**关键模式：** Agent 不直接操作数据库，通过 tools 操控：

```text
Builder Agent Tools:
  add_node(profile, config)         → 创建节点
  connect_nodes(from_id, to_id)     → 添加边
  update_node_params(node_id, ...)  → 修改参数
  validate_structure()              → 验证 DAG
  preview_workflow()                → 预览 Mermaid 图
```

---

### 15. 前端 TypeScript 图模型

**参考 n8n：** n8n 前端使用 Vue Flow 作为 DAG 编辑器，
图数据是唯一事实源。节点/边增删都是事务式操作。

**改进方向：**

```typescript
interface WorkflowNode {
  id: string;
  type: 'analysis' | 'design' | 'dev' | 'test' | 'doc' | 'deploy';
  profile: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

// 事务式图修改
function applyGraphMutation(mutation: GraphMutation) {
  validateState();          // 修改前校验
  updateNodeList();         // 节点变更
  syncEdges();              // 边同步修正
  validateGraph();          // 修改后校验
  reRender();               // 视图刷新
}
```

**不建议立即重写 UI**——先迁移数据层为 TypeScript 模块，保证图数据正确。

---

## 推荐执行顺序

```
Week 1: 第一批（P0 失真修复）
  Day 1: Dockerfile + 统一异步协议
  Day 2: 前端接入真实 SSE + 移除静默模拟
  Day 3: Compiler edges[] 修复 + 快照持久化
  Day 4: DAG 校验器接入 + 状态机修复 + XSS
  Day 5: 集成测试 + CI 补充

Week 2-3: 第二批（可靠执行）
  Workflow 快照 + 规范化 edges 表
  SQLite 并发管理 + 启动扫描 + Lease
  ArtifactBroker
  SandboxRunner 抽象

Week 4-6: 第三批（团队平台）
  Eval Harness
  Supervisor 多 Agent 路由
  Provider 平台化
  前端 TypeScript 图模型
```
