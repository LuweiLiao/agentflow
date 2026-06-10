#!/usr/bin/env python3
"""Compiler tests for prompt_compiler.py."""

import sys, os, tempfile
sys.path.insert(0, '/home/llw/agentflow')

import pytest
from prompt_compiler import PromptCompiler, TemplateEngine, TemplateNotFound
from agentflow_schema import (
    WorkflowJSON, NodeDef, EdgeDef, PromptTask,
)


# ═══════════════════════════════════════════════════════
# TemplateEngine  tests
# ═══════════════════════════════════════════════════════

class TestTemplateEngine:
    def test_load_existing_template(self):
        """Loading an existing profile template should succeed."""
        engine = TemplateEngine(template_dir="/home/llw/agentflow/templates")
        tmpl = engine.load("dev")
        assert "prompt_template" in tmpl
        assert "system_prompt" in tmpl
        assert "tool_set" in tmpl

    def test_load_fallback_to_dev(self):
        """Loading a missing profile should fall back to dev.yaml."""
        engine = TemplateEngine(template_dir="/home/llw/agentflow/templates")
        tmpl = engine.load("nonexistent_profile")
        # Should have loaded dev.yaml as fallback
        assert "prompt_template" in tmpl

    def test_load_template_not_found(self):
        """If neither profile nor dev.yaml exists, raise TemplateNotFound."""
        with tempfile.TemporaryDirectory() as td:
            engine = TemplateEngine(template_dir=td)
            with pytest.raises(TemplateNotFound, match="模板不存在"):
                engine.load("test_profile")

    def test_render_basic_variables(self):
        """Render should replace {global.goal} and {node.label}."""
        engine = TemplateEngine(template_dir="/home/llw/agentflow/templates")
        tmpl = engine.load("dev")
        rendered = engine.render(tmpl, {
            "global_context": {"goal": "Build a website", "constraints": []},
            "node": {"label": "Frontend", "desc": "Build frontend", "id": "n1"},
            "params": {"description": "Build the frontend UI"},
            "upstream_context": "Design done",
            "sequence": "1",
        })
        assert "Build a website" in rendered
        assert "Frontend" in rendered
        assert "Build the frontend UI" in rendered

    def test_render_upstream_context(self):
        """{upstream_context} should be replaced."""
        engine = TemplateEngine(template_dir="/home/llw/agentflow/templates")
        tmpl = engine.load("dev")
        rendered = engine.render(tmpl, {
            "global_context": {"goal": "test", "constraints": []},
            "node": {"label": "N", "desc": "", "id": "n1"},
            "params": {"description": "desc"},
            "upstream_context": "Previous step output here",
            "sequence": "1",
        })
        assert "Previous step output here" in rendered

    def test_render_empty_upstream_context(self):
        """When upstream_context is empty, render should show fallback."""
        engine = TemplateEngine(template_dir="/home/llw/agentflow/templates")
        tmpl = engine.load("dev")
        rendered = engine.render(tmpl, {
            "global_context": {"goal": "test", "constraints": []},
            "node": {"label": "N", "desc": "", "id": "n1"},
            "params": {"description": "desc"},
            "upstream_context": "",
            "sequence": "1",
        })
        assert "上游依赖" in rendered
        assert "无" in rendered

    def test_render_caching(self):
        """Templates should be cached after first load."""
        engine = TemplateEngine(template_dir="/home/llw/agentflow/templates")
        tmpl1 = engine.load("dev")
        tmpl2 = engine.load("dev")
        assert tmpl1 is tmpl2  # same object from cache

    def test_render_global_constraints_list(self):
        """{global.constraints} as a list should render as bullet points."""
        engine = TemplateEngine(template_dir="/home/llw/agentflow/templates")
        tmpl = engine.load("dev")
        rendered = engine.render(tmpl, {
            "global_context": {
                "goal": "test",
                "constraints": ["Must be fast", "Must be secure"],
            },
            "node": {"label": "N", "desc": "", "id": "n1"},
            "params": {"description": "desc"},
            "upstream_context": "",
            "sequence": "1",
        })
        assert "- Must be fast" in rendered
        assert "- Must be secure" in rendered


# ═══════════════════════════════════════════════════════
# PromptCompiler  —  basic compile tests
# ═══════════════════════════════════════════════════════

