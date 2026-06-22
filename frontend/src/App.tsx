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
  hasCycle,
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
import { colors, profileColor, radius, zIndex, transition, formatCost } from "./theme";  // #2: added radius
import type { WorkflowNode, NodeStatus } from "./types";

const MAX_REQUIREMENT_LEN = 2000;

// ── 节点类型注册 ──
const nodeTypes = { agent: AgentNode };

/** MiniMap node color: color each minimap node by its profile color, with a
 * safe fallback chain (node.color → profileColor(profile) →
 * border.default) so the minimap always reads at a glance. */
const miniMapNodeColor = (node: Node) => {
  const d = node.data as AgentNodeData | undefined;
  return (
    d?.color ||
    (d?.profile ? profileColor(d.profile) : colors.border.default)
  );
};

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
  if (updates.params !== undefined) newData.params = { ...data.params, ...updates.params };
  return newData;
}

/**
 * P1-fix: Update a single node by id without cloning every node in the array.
 * Uses findIndex (early exit) + shallow copy instead of nds.map(...), which
 * previously allocated a new object for every node on every SSE event —
 * O(events × nodes). Now only the changed node is cloned.
 */
function patchNodeData(
  nds: Node<AgentNodeData>[],
  id: string,
  patch: (data: AgentNodeData) => AgentNodeData
): Node<AgentNodeData>[] {
  const idx = nds.findIndex((n) => n.id === id);
  if (idx === -1) return nds;
  const next = nds.slice();
  next[idx] = { ...nds[idx], data: patch(nds[idx].data) };
  return next;
}

const STORAGE_KEY = "agentflow_workflow";
function loadSavedState(): { nodes: Node<AgentNodeData>[]; edges: Edge[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore parse errors */ }
  return { nodes: [], edges: [] };
}
function saveState(nodes: Node<AgentNodeData>[], edges: Edge[]) {
  try {
    const payload = JSON.stringify({ nodes, edges });
    if (payload.length > 4_000_000) {
      console.warn('saveState: payload too large, skipping localStorage write');
      return;
    }
    localStorage.setItem(STORAGE_KEY, payload);
  } catch { /* storage full or disabled */ }
}

