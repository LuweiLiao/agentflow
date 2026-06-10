#!/usr/bin/env python3
"""AgentFlow 端到端基准测试脚本。

需要后端在 localhost:9600 运行，且 LLM API key 已配置。

用法:
    # 启动后端
    python3 agentflow-backend.py 9600 &

    # 运行基准测试
    python3 evals/run_benchmark.py

    # 指定后端地址
    AGENTFLOW_PORT=9601 python3 evals/run_benchmark.py
"""
import json
import os
import sys
import time

# 项目根目录
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from evals.conftest import record_eval_result  # noqa: E402

# ── 后端配置 ──────────────────────────────────────
HOST = os.environ.get("AGENTFLOW_HOST", "127.0.0.1")
PORT = int(os.environ.get("AGENTFLOW_PORT", "9600"))
BASE_URL = f"http://{HOST}:{PORT}"

# ── 测试用例 ──────────────────────────────────────
BENCHMARKS = [
    {
        "name": "serial_tool",
        "requirement": (
            "用 PyQt5 实现一个串口调试助手，"
            "功能包括：端口扫描、波特率设置（9600/115200/921600）、"
            "数据收发（ASCII/HEX 两种模式）、自动滚动、"
            "发送间隔定时器、数据导出。"
        ),
        "count": 5,
    },
    {
        "name": "todo_webapp",
        "requirement": (
            "用 Python Flask + SQLite 开发一个 Todo 网页应用，"
            "功能包括：用户注册登录、创建/编辑/删除 Todo、"
            "分类标签、截止日期提醒、响应式 UI。"
        ),
        "count": 5,
    },
    {
        "name": "quadrotor_adrc",
        "requirement": (
            "在 MATLAB/Simulink 中设计并仿真四旋翼无人机的"
            "ADRC（自抗扰控制）控制器。"
        ),
        "count": 4,
    },
    {
        "name": "quadruped_vmc",
        "requirement": (
            "在 MATLAB/Simulink 中设计并仿真四足机器人的"
            "VMC（虚拟模型控制）行走控制器。"
        ),
        "count": 4,
    },
]

# ── API 辅助 ──────────────────────────────────────
import urllib.error  # noqa: E402
import urllib.request  # noqa: E402


def _post(path, data, timeout=30):
    url = f"{BASE_URL}{path}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        url, data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        resp = urllib.request.urlopen(req, timeout=timeout)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read()) if e.read() else {}
    except Exception as e:
        return 0, {"error": str(e)}


def _get(path, timeout=10):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url)
    try:
        resp = urllib.request.urlopen(req, timeout=timeout)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read()) if e.read() else {}
    except Exception as e:
        return 0, {"error": str(e)}


def _wait_run(run_id, timeout=600):
    deadline = time.time() + timeout
    while time.time() < deadline:
        status, run = _get(f"/api/runs/{run_id}", timeout=5)
        if status == 200 and run.get("status") in ("completed", "failed"):
            return run
        time.sleep(2)
    return {"status": "timeout", "error": f"超时 {timeout}s"}


def health_check() -> bool:
    """检查后端是否存活。"""
    status, data = _get("/api/runs", timeout=3)
    return status == 200


# ── 运行 ──────────────────────────────────────────
def run_single(bench: dict) -> dict:
    """运行单个 benchmark，返回结果。"""
    name = bench["name"]
    requirement = bench["requirement"]
    count = bench["count"]
    t0 = time.time()

    result = {
        "name": name,
        "timestamp": t0,
        "steps": [],
        "passed": False,
        "errors": [],
    }

    # Step 1: Decompose
    print(f"\n  [{name}] Step 1 编排...", end=" ", flush=True)
    t1 = time.time()
    status, decomp = _post("/api/decompose", {
        "requirement": requirement, "count": count,
    }, timeout=60)
    dur = time.time() - t1
    if status != 200:
        result["errors"].append(f"编排失败 ({status}): {decomp}")
        print(f"✗ ({dur:.1f}s)")  # noqa: T201
        return result
    nodes = decomp.get("nodes", [])
    edges = decomp.get("edges", [])
    if not nodes:
        result["errors"].append("编排结果为空")
        print(f"✗ 空结果 ({dur:.1f}s)")  # noqa: T201
        return result
    result["steps"].append({
        "step": "decompose", "duration_s": dur,
        "node_count": len(nodes), "edge_count": len(edges),
    })
    print(f"✓ {len(nodes)}节点 ({dur:.1f}s)")  # noqa: T201

    # Step 2: Execute
    print(f"  [{name}] Step 2 执行...", end=" ", flush=True)
    t2 = time.time()
    status, exec_resp = _post("/api/runs", {
        "requirement": requirement,
        "nodes": nodes,
        "edges": edges,
    }, timeout=10)
    if status != 202:
        result["errors"].append(f"执行提交失败 ({status}): {exec_resp}")
        print(f"✗ ({time.time()-t2:.1f}s)")  # noqa: T201
        return result
    run_id = exec_resp.get("run_id", "")
    if not run_id:
        result["errors"].append("未返回 run_id")
        print("✗")  # noqa: T201
        return result
    print(f"run_id={run_id}")  # noqa: T201

    # Step 3: Wait and check
    run = _wait_run(run_id)
    dur = time.time() - t2
    run_status = run.get("status", "unknown")
    run_nodes = run.get("nodes", [])
    total_cost = run.get("total_cost", 0)
    total_dur = run.get("total_dur", 0)

    completed = sum(1 for n in run_nodes if n.get("status") == "completed")
    failed = sum(1 for n in run_nodes if n.get("status") == "failed")
    skipped = sum(1 for n in run_nodes if n.get("status") == "skipped")

    result["steps"].append({
        "step": "execute", "duration_s": dur,
        "run_id": run_id,
        "run_status": run_status,
        "completed": completed,
        "failed": failed,
        "skipped": skipped,
        "total_cost": total_cost,
        "total_duration_ms": total_dur,
    })

    print(f"  [{name}] 完成: {run_status}, "
          f"{completed}/{len(run_nodes)}通过, "
          f"${total_cost:.4f}, {total_dur/1000:.1f}s")  # noqa: T201

    # Step 4: Validate
    validation = _validate_run(run)
    if validation:
        result["errors"].extend(validation)

    result["passed"] = len(result["errors"]) == 0
    result["duration_s"] = time.time() - t0
    return result


