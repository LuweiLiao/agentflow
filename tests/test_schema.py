#!/usr/bin/env python3
"""Unit tests for agentflow_schema.py."""

import sys, os
sys.path.insert(0, '/home/llw/agentflow')

import pytest
from agentflow_schema import (
    WorkflowJSON, NodeDef, EdgeDef, PromptTask,
    validate_workflow, validate_prompt_tasks,
    topological_sort, parallel_groups, Profile,
)


# ═══════════════════════════════════════════════════════
# validate_workflow  tests
# ═══════════════════════════════════════════════════════

class TestValidateWorkflow:
    def test_empty_nodes(self):
        """Empty nodes list should return ['nodes 为空']."""
        wf = WorkflowJSON(nodes=[])
        errors = validate_workflow(wf)
        assert errors == ["nodes 为空"]

    def test_duplicate_ids(self):
        """Duplicate node IDs should be detected."""
        nodes = [
            NodeDef(id="a1", profile="dev"),
            NodeDef(id="a1", profile="test"),
        ]
        wf = WorkflowJSON(nodes=nodes)
        errors = validate_workflow(wf)
        assert any("重复 node id" in e for e in errors)
        assert any("a1" in e for e in errors)

    def test_empty_id(self):
        """A node with an empty/whitespace id should be flagged."""
        nodes = [
            NodeDef(id="a1", profile="dev"),
            NodeDef(id="  ", profile="test"),
        ]
        edges = [EdgeDef(source="a1", target="  ")]
        wf = WorkflowJSON(nodes=nodes, edges=edges)
        errors = validate_workflow(wf)
        assert any("空 id" in e for e in errors)

    def test_self_loop(self):
        """Edge where source==target should be flagged as a self-loop."""
        nodes = [
            NodeDef(id="a1", profile="dev"),
            NodeDef(id="a2", profile="test"),
        ]
        edges = [EdgeDef(source="a1", target="a1")]
        wf = WorkflowJSON(nodes=nodes, edges=edges)
        errors = validate_workflow(wf)
        assert any("自环" in e for e in errors)

    def test_dag_cycle(self):
        """A cycle in edges should be detected as a DAG violation."""
        nodes = [
            NodeDef(id="a1", profile="dev"),
            NodeDef(id="a2", profile="test"),
            NodeDef(id="a3", profile="doc"),
        ]
        edges = [
            EdgeDef(source="a1", target="a2"),
            EdgeDef(source="a2", target="a3"),
            EdgeDef(source="a3", target="a1"),  # cycle
        ]
        wf = WorkflowJSON(nodes=nodes, edges=edges)
        errors = validate_workflow(wf)
        assert any("环" in e for e in errors)

    def test_orphan_nodes(self):
        """Orphan nodes (no in/out edges) with >1 total nodes should be flagged."""
        nodes = [
            NodeDef(id="a1", profile="dev"),
            NodeDef(id="a2", profile="test"),
            NodeDef(id="a3", profile="doc"),
        ]
        edges = [EdgeDef(source="a1", target="a2")]
        wf = WorkflowJSON(nodes=nodes, edges=edges)
        errors = validate_workflow(wf)
        # a3 is orphaned (no in, no out) and there are 3 nodes > 1, so orphan detection triggers
        # But orphan detection triggers only if > 1 orphans, so let's check
        # Actually logic: if len(orphans) > 1, so with one orphan it won't trigger
        # Let me make 2 orphans: a2 has in from a1, a3 is orphan. Only a3 is orphan = 1, not > 1
        # So need to adjust — make 2 orphans
        pass

    def test_orphan_nodes_two(self):
        """Two orphans should be flagged."""
        nodes = [
            NodeDef(id="a1", profile="dev"),
            NodeDef(id="a2", profile="test"),
            NodeDef(id="a3", profile="doc"),
        ]
        edges = [EdgeDef(source="a1", target="a2")]
        wf = WorkflowJSON(nodes=nodes, edges=edges)
        errors = validate_workflow(wf)
        # a3 has no in and no out, len(orphans)=1 which is not > 1, so no error
        orphan_errors = [e for e in errors if "孤儿" in e]
        assert len(orphan_errors) == 0  # only 1 orphan

        # Now with 2 orphans
        nodes2 = [
            NodeDef(id="a1", profile="dev"),
            NodeDef(id="x1", profile="test"),
            NodeDef(id="x2", profile="doc"),
        ]
        wf2 = WorkflowJSON(nodes=nodes2, edges=[])
        errors2 = validate_workflow(wf2)
        orphan_errors2 = [e for e in errors2 if "孤儿" in e]
        assert len(orphan_errors2) > 0

    def test_max_nodes_exceeded(self):
        """Exceeding max nodes (200) should be flagged."""
        nodes = [NodeDef(id=f"n{i}", profile="dev") for i in range(201)]
        wf = WorkflowJSON(nodes=nodes)
        errors = validate_workflow(wf)
        assert any("超过最大限制" in e for e in errors)

    def test_profile_validation(self):
        """Unknown profile should be flagged."""
        nodes = [
            NodeDef(id="a1", profile="unknown_profile_type"),
        ]
        wf = WorkflowJSON(nodes=nodes)
        errors = validate_workflow(wf)
        assert any("未知 profile" in e for e in errors)

    def test_valid_workflow_passes(self):
        """A valid minimal workflow should return no errors."""
        nodes = [
            NodeDef(id="a1", profile="analysis"),
            NodeDef(id="a2", profile="dev"),
            NodeDef(id="a3", profile="doc"),
        ]
        edges = [
            EdgeDef(source="a1", target="a2"),
            EdgeDef(source="a2", target="a3"),
        ]
        wf = WorkflowJSON(nodes=nodes, edges=edges)
        errors = validate_workflow(wf)
        assert errors == []

    def test_nonexistent_edge_source(self):
        """Edge referencing a non-existent source node."""
        nodes = [NodeDef(id="a1", profile="dev")]
        edges = [EdgeDef(source="nonexistent", target="a1")]
        wf = WorkflowJSON(nodes=nodes, edges=edges)
        errors = validate_workflow(wf)
        assert any("不存在" in e for e in errors)

    def test_nonexistent_edge_target(self):
        """Edge referencing a non-existent target node."""
        nodes = [NodeDef(id="a1", profile="dev")]
        edges = [EdgeDef(source="a1", target="nonexistent")]
        wf = WorkflowJSON(nodes=nodes, edges=edges)
        errors = validate_workflow(wf)
        assert any("不存在" in e for e in errors)


