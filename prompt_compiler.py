"""
AgentFlow Prompt Compiler — WorkflowJSON → PromptTask[]
=======================================================
Compiler 是 AgentFlow 的核心转换层：
- 输入: WorkflowJSON (画布输出的节点定义 + DAG 边)
- 输出: PromptTask[] (每个节点渲染为完整的自然语言提示词)

替换原来的 build_agent_prompt() 硬编码。

用法:
    from prompt_compiler import PromptCompiler
    compiler = PromptCompiler(template_dir="templates/")
    tasks = compiler.compile(workflow_json)
"""

import json
import os
import re

from agentflow_schema import (
    EdgeDef,
    NodeDef,
    PromptTask,
    WorkflowJSON,
    topological_sort,
)


class TemplateNotFoundError(Exception):
    pass


class TemplateEngine:
    """JSON 模板加载和变量渲染引擎。"""

    def __init__(self, template_dir: str = None):
        self.template_dir = template_dir or os.path.join(
            os.path.dirname(__file__), "templates"
        )
        self._cache: dict[str, dict] = {}

    def load(self, profile: str) -> dict:
        """加载 profile 对应的 JSON 模板。"""
        if profile in self._cache:
            return self._cache[profile]

        path = os.path.join(self.template_dir, f"{profile}.json")
        if not os.path.isfile(path):
            # 尝试默认 dev 模板
            fallback = os.path.join(self.template_dir, "dev.json")
            if os.path.isfile(fallback):
                path = fallback
            else:
                raise TemplateNotFoundError(f"模板不存在: {path}")

        with open(path, encoding="utf-8") as f:
            tmpl = json.load(f)
        self._cache[profile] = tmpl
        return tmpl

    def render(self, tmpl: dict, variables: dict) -> str:
        """
        渲染 prompt_template 中的变量占位符。

        支持的变量:
            {global.goal}          全局目标
            {global.constraints}   全局约束列表
            {node.label}           节点名称
            {param.xxx}            节点参数 xxx
            {param.description}    节点描述
            {upstream_context}     上游节点输出汇总
        """
        template_str = tmpl.get("prompt_template", "")
        if not template_str:
            return ""

        # 全局变量
        gc = variables.get("global_context", {})

        def replace_var(match):
            key = match.group(1)
            # {global.xxx}
            if key.startswith("global."):
                k = key[7:]
                val = gc.get(k, f"{{{key}}}")
                if isinstance(val, list):
                    return "\n".join(f"- {x}" for x in val)
                return str(val) if val else f"{{{key}}}"
            # {node.xxx}
            if key.startswith("node."):
                k = key[5:]
                node_vars = variables.get("node", {})
                val = node_vars.get(k, f"{{{key}}}")
                return str(val) if val else f"{{{key}}}"
            # {param.xxx}
            if key.startswith("params.") or key.startswith("param."):
                k = key.split(".", 1)[1]
                params = variables.get("params", {})
                val = params.get(k, f"{{{key}}}")
                return str(val) if val else f"{{{key}}}"
            # {upstream_context}
            if key == "upstream_context":
                val = variables.get("upstream_context", "")
                return str(val) if val else "无上游依赖"
            # {count} / 其他直接变量
            val = variables.get(key, f"{{{key}}}")
            return str(val) if val else f"{{{key}}}"

        return re.sub(r"\{([a-z_.]+)\}", replace_var, template_str)


