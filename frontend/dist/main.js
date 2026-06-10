/* AgentFlow 前端 — 主入口 */
import { api } from "./api.js";
import { GraphStore } from "./state.js";
// ── 应用状态 ──
const requirementInput = document.getElementById("requirement");
const submitBtn = document.getElementById("submitBtn");
const configPanel = document.getElementById("configPanel");
const resultPanel = document.getElementById("resultPanel");
const canvasEl = document.getElementById("canvas");
const statusEl = document.getElementById("status");
let graph = new GraphStore();
let currentRunId = "";
let currentSseCancel = null;
let supSessionId = "";
// ── 安全转义 ──
function esc(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
}
// ── 画布渲染 ──
function renderCanvas() {
    const nodes = graph.nodes;
    const edges = graph.edges;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    let html = `<div class="graph-info">${nodes.length} 节点 · ${edges.length} 条边</div>
    <svg class="edges-layer" width="100%" height="100%" style="position:absolute;top:0;left:0;pointer-events:none;z-index:1;">`;
    // 边
    for (const e of edges) {
        html += `<line x1="50%" y1="0" x2="50%" y2="0" stroke="#94a3b8" stroke-width="2"
      marker-end="url(#arrow)" class="edge" data-source="${esc(e.source)}" data-target="${esc(e.target)}"/>`;
    }
    html += `<defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5"
    markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10" fill="#94a3b8"/></marker></defs></svg>`;
    html += `<div class="nodes-container" style="display:flex;flex-direction:column;gap:12px;padding:16px;position:relative;z-index:2;">`;
    // 按拓扑排序分组
    const sorted = graph.topoSorted;
    for (const node of sorted) {
        const status = node.status || "pending";
        const statusColors = {
            pending: "border-gray-300 bg-white",
            running: "border-blue-400 bg-blue-50 animate-pulse",
            completed: "border-green-500 bg-green-50",
            failed: "border-red-500 bg-red-50",
            skipped: "border-gray-300 bg-gray-100 opacity-60",
            timed_out: "border-yellow-500 bg-yellow-50",
        };
        const upstream = graph.getUpstream(node.id);
        const depStr = upstream.length > 0 ? `依赖: ${upstream.join(", ")}` : "无依赖";
        html += `<div class="node-card ${statusColors[status] || statusColors.pending}"
      style="border:2px solid;border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px;cursor:pointer;"
      data-id="${esc(node.id)}"
      onclick="window.__showNodeDetail('${esc(node.id)}')">

      <span style="font-size:20px;">${esc(node.icon || "🤖")}</span>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:14px;">${esc(node.label || node.id)}</div>
        <div style="font-size:11px;color:#64748b;">[${esc(node.profile)}] ${esc(depStr)}</div>
        <div style="font-size:12px;color:#475569;">${esc((node.desc || "").slice(0, 60))}</div>
      </div>
      <span class="status-badge" style="font-size:12px;padding:2px 6px;border-radius:4px;
        background:${status === 'completed' ? '#22c55e' : status === 'running' ? '#3b82f6' : status === 'failed' ? '#ef4444' : '#e2e8f0'};
        color:${status === 'pending' ? '#475569' : 'white'};">${esc(status)}</span>
    </div>`;
    }
    html += `</div>`;
    if (canvasEl)
        canvasEl.innerHTML = html;
    // 更新节点卡片点击事件
    for (const card of canvasEl?.querySelectorAll(".node-card") || []) {
        card.addEventListener("click", () => {
            const nid = card.getAttribute("data-id") || "";
            const node = graph.getNode(nid);
            if (!node)
                return;
            showToast(`📋 ${node.label || nid}\n${node.desc || "无描述"}\n状态: ${node.status || "pending"}\n费用: $${node.cost || 0}`);
        });
    }
}
// ── Toast 提示 ──
function showToast(msg) {
    const toast = document.getElementById("toast") || (() => {
        const el = document.createElement("div");
        el.id = "toast";
        el.style.cssText = "position:fixed;bottom:20px;right:20px;background:#1e293b;color:white;padding:12px 20px;border-radius:8px;z-index:9999;max-width:400px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);";
        document.body.appendChild(el);
        return el;
    })();
    toast.textContent = msg;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 4000);
}
// ── 日志 ──
function addLog(text, cls = "") {
    const log = document.getElementById("log");
    if (!log)
        return;
    const entry = document.createElement("div");
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    entry.className = cls;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}
// ── Supervisor 多轮对话 ──
async function startSupervisor() {
    const req = requirementInput.value.trim();
    if (!req) {
        showToast("请输入需求");
        return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "对话中...";
    addLog(`🤖 开始编排: ${req.slice(0, 80)}...`, "log-info");
    try {
        let done = false;
        supSessionId = "";
        while (!done) {
            const resp = await api.supervisor(req, supSessionId);
            supSessionId = resp.session_id;
            addLog(`[${resp.step}] ${resp.message.slice(0, 120)}`, "log-agent");
            if (resp.done && resp.nodes && resp.nodes.length > 0) {
                // 方案确认，加载到画布
                graph.load({ nodes: resp.nodes, edges: resp.edges });
                renderCanvas();
                configPanel.style.display = "block";
                showToast(`✅ 方案已确认: ${resp.nodes.length} 个节点`);
                addLog(`✅ 工作流就绪: ${resp.nodes.length} 节点`, "log-success");
                done = true;
            }
            else if (resp.step === "planning") {
                // 自动确认
                done = true;
                if (resp.nodes && resp.nodes.length > 0) {
                    graph.load({ nodes: resp.nodes, edges: resp.edges });
                    renderCanvas();
                    configPanel.style.display = "block";
                    addLog(`📋 规划完成: ${resp.nodes.length} 节点`, "log-success");
                }
                done = true;
            }
            else {
                // 还在询问细节，模拟用户补充
                //（实际用法：用户手动补充）
                done = true; // 跳出循环，让用户继续
                showToast("请补充需求细节后再次对话");
            }
        }
    }
    catch (err) {
        addLog(`❌ 编排失败: ${err.message}`, "log-error");
        showToast(`编排失败: ${err.message}`);
    }
    submitBtn.disabled = false;
    submitBtn.textContent = "🤖 AI 编排";
}
// ── 执行 ──
async function startExecution() {
    const req = requirementInput.value.trim();
    const nodes = graph.nodes;
    const edges = graph.edges;
    if (nodes.length === 0) {
        showToast("没有节点可执行");
        return;
    }
    addLog(`🚀 提交执行: ${nodes.length} 节点`, "log-info");
    const execBtn = document.getElementById("execBtn");
    if (execBtn)
        execBtn.disabled = true;
    try {
        const { run_id } = await api.execute(nodes, edges, req);
        currentRunId = run_id;
        addLog(`✅ 已提交: run_id=${run_id}`, "log-success");
        // 订阅 SSE
        if (currentSseCancel)
            currentSseCancel();
        currentSseCancel = api.subscribeRunEvents(run_id, {
            onNodeStart: (evt) => {
                graph.updateNodeStatus(evt.node_id, "running");
                renderCanvas();
                addLog(`▶️ ${evt.label} 开始执行`, "log-running");
            },
            onNodeComplete: (evt) => {
                graph.updateNodeStatus(evt.node_id, evt.status);
                if (evt.result)
                    graph.updateNode(evt.node_id, { result: evt.result.slice(0, 200) });
                renderCanvas();
                addLog(` ${evt.label}: ${evt.status} $${evt.cost?.toFixed(4)}`, evt.status === "completed" ? "log-success" : "log-error");
            },
            onWorkflowDone: (evt) => {
                addLog(`🏁 工作流完成: ${evt.status} 总费用: $${evt.total_cost?.toFixed(4)}`, "log-success");
                if (execBtn)
                    execBtn.disabled = false;
                showToast(`🎉 完成! 费用: $${evt.total_cost?.toFixed(4)}`);
            },
            onError: (err) => {
                addLog(`⚠️ SSE 连接异常: ${err.message}`, "log-warn");
                // fallback: 轮询
                pollRunStatus(run_id);
            },
        });
    }
    catch (err) {
        addLog(`❌ 执行失败: ${err.message}`, "log-error");
        if (execBtn)
            execBtn.disabled = false;
    }
}
// ── 轮询 fallback ──
async function pollRunStatus(runId) {
    const maxPoll = 60; // ~2 分钟
    for (let i = 0; i < maxPoll; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
            const run = await api.getRun(runId);
            if (run.status === "completed" || run.status === "failed") {
                addLog(`🏁 [轮询] 完成: ${run.status}`, "log-info");
                for (const n of run.nodes || []) {
                    graph.updateNode(n.node_id, { status: n.status, result: (n.result || "").slice(0, 200) });
                }
                renderCanvas();
                return;
            }
        }
        catch {
            break;
        }
    }
}
// ── 清空 ──
function resetAll() {
    graph.clear();
    renderCanvas();
    configPanel.style.display = "none";
    document.getElementById("log").innerHTML = "";
    currentRunId = "";
    if (currentSseCancel)
        currentSseCancel();
}
// ── 初始化 ──
document.addEventListener("DOMContentLoaded", () => {
    // 加载历史 runs
    api.listRuns().then(({ runs }) => {
        if (runs.length > 0) {
            const recent = runs[0];
            addLog(`📊 最近一次执行: ${recent.run_id} (${recent.status})`, "log-info");
        }
    }).catch(() => { });
    // 快速示例
    const examples = [
        "用 PyQt5 实现一个串口调试助手，支持端口扫描、波特率设置、HEX/ASCII 收发",
        "用 Flask + SQLite 开发一个 Todo 网页应用，含用户登录、CRUD、标签分类",
        "在 MATLAB/Simulink 中设计并仿真四旋翼无人机 ADRC 控制器",
    ];
    const exampleSelect = document.getElementById("exampleSelect");
    if (exampleSelect) {
        for (const ex of examples) {
            const opt = document.createElement("option");
            opt.value = ex;
            opt.textContent = ex.slice(0, 50) + "...";
            exampleSelect.appendChild(opt);
        }
        exampleSelect.addEventListener("change", () => {
            if (exampleSelect.value)
                requirementInput.value = exampleSelect.value;
        });
    }
    // 暴露到全局（用于 onClick）
    window.__showNodeDetail = (id) => {
        const node = graph.getNode(id);
        if (node)
            showToast(`📋 ${node.label || id}\n${node.desc || "无描述"}\n状态: ${node.status || "pending"}`);
    };
});
//# sourceMappingURL=main.js.map