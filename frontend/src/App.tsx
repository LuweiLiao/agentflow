import { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Node,
  Edge,
  Connection,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import AgentNode, { type AgentNodeData } from "./AgentNode";
import InspectorPanel from "./InspectorPanel";
import { api } from "./api";
import type { WorkflowNode, WorkflowEdge, NodeStatus } from "./types";

// ── 节点类型注册 ──
const nodeTypes = { agent: AgentNode };

// ── 颜色映射 ──
const PROFILE_COLORS: Record<string, string> = {
  analysis: "#3b82f6",
  design: "#8b5cf6",
  dev: "#10b981",
  test: "#f59e0b",
  doc: "#f97316",
  deploy: "#06b6d4",
};
const DEFAULT_COLOR = "#6366f1";

let nodeCounter = 0;
function nextId() {
  nodeCounter++;
  return `n${nodeCounter}`;
}

function rfNodeToWorkflowNode(rfNode: Node<AgentNodeData>): WorkflowNode {
  return {
    id: rfNode.id,
    icon: rfNode.data.icon,
    label: rfNode.data.label,
    desc: rfNode.data.desc,
    color: rfNode.data.color,
    profile: rfNode.data.profile as WorkflowNode["profile"],
    depends_on: [],
    status: rfNode.data.status as NodeStatus,
    cost: rfNode.data.cost,
    duration_ms: rfNode.data.duration_ms,
    model: rfNode.data.model,
  };
}

function rfEdgeToWorkflowEdge(e: Edge): WorkflowEdge {
  return { source: e.source, target: e.target };
}

// ── 示例需求 ──
const EXAMPLES = [
  "用 PyQt5 实现一个串口调试助手，支持端口扫描、波特率设置、HEX/ASCII 收发",
  "用 Flask + SQLite 开发一个 Todo 网页应用，含用户登录、CRUD、标签分类",
  "在 MATLAB/Simulink 中设计并仿真四旋翼无人机 ADRC 控制器",
];

function CanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<AgentNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [requirement, setRequirement] = useState("");
  const [selectedNode, setSelectedNode] = useState<Node<AgentNodeData> | null>(null);
  const [logs, setLogs] = useState<string[]>([`[${new Date().toLocaleTimeString()}] AgentFlow 已启动`]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const currentRunId = useRef("");
  const sseCancel = useRef<(() => void) | null>(null);
  const rf = useReactFlow();

  const addLog = useCallback((text: string) => {
    setLogs((prev) => [...prev.slice(-200), `[${new Date().toLocaleTimeString()}] ${text}`]);
  }, []);

  // ── 从 Supervisor 结果重建画布 ──
  const loadWorkflow = useCallback(
    (wfNodes: WorkflowNode[], wfEdges: WorkflowEdge[]) => {
      const rfNodes: Node<AgentNodeData>[] = wfNodes.map((n, i) => ({
        id: n.id,
        type: "agent",
        position: { x: 250, y: i * 160 },
        data: {
          icon: n.icon || "🤖",
          label: n.label,
          desc: n.desc,
          color: PROFILE_COLORS[n.profile] || DEFAULT_COLOR,
          profile: n.profile,
          status: n.status,
          cost: n.cost,
          duration_ms: n.duration_ms,
          model: n.model,
        },
      }));
      const rfEdges: Edge[] = wfEdges.map((e, i) => ({
        id: `e${i}`,
        source: e.source,
        target: e.target,
        style: { stroke: "#4b5563", strokeWidth: 2 },
        markerEnd: { type: "arrowclosed", color: "#4b5563" },
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
      addLog(`📋 工作流加载: ${rfNodes.length} 节点 · ${rfEdges.length} 条边`);
    },
    [setNodes, setEdges, addLog]
  );

  // ── 编排（Supervisor）──
  const handleDecompose = useCallback(async () => {
    if (!requirement.trim()) return;
    setIsDecomposing(true);
    addLog(`🤖 开始编排: ${requirement.slice(0, 80)}...`);

    try {
      let sessionId = "";
      let done = false;

      while (!done) {
        const resp = await api.supervisor(requirement, sessionId);
        sessionId = resp.session_id;
        addLog(`[${resp.step}] ${resp.message.slice(0, 120)}`);

        if (resp.done && resp.nodes && resp.nodes.length > 0) {
          loadWorkflow(resp.nodes, resp.edges || []);
          // 自动适配画布
          setTimeout(() => rf.fitView({ padding: 0.2 }), 100);
          done = true;
        } else if (resp.step === "planning" && resp.nodes) {
          loadWorkflow(resp.nodes, resp.edges || []);
          setTimeout(() => rf.fitView({ padding: 0.2 }), 100);
          done = true;
        } else {
          addLog("ℹ️ Supervisor 需更多输入，跳过");
          done = true;
        }
      }
    } catch (err: any) {
      addLog(`❌ 编排失败: ${err.message}`);
    }
    setIsDecomposing(false);
  }, [requirement, addLog, loadWorkflow, rf]);

  // ── 执行 ──
  const handleExecute = useCallback(async () => {
    if (nodes.length === 0) {
      addLog("⚠️ 没有节点可执行");
      return;
    }

    setIsRunning(true);
    const wfNodes = nodes.map(rfNodeToWorkflowNode);
    const wfEdges = edges.map(rfEdgeToWorkflowEdge);

    addLog(`🚀 提交执行: ${wfNodes.length} 节点`);
    try {
      const { run_id } = await api.execute(wfNodes, wfEdges, requirement);
      currentRunId.current = run_id;
      addLog(`✅ 已提交: run_id=${run_id}`);

      // 重置状态
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, status: "pending", cost: undefined, duration_ms: undefined },
        }))
      );

      // SSE 订阅
      if (sseCancel.current) sseCancel.current();
      sseCancel.current = api.subscribeRunEvents(run_id, {
        onNodeStart: (evt: any) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === evt.node_id ? { ...n, data: { ...n.data, status: "running" } } : n
            )
          );
          addLog(`▶️ ${evt.label} 开始执行`);
        },
        onNodeComplete: (evt: any) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === evt.node_id
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      status: evt.status,
                      cost: evt.cost,
                      duration_ms: evt.duration_ms,
                    },
                  }
                : n
            )
          );
          addLog(
            ` ${evt.label}: ${evt.status} $${evt.cost?.toFixed(4) || "?"} ${evt.duration_ms || "?"}ms`
          );
        },
        onWorkflowDone: (evt: any) => {
          addLog(`🏁 工作流完成: ${evt.status} · 总费用: $${evt.total_cost?.toFixed(4)}`);
          setIsRunning(false);
        },
        onError: (err: Error) => {
          addLog(`⚠️ SSE 异常: ${err.message}`);
          setIsRunning(false);
        },
      });
    } catch (err: any) {
      addLog(`❌ 执行失败: ${err.message}`);
      setIsRunning(false);
    }
  }, [nodes, edges, requirement, addLog, setNodes]);

  // ── 连接（React Flow 原生）──
  const onConnect = useCallback(
    (connection: Connection) => {
      // 环检测
      if (connection.source === connection.target) return;
      setEdges((eds) => {
        const alreadyExists = eds.some(
          (e) => e.source === connection.source && e.target === connection.target
        );
        if (alreadyExists) return eds;

        // 快速环检测：如果 target 已有路径到 source，拒绝
        const adj = new Map<string, string[]>();
        for (const e of eds) {
          if (!adj.has(e.source)) adj.set(e.source, []);
          adj.get(e.source)!.push(e.target);
        }
        if (!adj.has(connection.source!)) adj.set(connection.source!, []);
        adj.get(connection.source!)!.push(connection.target!);

        // DFS from target back to source
        const visited = new Set<string>();
        const stack = [connection.target!];
        while (stack.length > 0) {
          const cur = stack.pop()!;
          if (cur === connection.source) return eds; // cycle detected
          if (visited.has(cur)) continue;
          visited.add(cur);
          for (const next of adj.get(cur) || []) {
            stack.push(next);
          }
        }

        addLog(`🔗 连线: ${connection.source} → ${connection.target}`);
        return addEdge(
          {
            ...connection,
            style: { stroke: "#4b5563", strokeWidth: 2 },
            markerEnd: { type: "arrowclosed", color: "#4b5563" },
          },
          eds
        );
      });
    },
    [setEdges, addLog]
  );

  // ── 节点选择 ──
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<AgentNodeData>) => {
      setSelectedNode(node);
    },
    []
  );
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // ── Inspector 回调 ──
  const handleNodeUpdate = useCallback(
    (id: string, updates: Partial<WorkflowNode>) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n;
          const newData = { ...n.data };
          if (updates.label !== undefined) newData.label = updates.label;
          if (updates.desc !== undefined) newData.desc = updates.desc;
          if (updates.profile !== undefined) {
            newData.profile = updates.profile;
            newData.color = PROFILE_COLORS[updates.profile] || DEFAULT_COLOR;
          }
          if (updates.model !== undefined) newData.model = updates.model;
          return { ...n, data: newData };
        })
      );
      // 同步 selectedNode
      setSelectedNode((prev) => {
        if (!prev) return null;
        const updated = nodes.find((n) => n.id === id);
        return updated || prev;
      });
      addLog(`✏️ 更新节点 ${id}`);
    },
    [setNodes, nodes, addLog]
  );

  const handleNodeDelete = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setSelectedNode(null);
      addLog(`🗑 删除节点 ${id}`);
    },
    [setNodes, setEdges, addLog]
  );

  // ── 导出/导入 JSON ──
  const handleExport = useCallback(() => {
    const data = {
      nodes: nodes.map(rfNodeToWorkflowNode),
      edges: edges.map(rfEdgeToWorkflowEdge),
      requirement,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agentflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog(`📤 导出工作流 (${nodes.length} 节点)`);
  }, [nodes, edges, requirement, addLog]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.nodes) loadWorkflow(data.nodes, data.edges || []);
        if (data.requirement) setRequirement(data.requirement);
        addLog(`📥 导入工作流: ${file.name}`);
      } catch (err: any) {
        addLog(`❌ 导入失败: ${err.message}`);
      }
    };
    input.click();
  }, [loadWorkflow, addLog]);

  // ── 重置 ──
  const handleReset = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setLogs([`[${new Date().toLocaleTimeString()}] AgentFlow 已启动`]);
    currentRunId.current = "";
    if (sseCancel.current) {
      sseCancel.current();
      sseCancel.current = null;
    }
    addLog("🔄 已重置");
  }, [setNodes, setEdges, addLog]);

  // ── 示例选择 ──
  const handleExample = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (e.target.value) setRequirement(e.target.value);
    },
    []
  );

  return (
    <div style={containerStyle}>
      {/* ── Top Toolbar ── */}
      <div style={toolbarStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap" }}>
            🧬 AgentFlow
          </span>
          <div style={{ width: 1, height: 24, background: "#374151" }} />
          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="输入需求描述，如：用 PyQt5 实现串口调试助手..."
            style={reqInputStyle}
            rows={1}
          />
          <button style={btnStyle} onClick={handleDecompose} disabled={isDecomposing || !requirement.trim()}>
            {isDecomposing ? "🔄 编排中..." : "🤖 AI 编排"}
          </button>
          <button style={{ ...btnStyle, background: "rgba(16,185,129,0.12)", color: "#34d399" }} onClick={handleExecute} disabled={isRunning || nodes.length === 0}>
            {isRunning ? "⏳ 执行中..." : "🚀 执行"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <select onChange={handleExample} style={selectMiniStyle}>
            <option value="">📂 示例</option>
            {EXAMPLES.map((ex, i) => (
              <option key={i} value={ex}>
                {ex.slice(0, 36)}...
              </option>
            ))}
          </select>
          <button style={btnMiniStyle} onClick={handleExport} title="导出 JSON">
            📤
          </button>
          <button style={btnMiniStyle} onClick={handleImport} title="导入 JSON">
            📥
          </button>
          <button style={btnMiniStyle} onClick={handleReset} title="重置">
            🔄
          </button>
          <span style={{ fontSize: 10, color: "#64748b", marginLeft: 4 }}>
            {nodes.length} 节点 · {edges.length} 边
          </span>
        </div>
      </div>

      {/* ── Main Canvas + Inspector ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode={["Backspace", "Delete"]}
            snapToGrid
            snapGrid={[10, 10]}
            style={{ background: "#0f1117" }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
            <Controls
              style={{
                background: "#1a1d2e",
                border: "1px solid #374151",
                borderRadius: 8,
                color: "#e2e8f0",
              }}
            />
            <MiniMap
              nodeColor={(node) => (node.data as AgentNodeData)?.color || "#374151"}
              maskColor="rgba(0,0,0,0.6)"
              style={{
                background: "#1a1d2e",
                border: "1px solid #374151",
                borderRadius: 8,
              }}
            />
          </ReactFlow>
        </div>

        {/* Inspector */}
        <InspectorPanel
          node={selectedNode ? rfNodeToWorkflowNode(selectedNode) : null}
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
          graphInfo={{ nodes: nodes.length, edges: edges.length }}
        />
      </div>

      {/* ── Log Panel ── */}
      <div style={logPanelStyle}>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
          📜 日志
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, fontFamily: "monospace" }}>
          {logs.map((line, i) => (
            <div key={i}>
              {line.startsWith("❌") || line.includes("失败") ? (
                <span style={{ color: "#f87171" }}>{line}</span>
              ) : line.startsWith("✅") || line.startsWith("🏁") ? (
                <span style={{ color: "#34d399" }}>{line}</span>
              ) : line.startsWith("▶️") || line.startsWith("🤖") ? (
                <span style={{ color: "#60a5fa" }}>{line}</span>
              ) : line.startsWith("ℹ️") || line.startsWith("📋") ? (
                <span style={{ color: "#fbbf24" }}>{line}</span>
              ) : (
                <span>{line}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}

// ── Styles ──
const containerStyle: React.CSSProperties = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#0f1117",
  color: "#e2e8f0",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  overflow: "hidden",
};

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  background: "#1a1d2e",
  borderBottom: "1px solid #2d2d2d",
  flexWrap: "wrap",
};

const reqInputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 200,
  padding: "6px 10px",
  background: "#0f1117",
  border: "1px solid #374151",
  borderRadius: 6,
  color: "#e2e8f0",
  fontSize: 12,
  resize: "none",
  fontFamily: "inherit",
};

const btnStyle: React.CSSProperties = {
  padding: "6px 14px",
  background: "rgba(59,130,246,0.12)",
  border: "1px solid rgba(59,130,246,0.3)",
  borderRadius: 6,
  color: "#60a5fa",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const btnMiniStyle: React.CSSProperties = {
  padding: "4px 8px",
  background: "transparent",
  border: "1px solid #374151",
  borderRadius: 6,
  color: "#94a3b8",
  fontSize: 14,
  cursor: "pointer",
};

const selectMiniStyle: React.CSSProperties = {
  padding: "4px 8px",
  background: "#0f1117",
  border: "1px solid #374151",
  borderRadius: 6,
  color: "#94a3b8",
  fontSize: 11,
  cursor: "pointer",
};

const logPanelStyle: React.CSSProperties = {
  height: 140,
  overflowY: "auto",
  padding: "6px 12px",
  background: "#111318",
  borderTop: "1px solid #2d2d2d",
};