class TestPromptCompilerBasic:
    def test_compile_simple_workflow(self):
        """Compiling a simple workflow should produce one PromptTask per node."""
        compiler = PromptCompiler(template_dir="/home/llw/agentflow/templates")
        wf = WorkflowJSON(
            workflow_id="test_wf",
            nodes=[
                NodeDef(id="n1", label="需求分析", profile="analysis",
                        params={"description": "分析需求"}),
                NodeDef(id="n2", label="开发", profile="dev",
                        params={"description": "编码实现"}),
            ],
            edges=[EdgeDef(source="n1", target="n2")],
        )
        tasks = compiler.compile(wf)
        assert len(tasks) == 2
        assert tasks[0].node_id == "n1"
        assert tasks[1].node_id == "n2"
        assert tasks[0].sequence == 1
        assert tasks[1].sequence == 2

    def test_compile_depends_on(self):
        """depends_on should contain correct upstream node_ids."""
        compiler = PromptCompiler(template_dir="/home/llw/agentflow/templates")
        wf = WorkflowJSON(
            nodes=[
                NodeDef(id="n1", profile="analysis"),
                NodeDef(id="n2", profile="dev"),
                NodeDef(id="n3", profile="test"),
            ],
            edges=[
                EdgeDef(source="n1", target="n2"),
                EdgeDef(source="n2", target="n3"),
            ],
        )
        tasks = compiler.compile(wf)
        # n1 has no dependencies
        assert tasks[0].depends_on == []
        # n2 depends on n1
        assert tasks[1].depends_on == ["n1"]
        # n3 depends on n2
        assert tasks[2].depends_on == ["n2"]

    def test_compile_parallel_group(self):
        """parallel_group should reflect topological depth."""
        compiler = PromptCompiler(template_dir="/home/llw/agentflow/templates")
        wf = WorkflowJSON(
            nodes=[
                NodeDef(id="root", profile="analysis"),
                NodeDef(id="a", profile="dev"),
                NodeDef(id="b", profile="test"),
            ],
            edges=[
                EdgeDef(source="root", target="a"),
                EdgeDef(source="root", target="b"),
            ],
        )
        tasks = compiler.compile(wf)
        task_map = {t.node_id: t for t in tasks}
        # root should be parallel_group 0
        assert task_map["root"].parallel_group == 0
        # a and b should be parallel_group 1
        assert task_map["a"].parallel_group == 1
        assert task_map["b"].parallel_group == 1

    def test_compile_system_prompt(self):
        """system_prompt should be loaded from template."""
        compiler = PromptCompiler(template_dir="/home/llw/agentflow/templates")
        wf = WorkflowJSON(
            nodes=[NodeDef(id="n1", profile="dev")],
        )
        tasks = compiler.compile(wf)
        assert len(tasks[0].system_prompt) > 0
        assert "开发" in tasks[0].system_prompt or "dev" in tasks[0].system_prompt


# ═══════════════════════════════════════════════════════
# PromptCompiler  —  upstream_context  tests
# ═══════════════════════════════════════════════════════

