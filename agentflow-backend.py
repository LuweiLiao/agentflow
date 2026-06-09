#!/usr/bin/env python3
"""AgentFlow 后端代理 — 调用 GLM-5-Turbo 替代硬编码模板"""
import os, sys, json, http.server, urllib.request, urllib.error

ZAI_API_KEY = os.environ.get("ZAI_API_KEY", "")
if not ZAI_API_KEY:
    print("WARNING: ZAI_API_KEY not set, using fallback templates", file=sys.stderr)

API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 9601
STATIC_DIR = "/home/llw/www/agentflow"

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
        self.send_cors()
        self.end_headers()

    def send_cors(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_GET(self):
        if self.path == "/" or self.path == "":
            self.path = "/canvas-demo.html"
        # Serve static files
        filepath = STATIC_DIR + self.path
        if not os.path.isfile(filepath):
            filepath = STATIC_DIR + "/canvas-demo.html"
        try:
            with open(filepath, "rb") as f:
                content = f.read()
            ext = os.path.splitext(filepath)[1].lstrip('.')
            mime = {"html":"text/html","js":"text/javascript","css":"text/css","png":"image/png","jpg":"image/jpeg",
                    "svg":"image/svg+xml","json":"application/json","ico":"image/x-icon"}.get(ext, "application/octet-stream")
            self.send_response(200)
            self.send_header("Content-Type", mime + "; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(404, str(e))

    def do_POST(self):
        self.send_cors()
        if self.path == "/api/decompose":
            self.handle_decompose()
        else:
            self.send_error(404)

    def handle_decompose(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            requirement = body.get("requirement", "")
            count = int(body.get("count", 4))
        except:
            self.send_error(400, "Invalid request body")
            return

        count = max(1, min(count, 100))

        if ZAI_API_KEY:
            nodes = self.call_llm(requirement, count)
        else:
            nodes = self.fallback_template(requirement, count)

        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"nodes": nodes, "count": len(nodes)}).encode())

    def call_llm(self, requirement, count):
        payload = json.dumps({
            "model": "glm-5-turbo",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"需求：{requirement}\nAgent数量：{count}个"}
            ],
            "temperature": 0.7,
            "max_tokens": 2000,
            "response_format": {"type": "json_object"}
        }).encode()

        req = urllib.request.Request(API_URL, data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ZAI_API_KEY}"
            },
            method="POST")

        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read())
            content = data["choices"][0]["message"]["content"]
            # 提取 JSON 数组
            nodes = json.loads(content)
            if isinstance(nodes, dict) and "nodes" in nodes:
                nodes = nodes["nodes"]
            if isinstance(nodes, list):
                # 确保数量匹配
                return self.adjust_nodes(nodes, count)
            return self.fallback_template(requirement, count)
        except Exception as e:
            print(f"LLM call failed: {e}", file=sys.stderr)
            return self.fallback_template(requirement, count)

    def adjust_nodes(self, nodes, target):
        """确保节点数量匹配用户需求"""
        nodes = nodes[:target]  # 截断
        while len(nodes) < target:
            # 补齐
            idx = len(nodes) + 1
            nodes.append({
                "id": f"auto_{idx}", "icon": "🔧",
                "label": f"子任务 #{idx}", "desc": "细化子任务",
                "color": "blue"
            })
        # 保证最后一个节点是输出报告类
        last = nodes[-1]
        if not any(kw in last["label"] for kw in ["输出","报告","文档","总结"]):
            nodes.append({
                "id": "output", "icon": "📝",
                "label": "输出报告", "desc": "汇总生成交付文档",
                "color": "orange"
            })
            if len(nodes) > target:
                nodes.pop(-2)
        return nodes[:target]

    def fallback_template(self, requirement, count):
        """无 API key 时的降级模板"""
        t = requirement.lower()
        if any(kw in t for kw in ["pid","控制器","四旋翼","无人机"]):
            base = [
                {"id":"r1","icon":"📋","label":"需求分析","desc":"解析需求 → 确定控制目标","color":"blue"},
                {"id":"r2","icon":"🧮","label":"系统建模","desc":"动力学模型 → 传递函数","color":"blue"},
                {"id":"r3","icon":"📐","label":"控制器设计","desc":"Ziegler-Nichols PID整定","color":"purple"},
                {"id":"r4","icon":"💻","label":"C++代码生成","desc":"ArduPilot→PID.cpp","color":"green"},
                {"id":"r5","icon":"🧪","label":"编译测试","desc":"scons编译+单元测试","color":"purple"},
                {"id":"r6","icon":"📝","label":"输出报告","desc":"综合生成报告","color":"orange"},
            ]
        elif any(kw in t for kw in ["网站","官网","web","前端","后端"]):
            base = [
                {"id":"w1","icon":"📋","label":"需求分析","desc":"功能需求→技术选型","color":"blue"},
                {"id":"w2","icon":"🎨","label":"UI/UX设计","desc":"页面原型设计","color":"orange"},
                {"id":"w3","icon":"💻","label":"前端开发","desc":"React+Tailwind","color":"green"},
                {"id":"w4","icon":"⚙️","label":"后端API","desc":"FastAPI REST","color":"green"},
                {"id":"w5","icon":"🗄️","label":"数据库设计","desc":"PostgreSQL Schema","color":"blue"},
                {"id":"w6","icon":"🧪","label":"集成测试","desc":"API测试+联调","color":"purple"},
                {"id":"w7","icon":"🌐","label":"部署发布","desc":"Docker→服务器","color":"green"},
            ]
        elif any(kw in t for kw in ["机器","训练","模型","ml","预测"]):
            base = [
                {"id":"m1","icon":"📋","label":"需求分析","desc":"问题定义→目标设定","color":"blue"},
                {"id":"m2","icon":"📊","label":"数据采集","desc":"多数据源ETL","color":"blue"},
                {"id":"m3","icon":"🔍","label":"数据探索EDA","desc":"统计分析→可视化","color":"orange"},
                {"id":"m4","icon":"🧹","label":"数据预处理","desc":"清洗→特征工程","color":"purple"},
                {"id":"m5","icon":"🧮","label":"模型训练","desc":"XGBoost+超参调优","color":"purple"},
                {"id":"m6","icon":"📊","label":"模型评估","desc":"交叉验证→指标","color":"orange"},
                {"id":"m7","icon":"📝","label":"模型导出","desc":"ONNX+模型卡","color":"green"},
            ]
        else:
            base = [
                {"id":"g1","icon":"📋","label":"需求分析","desc":"解析用户需求","color":"blue"},
                {"id":"g2","icon":"🧮","label":"方案设计","desc":"技术方案设计","color":"purple"},
                {"id":"g3","icon":"💻","label":"开发实现","desc":"编码实现","color":"green"},
                {"id":"g4","icon":"🧪","label":"测试验证","desc":"测试验证","color":"purple"},
                {"id":"g5","icon":"📝","label":"输出报告","desc":"交付文档","color":"orange"},
            ]

        return (base * 20)[:count]

    def log_message(self, format, *args):
        print(f"[AgentFlow] {args[0] if args else ''}", file=sys.stderr)

if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", PORT), AgentFlowHandler)
    print(f"AgentFlow backend running on http://localhost:{PORT}", file=sys.stderr)
    print(f"API: POST /api/decompose", file=sys.stderr)
    print(f"Static: {STATIC_DIR}", file=sys.stderr)
    print(f"ZAI_API_KEY: {'SET' if ZAI_API_KEY else 'NOT SET (using fallback)'}", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down", file=sys.stderr)