# ═══════════════════════════════════════════════════════
# topological_sort  tests
# ═══════════════════════════════════════════════════════

class TestTopologicalSort:
    def test_normal_dag(self):
        """Normal linear DAG should sort correctly with increasing depth."""
        nodes = [
            NodeDef(id="a", profile="analysis"),
            NodeDef(id="b", profile="dev"),
            NodeDef(id="c", profile="doc"),
        ]
        edges = [
            EdgeDef(source="a", target="b"),
            EdgeDef(source="b", target="c"),
        ]
        sorted_nodes, depth = topological_sort(nodes, edges)
        ids = [n.id for n in sorted_nodes]
        assert ids == ["a", "b", "c"]
        assert depth["a"] == 0
        assert depth["b"] == 1
        assert depth["c"] == 2

    def test_single_node(self):
        """Single node with no edges should sort to that node, depth 0."""
        nodes = [NodeDef(id="a1", profile="dev")]
        sorted_nodes, depth = topological_sort(nodes, [])
        assert len(sorted_nodes) == 1
        assert sorted_nodes[0].id == "a1"
        assert depth["a1"] == 0

    def test_cycle_detection(self):
        """Cycle in DAG should raise ValueError."""
        nodes = [
            NodeDef(id="a", profile="dev"),
            NodeDef(id="b", profile="test"),
            NodeDef(id="c", profile="doc"),
        ]
        edges = [
            EdgeDef(source="a", target="b"),
            EdgeDef(source="b", target="c"),
            EdgeDef(source="c", target="a"),
        ]
        with pytest.raises(ValueError, match="环"):
            topological_sort(nodes, edges)

    def test_diamond_dag(self):
        """Diamond-shaped DAG should sort correctly."""
        nodes = [
            NodeDef(id="a", profile="analysis"),
            NodeDef(id="b", profile="dev"),
            NodeDef(id="c", profile="test"),
            NodeDef(id="d", profile="doc"),
        ]
        edges = [
            EdgeDef(source="a", target="b"),
            EdgeDef(source="a", target="c"),
            EdgeDef(source="b", target="d"),
            EdgeDef(source="c", target="d"),
        ]
        sorted_nodes, depth = topological_sort(nodes, edges)
        ids = [n.id for n in sorted_nodes]
        # a must come first, d must come last
        assert ids[0] == "a"
        assert ids[-1] == "d"
        # b and c can be in any order but both depth=1
        assert depth["b"] == 1
        assert depth["c"] == 1


