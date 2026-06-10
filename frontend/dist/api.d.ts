import type { WorkflowNode, WorkflowEdge, RunInfo, SupervisorResponse } from "./types.js";
export declare class ApiClient {
    decompose(requirement: string, count?: number): Promise<{
        nodes: WorkflowNode[];
        edges: WorkflowEdge[];
    }>;
    execute(nodes: WorkflowNode[], edges: WorkflowEdge[], requirement: string): Promise<{
        run_id: string;
        status: string;
    }>;
    getRun(runId: string): Promise<RunInfo>;
    listRuns(): Promise<{
        runs: RunInfo[];
    }>;
    supervisor(message: string, sessionId?: string): Promise<SupervisorResponse>;
    /** SSE 事件流：监听 run 状态变更 */
    subscribeRunEvents(runId: string, callbacks: {
        onNodeStart?: (evt: any) => void;
        onNodeComplete?: (evt: any) => void;
        onWorkflowDone?: (evt: any) => void;
        onError?: (err: Error) => void;
    }): () => void;
}
export declare const api: ApiClient;