function CanvasInner() {
  // P0-fix: lazy init via ref — loadSavedState() runs only ONCE on first
  // render, not on every re-render (avoids repeated localStorage.getItem +
  // JSON.parse calls that ran on each render previously).
  const savedRef = useRef<{ nodes: Node<AgentNodeData>[]; edges: Edge[] } | null>(null);
  if (savedRef.current === null) {
    savedRef.current = loadSavedState();
  }
  const saved = savedRef.current!;
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AgentNodeData>>(saved.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(saved.edges);
  const [requirement, setRequirement] = useState("");
  const [selectedNode, setSelectedNode] = useState<Node<AgentNodeData> | null>(null);
  const [logs, setLogs] = useState<string[]>([`[${new Date().toLocaleTimeString()}] AgentFlow Code 已启动`]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  // P0-fix: currentRunId is now state (was a ref) so EvolutionPanel re-renders
  // when a run starts — its `runId` prop stays reactive.
  const [currentRunId, setCurrentRunId] = useState("");
  // P3: workflow_id returned by the backend after the first save. Null until
  // the user saves (or restores) a workflow. Used to switch from POST (create)
  // to PUT (update) on subsequent saves.
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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

  // ── localStorage 持久化: 自动保存 nodes/edges (P0-fix: debounced 300ms) ──
  // Debouncing prevents a synchronous localStorage write on every animation
  // frame (e.g. during node drag) which caused jank.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveState(nodes, edges);
      saveTimerRef.current = null;
    }, 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [nodes, edges]);

  // H3 — focus management refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const inspectorWrapRef = useRef<HTMLDivElement>(null);

  /** 保存当前状态到 undo 栈（通过 ref 读取最新 state，避免 deps 抖动） */
  // R3-BUG-P1-006: deep compare with JSON.stringify instead of just length
  const pushUndo = useCallback(() => {
    if (undoLockRef.current) return;
    const cur = stateRef.current;
    setUndoStack((prev) => {
      const last = prev[prev.length - 1];
      if (last && JSON.stringify(last.nodes) === JSON.stringify(cur.nodes) && JSON.stringify(last.edges) === JSON.stringify(cur.edges)) {
        return prev; // 无变化则跳过
      }
      const snapshot = { nodes: [...cur.nodes], edges: [...cur.edges] };
      return [...prev.slice(-(UNDO_MAX - 1)), snapshot];
    });
    setRedoStack([]);
  }, []);

  /** 撤销 */
  // R3-BUG-P0-002: split nested setState into sequential calls
  // P2-fix: move stale-closure read of undoStack inside setUndoStack to avoid deps
  const handleUndo = useCallback(() => {
    const cur = stateRef.current;
    let prevState: { nodes: Node<AgentNodeData>[]; edges: Edge[] } | null = null;
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      prevState = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    // setUndoStack runs synchronously in React, so prevState is populated.
    if (!prevState) return;
    setRedoStack((r) => [...r.slice(-(UNDO_MAX - 1)), { nodes: [...cur.nodes], edges: [...cur.edges] }]);
    undoLockRef.current = true;
    const ps = prevState as { nodes: Node<AgentNodeData>[]; edges: Edge[] };
    setNodes(ps.nodes);
    setEdges(ps.edges);
    setTimeout(() => { undoLockRef.current = false; }, 0);
  }, [setNodes, setEdges]);

  /** 重做 */
  // R3-BUG-P0-002: split nested setState into sequential calls
  // P2-fix: move stale-closure read of redoStack inside setRedoStack to avoid deps
  const handleRedo = useCallback(() => {
    const cur = stateRef.current;
    let nextState: { nodes: Node<AgentNodeData>[]; edges: Edge[] } | null = null;
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      nextState = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    if (!nextState) return;
    setUndoStack((u) => [...u.slice(-(UNDO_MAX - 1)), { nodes: [...cur.nodes], edges: [...cur.edges] }]);
    undoLockRef.current = true;
    const ns = nextState as { nodes: Node<AgentNodeData>[]; edges: Edge[] };
    setNodes(ns.nodes);
    setEdges(ns.edges);
    setTimeout(() => { undoLockRef.current = false; }, 0);
  }, [setNodes, setEdges]);

  // ── 键盘快捷键 (moved below so all handlers are in scope) ──
  // See the consolidated keydown listener added after onNodesDelete.
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

  // ── P3: On mount, try to restore the latest workflow from the backend ──
  // Only restores if localStorage is empty (no unsaved local work to clobber).
  // This enables cross-device / cross-session workflow continuity.
  useEffect(() => {
    if (savedRef.current?.nodes?.length || savedRef.current?.edges?.length) {
      return; // localStorage has data — don't override local work.
    }
    let cancelled = false;
    (async () => {
      try {
        const { workflows } = await api.listWorkflows();
        if (cancelled || !workflows || workflows.length === 0) return;
        // Pick the most recently updated workflow.
        const latest = [...workflows].sort(
          (a, b) => (b.updated_at || b.created_at || 0) - (a.updated_at || a.created_at || 0)
        )[0];
        if (!latest?.nodes?.length) return;
        loadWorkflow(latest.nodes, latest.edges || []);
        if (latest.requirement) updateRequirement(latest.requirement);
        setSavedWorkflowId(latest.workflow_id);
        addLog(`☁️ 已从服务器恢复工作流: ${latest.workflow_id}`);
      } catch {
        // Backend may be unreachable on first load — silently fall back to
        // the (empty) localStorage state. Don't log to avoid noise.
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 📐 自动布局 — re-run DAG layered layout on the current nodes. */
  const handleAutoLayout = useCallback(() => {
    const cur = stateRef.current;
    if (cur.nodes.length === 0) return;
    pushUndo();
    const wfEdges = cur.edges.map(rfEdgeToWorkflowEdge);
    const laid = autoLayout(cur.nodes, wfEdges);
    setNodes(laid);
    addLog("📐 已重新自动布局");
    setTimeout(() => rf.fitView({ padding: 0.15, maxZoom: 1.2 }), 100);
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
      // P1-fix: cap supervisor iterations to prevent infinite loops if the
      // backend keeps returning non-terminal responses.
      const MAX_SUPERVISOR_ITERS = 5;
      let iters = 0;

      while (!done) {
        if (++iters > MAX_SUPERVISOR_ITERS) {
          addLog(`⚠️ Supervisor 达到最大迭代次数 (${MAX_SUPERVISOR_ITERS})，中止`);
          break;
        }
        const resp = await api.supervisor(trimmed, sessionId);
        sessionId = resp.session_id;
        addLog(`[${resp.step}] ${resp.message.slice(0, 120)}`);

        if (resp.done && resp.nodes && resp.nodes.length > 0) {
          loadWorkflow(resp.nodes, resp.edges || []);
          setTimeout(() => rf.fitView({ padding: 0.15, maxZoom: 1.2 }), 100);
          done = true;
        } else if (resp.step === "planning" && resp.nodes) {
          loadWorkflow(resp.nodes, resp.edges || []);
          setTimeout(() => rf.fitView({ padding: 0.15, maxZoom: 1.2 }), 100);
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
  }, [requirement, addLog, loadWorkflow, rf, setIsDecomposing]);

  // ── 执行 ──
  const handleExecute = useCallback(async () => {
    if (nodes.length === 0) {
      addLog("⚠️ 没有节点可执行");
      return;
    }

    setIsRunning(true);
    const wfNodes = nodes.map((n) => rfNodeToWorkflowNode(n));
    const wfEdges = edges.map(rfEdgeToWorkflowEdge);

    addLog(`🚀 提交执行: ${wfNodes.length} 节点`);
    try {
      const { run_id } = await api.execute(wfNodes, wfEdges, requirement.trim()); // G7 — trim
      setCurrentRunId(run_id);
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
            setNodes((nds) => patchNodeData(nds, evt.node_id, (d) => ({ ...d, status: "running" })))
          );
          addLog(`▶️ ${evt.label || evt.node_id} 开始执行`);
        },
        onNodeComplete: (evt) => {
          applyOrQueue(() =>
            setNodes((nds) =>
              patchNodeData(nds, evt.node_id, (d) => ({
                ...d,
                status: evt.status as NodeStatus,
                cost: evt.cost,
                duration_ms: evt.duration_ms,
              }))
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
              patchNodeData(nds, evt.node_id, (d) => ({
                ...d,
                status: "failed",
                cost: evt.cost,
                duration_ms: evt.duration_ms,
              }))
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
  }, [nodes, edges, requirement, addLog, setNodes, pushUndo, setCurrentRunId, setIsRunning]);

  // ── Pause / Resume / Stop transport controls (Simulink-style) ──
  const handlePause = useCallback(() => {
    isPausedRef.current = true;
    setIsPaused(true);
    addLog("⏸ 已暂停（节点更新已排队）");
  }, [addLog, setIsPaused]);

  const handleResume = useCallback(() => {
    isPausedRef.current = false;
    setIsPaused(false);
    const q = pausedQueueRef.current;
    pausedQueueRef.current = [];
    q.forEach((fn) => fn());
    if (q.length > 0) addLog(`▶ 已继续，刷新 ${q.length} 条排队更新`);
    else addLog("▶ 已继续");
  }, [addLog, setIsPaused]);

  // R3-BUG-P1-008: clear running node states on stop
  const handleStop = useCallback(async () => {
    addLog("⏹ 正在停止执行...");
    try {
      if (currentRunId) {
        await api.deleteRun(currentRunId);
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
    // Reset all running nodes back to pending
    setNodes((nds) =>
      nds.map((n) =>
        n.data.status === "running"
          ? { ...n, data: { ...n.data, status: "pending" as NodeStatus } }
          : n
      )
    );
    addLog("⏹ 已停止");
  }, [addLog, setNodes, setIsPaused, setIsRunning, currentRunId]);

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
  // Only jump focus when the selected node changes to a different node (by id),
  // not when SSE updates update the data reference of the same node.
  const prevSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentId = selectedNode?.id ?? null;
    if (currentId === prevSelectedIdRef.current) return; // same node, no focus jump
    prevSelectedIdRef.current = currentId;
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
      // 3. No cycle — would adding source→target create a back-path target→source?
      return !hasCycle(stateRef.current.edges, { source: c.source, target: c.target });
    },
    []
  );

  // ── 连线（含环检测）──
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source === connection.target) return;
      // R3-BUG-P0-003: compute labels before setEdges so addLog can use them after
      const srcNode = stateRef.current.nodes.find((n) => n.id === connection.source);
      const tgtNode = stateRef.current.nodes.find((n) => n.id === connection.target);
      const srcLabel = srcNode?.data.label || connection.source || "";
      const tgtLabel = tgtNode?.data.label || connection.target || "";
      pushUndo();
      setEdges((eds) => {
        const alreadyExists = eds.some(
          (e) => e.source === connection.source && e.target === connection.target
        );
        if (alreadyExists) return eds;

        // 快速环检测 — 使用公共 hasCycle 函数
        if (hasCycle(eds, { source: connection.source!, target: connection.target! })) {
          return eds;
        }

        // Simulink-style edge: orthogonal routing, source-colored, hover label.
        const srcColor = srcNode?.data.color || DEFAULT_COLOR;
        const newEdge = makeSignalEdge(
          connection.source!,
          connection.target!,
          srcColor,
          eds.length,
          `${srcLabel} → ${tgtLabel}`
        );
        return addEdge(newEdge, eds);
      });
      addLog(`🔗 连线: ${srcLabel} → ${tgtLabel}`);
    },
    [setEdges, addLog, pushUndo]
  );

  // ── 节点选择 ──
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<AgentNodeData>) => setSelectedNode(node),
    [setSelectedNode]
  );
  const onPaneClick = useCallback(() => setSelectedNode(null), [setSelectedNode]);

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
    [pushUndo, setNodes, setSelectedNode, addLog]
  );

  const handleNodeDelete = useCallback(
    (id: string) => {
      pushUndo();
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setSelectedNode(null);
      addLog(`🗑 删除节点 ${id}`);
    },
    [pushUndo, setNodes, setEdges, setSelectedNode, addLog]
  );

  // R3-BUG-P1-005: capture undo snapshot when React Flow deletes nodes via keyboard
  const onNodesDelete = useCallback(
    (deleted: Node<AgentNodeData>[]) => {
      if (deleted.length > 0 && !window.confirm('确认删除节点?')) return;
      pushUndo();
    },
    [pushUndo]
  );

  // ── 全局键盘快捷键 (P3) ──
  // Consolidated listener: Ctrl+Z=undo, Ctrl+Shift+Z / Ctrl+Y=redo,
  // Delete=remove selected node, Ctrl+Enter=execute workflow.
  // R3-BUG-P1-004: skip when focus is in an input/textarea (don't hijack native undo).
  // P2-fix: use refs for handler callbacks to avoid re-binding on every render.
  const handleUndoRef = useRef(handleUndo);
  const handleRedoRef = useRef(handleRedo);
  const handleNodeDeleteRef = useRef(handleNodeDelete);
  const handleExecuteRef = useRef(handleExecute);
  const selectedNodeRef = useRef(selectedNode);
  handleUndoRef.current = handleUndo;
  handleRedoRef.current = handleRedo;
  handleNodeDeleteRef.current = handleNodeDelete;
  handleExecuteRef.current = handleExecute;
  selectedNodeRef.current = selectedNode;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Undo: Ctrl+Z (not Shift)
      if (ctrl && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        handleUndoRef.current();
        return;
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if (ctrl && ((e.shiftKey && (e.key === "z" || e.key === "Z")) || e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        handleRedoRef.current();
        return;
      }
      // Delete selected node: Delete or Backspace (when not in an input).
      // React Flow handles its own node-deletion on these keys; we only
      // intervene when a single node is selected in the Inspector and the
      // canvas itself doesn't have keyboard focus, so we clear selection
      // and remove the node.
      const sn = selectedNodeRef.current;
      if ((e.key === "Delete" || e.key === "Backspace") && sn) {
        // Only intercept if the canvas doesn't have focus (RF handles it when focused).
        if (document.activeElement !== canvasRef.current) {
          e.preventDefault();
          handleNodeDeleteRef.current(sn.id);
          return;
        }
      }
      // Execute: Ctrl+Enter
      if (ctrl && e.key === "Enter") {
        e.preventDefault();
        handleExecuteRef.current();
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ── 导出/导入 JSON ──
  // R3-P3 #10: include metadata (timestamp / requirement / counts) so exports
  // are self-describing and round-trippable. Format mirrors handleSaveToServer.
  const handleExport = useCallback(() => {
    const wfNodes = nodes.map((n) => rfNodeToWorkflowNode(n));
    const wfEdges = edges.map(rfEdgeToWorkflowEdge);
    const data = {
      // Workflow graph
      nodes: wfNodes,
      edges: wfEdges,
      // Original user requirement (lets us re-decompose later)
      requirement,
      // R3-P3 #10 — provenance metadata
      meta: {
        format: "agentflow-workflow",
        format_version: 1,
        exported_at: new Date().toISOString(),
        timestamp: Date.now(),
        node_count: wfNodes.length,
        edge_count: wfEdges.length,
        source: "agentflow-frontend",
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agentflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog(`📤 导出工作流 (${wfNodes.length} 节点, ${wfEdges.length} 连线)`);
  }, [nodes, edges, requirement, addLog]);

  // ── P3: Save/Restore workflow to/from backend ──────────────
  /**
   * Persist the current canvas to the backend. First save issues POST
   * /api/workflows (create); subsequent saves use PUT /api/workflows/{id}
   * (update). The returned workflow_id is cached in state so the button
   * label can reflect "update" vs "create".
   */
  const handleSaveToServer = useCallback(async () => {
    if (nodes.length === 0) {
      addLog("⚠️ 没有节点可保存");
      return;
    }
    setIsSaving(true);
    try {
      const wfNodes = nodes.map((n) => rfNodeToWorkflowNode(n));
      const wfEdges = edges.map(rfEdgeToWorkflowEdge);
      const payload = {
        name: requirement.slice(0, 80) || "未命名工作流",
        requirement,
        nodes: wfNodes,
        edges: wfEdges,
      };
      if (savedWorkflowId) {
        const wf = await api.updateWorkflow(savedWorkflowId, payload);
        addLog(`💾 工作流已更新: ${wf.workflow_id}`);
      } else {
        const wf = await api.saveWorkflow(payload);
        setSavedWorkflowId(wf.workflow_id);
        addLog(`💾 工作流已保存到服务器: ${wf.workflow_id}`);
      }
    } catch (err) {
      addLog(`❌ 保存失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, requirement, savedWorkflowId, addLog]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      // R3-P3 #9: friendly, structured schema validation. Collect all
      // violations first so the user sees every problem at once instead of
      // fixing them one at a time across multiple import attempts.
      const fail = (reason: string) => addLog(`❌ 导入失败: ${reason}`);

      try {
        const text = await file.text();
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          fail("文件不是有效的 JSON（解析失败）");
          return;
        }
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          fail("无效的工作流格式（应为包含 nodes/edges 的对象）");
          return;
        }
        const obj = data as Record<string, unknown>;
        if (!Array.isArray(obj.nodes)) {
          fail("缺少 nodes 数组（顶层应有 nodes: [...] 字段）");
          return;
        }
        if (!Array.isArray(obj.edges)) {
          fail("缺少 edges 数组（顶层应有 edges: [...] 字段）");
          return;
        }
        const importedNodes = obj.nodes as any[];
        const importedEdges = obj.edges as any[];

        // Validate each node has the minimum required fields.
        for (const n of importedNodes) {
          if (!n || typeof n !== "object") {
            fail(`节点列表中存在非对象元素`);
            return;
          }
          if (!n.id || typeof n.id !== "string") {
            fail(`存在缺少 id（或 id 非字符串）的节点`);
            return;
          }
          if (!n.label || typeof n.label !== "string") {
            fail(`节点 ${n.id} 缺少 label 字段`);
            return;
          }
        }

        // R3-P3 #9: validate each edge has source & target pointing at known nodes.
        const nodeIds = new Set(importedNodes.map((n) => n.id));
        for (const ed of importedEdges) {
          if (!ed || typeof ed !== "object") {
            fail(`边列表中存在非对象元素`);
            return;
          }
          if (!ed.source || !ed.target) {
            fail(`存在缺少 source/target 的边`);
            return;
          }
          if (!nodeIds.has(ed.source) || !nodeIds.has(ed.target)) {
            fail(`边 ${ed.source}→${ed.target} 引用了不存在的节点`);
            return;
          }
        }

        // Check for duplicate node IDs.
        const seenIds = new Set<string>();
        for (const n of importedNodes) {
          if (seenIds.has(n.id)) {
            fail(`检测到重复节点 id: ${n.id}`);
            return;
          }
          seenIds.add(n.id);
        }

        // F16 FIX: validate imported edges for cycles before applying
        if (hasCycle(importedEdges)) {
          fail(`导入的工作流包含环（循环依赖），无法加载`);
          return;
        }

        loadWorkflow(importedNodes, importedEdges);
        if (typeof obj.requirement === "string") updateRequirement(obj.requirement);
        addLog(`📥 导入工作流: ${file.name} (${importedNodes.length} 节点, ${importedEdges.length} 连线)`);
      } catch (err) {
        fail(`未知错误: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    input.click();
  }, [loadWorkflow, addLog, updateRequirement]);

  // ── 重置 ──
  // R3-BUG-P1-007: reset isRunning and isPaused states
  const handleReset = useCallback(() => {
    pushUndo();
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setRequirement("");
    setLogs([`[${new Date().toLocaleTimeString()}] AgentFlow Code 已启动`]);
    setCurrentRunId("");
    setSavedWorkflowId(null);
    if (sseController.current) {
      sseController.current.abort();
      sseController.current = null;
    }
    isPausedRef.current = false;
    pausedQueueRef.current = [];
    setIsRunning(false);
    setIsPaused(false);
    addLog("🔄 已重置");
  }, [pushUndo, setNodes, setEdges, addLog, setIsRunning, setIsPaused]);

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
      pushUndo();
      // R2-#1: Use functional updater so idx is always correct even during rapid calls
      setNodes((nds) => {
        const idx = nds.length + 1;
        const newNode: Node<AgentNodeData> = {
          id: nextId(),
          type: "agent",
          position: position ?? {
            x: 140,
            y: 60 + (idx - 1) * 100,
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
        return [...nds, newNode];
      });
      addLog(`➕ 新增节点: ${def?.label || "新节点"} (${profile})`);
    },
    [setNodes, addLog, pushUndo]
  );

  /** Library card click → add node at a default offset position. */
  const handleAddFromLibrary = useCallback(
    (profile: string) => createNodeFromProfile(profile),
    [createNodeFromProfile]
  );

  /** HTML5 drop onto the canvas → create node at the drop position. */
  // #7: track drag-over state to drive the canvas drop-zone highlight
  // (`.af-canvas--dragover` in global.css adds a translucent blue border).
  // Declared BEFORE onDrop/onDragLeave so the setter is in scope for their
  // dependency arrays (block-scoped `const` temporal-dead-zone safe).
  const [isDragOver, setIsDragOver] = useState(false);
  const isDragOverRef = useRef(false);
  isDragOverRef.current = isDragOver;
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      // #7: clear drop-zone highlight as soon as the drop resolves.
      setIsDragOver(false);
      const profile = event.dataTransfer.getData(DRAG_MIME);
      if (!profile) return;
      const position = rf.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      createNodeFromProfile(profile, position);
    },
    [rf, createNodeFromProfile, setIsDragOver]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (!isDragOverRef.current) setIsDragOver(true);
  }, []);
  const onDragLeave = useCallback((event: React.DragEvent) => {
    // Only clear when leaving the canvas container (relatedTarget becomes null
    // or points outside this element). Using `Element` (not `Node`, which is
    // shadowed by @xyflow/react's `Node` type in this file).
    const rt = event.relatedTarget as Element | null;
    if (!rt || !event.currentTarget.contains(rt)) {
      setIsDragOver(false);
    }
  }, [setIsDragOver]);

  // ── 进度统计 (B8) ──
  // R3-P3 #6: memoize the per-status tally so the ProgressBar / status bar
  // don't recompute the full node scan on every keystroke in unrelated inputs.
  // `statusSignature` is already memoized above, so this only re-runs when
  // node statuses (or count) actually change.
  const progress = useMemo(
    () =>
      nodes.reduce(
        (acc, n) => {
          const s = (n.data.status || "pending") as NodeStatus;
          if (s === "completed") acc.completed++;
          else if (s === "running") acc.running++;
          else if (s === "failed" || s === "timed_out" || s === "cancelled" || s === "skipped") acc.failed++;
          else acc.pending++;
          return acc;
        },
        { completed: 0, running: 0, failed: 0, pending: 0 }
      ),
    [statusSignature, nodes]
  );
  // R3-P3 #6: derived counts are cheap but reused in multiple places — memoize.
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const totalNodes = nodeCount;
  const showProgress = isRunning && totalNodes > 0;

  const decomposeDisabled = isDecomposing || !requirement.trim();
  const executeDisabled = isRunning || nodeCount === 0;

  // R3-P3 #8: highlight the requirement word-count orange when within 10% of
  // the 2000-char ceiling (i.e. ≥ 1800 chars) so the user knows they're close.
  const reqWarn = requirement.length >= 1800;

  const handleToggleEvolution = useCallback(() => {
    setShowEvolution((v) => !v);
  }, []);

  const handleCloseEvolution = useCallback(() => {
    setShowEvolution(false);
  }, []);

  return (
    <div style={containerStyle}>
      {/* Skip-to-content link for keyboard users */}
      <a
        href="#main-canvas"
        style={{
          position: "absolute",
          top: -100,
          left: 0,
          zIndex: 1000,
          padding: "8px 16px",
          background: colors.accent.blue,
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          borderRadius: "0 0 4px 0",
          textDecoration: "none",
          transition: "top 0.12s ease",
        }}
        onFocus={(e) => { e.currentTarget.style.top = "0"; }}
        onBlur={(e) => { e.currentTarget.style.top = "-100px"; }}
      >
        跳转到主内容
      </a>
      {/* ── Top Toolbar (B1/B2) ── */}
      <div style={toolbarStyle}>
        <div style={toolbarRowStyle}>
          {/* Left section */}
          <div style={toolbarLeftStyle}>
            <h1 style={logoStyle}>🧬 AgentFlow Code</h1>
            <span style={toolbarDividerStyle} />
            <AutoGrowTextarea
              value={requirement}
              onChange={updateRequirement}
              placeholder="输入需求描述，如：用 PyQt5 实现串口调试助手..."
            />
            <button
              type="button"
              className="af-btn af-btn-primary"
              style={btnStyle}
              onClick={handleDecompose}
              disabled={decomposeDisabled}
              title="使用 AI 自动编排工作流"
            >
              {/* #6: CSS spinner (`.af-spinner` in global.css) replaces the
                   simple disabled look while the supervisor is running. */}
              {isDecomposing ? (<><span className="af-spinner" /> 编排中...</>) : "🤖 AI 编排"}
            </button>

            {/* Simulink-style transport controls: Run / Pause / Stop */}
            <div style={runGroupStyle} role="group" aria-label="执行控制">
              {/* aria-live region for announcing control changes */}
              <div aria-live="polite" aria-atomic="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
                {isRunning ? "工作流运行中，显示暂停和停止按钮" : "工作流已停止"}
              </div>
              <button
                type="button"
                className="af-btn af-btn-run"
                style={runGroupRunBtn}
                onClick={handleExecute}
                disabled={executeDisabled}
                title="执行当前工作流"
              >
                {/* #6: CSS spinner conveys active execution instead of a static emoji. */}
                {isRunning ? (<><span className="af-spinner" /> 执行中</>) : "▶ 执行"}
              </button>
              {isRunning && (
                <button
                  type="button"
                  style={runGroupPauseBtn}
                  onClick={isPaused ? handleResume : handlePause}
                  title={isPaused ? "继续执行" : "暂停执行"}
                >
                  {isPaused ? "▶ 继续" : "⏸ 暂停"}
                </button>
              )}
              {isRunning && (
                <button
                  type="button"
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
              <option value="">示例 📂</option>
              {EXAMPLES.map((ex) => (
                <option key={ex.text} value={ex.text}>
                  {ex.text.slice(0, 30)}... {ex.icon}
                </option>
              ))}
            </select>

            {/* file ops group */}
            <button
              type="button"
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
              type="button"
              className="af-btn-mini"
              style={btnMiniStyle}
              onClick={handleImport}
              aria-label="导入 JSON"
              title="从 JSON 导入工作流"
            >
              📥
            </button>

            {/* P3: save to / restore from backend server */}
            <button
              type="button"
              className="af-btn-mini"
              style={{
                ...btnMiniStyle,
                color: savedWorkflowId ? colors.accent.green : undefined,
                borderColor: savedWorkflowId ? colors.accent.green : undefined,
              }}
              onClick={handleSaveToServer}
              disabled={isSaving || nodes.length === 0}
              aria-label={savedWorkflowId ? "更新服务器工作流" : "保存到服务器"}
              title={
                savedWorkflowId
                  ? `💾 更新服务器工作流 (${savedWorkflowId})`
                  : "💾 保存工作流到服务器"
              }
            >
              {isSaving ? "⏳" : "💾"}
            </button>

            <span style={toolbarDividerStyle} />

            {/* history group */}
            <button
              type="button"
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
              type="button"
              className="af-btn-mini"
              style={btnMiniStyle}
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              aria-label="重做"
              title="重做 (Ctrl+Shift+Z / Ctrl+Y)"
            >
              ↪️
            </button>

            <span style={toolbarDividerStyle} />

            <button
              type="button"
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
              type="button"
              className="af-btn-mini"
              style={btnMiniStyle}
              onClick={handleReset}
              aria-label="重置画布"
              title="重置画布"
            >
              🔄
            </button>
            <button
              type="button"
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
        <div style={toolbarStatusBarStyle} aria-live="polite" aria-atomic="true">
          <span>🧩 节点: <strong style={{ color: colors.text.secondary }}>{nodeCount}</strong></span>
          <span>🔗 连线: <strong style={{ color: colors.text.secondary }}>{edgeCount}</strong></span>
          <span>
            状态:{" "}
            <strong style={{ color: isRunning ? colors.status.running : colors.text.secondary }}>
              {isRunning ? "运行中" : isDecomposing ? "编排中" : "就绪"}
            </strong>
          </span>
          <div style={{ flex: 1 }} />
          {/* R3-P3 #8 — turn the counter orange when within 10% of the limit. */}
          <span
            style={{
              color: reqWarn ? colors.status.timed_out : colors.text.tertiary,
              fontWeight: reqWarn ? 700 : 400,
            }}
            title={reqWarn ? "已接近字数上限" : undefined}
          >
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
          id="main-canvas"
          className={`af-canvas${isDragOver ? " af-canvas--dragover" : ""}`}
          style={{ flex: 1, position: "relative", outline: "none" }}
          tabIndex={0}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          {nodes.length === 0 && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
              zIndex: zIndex.panel, pointerEvents: "none", userSelect: "none",
            }} aria-live="polite">
              <div style={{
                fontSize: 48, opacity: 0.15, marginBottom: 16,
              }}>🧬</div>
              <div style={{
                fontSize: 14, color: "rgba(232,237,245,0.3)", textAlign: "center",
                lineHeight: 1.6,
              }}>
                从左侧模块库拖拽或点击模块开始创建
              </div>
              <div style={{
                fontSize: 12, color: "rgba(232,237,245,0.15)", marginTop: 8,
              }}>
                点击模块 → 添加到画布 | 拖拽模块 → 指定位置
              </div>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodesDelete={onNodesDelete}
            isValidConnection={isValidConnection}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: "smoothstep" }}
            fitView
            fitViewOptions={{ padding: 0.15, maxZoom: 1.2 }}
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
                borderRadius: radius.lg,  // #2: was hardcoded 8 — now uses token
                color: colors.text.primary,
              }}
            />
            <MiniMap
              nodeColor={miniMapNodeColor}
              maskColor="rgba(0,0,0,0.6)"
              style={{
                background: colors.bg[3],
                border: `1px solid ${colors.border.default}`,
                borderRadius: radius.lg,  // #2: was hardcoded 8 — now uses token
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
          runId={currentRunId || null}
          onClose={handleCloseEvolution}
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
  // #8: percentage of nodes that have reached a terminal state
  // (completed / failed / skipped), formatted like `3/7 (43%)`.
  const finished = completed + failed;
  const pct = Math.round((finished / total) * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={finished}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`工作流执行进度: ${finished}/${total} (${pct}%)`}
      style={{
        padding: "6px 12px",
        background: colors.bg[1],
        borderTop: `1px solid ${colors.border.subtle}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ flex: 1, height: 8, borderRadius: radius.sm, overflow: "hidden", display: "flex", background: colors.bg[2] }}>
        {segments.map(
          (seg) =>
            seg.count > 0 && (
              <div
                key={seg.color}
                className={seg.animated ? "af-progress-running" : undefined}
                style={{
                  width: `${(seg.count / total) * 100}%`,
                  height: "100%",
                  background: seg.color,
                  transition: `width ${transition.slow}`,
                }}
              />
            )
        )}
      </div>
      {/* #8: include percentage so users can gauge progress at a glance. */}
      <span style={{ fontSize: 11, color: colors.text.secondary, whiteSpace: "nowrap" }}>
        {finished}/{total} ({pct}%)
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
