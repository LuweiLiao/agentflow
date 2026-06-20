#!/usr/bin/env python3
"""Submit curated AgentFlow serial-assistant DAG and monitor until terminal."""
import json, time, urllib.request
from pathlib import Path
ROOT=Path('/home/llw/agentflow')
REQ="""用 PyQt5 实现一个完整的串口调试助手。要求：1) 支持端口扫描、打开/关闭串口、波特率/数据位/停止位/校验位设置；2) 支持 ASCII/HEX 发送与接收显示、时间戳、自动换行、自动滚动、定时发送；3) 支持接收区清空、保存日志；4) 核心串口逻辑必须与 GUI 解耦，能够在无硬件环境下用 fake serial 单元测试；5) 输出完整可运行项目，包含 README.md、requirements.txt、serial_core.py、gui_main_window.py、main.py、test_core.py、test_gui.py；6) 测试节点必须运行 python3 -m pytest 或内置 unittest，不能只写报告。"""
NODES=[
 {"id":"n1","icon":"📋","label":"需求分析","desc":"分析功能需求和输出文件清单","color":"blue","profile":"analysis","depends_on":[]},
 {"id":"n2","icon":"🎨","label":"架构设计","desc":"设计核心逻辑与GUI解耦架构、SerialCore接口、FakeSerial测试方案","color":"blue","profile":"design","depends_on":["n1"]},
 {"id":"n3","icon":"⚙️","label":"开发串口核心","desc":"必须使用 write_file 工具实现 serial_core.py，禁止用 shell heredoc。实现端口扫描、参数配置、ASCII/HEX收发、日志格式化、FakeSerial。","color":"green","profile":"dev","depends_on":["n2"],"params":{"expected_files":["serial_core.py"]}},
 {"id":"n4","icon":"💻","label":"开发GUI界面","desc":"必须使用 write_file 工具实现 gui_main_window.py 和 main.py，GUI 调用 SerialCore，不直接操作串口底层。","color":"green","profile":"dev","depends_on":["n3"],"params":{"expected_files":["serial_core.py","gui_main_window.py","main.py"]}},
 {"id":"n5","icon":"🧪","label":"核心测试","desc":"必须使用 write_file 工具编写 test_core.py，并运行 python3 -m unittest test_core.py。","color":"purple","profile":"test","depends_on":["n4"],"params":{"expected_files":["serial_core.py","test_core.py"],"validation_commands":["python3 -m unittest test_core.py"]}},
 {"id":"n6","icon":"🧪","label":"GUI测试","desc":"必须使用 write_file 工具编写 test_gui.py，并运行 QT_QPA_PLATFORM=offscreen python3 -m unittest test_gui.py；无PyQt环境时测试可优雅skip，但文件必须存在。","color":"purple","profile":"test","depends_on":["n4"],"params":{"expected_files":["gui_main_window.py","main.py","test_gui.py"],"validation_commands":["QT_QPA_PLATFORM=offscreen python3 -m unittest test_gui.py"]}},
 {"id":"n7","icon":"📄","label":"文档与打包","desc":"必须使用 write_file 工具补齐 README.md、requirements.txt，整理最终项目并说明测试命令。","color":"orange","profile":"doc","depends_on":["n5","n6"],"params":{"expected_files":["README.md","requirements.txt","serial_core.py","gui_main_window.py","main.py","test_core.py","test_gui.py"]}},
]
EDGES=[{'source':d,'target':n['id']} for n in NODES for d in n.get('depends_on',[])]
def post(url,payload):
 data=json.dumps(payload,ensure_ascii=False).encode(); req=urllib.request.Request(url,data=data,headers={'Content-Type':'application/json'},method='POST')
 with urllib.request.urlopen(req,timeout=20) as r: return json.loads(r.read())
def get(url):
 with urllib.request.urlopen(url,timeout=10) as r: return json.loads(r.read())
run=post('http://127.0.0.1:19600/api/runs',{'nodes':NODES,'edges':EDGES,'requirement':REQ})
rid=run['run_id']; print('RUN_ID',rid,flush=True)
last=None
while True:
 r=get(f'http://127.0.0.1:19600/api/runs/{rid}')
 state=(r['status'],[(n['node_id'],n['label'],n['profile'],n['status']) for n in r['nodes']])
 s=json.dumps(state,ensure_ascii=False)
 if s!=last:
  print(time.strftime('%H:%M:%S'),s,flush=True); last=s
 if r['status'] in ('completed','failed','cancelled'):
  out=ROOT/'.agentflow'/f'{rid}_final.json'; out.write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
  print('FINAL_JSON',out,flush=True); print('WORKSPACE',r.get('workspace_path'),flush=True); break
 time.sleep(8)
