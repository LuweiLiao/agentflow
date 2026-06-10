/* AgentFlow 前端 — API 客户端 */

import type {
  WorkflowNode, WorkflowEdge,
  RunInfo, SupervisorResponse,
} from "./types.js";

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

  /** SSE 事件流：监听 run 状态变更 */
  subscribeRunEvents(runId: string, callbacks: {
    onNodeStart?: (evt: any) => void;
    onNodeComplete?: (evt: any) => void;
    onWorkflowDone?: (evt: any) => void;
    onError?: (err: Error) => void;
  }): () => void {
    const es = new EventSource(`${BASE}/api/runs/${runId}/events`);

    if (callbacks.onNodeStart) {
      es.addEventListener("node_start", (e) => callbacks.onNodeStart!(JSON.parse(e.data)));
    }
    if (callbacks.onNodeComplete) {
      es.addEventListener("node_complete", (e) => callbacks.onNodeComplete!(JSON.parse(e.data)));
    }
    if (callbacks.onWorkflowDone) {
      es.addEventListener("workflow_done", (e) => callbacks.onWorkflowDone!(JSON.parse(e.data)));
    }
    es.onerror = () => {
      if (callbacks.onError) callbacks.onError(new Error("SSE 连接错误"));
    };

    // 返回取消订阅函数
    return () => es.close();
  }
}

export const api = new ApiClient();
