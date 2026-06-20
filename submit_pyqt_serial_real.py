#!/usr/bin/env python3
"""Submit a real AgentFlow DAG to generate a PyQt serial assistant."""
import json
import time
import urllib.request
import urllib.error

API = "http://127.0.0.1:19600"
requirement = """
完全通过 AgentFlow 编排生成一个 PyQt 串口助手。
要求：
- Python GUI，优先 PyQt5，缺失时可兼容 PySide6/PySide2，但代码结构要清晰。
- 功能：串口列表刷新、波特率选择、打开/关闭串口、文本发送、接收区显示、HEX发送/显示切换、时间戳、清空、保存日志。
- 串口层优先使用 pyserial；如果环境没有串口设备，测试必须用 mock serial 验证核心逻辑。
- GUI 不能在 import 时阻塞，主循环必须放在 if __name__ == "__main__"。
- 必须生成 app.py、serial_worker.py、README.md、tests/test_smoke.py。
- 必须通过 py_compile 和 pytest/unittest/offscreen smoke test。
""".strip()

nodes = [
    {
        "id": "n1_req", "profile": "doc", "label": "需求拆解", "desc": "拆解串口助手功能与验收标准", "color": "blue", "icon": "📋",
        "params": {"description": "将需求拆成可执行功能清单、模块边界、验收标准。"}
    },
    {
        "id": "n2_arch", "profile": "dev", "label": "架构设计", "desc": "设计 PyQt 串口助手架构", "color": "purple", "icon": "🏗️",
        "depends_on": ["n1_req"],
        "params": {"description": "设计 app.py、serial_worker.py、测试结构和依赖策略，强调 import 不阻塞。"}
    },
    {
        "id": "n3_dev", "profile": "dev", "label": "代码实现", "desc": "实现 PyQt 串口助手", "color": "green", "icon": "💻",
        "depends_on": ["n2_arch"],
        "params": {
            "description": "在当前目录实现完整代码。必须生成 app.py、serial_worker.py、README.md、tests/test_smoke.py。PyQt 缺失时提供可导入 fallback/stub 以便测试核心逻辑。",
            "expected_files": ["app.py", "serial_worker.py", "README.md", "tests/test_smoke.py"],
            "validation_commands": [
                "python3 -m py_compile app.py serial_worker.py",
                "QT_QPA_PLATFORM=offscreen python3 -m pytest -q tests/test_smoke.py"
            ]
        }
    },
    {
        "id": "n4_test", "profile": "test", "label": "测试验证", "desc": "验证串口助手", "color": "orange", "icon": "🧪",
        "depends_on": ["n3_dev"],
        "params": {
            "description": "基于上游真实文件运行 py_compile 和 offscreen pytest，必要时补充测试但不得重写主实现。",
            "expected_files": ["app.py", "serial_worker.py", "tests/test_smoke.py"],
            "validation_commands": [
                "python3 -m py_compile app.py serial_worker.py",
                "QT_QPA_PLATFORM=offscreen python3 -m pytest -q tests/test_smoke.py"
            ]
        }
    },
    {
        "id": "n5_doc", "profile": "doc", "label": "交付文档", "desc": "整理使用说明和测试报告", "color": "gray", "icon": "📦",
        "depends_on": ["n4_test"],
        "params": {
            "description": "基于最终真实代码整理 README/交付说明，说明运行、测试、已知限制。",
            "expected_files": ["README.md"]
        }
    },
]
edges=[]
for n in nodes:
    for dep in n.get('depends_on', []):
        edges.append({'source': dep, 'target': n['id']})

body=json.dumps({'requirement': requirement, 'nodes': nodes, 'edges': edges}, ensure_ascii=False).encode('utf-8')
req=urllib.request.Request(API+'/api/execute', data=body, headers={'Content-Type':'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        data=json.loads(r.read().decode())
    print(json.dumps(data, ensure_ascii=False, indent=2))
except urllib.error.HTTPError as e:
    print('HTTP_ERROR', e.code)
    print(e.read().decode('utf-8', errors='replace'))
    raise
