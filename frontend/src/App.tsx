import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
import BlockLibrary, { BLOCK_LIBRARY, DRAG_MIME } from "./BlockLibrary";
import { api } from "./api";
import {
  PROFILE_COLORS,
  DEFAULT_COLOR,
  toRfNodes,
  rfNodeToWorkflowNode,
  rfEdgeToWorkflowEdge,
  makeSignalEdge,
  applyEdgeAnimation,
  nextId,
} from "./utils";
import { autoLayout } from "./layout";
import {
  containerStyle,
  toolbarStyle,
  toolbarRowStyle,
  toolbarLeftStyle,
  toolbarRightStyle,
  toolbarDividerStyle,
  toolbarStatusBarStyle,
  logoStyle,
  reqInputStyle,
  btnStyle,
  btnMiniStyle,
  selectMiniStyle,
  runGroupStyle,
  runGroupRunBtn,
  runGroupPauseBtn,
  runGroupStopBtn,
  layoutBtnStyle,
} from "./styles";
import { colors, profileColor, formatCost } from "./theme";
import type { WorkflowNode, NodeStatus } from "./types";

const MAX_REQUIREMENT_LEN = 2000;

// ── 节点类型注册 ──
const nodeTypes = { agent: AgentNode };

// ── 示例需求 ──
const EXAMPLES = [
  { icon: "🔌", text: "用 PyQt5 实现一个串口调试助手，支持端口扫描、波特率设置、HEX/ASCII 收发" },
  { icon: "✅", text: "用 Flask + SQLite 开发一个 Todo 网页应用，含用户登录、CRUD、标签分类" },
  { icon: "🚁", text: "在 MATLAB/Simulink 中设计并仿真四旋翼无人机 ADRC 控制器" },
];

/** Pure helper: apply partial WorkflowNode updates to AgentNodeData. (G2) */
function applyNodeUpdates(data: AgentNodeData, updates: Partial<WorkflowNode>): AgentNodeData {
  const newData = { ...data };
  if (updates.label !== undefined) newData.label = updates.label;
  if (updates.desc !== undefined) newData.desc = updates.desc;
  if (updates.profile !== undefined) {
    newData.profile = updates.profile;
    newData.color = PROFILE_COLORS[updates.profile] || DEFAULT_COLOR;
  }
  if (updates.model !== undefined) newData.model = updates.model;
  return newData;
}

function CanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AgentNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [requirement, setRequirement] = useState("");
  const [selectedNode, setSelectedNode] = useState<Node<AgentNodeData> | null>(null);
  const [logs, setLogs] = useState<string[]>([`[${new Date().toLocaleTimeString()}] AgentFlow 已启动`]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const currentRunId = useRef("");
  const sseController = useRef<AbortController | null>(null);

  // ── Pause/Stop transport controls (Simulink-style) ──
  // isPausedRef is read synchronously inside SSE callbacks (which are created
  // once); paused updates are queued and flushed on resume.
  const isPausedRef = useRef(false);
  const pausedQueueRef = useRef<Array<() => void>>([]);

  // ── Undo/Redo 栈 ──
  const UNDO_MAX = 50;
  const [undoStack, setUndoStack] = useState<{ nodes: Node<AgentNodeData>[]; edges: Edge[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ nodes: Node<AgentNodeData>[]; edges: Edge[] }[]>([]);
  const undoLockRef = useRef(false);
  const stateRef = useRef({ nodes, edges });
  stateRef.current = { nodes, edges }; // 始终持有最新快照

  // H3 — focus management refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const inspectorWrapRef = useRef<HTMLDivElement>(null);

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

  /** G7 — validated requirement setter (cap length). */
  const updateRequirement = useCallback((v: string) => {
    setRequirement(v.slice(0, MAX_REQUIREMENT_LEN));
  }, []);

  /** 加载工作流到画布 */
  const loadWorkflow = useCallback(
    (wfNodes: WorkflowNode[], wfEdges: import("./types").WorkflowEdge[]) => {
      pushUndo();
      const { rfNodes, rfEdges } = toRfNodes(wfNodes, wfEdges);
      // Explicitly run auto-layout (left-to-right DAG layers) on the RF nodes.
      const laid = autoLayout(rfNodes, rfEdges);
      setNodes(laid);
      setEdges(rfEdges);
      addLog(`📋 工作流加载: ${rfNodes.length} 节点 · ${rfEdges.length} 条边`);
    },
    // G1 — pushUndo was missing from the dependency array.
    [setNodes, setEdges, addLog, pushUndo]
  );

  /** 📐 自动布局 — re-run DAG layered layout on the current nodes. */
  const handleAutoLayout = useCallback(() => {
    const cur = stateRef.current;
    if (cur.nodes.length === 0) return;
    pushUndo();
    const wfEdges = cur.edges.map(rfEdgeToWorkflowEdge);
    const laid = autoLayout(cur.nodes, wfEdges);
    setNodes(laid);
    addLog("📐 已重新自动布局");
    setTimeout(() => rf.fitView({ padding: 0.2 }), 100);
  }, [setNodes, addLog, pushUndo, rf]);

  // ── 编排（Supervisor）──
  const handleDecompose = useCallback(async () => {
    const trimmed = requirement.trim(); // G7 — trim whitespace
    if (!trimmed) return;
    setIsDecomposing(true);
    addLog(`🤖 开始编排: ${trimmed.slice(0, 80)}...`);

    try {
      let sessionId = "";
      let done = false;

      while (!done) {
        const resp = await api.supervisor(trimmed, sessionId);
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
    } catch (err) {
      addLog(`❌ 编排失败: ${err instanceof Error ? err.message : String(err)}`);
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
      const { run_id } = await api.execute(wfNodes, wfEdges, requirement.trim()); // G7 — trim
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

      // Pause-aware dispatcher: when paused, node UI updates are queued and
      // flushed on resume; SSE events keep being received.
      const applyOrQueue = (apply: () => void) => {
        if (isPausedRef.current) pausedQueueRef.current.push(apply);
        else apply();
      };

      // SSE 订阅（AbortController 模式）
      if (sseController.current) sseController.current.abort();
      sseController.current = api.subscribeRunEvents(run_id, {
        onNodeStart: (evt) => {
          applyOrQueue(() =>
            setNodes((nds) =>
              nds.map((n) =>
                n.id === evt.node_id ? { ...n, data: { ...n.data, status: "running" } } : n
              )
            )
          );
          addLog(`▶️ ${evt.label || evt.node_id} 开始执行`);
        },
        onNodeComplete: (evt) => {
          applyOrQueue(() =>
            setNodes((nds) =>
              nds.map((n) =>
                n.id === evt.node_id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        status: evt.status as NodeStatus,
                        cost: evt.cost,
                        duration_ms: evt.duration_ms,
                      },
                    }
                  : n
              )
            )
          );
          const icon = evt.status === "completed" ? "✅" : "❌";
          const dur = evt.duration_ms != null ? `${(evt.duration_ms / 1000).toFixed(0)}s` : "?";
          addLog(
            `${icon} ${evt.label || evt.node_id}: ${evt.status} ${formatCost(evt.cost)} ${dur}`
          );
        },
        onNodeFailed: (evt) => {
          applyOrQueue(() =>
            setNodes((nds) =>
              nds.map((n) =>
                n.id === evt.node_id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        status: "failed",
                        cost: evt.cost,
                        duration_ms: evt.duration_ms,
                      },
                    }
                  : n
              )
            )
          );
          addLog(`❌ ${evt.label || evt.node_id}: 失败`);
        },
        onWorkflowDone: (evt) => {
          addLog(`🏁 工作流完成: ${evt.status} · 总费用: ${formatCost(evt.total_cost)}`);
          setIsRunning(false);
        },
        onRunCancelled: () => {
          addLog(`🛑 工作流已取消`);
          setIsRunning(false);
          setNodes((nds) =>
            nds.map((n) =>
              n.data.status === "running" || n.data.status === "pending"
                ? { ...n, data: { ...n.data, status: "cancelled" } }
                : n
            )
          );
        },
        onQualityUpdate: (evt: any) => {
          if (evt?.event_type === "quality_fail" || evt?.type === "quality_fail") {
            addLog(`⚠️ 质量检查未通过: ${evt?.reason || ""}`);
          }
        },
        onError: (err: Error) => {
          addLog(`⚠️ SSE 异常: ${err.message}`);
          setIsRunning(false);
        },
      });
    } catch (err) {
      addLog(`❌ 执行失败: ${err instanceof Error ? err.message : String(err)}`);
      setIsRunning(false);
    }
  }, [nodes, edges, requirement, addLog, setNodes, pushUndo]);

  // ── Pause / Resume / Stop transport controls (Simulink-style) ──
  const handlePause = useCallback(() => {
    isPausedRef.current = true;
    setIsPaused(true);
    addLog("⏸ 已暂停（节点更新已排队）");
  }, [addLog]);

  const handleResume = useCallback(() => {
    isPausedRef.current = false;
    setIsPaused(false);
    const q = pausedQueueRef.current;
    pausedQueueRef.current = [];
    q.forEach((fn) => fn());
    if (q.length > 0) addLog(`▶ 已继续，刷新 ${q.length} 条排队更新`);
    else addLog("▶ 已继续");
  }, [addLog]);

  const handleStop = useCallback(async () => {
    addLog("⏹ 正在停止执行...");
    try {
      if (currentRunId.current) {
        await api.deleteRun(currentRunId.current);
      }
    } catch (err) {
      addLog(`⚠️ 停止请求: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (sseController.current) {
      sseController.current.abort();
      sseController.current = null;
    }
    isPausedRef.current = false;
    pausedQueueRef.current = [];
    setIsPaused(false);
    setIsRunning(false);
    addLog("⏹ 已停止");
  }, [addLog]);

  // ── Signal-flow animation: animate outgoing edges of running/completed nodes ──
  // Recompute edge `animated` flags whenever node statuses change.
  const statusSignature = useMemo(
    () => nodes.map((n) => `${n.id}:${n.data.status ?? "pending"}`).join("|"),
    [nodes]
  );
  useEffect(() => {
    setEdges((eds) => applyEdgeAnimation(eds, stateRef.current.nodes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusSignature, setEdges]);

  // G3 — abort any in-flight SSE stream when the component unmounts.
  useEffect(() => {
    return () => {
      if (sseController.current) {
        sseController.current.abort();
        sseController.current = null;
      }
    };
  }, []);

  // H3 — move focus between canvas and inspector on selection change.
  useEffect(() => {
    if (selectedNode) {
      inspectorWrapRef.current?.focus();
    } else {
      canvasRef.current?.focus();
    }
  }, [selectedNode]);

  // Bug #6 — keep selectedNode in sync when SSE updates node data.
  // Without this, the InspectorPanel shows stale data after execution events.
  useEffect(() => {
    if (!selectedNode) return;
    const updated = nodes.find((n) => n.id === selectedNode.id);
    if (updated && updated.data !== selectedNode.data) {
      setSelectedNode(updated);
    }
  }, [nodes]);

  // ── F07: isValidConnection — real-time connection validation during drag ──
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const c = connection as Connection;
      // 1. No self-connection
      if (!c.source || !c.target || c.source === c.target) return false;
      // 2. No duplicate edge
      const exists = stateRef.current.edges.some(
        (e) => e.source === c.source && e.target === c.target
      );
      if (exists) return false;
      // 3. No cycle — DFS from target back to source
      const adj = new Map<string, string[]>();
      for (const e of stateRef.current.edges) {
        if (!adj.has(e.source)) adj.set(e.source, []);
        adj.get(e.source)!.push(e.target);
      }
      // Temporarily add the new edge
      if (!adj.has(c.source)) adj.set(c.source, []);
      adj.get(c.source)!.push(c.target);
      const visited = new Set<string>();
      const stack = [c.target];
      while (stack.length > 0) {
        const cur = stack.pop()!;
        if (cur === c.source) return false; // cycle detected
        if (visited.has(cur)) continue;
        visited.add(cur);
        for (const next of adj.get(cur) || []) stack.push(next);
      }
      return true;
    },
    []
  );

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

        // Simulink-style edge: orthogonal routing, source-colored, hover label.
        const srcNode = stateRef.current.nodes.find((n) => n.id === connection.source);
        const tgtNode = stateRef.current.nodes.find((n) => n.id === connection.target);
        const srcColor = srcNode?.data.color || DEFAULT_COLOR;
        const srcLabel = srcNode?.data.label || connection.source || "";
        const tgtLabel = tgtNode?.data.label || connection.target || "";
        const newEdge = makeSignalEdge(
          connection.source!,
          connection.target!,
          srcColor,
          eds.length,
          `${srcLabel} → ${tgtLabel}`
        );
        addLog(`🔗 连线: ${srcLabel} → ${tgtLabel}`);
        return addEdge(newEdge, eds);
      });
    },
    [setEdges, addLog, pushUndo]
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
      // G2 — functional updates with shared helper; no stale `nodes` closure.
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: applyNodeUpdates(n.data, updates) } : n))
      );
      setSelectedNode((prev) =>
        prev && prev.id === id ? { ...prev, data: applyNodeUpdates(prev.data, updates) } : prev
      );
      addLog(`✏️ 更新节点 ${id}`);
    },
    [pushUndo, setNodes, addLog]
  );

  const handleNodeDelete = useCallback(
    (id: string) => {
      pushUndo();
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setSelectedNode(null);
      addLog(`🗑 删除节点 ${id}`);
    },
    [pushUndo, setNodes, setEdges, addLog]
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
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.nodes) {
          // F16 FIX: validate imported edges for cycles before applying
          const importedEdges = data.edges || [];
          const hasCycle = (() => {
            const adj = new Map<string, string[]>();
            for (const e of importedEdges) {
              if (!adj.has(e.source)) adj.set(e.source, []);
              adj.get(e.source)!.push(e.target);
            }
            const visited = new Set<string>();
            const stack = new Set<string>();
            const dfs = (node: string): boolean => {
              if (stack.has(node)) return true;
              if (visited.has(node)) return false;
              visited.add(node);
              stack.add(node);
              for (const next of adj.get(node) || []) {
                if (dfs(next)) return true;
              }
              stack.delete(node);
              return false;
            };
            for (const n of data.nodes) {
              if (dfs(n.id || n.node_id)) return true;
            }
            return false;
          })();
          if (hasCycle) {
            addLog(`❌ 导入失败: 导入的工作流包含环，无法加载`);
            return;
          }
          loadWorkflow(data.nodes, importedEdges);
        }
        if (data.requirement) updateRequirement(data.requirement);
        addLog(`📥 导入工作流: ${file.name}`);
      } catch (err) {
        addLog(`❌ 导入失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    input.click();
  }, [loadWorkflow, addLog, updateRequirement]);

  // ── 重置 ──
  const handleReset = useCallback(() => {
    pushUndo();
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setRequirement("");
    setLogs([`[${new Date().toLocaleTimeString()}] AgentFlow 已启动`]);
    currentRunId.current = "";
    if (sseController.current) {
      sseController.current.abort();
      sseController.current = null;
    }
    addLog("🔄 已重置");
  }, [pushUndo, setNodes, setEdges, addLog]);

  // ── 示例选择 (B7 — controlled empty value → resets to placeholder) ──
  const handleExample = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val) updateRequirement(val);
    },
    [updateRequirement]
  );

  // ── 清空日志 (E3) ──
  const handleClearLogs = useCallback(() => {
    setLogs([`[${new Date().toLocaleTimeString()}] 日志已清空`]);
  }, []);

  // ── Block Library: drag-drop / click-to-add new nodes ──
  const createNodeFromProfile = useCallback(
    (profile: string, position?: { x: number; y: number }) => {
      const def = BLOCK_LIBRARY.find((b) => b.profile === profile);
      const idx = stateRef.current.nodes.length + 1;
      const newNode: Node<AgentNodeData> = {
        id: nextId(),
        type: "agent",
        position: position ?? {
          x: 140 + Math.random() * 120,
          y: 120 + (idx - 1) * 24,
        },
        data: {
          icon: def?.icon || "🤖",
          label: def?.label || "新节点",
          desc: def?.desc || "",
          color: def?.color || profileColor(profile) || DEFAULT_COLOR,
          profile,
          status: "pending",
          index: idx,
        },
      };
      pushUndo();
      setNodes((nds) => [...nds, newNode]);
      addLog(`➕ 新增节点: ${newNode.data.label} (${profile})`);
    },
    [setNodes, addLog, pushUndo]
  );

  /** Library card click → add node at a default offset position. */
  const handleAddFromLibrary = useCallback(
    (profile: string) => createNodeFromProfile(profile),
    [createNodeFromProfile]
  );

  /** HTML5 drop onto the canvas → create node at the drop position. */
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const profile = event.dataTransfer.getData(DRAG_MIME);
      if (!profile) return;
      const position = rf.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      createNodeFromProfile(profile, position);
    },
    [rf, createNodeFromProfile]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // ── 进度统计 (B8) ──
  const progress = nodes.reduce(
    (acc, n) => {
      const s = (n.data.status || "pending") as NodeStatus;
      if (s === "completed") acc.completed++;
      else if (s === "running") acc.running++;
      else if (s === "failed" || s === "timed_out" || s === "cancelled" || s === "skipped") acc.failed++;
      else acc.pending++;
      return acc;
    },
    { completed: 0, running: 0, failed: 0, pending: 0 }
  );
  const totalNodes = nodes.length;
  const showProgress = isRunning && totalNodes > 0;

  const decomposeDisabled = isDecomposing || !requirement.trim();
  const executeDisabled = isRunning || nodes.length === 0;

  return (
    <div style={containerStyle}>
      {/* ── Top Toolbar (B1/B2) ── */}
      <div style={toolbarStyle}>
        <div style={toolbarRowStyle}>
          {/* Left section */}
          <div style={toolbarLeftStyle}>
            <span style={logoStyle}>🧬 AgentFlow</span>
            <span style={toolbarDividerStyle} />
            <AutoGrowTextarea
              value={requirement}
              onChange={updateRequirement}
              placeholder="输入需求描述，如：用 PyQt5 实现串口调试助手..."
            />
            <button
              className="af-btn af-btn-primary"
              style={btnStyle}
              onClick={handleDecompose}
              disabled={decomposeDisabled}
              title="使用 AI 自动编排工作流"
            >
              {isDecomposing ? "🔄 编排中..." : "🤖 AI 编排"}
            </button>

            {/* Simulink-style transport controls: Run / Pause / Stop */}
            <div style={runGroupStyle} role="group" aria-label="执行控制">
              <button
                className="af-btn af-btn-run"
                style={runGroupRunBtn}
                onClick={handleExecute}
                disabled={executeDisabled}
                title="执行当前工作流"
              >
                {isRunning ? "⏳ 执行中" : "▶ 执行"}
              </button>
              {isRunning && (
                <button
                  style={runGroupPauseBtn}
                  onClick={isPaused ? handleResume : handlePause}
                  title={isPaused ? "继续执行" : "暂停执行"}
                >
                  {isPaused ? "▶ 继续" : "⏸ 暂停"}
                </button>
              )}
              {isRunning && (
                <button
                  style={runGroupStopBtn}
                  onClick={handleStop}
                  title="停止执行"
                >
                  ⏹ 停止
                </button>
              )}
            </div>
          </div>

          {/* Right section (B5 — grouped utility buttons) */}
          <div style={toolbarRightStyle}>
            {/* B7 — example selector; controlled empty value resets to placeholder */}
            <select
              value=""
              onChange={handleExample}
              style={selectMiniStyle}
              aria-label="选择示例需求"
              title="示例需求"
            >
              <option value="">📂 示例</option>
              {EXAMPLES.map((ex, i) => (
                <option key={i} value={ex.text}>
                  {ex.icon} {ex.text.slice(0, 30)}...
                </option>
              ))}
            </select>

            {/* file ops group */}
            <button
              className="af-btn-mini"
              style={btnMiniStyle}
              onClick={handleExport}
              aria-label="导出 JSON"
              title="导出工作流为 JSON"
              disabled={nodes.length === 0}
            >
              📤
            </button>
            <button
              className="af-btn-mini"
              style={btnMiniStyle}
              onClick={handleImport}
              aria-label="导入 JSON"
              title="从 JSON 导入工作流"
            >
              📥
            </button>

            <span style={toolbarDividerStyle} />

            {/* history group */}
            <button
              className="af-btn-mini"
              style={btnMiniStyle}
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              aria-label="撤销"
              title="撤销 (Ctrl+Z)"
            >
              ↩️
            </button>
            <button
              className="af-btn-mini"
              style={btnMiniStyle}
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              aria-label="重做"
              title="重做 (Ctrl+Shift+Z)"
            >
              ↪️
            </button>

            <span style={toolbarDividerStyle} />

            <button
              className="af-btn-mini"
              style={layoutBtnStyle}
              onClick={handleAutoLayout}
              aria-label="自动布局"
              title="📐 自动布局（按依赖深度左→右排列）"
              disabled={nodes.length === 0}
            >
              📐
            </button>
            <button
              className="af-btn-mini"
              style={btnMiniStyle}
              onClick={handleReset}
              aria-label="重置画布"
              title="重置画布"
            >
              🔄
            </button>
            <button
              className="af-btn-mini"
              style={{
                ...btnMiniStyle,
                background: showEvolution ? colors.accent.purple : "transparent",
                borderColor: showEvolution ? colors.accent.purple : colors.border.default,
                color: showEvolution ? "#fff" : colors.text.secondary,
              }}
              onClick={() => setShowEvolution(!showEvolution)}
              aria-label="自我进化面板"
              title="自我进化面板"
              aria-pressed={showEvolution}
            >
              🧬
            </button>
          </div>
        </div>

        {/* B6 — status bar */}
        <div style={toolbarStatusBarStyle}>
          <span>🧩 节点: <strong style={{ color: colors.text.secondary }}>{nodes.length}</strong></span>
          <span>🔗 连线: <strong style={{ color: colors.text.secondary }}>{edges.length}</strong></span>
          <span>
            状态:{" "}
            <strong style={{ color: isRunning ? colors.status.running : colors.text.secondary }}>
              {isRunning ? "运行中" : isDecomposing ? "编排中" : "就绪"}
            </strong>
          </span>
          <div style={{ flex: 1 }} />
          <span>
            字数: {requirement.length}/{MAX_REQUIREMENT_LEN}
          </span>
        </div>

        {/* B8 — execution progress bar */}
        {showProgress && (
          <ProgressBar
            completed={progress.completed}
            running={progress.running}
            failed={progress.failed}
            pending={progress.pending}
            total={totalNodes}
          />
        )}
      </div>

      {/* ── Main Canvas + Inspector ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Simulink-style block library sidebar */}
        <BlockLibrary onAddNode={handleAddFromLibrary} />

        <div
          ref={canvasRef}
          className="af-canvas"
          style={{ flex: 1, position: "relative", outline: "none" }}
          tabIndex={0}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: "smoothstep" }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode={["Backspace", "Delete"]}
            snapToGrid
            snapGrid={[10, 10]}
            style={{ background: colors.bg[1] }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={colors.bg[4]} />
            <Controls
              style={{
                background: colors.bg[3],
                border: `1px solid ${colors.border.default}`,
                borderRadius: 8,
                color: colors.text.primary,
              }}
            />
            <MiniMap
              nodeColor={(node) => (node.data as AgentNodeData)?.color || colors.border.default}
              maskColor="rgba(0,0,0,0.6)"
              style={{
                background: colors.bg[3],
                border: `1px solid ${colors.border.default}`,
                borderRadius: 8,
              }}
            />
          </ReactFlow>
        </div>

        <div ref={inspectorWrapRef} tabIndex={-1} style={{ outline: "none" }}>
          <InspectorPanel
            node={selectedNode ? rfNodeToWorkflowNode(selectedNode) : null}
            onUpdate={handleNodeUpdate}
            onDelete={handleNodeDelete}
            graphInfo={{ nodes: nodes.length, edges: edges.length }}
          />
        </div>
      </div>

      {/* ── Evolution Panel ── */}
      {showEvolution && (
        <EvolutionPanel
          runId={currentRunId.current || null}
          onClose={() => setShowEvolution(false)}
        />
      )}

      {/* ── Log Panel ── */}
      <LogPanel logs={logs} onClear={handleClearLogs} />
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

/** B3 — auto-growing textarea (max ~3 rows) with focus-ring. */
function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 76)}px`; // ~3 rows
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="af-req-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={reqInputStyle}
      rows={1}
      aria-label="需求描述"
      maxLength={MAX_REQUIREMENT_LEN}
    />
  );
}

/** B8 — color-coded execution progress bar. */
function ProgressBar({
  completed,
  running,
  failed,
  pending,
  total,
}: {
  completed: number;
  running: number;
  failed: number;
  pending: number;
  total: number;
}) {
  if (total === 0) return null;
  const segments: { count: number; color: string; animated?: boolean }[] = [
    { count: completed, color: colors.status.completed },
    { count: running, color: colors.status.running, animated: true },
    { count: failed, color: colors.status.failed },
    { count: pending, color: colors.border.default },
  ];

  return (
    <div
      style={{
        padding: "6px 12px",
        background: colors.bg[1],
        borderTop: `1px solid ${colors.border.subtle}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ flex: 1, height: 8, borderRadius: 4, overflow: "hidden", display: "flex", background: colors.bg[2] }}>
        {segments.map(
          (seg, i) =>
            seg.count > 0 && (
              <div
                key={i}
                className={seg.animated ? "af-progress-running" : undefined}
                style={{
                  width: `${(seg.count / total) * 100}%`,
                  height: "100%",
                  background: seg.color,
                  transition: "width 0.3s ease",
                }}
              />
            )
        )}
      </div>
      <span style={{ fontSize: 11, color: colors.text.secondary, whiteSpace: "nowrap" }}>
        已完成 {completed}/{total}
      </span>
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
