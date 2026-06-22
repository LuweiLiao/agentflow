// @bun
import {
  clearSessionCaches,
  init_caches
} from "./chunk-1q9dw7sa.js";
import {
  asAgentId,
  clearAllPlanSlugs,
  clearSessionMetadata,
  evictTaskOutput,
  executeSessionEndHooks,
  exports_coordinatorMode,
  exports_sessionStorage,
  getAgentTranscriptPath,
  getCurrentWorktreeSession,
  getReplBridgeHandle,
  getSessionEndHookTimeoutMs,
  initTaskOutputAsSymlink,
  init_LocalAgentTask,
  init_Shell,
  init_coordinatorMode,
  init_diskOutput,
  init_guards,
  init_hooks1 as init_hooks,
  init_ids,
  init_plans,
  init_replBridgeHandle,
  init_sessionStart,
  init_sessionStorage,
  init_types1 as init_types,
  init_worktree,
  isInProcessTeammateTask,
  isLocalAgentTask,
  isLocalShellTask,
  processSessionStartHooks,
  resetSessionFilePointer,
  saveWorktreeState,
  setCwd
} from "./chunk-85672e5z.js";
import {
  createEmptyAttributionState,
  init_commitAttribution
} from "./chunk-s8p02480.js";
import {
  exports_proactive,
  init_proactive
} from "./chunk-652r6kww.js";
import {
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
import {
  init_log,
  logError
} from "./chunk-jsbc7abp.js";
import {
  getLastMainRequestId,
  getOriginalCwd,
  getSessionId,
  init_state,
  regenerateSessionId,
  resetCostState,
  setLastAPIRequest,
  setLastAPIRequestMessages,
  setLastClassifierRequests
} from "./chunk-xqs9r7pg.js";
import {
  __esm,
  __toCommonJS
} from "./chunk-hhsxm2yr.js";

// src/commands/clear/conversation.ts
import { randomUUID } from "crypto";
function notifyRemoteConversationCleared() {
  const handle = getReplBridgeHandle();
  if (!handle)
    return;
  handle.markTranscriptReset?.();
  const message = {
    type: "status",
    subtype: "status",
    status: "conversation_cleared",
    message: "conversation_cleared",
    uuid: randomUUID()
  };
  handle.writeSdkMessages([message]);
}
async function clearConversation({
  setMessages,
  readFileState,
  discoveredSkillNames,
  loadedNestedMemoryPaths,
  getAppState,
  setAppState,
  setConversationId
}) {
  const sessionEndTimeoutMs = getSessionEndHookTimeoutMs();
  await executeSessionEndHooks("clear", {
    getAppState,
    setAppState,
    signal: AbortSignal.timeout(sessionEndTimeoutMs),
    timeoutMs: sessionEndTimeoutMs
  });
  const lastRequestId = getLastMainRequestId();
  if (lastRequestId) {
    logEvent("tengu_cache_eviction_hint", {
      scope: "conversation_clear",
      last_request_id: lastRequestId
    });
  }
  const preservedAgentIds = new Set;
  const preservedLocalAgents = [];
  const shouldKillTask = (task) => ("isBackgrounded" in task) && task.isBackgrounded === false;
  if (getAppState) {
    for (const task of Object.values(getAppState().tasks)) {
      if (shouldKillTask(task))
        continue;
      if (isLocalAgentTask(task)) {
        preservedAgentIds.add(task.agentId);
        preservedLocalAgents.push(task);
      } else if (isInProcessTeammateTask(task)) {
        preservedAgentIds.add(task.identity.agentId);
      }
    }
  }
  setMessages(() => []);
  notifyRemoteConversationCleared();
  if (true) {
    const { setContextBlocked } = (init_proactive(), __toCommonJS(exports_proactive));
    setContextBlocked(false);
  }
  if (setConversationId) {
    setConversationId(randomUUID());
  }
  clearSessionCaches(preservedAgentIds);
  setLastAPIRequest(null);
  setLastAPIRequestMessages(null);
  setLastClassifierRequests(null);
  resetCostState();
  setCwd(getOriginalCwd());
  readFileState.clear();
  discoveredSkillNames?.clear();
  loadedNestedMemoryPaths?.clear();
  if (setAppState) {
    setAppState((prev) => {
      const nextTasks = {};
      for (const [taskId, task] of Object.entries(prev.tasks)) {
        if (!shouldKillTask(task)) {
          nextTasks[taskId] = task;
          continue;
        }
        try {
          if (task.status === "running") {
            if (isLocalShellTask(task)) {
              task.shellCommand?.kill();
              task.shellCommand?.cleanup();
              if (task.cleanupTimeoutId) {
                clearTimeout(task.cleanupTimeoutId);
              }
            }
            if ("abortController" in task) {
              task.abortController?.abort();
            }
            if ("unregisterCleanup" in task) {
              task.unregisterCleanup?.();
            }
          }
        } catch (error) {
          logError(error);
        }
        evictTaskOutput(taskId);
      }
      return {
        ...prev,
        tasks: nextTasks,
        attribution: createEmptyAttributionState(),
        standaloneAgentContext: undefined,
        fileHistory: {
          snapshots: [],
          trackedFiles: new Set,
          snapshotSequence: 0
        },
        mcp: {
          clients: [],
          tools: [],
          commands: [],
          resources: {},
          pluginReconnectKey: prev.mcp.pluginReconnectKey
        }
      };
    });
  }
  clearAllPlanSlugs();
  clearSessionMetadata();
  regenerateSessionId({ setCurrentAsParent: true });
  if (process.env.USER_TYPE === "ant" && process.env.CLAUDE_CODE_SESSION_ID) {
    process.env.CLAUDE_CODE_SESSION_ID = getSessionId();
  }
  await resetSessionFilePointer();
  for (const task of preservedLocalAgents) {
    if (task.status !== "running")
      continue;
    initTaskOutputAsSymlink(task.id, getAgentTranscriptPath(asAgentId(task.agentId)));
  }
  if (true) {
    const { saveMode } = (init_sessionStorage(), __toCommonJS(exports_sessionStorage));
    const {
      isCoordinatorMode
    } = (init_coordinatorMode(), __toCommonJS(exports_coordinatorMode));
    saveMode(isCoordinatorMode() ? "coordinator" : "normal");
  }
  const worktreeSession = getCurrentWorktreeSession();
  if (worktreeSession) {
    saveWorktreeState(worktreeSession);
  }
  const hookMessages = await processSessionStartHooks("clear");
  if (hookMessages.length > 0) {
    setMessages(() => hookMessages);
  }
}
var init_conversation = __esm(() => {
  init_replBridgeHandle();
  init_state();
  init_analytics();
  init_types();
  init_LocalAgentTask();
  init_guards();
  init_ids();
  init_commitAttribution();
  init_hooks();
  init_log();
  init_plans();
  init_Shell();
  init_sessionStart();
  init_sessionStorage();
  init_diskOutput();
  init_worktree();
  init_caches();
});

export { clearConversation, init_conversation };

//# debugId=EA828926CCACCB1B64756E2164756E21
//# sourceMappingURL=chunk-8vdjmzfj.js.map
