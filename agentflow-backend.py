#!/usr/bin/env python3
"""AgentFlow 统一后端 — 静态文件 + API + Compiler + DAG 并行执行引擎"""
import os, sys, json, http.server, urllib.request, urllib.error, tempfile, shutil, time
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

from agent_runner import AgentRunner
from agentflow_schema import (
    WorkflowJSON, NodeDef, EdgeDef,
    validate_workflow, parallel_groups, Profile,
)
from prompt_compiler import PromptCompiler

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 9600
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.environ.get("AGENTFLOW_STATIC_DIR", SCRIPT_DIR)
TEMPLATE_DIR = os.environ.get("AGENTFLOW_TEMPLATE_DIR",
    os.path.join(STATIC_DIR, "templates") if os.path.isdir(os.path.join(STATIC_DIR, "templates"))
    else os.path.join(SCRIPT_DIR, "templates"))
DEFAULT_AGENT_MODEL = os.environ.get("AGENT_MODEL", "glm-5-turbo")

# 全局并发控制
MAX_CONCURRENT_AGENTS = int(os.environ.get("AGENTFLOW_MAX_CONCURRENT", "10"))
MAX_BODY_SIZE = int(os.environ.get("AGENTFLOW_MAX_BODY_SIZE", str(512 * 1024)))  # 512KB
_global_semaphore = threading.Semaphore(MAX_CONCURRENT_AGENTS)

SYSTEM_PROMPT = """你是一个工作流编排专家。你的任务是将用户的需求拆解为多个子任务（Agent），每个子任务由独立的 AI Agent 执行。

严格规则（必须遵守）：
1. 必须返回 **恰好 count 个** 节点，一个不多一个不少
2. 每个子任务包含：
   - id（唯一标识，如"a1""a2"）
   - icon（单个emoji，代表该任务）
   - label（简短名称，2-6字）
   - desc（一句话描述，15-30字）
   - color（blue/green/purple/orange 之一）
   - profile（Agent 类型，必须是以下之一：analysis/design/dev/test/doc/deploy）
3. 节点从分析到实现到验证到输出，逻辑连贯
4. 第一个节点是需求分析类（profile=analysis），最后一个节点是输出报告类（profile=doc）
5. 中间节点按 count-2 的数量均匀分配 profile

profile 含义：
- analysis: 需求分析、数据调研、问题定义
- design: 方案设计、架构设计、算法设计、UI设计
- dev: 编码实现、前端开发、后端开发、模型训练
- test: 测试验证、仿真测试、集成测试
- doc: 输出报告、文档生成、总结汇报
- deploy: 部署上线、发布运维

返回格式：**纯 JSON 数组，不要其他文字，不要 markdown 代码块**

示例（count=4, 企业官网需求）：
[{"id":"a1","icon":"📋","label":"需求分析","desc":"分析企业官网功能需求与技术选型","color":"blue","profile":"analysis"},
{"id":"a2","icon":"🎨","label":"UI设计","desc":"设计官网页面布局与视觉风格","color":"orange","profile":"design"},
{"id":"a3","icon":"💻","label":"前端开发","desc":"使用React+Tailwind实现前端页面","color":"green","profile":"dev"},
{"id":"a4","icon":"📝","label":"输出报告","desc":"汇总交付文档与上线说明","color":"orange","profile":"doc"}]

记住：返回的数组长度必须 = count"""


# 从 .env 或环境变量读取 API 鉴权 Token（可选）
# 设置后，所有 API 请求必须在 Authorization header 中携带此 Token
AGENTFLOW_API_TOKEN = os.environ.get("AGENTFLOW_API_TOKEN", "")