def _validate_run(run: dict) -> list[str]:
    """验证 run 结果。"""
    errors = []
    nodes = run.get("nodes", [])
    total_cost = run.get("total_cost", 0)
    total_dur = run.get("total_dur", 0)

    # 没有 LLM key 的 fallback 模式：所有节点应为 skipped
    all_skipped = all(n.get("status") == "skipped" for n in nodes)
    if all_skipped:
        errors.append("所有节点被跳过（可能无 API key）")
        return errors

    # 正常模式
    completed = sum(1 for n in nodes if n.get("status") == "completed")
    failed = sum(1 for n in nodes if n.get("status") == "failed")

    if completed == 0 and failed == 0 and len(nodes) > 0:
        errors.append(f"所有节点未执行 ({len(nodes)}个)")
    if failed > len(nodes) * 0.5:
        errors.append(f"失败率过高: {failed}/{len(nodes)}")
    if total_cost > 1.0:
        errors.append(f"费用超限: ${total_cost:.4f}")
    if total_dur > 600000:
        errors.append(f"耗时超限: {total_dur / 1000:.1f}s")

    return errors


def print_summary(results: list[dict]):
    """打印汇总表格。"""
    print("\n" + "=" * 60)
    print("AgentFlow 基准测试结果汇总".center(58))
    print("=" * 60)
    print(f"{'测试':<20} {'状态':<8} {'节点':<6} {'通过':<6} {'费用($)':<10} {'耗时(s)':<8}")
    print("-" * 60)
    all_passed = True
    for r in results:
        steps = r.get("steps", [])
        step2 = steps[1] if len(steps) > 1 else {}
        status = "✅ 通过" if r["passed"] else "❌ 失败"
        node_count = step2.get("completed", 0)
        completions = f"{step2.get('completed', 0)}/{step2.get('completed', 0) + step2.get('failed', 0) + step2.get('skipped', 0)}"
        cost = f"${step2.get('total_cost', 0):.4f}"
        dur = f"{step2.get('total_duration_ms', 0) / 1000:.1f}"
        print(f"{r['name']:<20} {status:<8} {node_count:<6} {completions:<6} {cost:<10} {dur:<8}")
        if not r["passed"]:
            all_passed = False
            for e in r["errors"]:
                print(f"  → {e}")
    print("-" * 60)
    passed_count = sum(1 for r in results if r["passed"])
    print(f"总分: {passed_count}/{len(results)} 通过")
    return all_passed


def main():
    """运行所有基准测试。"""
    print("=" * 60)
    print("AgentFlow 端到端基准测试".center(58))
    print("=" * 60)
    print(f"后端: {BASE_URL}")
    print(f"共 {len(BENCHMARKS)} 个测试用例")
    print()

    # 健康检查
    if not health_check():
        print(f"❌ 后端 {BASE_URL} 不可达。请先启动后端: python3 agentflow-backend.py {PORT}")
        sys.exit(1)
    print("✅ 后端存活")

    # 检查 API key
    if not os.environ.get("DEEPSEEK_API_KEY"):
        print("⚠️ DEEPSEEK_API_KEY 未设置，节点将被跳过")
    else:
        print("✅ DeepSeek API key 已配置")
    print()

    # 运行
    results = []
    for bench in BENCHMARKS:
        print(f"[{bench['name']}] 开始...")
        result = run_single(bench)
        results.append(result)
        # 记录
        try:
            record_eval_result(bench["name"], {
                "timestamp": time.time(),
                "passed": result["passed"],
                "duration_s": result.get("duration_s", 0),
                "errors": result["errors"],
                "steps": result.get("steps", []),
            })
        except Exception:
            pass

    # 汇总
    all_passed = print_summary(results)
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
