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
import LogPanel from "./LogPanel";
import EvolutionPanel from "./EvolutionPanel";
import { api } from "./api";
import {
  PROFILE_COLORS,
  DEFAULT_COLOR,
  toRfNodes,
  rfNodeToWorkflowNode,
  rfEdgeToWorkflowEdge,
} from "./utils";
import {
  containerStyle,
  toolbarStyle,
  reqInputStyle,
  btnStyle,
  btnMiniStyle,
  selectMiniStyle,
  runBtnStyle,
} from "./styles";
import type { WorkflowNode, NodeStatus } from "./types";

// ── 节点类型注册 ──
const nodeTypes = { agent: AgentNode };

// ── 示例需求 ──
const EXAMPLES = [
  "用 PyQt5 实现一个串口调试助手，支持端口扫描、波特率设置、HEX/ASCII 收发",
  "用 Flask + SQLite 开发一个 Todo 网页应用，含用户登录、CRUD、标签分类",
  "在 MATLAB/Simulink 中设计并仿真四旋翼无人机 ADRC 控制器",
];

function CanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AgentNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [requirement, setRequirement] = useState("");
  const [selectedNode, setSelectedNode] = useState<Node<AgentNodeData> | null>(null);
  const [logs, setLogs] = useState<string[]>([`[${new Date().toLocaleTimeString()}] AgentFlow 已启动`]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const currentRunId = useRef("");
  const sseController = useRef<AbortController | null>(null);

  // ── Undo/Redo 栈 ──
  const UNDO_MAX = 50;
  const [undoStack, setUndoStack] = useState<{ nodes: Node<AgentNodeData>[]; edges: Edge[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ nodes: Node<AgentNodeData>[]; edges: Edge[] }[]>([]);
  const undoLockRef = useRef(false);
  const stateRef = useRef({ nodes, edges });
  stateRef.current = { nodes, edges }; // 始终持有最新快照

  /** 保存当前状态到 undo 栈（通过 ref 读取最新 state，避免 deps 抖动） */
  const pushUndo = useCallback(() => {
    if (undoLockRef.current) return;
    const cur = stateRef.current;
    setUndoStack((prev) => {
      const last = prev[prev.length - 1];
      if (
        last &&
        last.nodes.length === cur.nodes.length &&
        last.edges.length === cur.edges.length
      ) {
        return prev; // 无变化则跳过
      }
      const snapshot = { nodes: [...cur.nodes], edges: [...cur.edges] };
      return [...prev.slice(-(UNDO_MAX - 1)), snapshot];
    });
    setRedoStack([]);
  }, []);

  /** 撤销 */
  const handleUndo = useCallback(() => {
    const cur = stateRef.current;
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const prevState = prev[prev.length - 1];
      setRedoStack((r) => [...r.slice(-(UNDO_MAX - 1)), { nodes: [...cur.nodes], edges: [...cur.edges] }]);
      undoLockRef.current = true;
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setTimeout(() => { undoLockRef.current = false; }, 0);
      return prev.slice(0, -1);
    });
  }, [setNodes, setEdges]);

  /** 重做 */
  const handleRedo = useCallback(() => {
    const cur = stateRef.current;
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const nextState = prev[prev.length - 1];
      setUndoStack((u) => [...u.slice(-(UNDO_MAX - 1)), { nodes: [...cur.nodes], edges: [...cur.edges] }]);
      undoLockRef.current = true;
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setTimeout(() => { undoLockRef.current = false; }, 0);
      return prev.slice(0, -1);
    });
  }, [setNodes, setEdges]);

  // ── 键盘快捷键 ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUndo, handleRedo]);
  const rf = useReactFlow();

  const addLog = useCallback((text: string) => {
    setLogs((prev) => [...prev.slice(-200), `[${new Date().toLocaleTimeString()}] ${text}`]);
  }, []);

  /** 加载工作流到画布 */
  const loadWorkflow = useCallback(
    (wfNodes: WorkflowNode[], wfEdges: import("./types").WorkflowEdge[]) => {
      pushUndo();
      const { rfNodes, rfEdges } = toRfNodes(wfNodes, wfEdges);
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
      pushUndo();
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, status: "pending", cost: undefined, duration_ms: undefined },
        }))
      );

      // SSE 订阅（AbortController 模式）
      if (sseController.current) sseController.current.abort();
      sseController.current = api.subscribeRunEvents(run_id, {
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

  // ── 连线（含环检测）──
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source === connection.target) return;
      pushUndo();
      setEdges((eds) => {
        const alreadyExists = eds.some(
          (e) => e.source === connection.source && e.target === connection.target
        );
        if (alreadyExists) return eds;

        // 快速环检测 DFS
        const adj = new Map<string, string[]>();
        for (const e of eds) {
          if (!adj.has(e.source)) adj.set(e.source, []);
          adj.get(e.source)!.push(e.target);
        }
        if (!adj.has(connection.source!)) adj.set(connection.source!, []);
        adj.get(connection.source!)!.push(connection.target!);

        const visited = new Set<string>();
        const stack = [connection.target!];
        while (stack.length > 0) {
          const cur = stack.pop()!;
          if (cur === connection.source) return eds;
          if (visited.has(cur)) continue;
          visited.add(cur);
          for (const next of adj.get(cur) || []) stack.push(next);
        }

        addLog(`🔗 连线: ${connection.source} → ${connection.target}`);
        return addEdge(
          {
            ...connection,
            style: { stroke: "#4b5563", strokeWidth: 2 } as any,
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
    (_: React.MouseEvent, node: Node<AgentNodeData>) => setSelectedNode(node),
    []
  );
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  // ── Inspector 回调 ──
  const handleNodeUpdate = useCallback(
    (id: string, updates: Partial<WorkflowNode>) => {
      pushUndo();
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
      pushUndo();
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
    pushUndo();
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setLogs([`[${new Date().toLocaleTimeString()}] AgentFlow 已启动`]);
    currentRunId.current = "";
    if (sseController.current) {
      sseController.current.abort();
      sseController.current = null;
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
          <button style={runBtnStyle} onClick={handleExecute} disabled={isRunning || nodes.length === 0}>
            {isRunning ? "⏳ 执行中..." : "🚀 执行"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <select onChange={handleExample} style={selectMiniStyle}>
            <option value="">📂 示例</option>
            {EXAMPLES.map((ex, i) => (
              <option key={i} value={ex}>{ex.slice(0, 36)}...</option>
            ))}
          </select>
          <button style={btnMiniStyle} onClick={handleExport} title="导出 JSON">📤</button>
          <button style={btnMiniStyle} onClick={handleImport} title="导入 JSON">📥</button>
          <button style={btnMiniStyle} onClick={handleUndo} disabled={undoStack.length === 0} title="撤销 (Ctrl+Z)">↩️</button>
          <button style={btnMiniStyle} onClick={handleRedo} disabled={redoStack.length === 0} title="重做 (Ctrl+Shift+Z)">↪️</button>
          <button style={btnMiniStyle} onClick={handleReset} title="重置">🔄</button>
          <button
            style={{ ...btnMiniStyle, background: showEvolution ? "#8b5cf6" : btnMiniStyle.background }}
            onClick={() => setShowEvolution(!showEvolution)}
            title="自我进化面板"
          >
            🧬
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

        <InspectorPanel
          node={selectedNode ? rfNodeToWorkflowNode(selectedNode) : null}
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
          graphInfo={{ nodes: nodes.length, edges: edges.length }}
        />
      </div>

      {/* ── Evolution Panel ── */}
      {showEvolution && (
        <EvolutionPanel
          runId={currentRunId.current || null}
          onClose={() => setShowEvolution(false)}
        />
      )}

      {/* ── Log Panel ── */}
      <LogPanel logs={logs} />
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
