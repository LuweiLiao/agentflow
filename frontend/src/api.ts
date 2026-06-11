/* AgentFlow 前端 — API 客户端 */

import type {
  WorkflowNode, WorkflowEdge,
  RunInfo, SupervisorResponse,
} from "./types";

const BASE = "";  // 同域

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

  /** SSE 事件流：监听 run 状态变更（fetch + ReadableStream + AbortController） */
  subscribeRunEvents(runId: string, callbacks: {
    onNodeStart?: (evt: any) => void;
    onNodeComplete?: (evt: any) => void;
    onWorkflowDone?: (evt: any) => void;
    onError?: (err: Error) => void;
  }): AbortController {
    const controller = new AbortController();

    (async () => {
      try {
        const resp = await fetch(`${BASE}/api/runs/${runId}/events`, {
          signal: controller.signal,
        });
        if (!resp.ok) {
          callbacks.onError?.(new Error(`SSE HTTP ${resp.status}`));
          return;
        }
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
            else if (line === "" && eventType && eventData) {
              try {
                const data = JSON.parse(eventData);
                if (eventType === "node_start") callbacks.onNodeStart?.(data);
                else if (eventType === "node_complete") callbacks.onNodeComplete?.(data);
                else if (eventType === "workflow_done") callbacks.onWorkflowDone?.(data);
              } catch (e) {
                /* ignore parse errors */
              }
              eventType = "";
              eventData = "";
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          callbacks.onError?.(err);
        }
      }
    })();

    return controller;
  }
}

export const api = new ApiClient();