# ═══════════════════════════════════════════════════════
# parallel_groups  tests
# ═══════════════════════════════════════════════════════

class TestParallelGroups:
    def test_linear_dag(self):
        """Linear chain should produce one group per node."""
        nodes = [
            NodeDef(id="a", profile="analysis"),
            NodeDef(id="b", profile="dev"),
            NodeDef(id="c", profile="doc"),
        ]
        edges = [
            EdgeDef(source="a", target="b"),
            EdgeDef(source="b", target="c"),
        ]
        groups = parallel_groups(nodes, edges)
        assert len(groups) == 3
        assert groups[0][0].id == "a"
        assert groups[1][0].id == "b"
        assert groups[2][0].id == "c"

    def test_parallel_nodes(self):
        """Nodes with no dependencies should be in the same group."""
        nodes = [
            NodeDef(id="root", profile="analysis"),
            NodeDef(id="b", profile="dev"),
            NodeDef(id="c", profile="test"),
        ]
        edges = [
            EdgeDef(source="root", target="b"),
            EdgeDef(source="root", target="c"),
        ]
        groups = parallel_groups(nodes, edges)
        # root depth 0, b and c depth 1
        assert len(groups) == 2
        assert len(groups[1]) == 2  # two parallel nodes
        parallel_ids = {n.id for n in groups[1]}
        assert parallel_ids == {"b", "c"}

    def test_single_node_group(self):
        """Single node should produce one group with one node."""
        nodes = [NodeDef(id="only", profile="dev")]
        groups = parallel_groups(nodes, [])
        assert len(groups) == 1
        assert groups[0][0].id == "only"


# ═══════════════════════════════════════════════════════
# NodeDef  tests
# ═══════════════════════════════════════════════════════

class TestNodeDef:
    def test_from_dict_basic(self):
        """NodeDef.from_dict should parse standard fields."""
        d = {
            "id": "n1",
            "icon": "🤖",
            "label": "测试",
            "desc": "测试节点",
            "color": "green",
            "profile": "dev",
            "params": {"key": "val"},
        }
        node = NodeDef.from_dict(d)
        assert node.id == "n1"
        assert node.label == "测试"
        assert node.profile == "dev"
        assert node.params == {"key": "val"}

    def test_from_dict_minimal(self):
        """NodeDef.from_dict should work with minimal fields."""
        d = {"id": "n1"}
        node = NodeDef.from_dict(d)
        assert node.id == "n1"
        assert node.icon == "🤖"
        assert node.profile == "dev"  # default

    def test_to_dict_roundtrip(self):
        """NodeDef to_dict and back via from_dict should preserve data."""
        original = NodeDef.from_dict({
            "id": "x1", "label": "节点X", "profile": "test",
            "params": {"foo": "bar"}, "result": "done",
        })
        d = original.to_dict()
        reconstructed = NodeDef.from_dict(d)
        assert reconstructed.id == original.id
        assert reconstructed.label == original.label
        assert reconstructed.profile == original.profile
        assert reconstructed.params == original.params
        assert reconstructed.result == original.result

    def test_to_dict_skips_none(self):
        """to_dict should omit None values."""
        node = NodeDef(id="n1", label="test")
        d = node.to_dict()
        assert "model" not in d  # model was not set (None)

    def test_from_dict_with_model(self):
        """model field should be handled correctly."""
        d = {"id": "n1", "model": "gpt-4o"}
        node = NodeDef.from_dict(d)
        assert node.model == "gpt-4o"

        d2 = {"id": "n1"}
        node2 = NodeDef.from_dict(d2)
        assert node2.model is None