class PromptCompiler:
    """
    将 WorkflowJSON 编译为 PromptTask[]。

    流程:
    1. 解析 WorkflowJSON → 节点 + DAG 边
    2. Kahn 拓扑排序 → 计算每个节点的执行顺序和并行分组
    3. 对每个节点: 加载 YAML 模板 → 渲染变量 → 组装 PromptTask
    """

    def __init__(self, template_dir: str = None):
        self.templates = TemplateEngine(template_dir)

    def compile(self, wf: WorkflowJSON,
                upstream_results: dict[str, str] = None) -> list[PromptTask]:
        """编译工作流定义为 PromptTask 列表。

        Args:
            wf: 工作流定义
            upstream_results: 可选，已执行节点的 {node_id: output_text} 映射。
                              当提供时，上游上下文使用真实输出而非静态描述。
        """
        tasks = []
        node_map = {n.id: n for n in wf.nodes}

        # 拓扑排序
        sorted_nodes, depth = topological_sort(wf.nodes, wf.edges)

        # 为每个节点生成 PromptTask
        for i, node in enumerate(sorted_nodes):
            # 使用真实上游输出（如果可用）代替静态描述
            if upstream_results:
                deps = self._get_dependencies(node.id, wf.edges)
                parts = []
                for dep_id in deps:
                    output = upstream_results.get(dep_id, "")
                    label = node_map[dep_id].label if dep_id in node_map else dep_id
                    if output:
                        parts.append(f"## {label} ({dep_id})\n输出:\n{output[:1500]}")
                    else:
                        parts.append(f"## {label} ({dep_id})\n(等待执行)")
                upstream_context = "\n\n".join(parts) if parts else "无上游依赖"
            else:
                upstream_context = self._build_upstream_context(
                    node.id, wf.nodes, wf.edges
                )

            task = self._compile_node(
                node=node,
                workflow=wf,
                upstream_context=upstream_context,
                sequence=i + 1,
                depth=depth.get(node.id, 0),
            )
            tasks.append(task)

        return tasks

    def _compile_node(self, node: NodeDef, workflow: WorkflowJSON,
                      upstream_context: str, sequence: int,
                      depth: int) -> PromptTask:
        """编译单个节点为 PromptTask。"""
        # 加载模板
        tmpl = self.templates.load(node.profile)

        # 构建渲染变量
        variables = {
            "global_context": workflow.global_context,
            "node": {
                "label": node.label,
                "desc": node.desc,
                "id": node.id,
            },
            "params": {
                "description": node.desc,
                **node.params,
            },
            "upstream_context": upstream_context,
            "sequence": str(sequence),
        }

        # 渲染提示词
        prompt = self.templates.render(tmpl, variables)

        # 获取 system_prompt
        system_prompt = tmpl.get("system_prompt", "")
        tool_set = tmpl.get("tool_set", ["bash", "read", "write"])
        max_turns = tmpl.get("max_turns", 10)
        timeout_s = tmpl.get("timeout_s", 120)

        # 计算依赖
        depends_on = self._get_dependencies(node.id, workflow.edges)

        return PromptTask(
            task_id=f"task_{node.id}",
            workflow_id=workflow.workflow_id,
            node_id=node.id,
            node_type=node.profile,
            sequence=sequence,
            parallel_group=depth,
            depends_on=depends_on,
            prompt=prompt,
            system_prompt=system_prompt,
            tool_set=tool_set,
            max_turns=max_turns,
            timeout_s=timeout_s,
        )

    def _build_upstream_context(self, node_id: str,
                                 nodes: list[NodeDef],
                                 edges: list[EdgeDef]) -> str:
        """构建上游节点输出的上下文摘要。"""
        # 找出所有以 node_id 为 target 的 edge
        upstream_ids = []
        for e in edges:
            if e.target == node_id:
                upstream_ids.append(e.source)

        if not upstream_ids:
            return ""

        node_map = {n.id: n for n in nodes}
        parts = []
        for uid in upstream_ids:
            n = node_map.get(uid)
            if n:
                result = n.result or n.desc or ""
                parts.append(f"- **{n.label}**: {result}")

        return "\n".join(parts) if parts else ""

    def _get_dependencies(self, node_id: str,
                          edges: list[EdgeDef]) -> list[str]:
        """返回节点的直接上游依赖 ID 列表。"""
        return [e.source for e in edges if e.target == node_id]
