#!/usr/bin/env python3
"""AgentFlow 统一后端 — 静态文件 + API + Compiler + DAG 并行执行引擎"""
import http.server
import json
import os
import re
import shutil
import sys
import tempfile
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed

from agent_runner import AgentRunner
from agentflow_schema import (
    NodeDef,
    WorkflowJSON,
    parallel_groups,
    validate_workflow,
)
from artifact_store import ArtifactStore
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

        # API 路由
        if url == "/api/runs":
            self._handle_list_runs()
            return
        if url.startswith("/api/runs/"):
            run_id = url.split("/")[-1]
            self._handle_get_run(run_id)
            return
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
            elif self.path == "/api/execute/stream":
                self.handle_execute_stream()
            else:
                self.send_error(404)
        except Exception as e:
            print(f"[AgentFlow] POST error: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            try:
                self.send_error(500, str(e))
            except Exception:
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
        except (json.JSONDecodeError, KeyError, ValueError, TypeError):
            self.send_error(400, "Invalid request")
            return

        count = max(1, min(count, 100))
        # 用 AgentRunner 自动检测可用 API key
        try:
            test_runner = AgentRunner(model=os.environ.get("AGENT_MODEL", "deepseek-chat"))
            has_key = bool(test_runner.api_key)
        except Exception:
            has_key = False
        nodes = self.call_llm(requirement, count) if has_key else self.fallback_template(requirement, count)

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
        """用 AgentRunner 调用 LLM 进行工作流编排，替代手写 urllib。"""
        model = os.environ.get("AGENT_MODEL", "glm-5-turbo")
        try:
            agent = AgentRunner(model=model)
            if not agent.api_key:
                print("[call_llm] No API key available", file=sys.stderr)
                return self.fallback_template(requirement, count)
        except Exception as e:
            print(f"[call_llm] Agent init failed: {e}", file=sys.stderr)
            return self.fallback_template(requirement, count)

        prompt = f"""你是一个工作流编排专家。将以下需求拆解为 {count} 个子任务。

需求: {requirement}
Agent数量: {count}

返回格式: **纯 JSON 数组，不要其他文字，不要 markdown 代码块**
每个元素包含: id, icon, label, desc, color, profile
profile 必须是: analysis/design/dev/test/doc/deploy 之一

返回的数组长度必须 = {count}"""

        result = agent.execute(
            prompt=prompt,
            tools_enabled=False,
            max_turns=1,
            timeout=45,
        )
        content = result.get("output", "[]").strip()
        # 提取 JSON
        json_match = re.search(r'\[.*?\]', content, re.DOTALL)
        if json_match:
            content = json_match.group()
        try:
            nodes = json.loads(content)
            if isinstance(nodes, dict) and "nodes" in nodes:
                nodes = nodes["nodes"]
            if isinstance(nodes, list):
                return self.adjust_nodes(nodes, count)
        except json.JSONDecodeError as e:
            print(f"[call_llm] JSON parse failed: {e}", file=sys.stderr)
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
        except (json.JSONDecodeError, KeyError, ValueError, TypeError):
            self.send_error(400, "Invalid request")
            return

        if not nodes:
            self.send_error(400, "No nodes")
            return

        # ── 初始化 ───────────────────────────────────
        run_id = f"run_{uuid.uuid4().hex[:12]}"
        store = ArtifactStore(run_id)
        store.save_meta({
            "requirement": requirement[:100],
            "node_count": len(nodes),
            "created": time.time(),
        })

        # 构建 WorkflowJSON
        wf = WorkflowJSON.from_api_request(nodes, requirement, edges)
        errs = validate_workflow(wf)
        if errs:
            print(f"[Execute] Validation errors: {errs}", file=sys.stderr)
            # 验证失败则中止执行
            self._send_json(400, {
                "error": "工作流验证失败",
                "details": errs,
                "run_id": run_id,
            })
            return

        compiler = PromptCompiler(TEMPLATE_DIR)
        work_dir = tempfile.mkdtemp(prefix=f"agentflow_{run_id}_")
        node_map = {n.id: n for n in wf.nodes}

        # DAG 分组
        groups = parallel_groups(wf.nodes, wf.edges)
        print(f"[Execute] {run_id}: {len(groups)} groups / {len(nodes)} nodes", file=sys.stderr)

        all_results = []
        upstream_results: dict[str, str] = {}  # {node_id: output_text}

        # ── 逐层执行（动态编译） ─────────────────────
        for group_idx, group_nodes in enumerate(groups):
            print(f"[Execute] Group {group_idx}: {[n.id for n in group_nodes]}", file=sys.stderr)

            # 每层开始前重新编译（注入已执行的上游真实输出）
            layer_tasks = compiler.compile(wf, upstream_results=upstream_results)
            # 只取当前层的 task
            group_task_ids = {n.id for n in group_nodes}
            current_tasks = [t for t in layer_tasks if t.node_id in group_task_ids]

            if not current_tasks:
                print(f"[Execute] Group {group_idx}: no tasks found, skipping", file=sys.stderr)
                continue

            # 并行执行同层节点
            with ThreadPoolExecutor(max_workers=len(group_nodes)) as pool:
                fut_to_node = {}
                for task in current_tasks:
                    node = node_map.get(task.node_id)
                    if not node:
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

                    # 保存到 ArtifactStore（持久化，下游可读）
                    store.save_raw(node.id, result)

                    # 注入到 upstream_results（供下一层编译使用）
                    output_text = result.get("output", "") or result.get("result", "")
                    upstream_results[node.id] = output_text[:2000]

                    all_results.append(node.to_dict())
                    print(f"[Execute] Node {node.id} done: ${node.cost:.4f} / {result.get('duration',0)}ms", file=sys.stderr)

        # 清理临时工作目录
        try:
            shutil.rmtree(work_dir)
        except OSError:
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
            "run_id": run_id,
            "artifact_dir": store.run_dir,
        }).encode())

    # ── 流式执行 (SSE) ─────────────────────────────────

    def _stream_send_event(self, event: str, data: dict):
        """发送 SSE 事件（需在流式响应头之后调用）。"""
        payload = f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
        try:
            self.wfile.write(payload.encode())
            self.wfile.flush()
        except Exception:
            pass  # 连接断开，忽略

    def _send_sse_headers(self):
        """发送 SSE 响应头。"""
        self.send_response(200)
        origin = self.headers.get("Origin", "")
        cors = self._cors_headers(origin)
        for k, v in cors.items():
            self.send_header(k, v)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()

    def handle_execute_stream(self):
        """流式执行 — 每个节点完成即发送 SSE 事件。"""
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length > MAX_BODY_SIZE:
                self.send_error(413, f"请求体过大 ({length} > {MAX_BODY_SIZE})")
                return
            body = json.loads(self.rfile.read(length))
            nodes = body.get("nodes", [])
            edges = body.get("edges", [])
            requirement = body.get("requirement", "")
        except (json.JSONDecodeError, KeyError, ValueError, TypeError):
            self.send_error(400, "Invalid request")
            return

        if not nodes:
            self.send_error(400, "No nodes")
            return

        # ── 初始化 ───────────────────────────────────
        run_id = f"run_{uuid.uuid4().hex[:12]}"
        store = ArtifactStore(run_id)
        store.save_meta({
            "requirement": requirement[:100],
            "node_count": len(nodes),
            "created": time.time(),
        })

        wf = WorkflowJSON.from_api_request(nodes, requirement, edges)
        errs = validate_workflow(wf)
        if errs:
            self._stream_send_event("error", {
                "error": "工作流验证失败",
                "details": errs,
                "run_id": run_id,
            })
            return

        self._send_sse_headers()

        compiler = PromptCompiler(TEMPLATE_DIR)
        work_dir = tempfile.mkdtemp(prefix=f"agentflow_{run_id}_")
        node_map = {n.id: n for n in wf.nodes}
        groups = parallel_groups(wf.nodes, wf.edges)
        all_results = []
        upstream_results: dict[str, str] = {}

        self._stream_send_event("workflow_start", {
            "run_id": run_id,
            "total_nodes": len(nodes),
            "total_groups": len(groups),
        })

        # ── 逐层执行（动态编译） ─────────────────────
        for group_idx, group_nodes in enumerate(groups):
            layer_tasks = compiler.compile(wf, upstream_results=upstream_results)
            group_task_ids = {n.id for n in group_nodes}
            current_tasks = [t for t in layer_tasks if t.node_id in group_task_ids]

            if not current_tasks:
                continue

            # 发送 group 开始事件
            self._stream_send_event("group_start", {
                "group_idx": group_idx,
                "total_groups": len(groups),
                "nodes": [{"id": n.id, "label": n.label} for n in group_nodes],
            })

            with ThreadPoolExecutor(max_workers=len(group_nodes)) as pool:
                fut_to_node = {}
                for task in current_tasks:
                    node = node_map.get(task.node_id)
                    if not node:
                        continue
                    node_dir = os.path.join(work_dir, f"node_{node.id}")
                    os.makedirs(node_dir, exist_ok=True)

                    # 发送节点开始事件
                    self._stream_send_event("node_start", {
                        "node_id": node.id,
                        "label": node.label,
                        "profile": node.profile,
                        "group_idx": group_idx,
                    })

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

                    node.result = result.get("result", "")
                    node.output = result.get("output", "")[:2000]
                    node.status = result.get("status", "error")
                    node.cost = result.get("cost", 0)
                    node.duration = result.get("duration", 0)
                    node.turns = result.get("turns", 0)
                    node.provider = result.get("provider", "")
                    node.model = result.get("model", node.model or DEFAULT_AGENT_MODEL)

                    store.save_raw(node.id, result)

                    output_text = result.get("output", "") or result.get("result", "")
                    upstream_results[node.id] = output_text[:2000]

                    node_dict = node.to_dict()
                    all_results.append(node_dict)

                    # 发送节点完成事件
                    self._stream_send_event("node_complete", {
                        "node_id": node.id,
                        "label": node.label,
                        "status": result.get("status", "ok"),
                        "result": node.result[:500],
                        "cost": node.cost,
                        "duration_ms": node.duration,
                        "turns": node.turns,
                        "model": node.model,
                        "provider": node.provider,
                    })

            self._stream_send_event("group_complete", {
                "group_idx": group_idx,
                "completed": len(current_tasks),
            })

        # 清理
        try:
            shutil.rmtree(work_dir)
        except OSError:
            pass

        # 发送完成事件
        self._stream_send_event("workflow_done", {
            "run_id": run_id,
            "nodes": all_results,
            "total_cost": sum(r.get("cost", 0) for r in all_results),
            "total_duration": sum(r.get("duration", 0) for r in all_results),
            "groups": [len(g) for g in groups],
            "artifact_dir": store.run_dir,
        })

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

    # ── Run History API ──────────────────────────────────

    def _handle_list_runs(self):
        """GET /api/runs — 列出所有执行历史。"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        runs = ArtifactStore.list_runs()
        self._send_json(200, {"runs": runs, "count": len(runs)})

    def _handle_get_run(self, run_id: str):
        """GET /api/runs/<run_id> — 获取指定 run 的完整结果。"""
        if not self._require_auth():
            self._send_json(401, {"error": "Unauthorized"})
            return
        store = ArtifactStore(run_id)
        meta_path = os.path.join(store.run_dir, "meta.json")
        if not os.path.isfile(meta_path):
            self._send_json(404, {"error": f"Run {run_id} not found"})
            return
        with open(meta_path) as f:
            meta = json.load(f)
        # 读取所有节点结果
        nodes = []
        if os.path.isdir(store.envelopes_dir):
            for fname in sorted(os.listdir(store.envelopes_dir)):
                if fname.endswith(".json"):
                    node_id = fname[:-5]
                    env = store.load(node_id)
                    if env:
                        nodes.append({
                            "node_id": node_id,
                            "status": env.status,
                            "summary": env.summary,
                            "cost": env.metrics.cost,
                            "duration_ms": env.metrics.duration_ms,
                            "model": env.metrics.model,
                            "provider": env.metrics.provider,
                        })
        self._send_json(200, {"run_id": run_id, "meta": meta, "nodes": nodes})

    def _send_json(self, status: int, data: dict):
        """发送 JSON 响应。"""
        self.send_response(status)
        origin = self.headers.get("Origin", "")
        cors = self._cors_headers(origin)
        for k, v in cors.items():
            self.send_header(k, v)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False, indent=2).encode())

    def log_message(self, format, *args):
        print(f"[AgentFlow] {args[0] if args else ''}", file=sys.stderr)


if __name__ == "__main__":
    server = http.server.HTTPServer(("127.0.0.1", PORT), AgentFlowHandler)
    print(f"AgentFlow v3 backend running on http://localhost:{PORT}", file=sys.stderr)
    print("API: POST /api/decompose | POST /api/execute | POST /api/execute/stream", file=sys.stderr)
    print(f"Static: {STATIC_DIR}", file=sys.stderr)
    print(f"Default Agent Model: {DEFAULT_AGENT_MODEL}", file=sys.stderr)
    print("Agent Engine: Provider Adapter + Compiler + DAG Parallel", file=sys.stderr)
    print(f"Support: {len(AgentRunner.PROVIDER_CONFIGS)} providers / 6 profile templates", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down", file=sys.stderr)
