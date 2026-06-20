#!/usr/bin/env python3
"""Run AgentFlow serial-assistant workflow end-to-end with screenshots."""
import json
import os
import sqlite3
import subprocess
import time
import urllib.request
from pathlib import Path

ROOT = Path('/home/llw/agentflow')
SHOT_DIR = ROOT / '.agentflow' / 'screenshots' / time.strftime('%Y%m%d_%H%M%S')
SHOT_DIR.mkdir(parents=True, exist_ok=True)
REQ = """用 PyQt5 实现一个完整的串口调试助手。要求：1) 支持端口扫描、打开/关闭串口、波特率/数据位/停止位/校验位设置；2) 支持 ASCII/HEX 发送与接收显示、时间戳、自动换行、自动滚动、定时发送；3) 支持接收区清空、保存日志；4) 核心串口逻辑必须与 GUI 解耦，能够在无硬件环境下用 fake serial 单元测试；5) 输出完整可运行项目，包含 README.md、requirements.txt、serial_core.py、gui_main_window.py、main.py、test_core.py、test_gui.py；6) 测试节点必须运行 python3 -m pytest 或内置 unittest，不能只写报告。"""
NODES = [
    {"id":"n1","icon":"📋","label":"需求分析","desc":"分析功能需求和输出文件清单","color":"blue","profile":"analysis","depends_on":[]},
    {"id":"n2","icon":"🎨","label":"架构设计","desc":"设计核心逻辑与GUI解耦架构、SerialCore接口、FakeSerial测试方案","color":"blue","profile":"design","depends_on":["n1"]},
    {"id":"n3","icon":"⚙️","label":"开发串口核心","desc":"实现 serial_core.py：端口扫描、参数配置、ASCII/HEX收发、日志格式化、FakeSerial","color":"green","profile":"dev","depends_on":["n2"],"params":{"expected_files":["serial_core.py"]}},
    {"id":"n4","icon":"💻","label":"开发GUI界面","desc":"实现 gui_main_window.py 和 main.py，GUI 调用 SerialCore，不直接操作串口底层","color":"green","profile":"dev","depends_on":["n3"],"params":{"expected_files":["serial_core.py","gui_main_window.py","main.py"]}},
    {"id":"n5","icon":"🧪","label":"核心测试","desc":"编写 test_core.py 并运行测试，覆盖 FakeSerial、收发、HEX、参数、日志等","color":"purple","profile":"test","depends_on":["n4"],"params":{"expected_files":["serial_core.py","test_core.py"],"validation_commands":["python3 -m unittest test_core.py"]}},
    {"id":"n6","icon":"🧪","label":"GUI测试","desc":"编写 test_gui.py，优先使用 unittest + offscreen；如环境无PyQt也要提供可跳过测试逻辑","color":"purple","profile":"test","depends_on":["n4"],"params":{"expected_files":["gui_main_window.py","main.py","test_gui.py"],"validation_commands":["QT_QPA_PLATFORM=offscreen python3 -m unittest test_gui.py"]}},
    {"id":"n7","icon":"📄","label":"文档与打包","desc":"补齐 README.md、requirements.txt，整理最终项目并说明测试命令","color":"orange","profile":"doc","depends_on":["n5","n6"],"params":{"expected_files":["README.md","requirements.txt","serial_core.py","gui_main_window.py","main.py","test_core.py","test_gui.py"]}},
]
EDGES = []
for n in NODES:
    for dep in n.get('depends_on', []):
        EDGES.append({'source': dep, 'target': n['id']})

def req_json(url, payload):
    data=json.dumps(payload, ensure_ascii=False).encode()
    r=urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'}, method='POST')
    with urllib.request.urlopen(r, timeout=20) as resp:
        return json.loads(resp.read())

def get_json(url):
    with urllib.request.urlopen(url, timeout=10) as resp:
        return json.loads(resp.read())

def screenshot(name):
    out = SHOT_DIR / name
    code = f"""
const {{ chromium }} = require('playwright');
(async () => {{
  const browser = await chromium.launch({{headless:true}});
  const page = await browser.newPage({{viewport:{{width:1440,height:1100}}, deviceScaleFactor:1}});
  await page.goto('http://127.0.0.1:19600', {{waitUntil:'networkidle'}});
  await page.screenshot({{path:{json.dumps(str(out))}, fullPage:true}});
  await browser.close();
}})();
"""
    subprocess.run(['node','-e',code], cwd=ROOT, check=True, timeout=60)
    print('SCREENSHOT', out, flush=True)

screenshot('01_before_submit.png')
run = req_json('http://127.0.0.1:19600/api/runs', {'nodes':NODES,'edges':EDGES,'requirement':REQ})
run_id = run['run_id']
print('RUN_ID', run_id, flush=True)
time.sleep(2)
screenshot('02_submitted.png')
last=None
while True:
    r=get_json(f'http://127.0.0.1:19600/api/runs/{run_id}')
    state=(r['status'], tuple((n['node_id'],n['status']) for n in r['nodes']))
    if state!=last:
        print('STATE', json.dumps(state,ensure_ascii=False), flush=True)
        last=state
        # screenshot on each state change
        screenshot(f"state_{int(time.time())}_{r['status']}.png")
    if r['status'] in ('completed','failed','cancelled'):
        (SHOT_DIR/'final_run.json').write_text(json.dumps(r,ensure_ascii=False,indent=2), encoding='utf-8')
        print('FINAL', json.dumps({'status':r['status'], 'workspace_path':r.get('workspace_path'), 'total_cost':r.get('total_cost')}, ensure_ascii=False), flush=True)
        break
    time.sleep(8)
print('SHOT_DIR', SHOT_DIR, flush=True)
