/* AgentFlow 前端 — API 客户端 */

import type {
  WorkflowNode, WorkflowEdge,
  RunInfo, SupervisorResponse,
  SSENodeEvent, SSEWorkflowDone,
  EvolutionReport, EvolutionStats,
  UpgradeDecision, Promotion, UpgradeSummary,
} from "./types";

const BASE = "";  // 同域

/** Callbacks for run SSE events. */
export interface RunEventCallbacks {
  onNodeStart?: (evt: SSENodeEvent) => void;
  onNodeComplete?: (evt: SSENodeEvent) => void;
  onNodeFailed?: (evt: SSENodeEvent) => void;
  onWorkflowDone?: (evt: SSEWorkflowDone) => void;
  onRunCancelled?: (evt: unknown) => void;
  onQualityUpdate?: (evt: unknown) => void;
  onEvolutionAnalysis?: (evt: unknown) => void;
  onUpgradeDecisions?: (evt: unknown) => void;
  onError?: (err: Error) => void;
}

export interface UpgradeResponse {
  ok: boolean;
  decisions?: UpgradeDecision[];
  promotions?: Promotion[];
  summary?: UpgradeSummary;
}

export interface EvolutionStatsResponse {
  ok: boolean;
  stats: EvolutionStats;
}

export class ApiClient {
  async decompose(requirement: string, count: number = 5): Promise<{ nodes: WorkflowNode[], edges: WorkflowEdge[] }> {
    const resp = await fetch(`${BASE}/api/decompose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirement, count }),
    });
    if (!resp.ok) throw new Error(`编排失败: ${resp.status}`);
    return resp.json();
  }

  async execute(nodes: WorkflowNode[], edges: WorkflowEdge[], requirement: string): Promise<{ run_id: string; status: string }> {
    const resp = await fetch(`${BASE}/api/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, edges, requirement }),
    });
    if (!resp.ok) throw new Error(`执行失败: ${resp.status}`);
    return resp.json();
  }

  async getRun(runId: string): Promise<RunInfo> {
    const resp = await fetch(`${BASE}/api/runs/${runId}`);
    if (!resp.ok) throw new Error(`查询失败: ${resp.status}`);
    return resp.json();
  }

  /** Stop a running workflow (Simulink-style Stop transport control). */
  async deleteRun(runId: string): Promise<void> {
    const resp = await fetch(`${BASE}/api/runs/${runId}`, { method: "DELETE" });
    if (!resp.ok) throw new Error(`停止失败: ${resp.status}`);
  }

  async listRuns(): Promise<{ runs: RunInfo[] }> {
    const resp = await fetch(`${BASE}/api/runs`);
    if (!resp.ok) throw new Error(`列表失败: ${resp.status}`);
    return resp.json();
  }

  async supervisor(message: string, sessionId?: string): Promise<SupervisorResponse> {
    const resp = await fetch(`${BASE}/api/supervisor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session_id: sessionId || "" }),
    });
    if (!resp.ok) throw new Error(`Supervisor 失败: ${resp.status}`);
    return resp.json();
  }

  /** SSE 事件流：监听 run 状态变更（fetch + ReadableStream + AbortController）
   * F47 FIX: auto-reconnect with Last-Event-ID on unexpected disconnects.
   */
  subscribeRunEvents(runId: string, callbacks: RunEventCallbacks): AbortController {
    const controller = new AbortController();
    let lastEventId = -1;
    let reconnectAttempts = 0;
    const MAX_RECONNECT = 5;
    let isTerminal = false;

    const connect = async () => {
      try {
        const headers: Record<string, string> = {};
        if (lastEventId >= 0) headers["Last-Event-ID"] = String(lastEventId);

        const resp = await fetch(`${BASE}/api/runs/${runId}/events`, {
          signal: controller.signal,
          headers,
        });
        if (!resp.ok) {
          callbacks.onError?.(new Error(`SSE HTTP ${resp.status}`));
          return;
        }
        reconnectAttempts = 0; // reset on successful connection
        const reader = resp.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let eventType = "";
        let eventData = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7);
            else if (line.startsWith("data: ")) eventData += line.slice(6);
            else if (line.startsWith("id: ")) {
              const id = parseInt(line.slice(4));
              if (!isNaN(id)) lastEventId = id;
            }
            else if (line === "" && eventType && eventData) {
              try {
                const data = JSON.parse(eventData);
                if (typeof data.sequence === "number") lastEventId = data.sequence;
                // G5 — handle all documented event types including evolution ones
                if (eventType === "node_start") callbacks.onNodeStart?.(data);
                else if (eventType === "node_complete") callbacks.onNodeComplete?.(data);
                else if (eventType === "node_failed") callbacks.onNodeFailed?.(data);
                else if (eventType === "run_done" || eventType === "run_failed"
                         || eventType === "workflow_done" || eventType === "workflow_failed") {
                  isTerminal = true;
                  callbacks.onWorkflowDone?.(data);
                }
                else if (eventType === "run_cancelled") {
                  isTerminal = true;
                  callbacks.onRunCancelled?.(data);
                }
                else if (eventType === "quality_start" || eventType === "quality_pass"
                         || eventType === "quality_fail" || eventType === "retry_scheduled")
                  callbacks.onQualityUpdate?.(data);
                else if (eventType === "evolution_analysis") callbacks.onEvolutionAnalysis?.(data);
                else if (eventType === "upgrade_decisions") callbacks.onUpgradeDecisions?.(data);
              } catch {
                /* ignore parse errors */
              }
              eventType = "";
              eventData = "";
            }
          }
        }

        // F47 FIX: auto-reconnect on unexpected disconnect (non-terminal, non-aborted)
        if (!isTerminal && !controller.signal.aborted && reconnectAttempts < MAX_RECONNECT) {
          reconnectAttempts++;
          const delay = Math.min(1000 * reconnectAttempts, 5000); // 1s, 2s, 3s, 4s, 5s backoff
          setTimeout(() => connect(), delay);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          // F47 FIX: reconnect on network error
          if (!isTerminal && reconnectAttempts < MAX_RECONNECT) {
            reconnectAttempts++;
            const delay = Math.min(1000 * reconnectAttempts, 5000);
            setTimeout(() => connect(), delay);
          } else {
            callbacks.onError?.(err);
          }
        }
      }
    };

    connect();

    return controller;
  }

  // ── Evolution API ──────────────────────────────────

  async evolve(runId: string): Promise<EvolutionReport> {
    const resp = await fetch(`${BASE}/api/runs/${runId}/evolve`, { method: "POST" });
    if (!resp.ok) throw new Error(`进化分析失败: ${resp.status}`);
    return resp.json();
  }

  async getEvolution(runId: string): Promise<EvolutionReport> {
    const resp = await fetch(`${BASE}/api/runs/${runId}/evolution`);
    if (!resp.ok) throw new Error(`获取进化报告失败: ${resp.status}`);
    return resp.json();
  }

  async upgrade(runId: string): Promise<UpgradeResponse> {
    const resp = await fetch(`${BASE}/api/runs/${runId}/upgrade`, { method: "POST" });
    if (!resp.ok) throw new Error(`升级管线失败: ${resp.status}`);
    return resp.json();
  }

  async getEvolutionStats(): Promise<EvolutionStatsResponse> {
    const resp = await fetch(`${BASE}/api/evolution/stats`);
    if (!resp.ok) throw new Error(`获取进化统计失败: ${resp.status}`);
    return resp.json();
  }

  async getEvolutionHistory(limit: number = 50): Promise<{ ok: boolean; history: unknown[] }> {
    const resp = await fetch(`${BASE}/api/evolution/history?limit=${limit}`);
    if (!resp.ok) throw new Error(`获取进化历史失败: ${resp.status}`);
    return resp.json();
  }
}

export const api = new ApiClient();
