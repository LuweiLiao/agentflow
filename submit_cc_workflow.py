"""
提交 Claude Code 多 Agent 工作流 — 串口助手核心模块。
3 个 CC 节点：Core → Tests → Review
"""

import json
import os
import sys
import time
import uuid

sys.path.insert(0, "/home/llw/agentflow")

from run_store import RunStore
from agentflow_schema import WorkflowJSON, NodeDef, EdgeDef


def submit_cc_workflow():
    """提交 3 节点 CC 多 Agent 工作流。"""

    work_dir = os.path.join(
        "/home/llw/agentflow/.agentflow/workspaces",
        f"run_{uuid.uuid4().hex[:12]}"
    )

    # ── 3 个 CC Agent 节点 ────────────────────────

    nodes = [
        {
            "id": "n1_core",
            "label": "核心模块 (CC Agent)",
            "profile": "dev",
            "desc": (
                "你是一个嵌入式 Python 开发专家。请开发 serial_core.py 串口助手核心模块。\n"
                "!!! 必须实际写文件并验证 !!!\n\n"
                "要求代码包含：\n"
                "1. SerialConfig dataclass: port, baudrate(9600-921600), parity, stopbits, bytesize, timeout\n"
                "2. SerialPort 类: open/close/read/write/list_ports, 线程安全, 回调机制\n"
                "3. DataParser 类: HEX/ASCII 格式转换\n\n"
                "写入 serial_core.py 后运行 python3 -c 'import serial_core' 验证\n"
                "输出文件路径和 import 验证结果。"
            ),
            "params": {
                "agent_type": "claude-code",
                "max_budget": 0.5,
            },
        },
        {
            "id": "n2_tests",
            "label": "单元测试 (CC Agent)",
            "profile": "tester",
            "desc": (
                "你是一个 QA 工程师。请为 serial_core.py 编写完整测试套件。\n"
                "!!! 先读取 serial_core.py 了解 API，再写 test_serial_core.py !!!\n\n"
                "使用 pytest + unittest.mock，覆盖：\n"
                "- SerialPort open/close/read/write\n"
                "- 多配置组合 (baudrate/parity/stopbits)\n"
                "- DataParser HEX/ASCII 格式\n"
                "- 线程安全操作\n"
                "- 错误处理 (无效端口、超时)\n\n"
                "写完后运行 pytest test_serial_core.py -v\n"
                "输出测试结果摘要。"
            ),
            "params": {
                "agent_type": "claude-code",
                "max_budget": 0.5,
            },
        },
        {
            "id": "n3_review",
            "label": "代码审查 (CC Agent)",
            "profile": "reviewer",
            "desc": (
                "你是一个资深代码审查员。\n"
                "!!! 先读取 serial_core.py 和 test_serial_core.py !!!\n\n"
                "审查内容：\n"
                "1. 正确性: 算法逻辑和边界条件\n"
                "2. 安全性: 线程安全、异常处理\n"
                "3. 可维护性: 代码组织、命名、文档\n"
                "4. 测试质量: 覆盖率、有效性\n\n"
                "输出中文审查报告：\n"
                "- ✅ 通过的检查项\n"
                "- ❌ 发现问题 (P0/P1/P2)\n"
                "- 💡 改进建议\n"
                "- 📊 总体评分 (1-10)"
            ),
            "params": {
                "agent_type": "claude-code",
                "max_budget": 0.3,
            },
        },
    ]

    edges = [
        {"source": "n1_core", "target": "n2_tests"},
        {"source": "n2_tests", "target": "n3_review"},
    ]

    # ── 提交 ─────────────────────────────────────
    store = RunStore()
    run_id = store.create_run(
        requirement="使用 Claude Code 引擎构建串口助手核心模块及测试",
        nodes=nodes,
        edges=edges,
        workflow_id="cc-multi-agent-serial",
    )

    print(f"\n{'='*60}")
    print(f"✅ 工作流已提交!")
    print(f"  Run ID: {run_id}")
    print(f"  节点: {len(nodes)} 个 (全部 CC Agent 引擎)")
    print(f"  拓扑: n1_core → n2_tests → n3_review")
    print(f"  Workspace: {work_dir}")
    print(f"{'='*60}")
    print()
    print(f"监视执行:  curl -s http://localhost:19600/api/workflows/{run_id}/status")
    print(f"查看结果:  curl -s http://localhost:19600/api/workflows/{run_id}")
    print()

    return run_id


def monitor_workflow(run_id: str, interval: int = 15, max_checks: int = 60):
    """监视工作流执行直到完成。"""
    import subprocess
    
    print(f"监视工作流 {run_id} ...")
    print()
    
    for i in range(max_checks):
        result = subprocess.run(
            ["curl", "-s", f"http://localhost:19600/api/workflows/{run_id}/status"],
            capture_output=True, text=True, timeout=10
        )
        status = result.stdout.strip() or "unknown"
        
        # Also get detailed info
        detail = subprocess.run(
            ["curl", "-s", f"http://localhost:19600/api/workflows/{run_id}"],
            capture_output=True, text=True, timeout=10
        )
        
        try:
            data = json.loads(detail.stdout)
            run_status = data.get("status", "?")
            nodes_info = [
                (n.get("node_id", "?"), n.get("status", "?"))
                for n in data.get("nodes", [])
            ]
            print(f"  [{i+1:2d}] run={run_status} nodes={nodes_info}")
        except (json.JSONDecodeError, Exception):
            print(f"  [{i+1:2d}] status={status}")
        
        # Check if done
        try:
            if data.get("status") in ("completed", "failed", "cancelled"):
                print(f"\n🎉 工作流完成! 最终状态: {data.get('status')}")
                return data
        except:
            pass
        
        time.sleep(interval)
    
    print(f"\n⏰ 监视超时 ({max_checks * interval}s)")
    return None


if __name__ == "__main__":
    rid = submit_cc_workflow()
    
    # 可选: 开始监视
    if "--monitor" in sys.argv:
        monitor_workflow(rid)
