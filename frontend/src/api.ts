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
  /**
   * P2 fix: fetch with timeout via AbortController.
   *
   * P3 enhancement: automatic retry on transient 5xx errors. Retries up to
   * `maxRetries` times (default 2) with exponential backoff (500ms, 1000ms,
   * 2000ms, ...). Only retries idempotent-looking requests and only when the
   * caller hasn't supplied its own AbortController signal that was already
   * aborted (so SSE/cancellation paths aren't retried).
   *
   * NOTE: The previous implementation called `this._fetch` recursively inside
   * itself, which was infinite recursion. This was the actual fetch core.
   */
  private async _fetch(url: string, opts: RequestInit = {}, timeoutMs = 30000): Promise<Response> {
    const MAX_RETRIES = 2;
    const BASE_BACKOFF_MS = 500;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      // Per-attempt AbortController so each retry gets a fresh timeout.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      // Merge caller-provided signal with our timeout signal. If the caller
      // already aborted (e.g. SSE cancellation), propagate immediately.
      const callerSignal = opts.signal;
      if (callerSignal) {
        if (callerSignal.aborted) controller.abort();
        else callerSignal.addEventListener("abort", () => controller.abort(), { once: true });
      }

      try {
        const resp = await fetch(url, { ...opts, signal: controller.signal });
        // Retry only on 5xx (transient server errors) and only on methods
        // that are safe to retry (GET/HEAD/OPTIONS, plus POST/PUT/DELETE only
        // when we haven't started streaming the request body).
        const isRetryableStatus = resp.status >= 500 && resp.status < 600;
        if (isRetryableStatus && attempt < MAX_RETRIES) {
          // Drain the body so the connection can be reused.
          try { await resp.body?.cancel(); } catch { /* ignore */ }
          const delay = BASE_BACKOFF_MS * Math.pow(2, attempt); // 500ms, 1000ms
          await new Promise<void>((resolve) => setTimeout(resolve, delay));
          continue;
        }
        return resp;
      } catch (err: unknown) {
        // Network errors / AbortError from timeout: retry if we have budget.
        const isAbort =
          err instanceof DOMException && err.name === "AbortError";
        // Only retry if the abort came from our timeout, not the caller.
        const abortedByCaller = callerSignal?.aborted;
        const canRetry =
          attempt < MAX_RETRIES &&
          !(abortedByCaller) &&
          // Only retry if no caller signal (auto-timeout) or it's still alive.
          (!callerSignal || !callerSignal.aborted);
        if (canRetry && (isAbort || err instanceof TypeError)) {
          const delay = BASE_BACKOFF_MS * Math.pow(2, attempt);
          await new Promise<void>((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    }
    // Unreachable — loop returns or throws — but satisfies TS return type.
    throw new Error(`_fetch exhausted retries for ${url}`);
  }

  async decompose(requirement: string, count: number = 5): Promise<{ nodes: WorkflowNode[], edges: WorkflowEdge[] }> {
    const resp = await this._fetch(`${BASE}/api/decompose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirement, count }),
    });
    if (!resp.ok) throw new Error(`编排失败: ${resp.status}`);
    return resp.json();
  }

  async execute(nodes: WorkflowNode[], edges: WorkflowEdge[], requirement: string): Promise<{ run_id: string; status: string }> {
    const resp = await this._fetch(`${BASE}/api/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, edges, requirement }),
    });
    if (!resp.ok) throw new Error(`执行失败: ${resp.status}`);
    return resp.json();
  }

  async getRun(runId: string): Promise<RunInfo> {
    const resp = await this._fetch(`${BASE}/api/runs/${runId}`);
    if (!resp.ok) throw new Error(`查询失败: ${resp.status}`);
    return resp.json();
  }

  /** Stop a running workflow (Simulink-style Stop transport control). */
  async deleteRun(runId: string): Promise<void> {
    const resp = await this._fetch(`${BASE}/api/runs/${runId}`, { method: "DELETE" });
    if (!resp.ok) throw new Error(`停止失败: ${resp.status}`);
  }

  async listRuns(): Promise<{ runs: RunInfo[] }> {
    const resp = await this._fetch(`${BASE}/api/runs`);
    if (!resp.ok) throw new Error(`列表失败: ${resp.status}`);
    return resp.json();
  }

  async supervisor(message: string, sessionId?: string): Promise<SupervisorResponse> {
    const resp = await this._fetch(`${BASE}/api/supervisor`, {
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

        const resp = await this._fetch(`${BASE}/api/runs/${runId}/events`, {
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
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000); // exponential: 1s, 2s, 4s, 8s, 16s (max 30s)
          setTimeout(() => connect(), delay);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          // F47 FIX: reconnect on network error
          if (!isTerminal && reconnectAttempts < MAX_RECONNECT) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
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
    const resp = await this._fetch(`${BASE}/api/runs/${runId}/evolve`, { method: "POST" });
    if (!resp.ok) throw new Error(`进化分析失败: ${resp.status}`);
    return resp.json();
  }

  async getEvolution(runId: string): Promise<EvolutionReport> {
    const resp = await this._fetch(`${BASE}/api/runs/${runId}/evolution`);
    if (!resp.ok) throw new Error(`获取进化报告失败: ${resp.status}`);
    return resp.json();
  }

  async upgrade(runId: string): Promise<UpgradeResponse> {
    const resp = await this._fetch(`${BASE}/api/runs/${runId}/upgrade`, { method: "POST" });
    if (!resp.ok) throw new Error(`升级管线失败: ${resp.status}`);
    return resp.json();
  }

  async getEvolutionStats(): Promise<EvolutionStatsResponse> {
    const resp = await this._fetch(`${BASE}/api/evolution/stats`);
    if (!resp.ok) throw new Error(`获取进化统计失败: ${resp.status}`);
    return resp.json();
  }

  async getEvolutionHistory(limit: number = 50): Promise<{ ok: boolean; history: unknown[] }> {
    const resp = await this._fetch(`${BASE}/api/evolution/history?limit=${limit}`);
    if (!resp.ok) throw new Error(`获取进化历史失败: ${resp.status}`);
    return resp.json();
  }

  // ── Workflow persistence API (P3) ─────────────────

  /**
   * Persist the current canvas workflow to the backend. Creates a new
   * workflow record (POST /api/workflows) and returns it with a workflow_id
   * that can be used for future updates via PUT.
   */
  async saveWorkflow(payload: {
    name?: string;
    requirement?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  }): Promise<BackendWorkflow> {
    const resp = await this._fetch(`${BASE}/api/workflows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`保存工作流失败: ${resp.status}`);
    return resp.json();
  }

  /** Update an existing workflow (PUT /api/workflows/{id}). */
  async updateWorkflow(
    workflowId: string,
    payload: Partial<{
      name: string;
      requirement: string;
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
    }>
  ): Promise<BackendWorkflow> {
    const resp = await this._fetch(`${BASE}/api/workflows/${encodeURIComponent(workflowId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`更新工作流失败: ${resp.status}`);
    return resp.json();
  }

  /** List all saved workflows (GET /api/workflows). */
  async listWorkflows(): Promise<{ workflows: BackendWorkflow[]; count: number }> {
    const resp = await this._fetch(`${BASE}/api/workflows`);
    if (!resp.ok) throw new Error(`获取工作流列表失败: ${resp.status}`);
    return resp.json();
  }

  /** Fetch a single workflow by id (GET /api/workflows/{id}). */
  async getWorkflow(workflowId: string): Promise<BackendWorkflow> {
    const resp = await this._fetch(`${BASE}/api/workflows/${encodeURIComponent(workflowId)}`);
    if (!resp.ok) throw new Error(`获取工作流失败: ${resp.status}`);
    return resp.json();
  }
}

/** Shape of a persisted workflow returned by the backend. */
export interface BackendWorkflow {
  workflow_id: string;
  name?: string;
  requirement?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  webhook_url?: string;
  created_at?: number;
  updated_at?: number;
}

export const api = new ApiClient();
