"""Eval: DAG 结构验证 — 测试 validate_decomposition 工具。"""
from evals.conftest import validate_decomposition


def test_valid_simple_dag():
    """线性 DAG: a1 → a2 → a3"""
    nodes = [
        {"id": "a1", "icon": "📋", "label": "需求", "desc": "分析",
         "color": "blue", "profile": "analysis"},
        {"id": "a2", "icon": "💻", "label": "开发", "desc": "实现",
         "color": "green", "profile": "dev"},
        {"id": "a3", "icon": "🧪", "label": "测试", "desc": "验证",
         "color": "purple", "profile": "test"},
    ]
    edges = [
        {"source": "a1", "target": "a2"},
        {"source": "a2", "target": "a3"},
    ]
    errors = validate_decomposition(nodes, edges)
    assert not errors, f"验证不应失败: {errors}"


def test_valid_parallel_dag():
    """并行 DAG: a1 → (a2, a3) → a4"""
    nodes = [
        {"id": "a1", "icon": "📋", "label": "需求", "desc": "分析",
         "color": "blue", "profile": "analysis"},
        {"id": "a2", "icon": "💻", "label": "后端", "desc": "API",
         "color": "green", "profile": "dev"},
        {"id": "a3", "icon": "💻", "label": "前端", "desc": "UI",
         "color": "green", "profile": "dev"},
        {"id": "a4", "icon": "🧪", "label": "集成测试", "desc": "联调",
         "color": "purple", "profile": "test"},
    ]
    edges = [
        {"source": "a1", "target": "a2"},
        {"source": "a1", "target": "a3"},
        {"source": "a2", "target": "a4"},
        {"source": "a3", "target": "a4"},
    ]
    errors = validate_decomposition(nodes, edges)
    assert not errors, f"验证不应失败: {errors}"


def test_single_node():
    """单节点 DAG（无依赖的工作流）。"""
    nodes = [
        {"id": "g1", "icon": "💻", "label": "开发", "desc": "实现",
         "color": "green", "profile": "dev"},
    ]
    errors = validate_decomposition(nodes, [])
    assert not errors, f"单节点不应报错: {errors}"


def test_cycle_detected():
    """DAG 含环应被检测。"""
    nodes = [
        {"id": "a1", "icon": "📋", "label": "A1", "desc": "节点1",
         "color": "blue", "profile": "analysis"},
        {"id": "a2", "icon": "💻", "label": "A2", "desc": "节点2",
         "color": "green", "profile": "dev"},
        {"id": "a3", "icon": "🧪", "label": "A3", "desc": "节点3",
         "color": "purple", "profile": "test"},
    ]
    edges = [
        {"source": "a1", "target": "a2"},
        {"source": "a2", "target": "a3"},
        {"source": "a3", "target": "a1"},  # 环！
    ]
    errors = validate_decomposition(nodes, edges)
    assert errors, "含环 DAG 应被检测出来"


def test_orphan_nodes_detected():
    """多孤立节点应被检测。"""
    nodes = [
        {"id": "a1", "icon": "📋", "label": "A1", "desc": "节点1",
         "color": "blue", "profile": "analysis"},
        {"id": "a2", "icon": "📋", "label": "A2", "desc": "节点2",
         "color": "blue", "profile": "analysis"},
    ]
    errors = validate_decomposition(nodes, [])
    # 2个孤立节点应该报错（超过1个）
    if errors:
        assert any("孤儿" in e for e in errors)


def test_multiple_entry_points():
    """多个无依赖的根节点是合法的。"""
    nodes = [
        {"id": "a1", "icon": "📋", "label": "需求分析1",
         "desc": "分析", "color": "blue", "profile": "analysis"},
        {"id": "a2", "icon": "📋", "label": "需求分析2",
         "desc": "分析", "color": "blue", "profile": "analysis"},
        {"id": "a3", "icon": "💻", "label": "集成",
         "desc": "合并", "color": "green", "profile": "dev"},
    ]
    edges = [
        {"source": "a1", "target": "a3"},
        {"source": "a2", "target": "a3"},
    ]
    errors = validate_decomposition(nodes, edges)
    assert not errors, f"多入口 DAG 应合法: {errors}"


def test_unknown_profile():
    """非法 profile 应被检测。"""
    nodes = [
        {"id": "a1", "icon": "📋", "label": "测试", "desc": "测试",
         "color": "blue", "profile": "unknown_profile_type"},
    ]
    errors = validate_decomposition(nodes, [])
    assert errors, "非法 profile 应被检测"


def test_self_loop():
    """自环应被检测。"""
    nodes = [
        {"id": "a1", "icon": "📋", "label": "A1",
         "desc": "节点", "color": "blue", "profile": "analysis"},
    ]
    edges = [{"source": "a1", "target": "a1"}]
    errors = validate_decomposition(nodes, edges)
    assert errors, "自环应被检测"
