#!/usr/bin/env python3
"""提交一个 PyQt 串口助手工作流到后端，验证端到端执行。"""
import json, urllib.request, time, sys

BACKEND = "http://127.0.0.1:18080"
AUTH_TOKEN = "test-key"

def api_post(path, body):
    req = urllib.request.Request(f"{BACKEND}{path}",
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {AUTH_TOKEN}",
        })
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"[ERROR] HTTP {e.code}: {e.read().decode()[:300]}")
        return None

# 1. 先编排分解需求
requirement = "用 PyQt5 实现一个串口调试助手，功能包括：端口扫描、波特率设置（9600/115200/921600）、数据收发（ASCII/HEX 两种模式）、自动滚动、发送间隔定时器、数据导出。"

print("=== 1. 编排分解 ===")
decomposed = api_post("/api/decompose", {
    "requirement": requirement,
    "count": 5
})
if decomposed:
    nodes = decomposed.get("nodes", [])
    edges = decomposed.get("edges", [])
    print(f"分解成功: {len(nodes)} 节点, {len(edges)} 边")
    for n in nodes:
        print(f"  {n['id']}: {n['label']} ({n['profile']})")
else:
    print("分解失败，使用预定义模板")
    nodes = [
        {"id": "1", "icon": "📋", "label": "需求分析", "desc": "分析串口调试助手需求", "color": "#FF6B6B", "profile": "analysis"},
        {"id": "2", "icon": "📐", "label": "系统设计", "desc": "设计UI和模块架构", "color": "#4ECDC4", "profile": "design", "depends_on": ["1"]},
        {"id": "3", "icon": "💻", "label": "核心开发", "desc": "实现串口收发GUI", "color": "#45B7D1", "profile": "dev", "depends_on": ["2"]},
        {"id": "4", "icon": "🧪", "label": "功能测试", "desc": "测试所有功能", "color": "#96CEB4", "profile": "test", "depends_on": ["3"]},
    ]
    edges = [{"source": "1", "target": "2"}, {"source": "2", "target": "3"}, {"source": "3", "target": "4"}]

# 2. 提交执行 - 使用 SSE 流式端点，方便实时查看进度
print("\n=== 2. 提交执行 ===")
run_body = {
    "requirement": requirement,
    "nodes": nodes,
    "edges": edges,
}
result = api_post("/api/runs", run_body)
if result and "run_id" in result:
    run_id = result["run_id"]
    print(f"已提交: run_id={run_id}, status={result.get('status')}")
    
    # 3. 轮询等待完成
    print("\n=== 3. 等待执行 ===")
    timeout = 600  # 10分钟
    poll = 5
    waited = 0
    while waited < timeout:
        status = api_post(f"/api/runs", run_body)  # just checking
        # Actually, GET the run status
        req = urllib.request.Request(f"{BACKEND}/api/runs/{run_id}",
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"})
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                run_data = json.loads(resp.read())
                st = run_data.get("status", "unknown")
                nodes_st = [(n.get("node_id"), n.get("status")) for n in run_data.get("nodes", [])]
                cost = run_data.get("total_cost", 0)
                print(f"  [{waited}s] status={st}, cost=${cost:.4f}, nodes={nodes_st}")
                if st in ("completed", "failed"):
                    print(f"\n=== 完成: {st} ===")
                    print(f"总成本: ${cost:.4f}")
                    for n in run_data.get("nodes", []):
                        print(f"  {n.get('node_id')}: {n.get('status')} cost=${n.get('cost',0):.4f} turns={n.get('turns',0)}")
                    break
        except Exception as e:
            print(f"  [{waited}s] poll error: {e}")
        time.sleep(poll)
        waited += poll
    else:
        print("超时，工作流未完成")
else:
    print(f"提交失败: {result}")
