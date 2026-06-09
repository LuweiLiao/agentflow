#!/usr/bin/env python3
"""AgentFlow 统一后端 — 静态文件 + API + Multi-Provider Agent 执行引擎"""
import os, sys, json, http.server, urllib.request, urllib.error, tempfile, shutil, time

from agent_runner import AgentRunner

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 9600
STATIC_DIR = "/home/llw/www/agentflow"
DEFAULT_AGENT_MODEL = os.environ.get("AGENT_MODEL", "glm-5-turbo")

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


class AgentFlowHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        url = self.path
        if url == "/" or url == "":
            url = "/canvas-demo.html"
        filepath = STATIC_DIR + url
        if not os.path.isfile(filepath):
            filepath = STATIC_DIR + "/canvas-demo.html"
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
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(404, str(e))

    def do_POST(self):
        try:
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
            body = json.loads(self.rfile.read(length))
            requirement = body.get("requirement", "")
            count = int(body.get("count", 4))
        except:
            self.send_error(400, "Invalid request")
            return

        count = max(1, min(count, 100))
        zai_key = os.environ.get("ZAI_API_KEY", "")
        nodes = self.call_llm(requirement, count) if zai_key else self.fallback_template(requirement, count)

        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"nodes": nodes, "count": len(nodes)}).encode())

    def call_llm(self, requirement, count):
        zai_key = os.environ.get("ZAI_API_KEY", "")
        payload = json.dumps({
            "model": "glm-5-turbo",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"需求：{requirement}\nAgent数量：{count}个"}
            ],
            "temperature": 0.7,
            "max_tokens": 3000,
            "response_format": {"type": "json_object"}
        }).encode()

        req = urllib.request.Request(
            "https://open.bigmodel.cn/api/paas/v4/chat/completions",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {zai_key}"
            }, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read())
            content = data["choices"][0]["message"]["content"]
            nodes = json.loads(content)
            if isinstance(nodes, dict) and "nodes" in nodes:
                nodes = nodes["nodes"]
            if isinstance(nodes, list):
                return self.adjust_nodes(nodes, count)
            return self.fallback_template(requirement, count)
        except Exception as e:
            print(f"LLM call failed: {e}", file=sys.stderr)
            return self.fallback_template(requirement, count)

    def adjust_nodes(self, nodes, target):
        nodes = nodes[:target]
        while len(nodes) < target:
            idx = len(nodes) + 1
            nodes.append({
                "id": f"auto_{idx}", "icon": "🔧",
                "label": f"子任务 #{idx}", "desc": "细化子任务",
                "color": "blue", "profile": "test"
            })
        last = nodes[-1]
        if last.get("profile") not in ("doc", "deploy"):
            nodes.append({
                "id": "output", "icon": "📝",
                "label": "输出报告", "desc": "汇总生成交付文档",
                "color": "orange", "profile": "doc",
                "result": "等待执行"
            })
            if len(nodes) > target:
                nodes.pop(-2)
        return nodes[:target]

    # ── /api/execute — Multi-Provider Agent 引擎 ────

    def handle_execute(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            nodes = body.get("nodes", [])
        except:
            self.send_error(400, "Invalid request")
            return

        if not nodes:
            self.send_error(400, "No nodes")
            return

        print(f"[Execute] Starting workflow with {len(nodes)} nodes", file=sys.stderr)
        work_dir = tempfile.mkdtemp(prefix="agentflow_")
        results = []

        for i, node in enumerate(nodes):
            print(f"[Execute] Node {i+1}/{len(nodes)}: {node.get('label','?')}", file=sys.stderr)
            node_dir = os.path.join(work_dir, f"node_{node['id']}")
            os.makedirs(node_dir, exist_ok=True)

            prompt = self.build_agent_prompt(node, i, len(nodes), nodes[:i])

            agent_model = node.get("model", DEFAULT_AGENT_MODEL)
            agent = AgentRunner(model=agent_model)
            result = agent.execute(
                prompt=prompt, work_dir=node_dir,
                profile=node.get("profile", "dev"),
                tools_enabled=True, max_turns=10, timeout=120
            )

            node["result"] = result.get("result", "完成")
            node["output"] = result.get("output", "")[:2000]
            node["cost"] = result.get("cost", 0)
            node["duration"] = result.get("duration_ms", 0)
            node["status"] = result.get("status", "ok")
            node["turns"] = result.get("turns", 1)
            node["model"] = result.get("model", agent_model)
            node["provider"] = result.get("provider", "")
            results.append(node)

            print(f"[Execute] Node {i+1} done: ${node.get('cost',0):.4f} / {node.get('duration',0)}ms", file=sys.stderr)

        try:
            shutil.rmtree(work_dir)
        except:
            pass

        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "nodes": results,
            "total_cost": sum(n.get("cost", 0) for n in results),
            "total_duration": sum(n.get("duration", 0) for n in results)
        }).encode())

    def build_agent_prompt(self, node, idx, total, prev_nodes):
        ctx_lines = []
        if prev_nodes:
            ctx_lines.append("## 上游输出")
            for p in prev_nodes:
                ctx_lines.append(f"- {p.get('label','?')}: {p.get('result','?')}")
        ctx = "\n".join(ctx_lines) if ctx_lines else "无上游依赖"

        return f"""你是一个 {node.get('label','')} Agent（{node.get('profile','')} 角色）。

## 任务说明
{node.get('desc','请完成分配的工作。')}

## 上下文
{ctx}

## 要求
1. 请输出清晰的结构化结果
2. 包含具体的技术方案或代码
3. 适合传递给下一个 Agent 继续处理

## 输出格式
以 ```json 代码块结束，包含:
{{
  "summary": "一句话总结",
  "output": "详细输出内容",
  "files": ["生成的文件列表"],
  "metrics": {{"key": "value"}}
}}"""

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
    server = http.server.HTTPServer(("0.0.0.0", PORT), AgentFlowHandler)
    print(f"AgentFlow v3 backend running on http://localhost:{PORT}", file=sys.stderr)
    print(f"API: POST /api/decompose | POST /api/execute", file=sys.stderr)
    print(f"Static: {STATIC_DIR}", file=sys.stderr)
    print(f"Default Agent Model: {DEFAULT_AGENT_MODEL}", file=sys.stderr)
    print(f"ZAI_API_KEY: {'SET' if os.environ.get('ZAI_API_KEY') else 'NOT SET'}", file=sys.stderr)
    print(f"Agent Engine: Multi-Provider Agent (agent_runner.py)", file=sys.stderr)
    print(f"Supported: DeepSeek/GLM/Grok/GPT/Qwen/Moonshot/Yi/MiniMax/...", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down", file=sys.stderr)