class AgentFlowHandler(http.server.BaseHTTPRequestHandler):
    def _cors_headers(self, origin: str = "") -> dict:
        """生成安全的 CORS 头。生产环境应设置 AGENTFLOW_ALLOWED_ORIGIN。"""
        allowed = os.environ.get("AGENTFLOW_ALLOWED_ORIGIN", "")
        if allowed and origin and origin == allowed:
            origin_val = origin
        elif allowed and origin and allowed == "*":
            origin_val = origin
        else:
            # 默认只允许本地
            origin_val = origin if origin in (
                "http://localhost",
                f"http://localhost:{PORT}",
                "http://127.0.0.1",
                f"http://127.0.0.1:{PORT}",
            ) else "http://localhost"
        return {
            "Access-Control-Allow-Origin": origin_val,
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }

    def _require_auth(self) -> bool:
        """检查 API Token 鉴权。如果 AGENTFLOW_API_TOKEN 为空则不要求鉴权。"""
        if not AGENTFLOW_API_TOKEN:
            return True
        auth = self.headers.get("Authorization", "")
        expected = f"Bearer {AGENTFLOW_API_TOKEN}"
        if auth == expected:
            return True
        # 也支持 X-API-Key header
        api_key = self.headers.get("X-API-Key", "")
        if api_key == AGENTFLOW_API_TOKEN:
            return True
        return False

    def do_OPTIONS(self):
        origin = self.headers.get("Origin", "")
        cors = self._cors_headers(origin)
        self.send_response(204)
        for k, v in cors.items():
            self.send_header(k, v)
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_GET(self):
        url = self.path
        if url == "/" or url == "":
            url = "/canvas-demo.html"
        filepath = os.path.normpath(os.path.join(STATIC_DIR, url.lstrip("/")))
        # 路径穿越防护
        if not filepath.startswith(os.path.normpath(STATIC_DIR) + os.sep) and filepath != os.path.normpath(STATIC_DIR):
            self.send_error(403, "Forbidden")
            return
        if not os.path.isfile(filepath):
            filepath = os.path.join(STATIC_DIR, "canvas-demo.html")
        try:
            with open(filepath, "rb") as f:
                content = f.read()
            ext = os.path.splitext(filepath)[1].lstrip('.')
            mime = {"html":"text/html","js":"text/javascript","css":"text/css",
                    "png":"image/png","jpg":"image/jpeg",
                    "svg":"image/svg+xml","json":"application/json",
                    "ico":"image/x-icon"}.get(ext, "application/octet-stream")
            self.send_response(200)
            self.send_header("Content-Type", mime + "; charset=utf-8")
            origin = self.headers.get("Origin", "")
            cors = self._cors_headers(origin)
            for k, v in cors.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(404, str(e))

    def do_POST(self):
        try:
            # API 鉴权（仅对 /api/* 路径）
            if self.path.startswith("/api") and not self._require_auth():
                self.send_response(401)
                cors = self._cors_headers(self.headers.get("Origin", ""))
                for k, v in cors.items():
                    self.send_header(k, v)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized. Set AGENTFLOW_API_TOKEN or provide Bearer token."}).encode())
                return
            if self.path == "/api/decompose":
                self.handle_decompose()
            elif self.path == "/api/execute":
                self.handle_execute()
            else:
                self.send_error(404)
        except Exception as e:
            print(f"[AgentFlow] POST error: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            try:
                self.send_error(500, str(e))
            except:
                pass

    # ── /api/decompose — 编排 Agent ──────────────────

    def handle_decompose(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length > MAX_BODY_SIZE:
                self.send_error(413, f"请求体过大 ({length} > {MAX_BODY_SIZE})")
                return
            body = json.loads(self.rfile.read(length))
            requirement = body.get("requirement", "")
            count = int(body.get("count", 4))
        except:
            self.send_error(400, "Invalid request")
            return

        count = max(1, min(count, 100))
        zai_key = os.environ.get("ZAI_API_KEY", "")
        nodes = self.call_llm(requirement, count) if zai_key else self.fallback_template(requirement, count)

        # 自动生成 edges: 分析→设计→开发→测试→文档→部署（链式串联）
        edges = self._generate_edges(nodes)

        self.send_response(200)
        origin = self.headers.get("Origin", "")
        cors = self._cors_headers(origin)
        for k, v in cors.items():
            self.send_header(k, v)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "nodes": nodes, "count": len(nodes), "edges": edges
        }).encode())

    def _generate_edges(self, nodes):
        """根据 profile 类型自动生成 DAG 边。"""
        edges = []
        for i in range(1, len(nodes)):
            edges.append({"source": nodes[i-1]["id"], "target": nodes[i]["id"]})
        # 如果节点数 > 2，可以让 analysis→dev/test 并行
        return edges

    def call_llm(self, requirement, count):
        zai_key = os.environ.get("ZAI_API_KEY", "")
        if not zai_key:
            return self.fallback_template(requirement, count)
        payload = json.dumps({
            "model": "glm-5-turbo",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"需求：{requirement}\nAgent数量：{count}个"}
            ],
            "temperature": 0.7,
            "max_tokens": 2000,
        }).encode()

        # 重试 2 次，每次 45s 超时
        last_error = None
        for attempt in range(3):  # 第一次 + 2 次重试
            try:
                req = urllib.request.Request(
                    "https://open.bigmodel.cn/api/paas/v4/chat/completions",
                    data=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {zai_key}"
                    }, method="POST")
                with urllib.request.urlopen(req, timeout=45) as resp:
                    data = json.loads(resp.read())
                content = data["choices"][0]["message"]["content"]
                nodes = json.loads(content)
                if isinstance(nodes, dict) and "nodes" in nodes:
                    nodes = nodes["nodes"]
                if isinstance(nodes, list):
                    return self.adjust_nodes(nodes, count)
                return self.fallback_template(requirement, count)
            except Exception as e:
                last_error = e
                print(f"LLM call attempt {attempt+1} failed: {e}", file=sys.stderr)
                if attempt < 2:
                    time.sleep(1.5)  # 退避
        print(f"LLM call all 3 attempts failed, using fallback: {last_error}", file=sys.stderr)
        return self.fallback_template(requirement, count)

    def adjust_nodes(self, nodes, target):
        """调整节点数量至 target，确保最后一个节点是 doc 或 deploy。"""
        # 确保最后一个节点是 doc/deploy
        if nodes and nodes[-1].get("profile") not in ("doc", "deploy"):
            # 找已存在的 doc 节点
            doc_idx = None
            for i in range(len(nodes)-2, -1, -1):
                if nodes[i].get("profile") in ("doc", "deploy"):
                    doc_idx = i
                    break
            if doc_idx is not None and doc_idx != len(nodes)-1:
                # 把 doc 节点移到末尾
                doc = nodes.pop(doc_idx)
                nodes.append(doc)
            else:
                # 加一个 doc 节点在末尾
                nodes.append({
                    "id": "output", "icon": "📝",
                    "label": "输出报告", "desc": "汇总生成交付文档",
                    "color": "orange", "profile": "doc",
                })

        # 截取到 target
        nodes = nodes[:target]

        # 如果截取后最后一个不是 doc/deploy 且还有空间，替换或追加
        if nodes and nodes[-1].get("profile") not in ("doc", "deploy"):
            if target > len(nodes):
                nodes.append({
                    "id": "output", "icon": "📝",
                    "label": "输出报告", "desc": "汇总生成交付文档",
                    "color": "orange", "profile": "doc",
                })
            else:
                # 把最后一个改成 doc
                nodes[-1]["profile"] = "doc"
                nodes[-1]["label"] = "输出报告"

        # 不够 target 就补
        while len(nodes) < target:
            idx = len(nodes) + 1
            profile = "test" if len(nodes) < target - 1 else "doc"
            nodes.append({
                "id": f"auto_{idx}", "icon": "🔧",
                "label": f"子任务 #{idx}", "desc": "细化子任务",
                "color": "blue", "profile": profile,
            })

        return nodes[:target]

    # ── /api/execute — Compiler + DAG 并行执行 ──────

    def handle_execute(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length > MAX_BODY_SIZE:
                self.send_error(413, f"请求体过大 ({length} > {MAX_BODY_SIZE})")
                return
            body = json.loads(self.rfile.read(length))
            nodes = body.get("nodes", [])
            edges = body.get("edges", [])
            requirement = body.get("requirement", "")
        except:
            self.send_error(400, "Invalid request")
            return

        if not nodes:
            self.send_error(400, "No nodes")
            return

        # 构建 WorkflowJSON
        wf = WorkflowJSON.from_api_request(nodes, requirement, edges)
        errs = validate_workflow(wf)
        if errs:
            print(f"[Execute] Validation errors: {errs}", file=sys.stderr)

        # Compiler: 编译 PromptTask[]
        compiler = PromptCompiler(TEMPLATE_DIR)
        tasks = compiler.compile(wf)
        print(f"[Execute] Compiled {len(tasks)} PromptTasks for {len(nodes)} nodes", file=sys.stderr)

        # DAG 分组: 按拓扑深度分组，同组可并行
        groups = parallel_groups(wf.nodes, wf.edges)
        print(f"[Execute] DAG groups: {[len(g) for g in groups]}", file=sys.stderr)

        # 执行
        work_dir = tempfile.mkdtemp(prefix="agentflow_")
        node_map = {n.id: n for n in wf.nodes}
        all_results = []
        all_envelopes = {}

        for group_idx, group_nodes in enumerate(groups):
            print(f"[Execute] Group {group_idx}: {[n.id for n in group_nodes]}", file=sys.stderr)

            # 并行执行同组节点
            with ThreadPoolExecutor(max_workers=len(group_nodes)) as pool:
                fut_to_node = {}
                for node in group_nodes:
                    task = next((t for t in tasks if t.node_id == node.id), None)
                    if not task:
                        continue
                    node_dir = os.path.join(work_dir, f"node_{node.id}")
                    os.makedirs(node_dir, exist_ok=True)
                    fut = pool.submit(
                        self._execute_one_node, node, task, node_dir
                    )
                    fut_to_node[fut] = node

                for fut in as_completed(fut_to_node):
                    node = fut_to_node[fut]
                    try:
                        result = fut.result()
                    except Exception as e:
                        result = {
                            "status": "error",
                            "result": f"执行异常: {e}",
                            "cost": 0, "duration": 0, "turns": 0,
                        }
                    # 更新节点
                    node.result = result.get("result", "")
                    node.output = result.get("output", "")[:2000]
                    node.status = result.get("status", "error")
                    node.cost = result.get("cost", 0)
                    node.duration = result.get("duration", 0)
                    node.turns = result.get("turns", 0)
                    node.provider = result.get("provider", "")
                    node.model = result.get("model", node.model or DEFAULT_AGENT_MODEL)
                    all_envelopes[node.id] = result
                    all_results.append(node.to_dict())
                    print(f"[Execute] Node {node.id} done: ${node.cost:.4f} / {result.get('duration',0)}ms", file=sys.stderr)

        # 清理
        try:
            shutil.rmtree(work_dir)
        except:
            pass

        self.send_response(200)
        origin = self.headers.get("Origin", "")
        cors = self._cors_headers(origin)
        for k, v in cors.items():
            self.send_header(k, v)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "nodes": all_results,
            "total_cost": sum(r.get("cost", 0) for r in all_results),
            "total_duration": sum(r.get("duration", 0) for r in all_results),
            "groups": [len(g) for g in groups],
        }).encode())

    def _execute_one_node(self, node: NodeDef, task, node_dir: str) -> dict:
        """执行单个节点（在 ThreadPool 中运行，受全局并发限流）。"""
        with _global_semaphore:
            agent_model = node.model or DEFAULT_AGENT_MODEL
            agent = AgentRunner(model=agent_model)

        # 用 Compiler 生成的完整提示词
        prompt = task.prompt
        if not prompt:
            prompt = node.desc or "请完成分配的工作。"

        result = agent.execute(
            prompt=prompt,
            work_dir=node_dir,
            profile=node.profile,
            tools_enabled=True,
            max_turns=task.max_turns,
            timeout=task.timeout_s,
        )

        return {
            "result": result.get("result", "完成"),
            "output": result.get("output", "")[:2000],
            "cost": result.get("cost", 0),
            "duration": result.get("duration_ms", 0),
            "status": result.get("status", "ok"),
            "turns": result.get("turns", 1),
            "model": result.get("model", agent_model),
            "provider": result.get("provider", ""),
        }

    def fallback_template(self, requirement, count):
        t = requirement.lower()
        if any(kw in t for kw in ["pid","控制器","四旋翼","无人机"]):
            base = [
                {"id":"a1","icon":"📋","label":"需求分析","desc":"解析需求→确定控制目标","color":"blue","profile":"analysis","result":"目标:四旋翼悬停控制\\n约束:收敛<2s"},
                {"id":"a2","icon":"🧮","label":"系统建模","desc":"四旋翼动力学模型→传递函数","color":"blue","profile":"design","result":"G(s)=1/(0.5s²+0.1s)"},
                {"id":"a3","icon":"📐","label":"控制器设计","desc":"Ziegler-Nichols→PID参数整定","color":"purple","profile":"design","result":"Kp=2.5,Ki=1.0,Kd=0.3"},
                {"id":"a4","icon":"💻","label":"C++代码生成","desc":"ArduPilot框架→PID.cpp","color":"green","profile":"dev","result":"PID.cpp+PID.h(136行)"},
                {"id":"a5","icon":"🧪","label":"编译测试","desc":"scons cuav-v5→单元测试","color":"purple","profile":"test","result":"✓编译通过\\n12/12测试通过"},
                {"id":"a6","icon":"📝","label":"输出报告","desc":"综合结果→可交付文档","color":"orange","profile":"doc","result":"PID_Report.pdf(8页)"},
            ]
        elif any(kw in t for kw in ["网站","官网","web","前端","后端"]):
            base = [
                {"id":"b1","icon":"📋","label":"需求分析","desc":"功能需求→技术选型","color":"blue","profile":"analysis","result":"React+FastAPI+PostgreSQL"},
                {"id":"b2","icon":"🎨","label":"UI/UX设计","desc":"Figma→页面原型","color":"orange","profile":"design","result":"首页/产品/关于三页原型"},
                {"id":"b3","icon":"💻","label":"前端开发","desc":"React+Tailwind","color":"green","profile":"dev","result":"3页面组件\\n响应式布局✅"},
                {"id":"b4","icon":"⚙️","label":"后端API","desc":"FastAPI→REST端点","color":"green","profile":"dev","result":"5 REST端点\\nJWT认证✅"},
                {"id":"b5","icon":"🗄️","label":"数据库设计","desc":"PostgreSQL Schema","color":"blue","profile":"design","result":"4表:users/products/orders"},
                {"id":"b6","icon":"🧪","label":"集成测试","desc":"API测试+联调","color":"purple","profile":"test","result":"✓36/36测试通过"},
                {"id":"b7","icon":"🌐","label":"部署发布","desc":"Docker→服务器","color":"green","profile":"deploy","result":"https://上线✅"},
            ]
        elif any(kw in t for kw in ["机器","训练","模型","ml","预测"]):
            base = [
                {"id":"c1","icon":"📋","label":"需求分析","desc":"业务目标→问题定义","color":"blue","profile":"analysis","result":"二分类:AUC>0.85"},
                {"id":"c2","icon":"📊","label":"数据采集","desc":"数据源→ETL","color":"blue","profile":"analysis","result":"3数据源,50万行"},
                {"id":"c3","icon":"🔍","label":"数据探索","desc":"统计分析→可视化","color":"orange","profile":"analysis","result":"12特征分析"},
                {"id":"c4","icon":"🧹","label":"数据预处理","desc":"清洗→特征工程","color":"purple","profile":"design","result":"8特征→12特征"},
                {"id":"c5","icon":"🧮","label":"模型训练","desc":"XGBoost→超参调优","color":"purple","profile":"dev","result":"AUC=0.89"},
                {"id":"c6","icon":"📊","label":"模型评估","desc":"交叉验证→混淆矩阵","color":"orange","profile":"test","result":"AUC=0.89,F1=0.82"},
                {"id":"c7","icon":"📝","label":"模型导出","desc":"ONNX→模型卡","color":"green","profile":"doc","result":"model.onnx(12MB)"},
            ]
        else:
            base = [
                {"id":"g1","icon":"📋","label":"需求分析","desc":"解析用户需求","color":"blue","profile":"analysis","result":"目标定义完成"},
                {"id":"g2","icon":"🧮","label":"方案设计","desc":"技术方案设计","color":"purple","profile":"design","result":"方案已确定"},
                {"id":"g3","icon":"💻","label":"开发实现","desc":"编码实现","color":"green","profile":"dev","result":"代码已提交"},
                {"id":"g4","icon":"🧪","label":"测试验证","desc":"测试验证","color":"purple","profile":"test","result":"测试通过"},
                {"id":"g5","icon":"📝","label":"输出报告","desc":"交付文档","color":"orange","profile":"doc","result":"报告已生成"},
            ]
        return (base * 20)[:count]

    def log_message(self, format, *args):
        print(f"[AgentFlow] {args[0] if args else ''}", file=sys.stderr)


if __name__ == "__main__":
    server = http.server.HTTPServer(("127.0.0.1", PORT), AgentFlowHandler)
    print(f"AgentFlow v3 backend running on http://localhost:{PORT}", file=sys.stderr)
    print(f"API: POST /api/decompose | POST /api/execute", file=sys.stderr)
    print(f"Static: {STATIC_DIR}", file=sys.stderr)
    print(f"Default Agent Model: {DEFAULT_AGENT_MODEL}", file=sys.stderr)
    print(f"ZAI_API_KEY: {'SET' if os.environ.get('ZAI_API_KEY') else 'NOT SET'}", file=sys.stderr)
    print(f"Agent Engine: Compiler + DAG Parallel + AgentRunner", file=sys.stderr)
    print(f"Support: {len(AgentRunner.PROVIDER_CONFIGS)} providers / 6 profile templates", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down", file=sys.stderr)