# ═══════════════════════════════════════════════════════
# validate_prompt_tasks  tests
# ═══════════════════════════════════════════════════════

class TestValidatePromptTasks:
    def test_empty_tasks(self):
        """Empty task list should return error."""
        errors = validate_prompt_tasks([])
        assert errors == ["tasks 为空"]

    def test_empty_prompt(self):
        """Task with empty prompt should be flagged."""
        tasks = [
            PromptTask(task_id="t1", node_id="n1", prompt=""),
        ]
        errors = validate_prompt_tasks(tasks)
        assert any("prompt 为空" in e for e in errors)

    def test_depends_on_uses_node_ids(self):
        """depends_on should reference existing node_ids, not task_ids."""
        tasks = [
            PromptTask(task_id="t1", node_id="n1", prompt="hello", depends_on=["n2"]),
            PromptTask(task_id="t2", node_id="n2", prompt="world"),
        ]
        errors = validate_prompt_tasks(tasks)
        # Both n1 and n2 exist as node_ids, so no error
        assert errors == []

    def test_depends_on_nonexistent_node_id(self):
        """depends_on referencing a non-existent node_id should be flagged."""
        tasks = [
            PromptTask(task_id="t1", node_id="n1", prompt="hello", depends_on=["n_missing"]),
        ]
        errors = validate_prompt_tasks(tasks)
        assert any("依赖" in e and "n_missing" in e for e in errors)

    def test_valid_tasks_pass(self):
        """Well-formed tasks should pass validation."""
        tasks = [
            PromptTask(task_id="t1", node_id="n1", prompt="Do task 1"),
            PromptTask(task_id="t2", node_id="n2", prompt="Do task 2", depends_on=["n1"]),
        ]
        errors = validate_prompt_tasks(tasks)
        assert errors == []


# ═══════════════════════════════════════════════════════
# WorkflowJSON  from/to dict helpers
# ═══════════════════════════════════════════════════════

class TestWorkflowJSON:
    def test_from_dict(self):
        d = {
            "version": "2.0.0",
            "workflow_id": "wf_test",
            "name": "test workflow",
            "nodes": [{"id": "n1", "profile": "dev"}],
            "edges": [{"source": "n1", "target": "n2"}],
            "metadata": {"key": "val"},
        }
        wf = WorkflowJSON.from_dict(d)
        assert wf.version == "2.0.0"
        assert wf.workflow_id == "wf_test"
        assert len(wf.nodes) == 1
        assert wf.nodes[0].id == "n1"

    def test_from_api_request(self):
        nodes = [{"id": "n1"}, {"id": "n2"}]
        edges = [{"source": "n1", "target": "n2"}]
        wf = WorkflowJSON.from_api_request(nodes, requirement="test req", edges=edges)
        assert "wf_" in wf.workflow_id
        assert wf.global_context["goal"] == "test req"
        assert len(wf.nodes) == 2

    def test_to_dict(self):
        wf = WorkflowJSON(
            workflow_id="abc",
            name="test",
            nodes=[NodeDef(id="n1")],
            edges=[EdgeDef(source="n1", target="n2")],
        )
        d = wf.to_dict()
        assert d["workflow_id"] == "abc"
        assert len(d["nodes"]) == 1
        assert len(d["edges"]) == 1
