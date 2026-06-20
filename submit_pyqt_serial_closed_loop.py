#!/usr/bin/env python3
"""Submit a detailed closed-loop AgentFlow workflow for PyQt serial assistant."""
import json
import urllib.request

API = "http://127.0.0.1:19600/api/runs"

requirement = """
完全通过 AgentFlow 编排实现一个 PyQt 串口调试助手，并体现闭环反馈流。
产品要求：
1. PyQt5 GUI：端口选择、波特率/数据位/停止位/校验位、打开/关闭串口、发送文本/HEX、接收显示、时间戳、自动滚屏、清空、保存日志。
2. 核心逻辑必须和 GUI 解耦：SerialPortConfig、SerialFrame、SerialBackend/MockSerialBackend、HEX 编解码、日志格式化可单元测试。
3. 无真实串口时必须支持 MOCK_SERIAL=1 自测；PyQt 缺失时测试核心逻辑仍能通过。
4. 测试必须覆盖：配置校验、HEX合法/非法输入、文本发送、HEX发送、接收帧格式、日志保存、GUI import/offscreen smoke。
5. 编排必须有闭环：测试/审查节点失败时把具体证据反馈给开发节点，开发节点带 feedback_history 返修后重新进入测试。
""".strip()

nodes = [
    {
        "id": "n1_spec",
        "icon": "📋",
        "label": "规格细化",
        "desc": "输出细粒度 PRD、验收清单、测试矩阵。必须明确 GUI 控件、串口参数、错误处理、Mock模式、文件清单。",
        "color": "blue",
        "profile": "analysis",
        "depends_on": [],
        "params": {
            "expected_files": ["SPEC.md"],
            "validation_commands": ["test -s SPEC.md && grep -q '闭环' SPEC.md && grep -q 'HEX' SPEC.md"]
        }
    },
    {
        "id": "n2_arch",
        "icon": "🏗️",
        "label": "架构设计",
        "desc": "基于 SPEC.md 设计文件结构和模块边界，输出 ARCHITECTURE.md。必须包含核心逻辑/GUI/测试三层边界。",
        "color": "cyan",
        "profile": "design",
        "depends_on": ["n1_spec"],
        "params": {
            "expected_files": ["ARCHITECTURE.md"],
            "validation_commands": ["test -s ARCHITECTURE.md && grep -q 'SerialBackend' ARCHITECTURE.md && grep -q 'GUI' ARCHITECTURE.md"]
        }
    },
    {
        "id": "n3_core_dev",
        "icon": "🔌",
        "label": "核心串口层开发",
        "desc": "实现可测试核心层。必须生成 serial_core.py 和 tests/test_serial_core.py。不得依赖 PyQt 才能测试核心逻辑。",
        "color": "green",
        "profile": "dev",
        "depends_on": ["n2_arch"],
        "params": {
            "expected_files": ["serial_core.py", "tests/test_serial_core.py"],
            "validation_commands": ["python3 -m py_compile serial_core.py", "python3 -m pytest -q tests/test_serial_core.py"]
        }
    },
    {
        "id": "n4_gui_dev",
        "icon": "🖥️",
        "label": "PyQt GUI开发",
        "desc": "基于 serial_core.py 实现 app.py。GUI需包含端口/波特率/格式选择、收发区、HEX切换、时间戳、保存日志。PyQt缺失时提供导入友好的fallback，不阻塞测试。",
        "color": "green",
        "profile": "dev",
        "depends_on": ["n3_core_dev"],
        "params": {
            "expected_files": ["app.py", "serial_core.py", "tests/test_serial_core.py"],
            "validation_commands": ["python3 -m py_compile app.py serial_core.py", "python3 - <<'PY'\nimport app\nprint('app import ok')\nPY"]
        }
    },
    {
        "id": "n5_tests",
        "icon": "🧪",
        "label": "自动化测试与闭环反馈",
        "desc": "基于真实上游文件补充 tests/test_app_smoke.py，运行核心测试和GUI offscreen/import测试。若失败，必须保留失败证据供 loop_to=n4_gui_dev 返修。",
        "color": "purple",
        "profile": "test",
        "depends_on": ["n4_gui_dev"],
        "params": {
            "loop_to": "n4_gui_dev",
            "max_loop_iterations": 2,
            "expected_files": ["app.py", "serial_core.py", "tests/test_serial_core.py", "tests/test_app_smoke.py"],
            "validation_commands": [
                "python3 -m py_compile app.py serial_core.py",
                "python3 -m pytest -q tests/test_serial_core.py tests/test_app_smoke.py"
            ]
        }
    },
    {
        "id": "n6_review",
        "icon": "🔍",
        "label": "产品细节审查闭环",
        "desc": "审查串口助手细节是否足够：参数组合、异常提示、HEX错误、日志保存、Mock模式、README运行说明。输出 REVIEW.md；如缺陷明显，通过质量门控失败触发 loop_to=n4_gui_dev。",
        "color": "orange",
        "profile": "test",
        "depends_on": ["n5_tests"],
        "params": {
            "loop_to": "n4_gui_dev",
            "max_loop_iterations": 1,
            "expected_files": ["REVIEW.md", "app.py", "serial_core.py"],
            "validation_commands": [
                "test -s REVIEW.md",
                "grep -q 'HEX' REVIEW.md && grep -q '日志' REVIEW.md && grep -q 'Mock' REVIEW.md",
                "python3 -m pytest -q tests/test_serial_core.py tests/test_app_smoke.py"
            ]
        }
    },
    {
        "id": "n7_doc",
        "icon": "📦",
        "label": "交付文档与打包说明",
        "desc": "生成 README.md、requirements.txt、运行说明、功能清单、测试结果摘要。",
        "color": "yellow",
        "profile": "doc",
        "depends_on": ["n6_review"],
        "params": {
            "expected_files": ["README.md", "requirements.txt", "app.py", "serial_core.py"],
            "validation_commands": ["test -s README.md && grep -q '串口' README.md && grep -q 'pytest' README.md"]
        }
    }
]

edges = []
for node in nodes:
    for dep in node.get("depends_on", []):
        edges.append({"source": dep, "target": node["id"]})

payload = {"requirement": requirement, "nodes": nodes, "edges": edges, "workflow_id": "wf_pyqt_serial_closed_loop_v1"}
req = urllib.request.Request(API, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
with urllib.request.urlopen(req, timeout=30) as r:
    data = json.load(r)
print(json.dumps(data, ensure_ascii=False, indent=2))