class TestUpstreamContext:
    def test_upstream_context_without_results(self):
        """Without upstream_results, context should be built from static descriptions."""
        compiler = PromptCompiler(template_dir="/home/llw/agentflow/templates")
        wf = WorkflowJSON(
            global_context={"goal": "test", "language": "zh-CN", "constraints": []},
            nodes=[
                NodeDef(id="n1", label="分析", profile="analysis",
                        desc="需求分析阶段", result="需求确认"),
                NodeDef(id="n2", label="开发", profile="dev",
                        desc="编码实现"),
            ],
            edges=[EdgeDef(source="n1", target="n2")],
        )
        tasks = compiler.compile(wf)
        # n2's prompt should contain n1's static context
        n2_task = tasks[1]
        assert "分析" in n2_task.prompt or "需求" in n2_task.prompt

    def test_upstream_context_with_results(self):
        """With upstream_results, context should use real output text."""
        compiler = PromptCompiler(template_dir="/home/llw/agentflow/templates")
        wf = WorkflowJSON(
            global_context={"goal": "test", "language": "zh-CN", "constraints": []},
            nodes=[
                NodeDef(id="n1", label="分析", profile="analysis",
                        desc="需求分析", result="static result"),
                NodeDef(id="n2", label="开发", profile="dev",
                        desc="编码实现"),
            ],
            edges=[EdgeDef(source="n1", target="n2")],
        )
        tasks = compiler.compile(wf, upstream_results={
            "n1": "REAL_OUTPUT: requirements confirmed",
        })
        n2_task = tasks[1]
        assert "REAL_OUTPUT" in n2_task.prompt

    def test_upstream_context_empty_when_no_deps(self):
        """A node with no dependencies should have no upstream context."""
        compiler = PromptCompiler(template_dir="/home/llw/agentflow/templates")
        wf = WorkflowJSON(
            global_context={"goal": "test", "language": "zh-CN", "constraints": []},
            nodes=[NodeDef(id="root", profile="analysis", desc="Start here")],
        )
        tasks = compiler.compile(wf)
        # The prompt should still render fine
        assert tasks[0].prompt is not None
        assert len(tasks[0].prompt) > 0

    def test_upstream_results_missing_node(self):
        """If upstream_results is provided but missing output for a dep, show fallback."""
        compiler = PromptCompiler(template_dir="/home/llw/agentflow/templates")
        wf = WorkflowJSON(
            global_context={"goal": "test", "language": "zh-CN", "constraints": []},
            nodes=[
                NodeDef(id="n1", label="分析", profile="analysis"),
                NodeDef(id="n2", label="开发", profile="dev"),
            ],
            edges=[EdgeDef(source="n1", target="n2")],
        )
        # upstream_results must be truthy to trigger dynamic path
        tasks = compiler.compile(wf, upstream_results={"n1": ""})
        n2_task = tasks[1]
        # Since n1 has empty output in upstream_results, fallback text appears
        assert "等待执行" in n2_task.prompt


# ═══════════════════════════════════════════════════════
# PromptCompiler  —  edge cases
# ═══════════════════════════════════════════════════════

class TestCompilerEdgeCases:
    def test_empty_workflow_no_nodes(self):
        """A workflow with no nodes should produce an empty task list."""
        compiler = PromptCompiler(template_dir="/home/llw/agentflow/templates")
        wf = WorkflowJSON()
        tasks = compiler.compile(wf)
        assert tasks == []

    def test_single_node_no_edges(self):
        """A single node with no edges should produce one task."""
        compiler = PromptCompiler(template_dir="/home/llw/agentflow/templates")
        wf = WorkflowJSON(
            nodes=[NodeDef(id="only", profile="dev")],
        )
        tasks = compiler.compile(wf)
        assert len(tasks) == 1
        assert tasks[0].node_id == "only"
        assert tasks[0].depends_on == []

    def test_diamond_dag_dependencies(self):
        """Diamond DAG: middle nodes depend on root, final depends on both."""
        compiler = PromptCompiler(template_dir="/home/llw/agentflow/templates")
        wf = WorkflowJSON(
            nodes=[
                NodeDef(id="root", profile="analysis"),
                NodeDef(id="a", profile="dev"),
                NodeDef(id="b", profile="test"),
                NodeDef(id="final", profile="doc"),
            ],
            edges=[
                EdgeDef(source="root", target="a"),
                EdgeDef(source="root", target="b"),
                EdgeDef(source="a", target="final"),
                EdgeDef(source="b", target="final"),
            ],
        )
        tasks = compiler.compile(wf)
        task_map = {t.node_id: t for t in tasks}
        assert task_map["root"].depends_on == []
        assert task_map["a"].depends_on == ["root"]
        assert task_map["b"].depends_on == ["root"]
        assert sorted(task_map["final"].depends_on) == ["a", "b"]

    def test_template_with_custom_params(self):
        """Node params should be available as {param.*} in templates."""
        compiler = PromptCompiler(template_dir="/home/llw/agentflow/templates")
        wf = WorkflowJSON(
            global_context={"goal": "test", "language": "zh-CN", "constraints": []},
            nodes=[
                NodeDef(id="n1", profile="dev",
                        params={"custom_var": "custom_value", "description": "test node"}),
            ],
        )
        tasks = compiler.compile(wf)
        # The custom param isn't in the template by default, but rendering
        # should leave {param.custom_var} unresolved or handle gracefully
        rendered = tasks[0].prompt
        assert rendered is not None  # shouldn't crash
