// @bun
import {
  init_envUtils,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import {
  __esm,
  __export
} from "./chunk-hhsxm2yr.js";

// src/utils/teammateContext.ts
import { AsyncLocalStorage } from "async_hooks";
function getTeammateContext() {
  return teammateContextStorage.getStore();
}
function runWithTeammateContext(context, fn) {
  return teammateContextStorage.run(context, fn);
}
function isInProcessTeammate() {
  return teammateContextStorage.getStore() !== undefined;
}
function createTeammateContext(config) {
  return {
    ...config,
    isInProcess: true
  };
}
var teammateContextStorage;
var init_teammateContext = __esm(() => {
  teammateContextStorage = new AsyncLocalStorage;
});

// src/utils/teammate.ts
var exports_teammate = {};
__export(exports_teammate, {
  waitForTeammatesToBecomeIdle: () => waitForTeammatesToBecomeIdle,
  setDynamicTeamContext: () => setDynamicTeamContext,
  runWithTeammateContext: () => runWithTeammateContext,
  isTeammate: () => isTeammate,
  isTeamLead: () => isTeamLead,
  isPlanModeRequired: () => isPlanModeRequired,
  isInProcessTeammate: () => isInProcessTeammate,
  hasWorkingInProcessTeammates: () => hasWorkingInProcessTeammates,
  hasActiveInProcessTeammates: () => hasActiveInProcessTeammates,
  getTeammateContext: () => getTeammateContext,
  getTeammateColor: () => getTeammateColor,
  getTeamName: () => getTeamName,
  getParentSessionId: () => getParentSessionId,
  getDynamicTeamContext: () => getDynamicTeamContext,
  getAgentName: () => getAgentName,
  getAgentId: () => getAgentId,
  createTeammateContext: () => createTeammateContext,
  clearDynamicTeamContext: () => clearDynamicTeamContext
});
function getParentSessionId() {
  const inProcessCtx = getTeammateContext();
  if (inProcessCtx)
    return inProcessCtx.parentSessionId;
  return dynamicTeamContext?.parentSessionId;
}
function setDynamicTeamContext(context) {
  dynamicTeamContext = context;
}
function clearDynamicTeamContext() {
  dynamicTeamContext = null;
}
function getDynamicTeamContext() {
  return dynamicTeamContext;
}
function getAgentId() {
  const inProcessCtx = getTeammateContext();
  if (inProcessCtx)
    return inProcessCtx.agentId;
  return dynamicTeamContext?.agentId;
}
function getAgentName() {
  const inProcessCtx = getTeammateContext();
  if (inProcessCtx)
    return inProcessCtx.agentName;
  return dynamicTeamContext?.agentName;
}
function getTeamName(teamContext) {
  const inProcessCtx = getTeammateContext();
  if (inProcessCtx)
    return inProcessCtx.teamName;
  if (dynamicTeamContext?.teamName)
    return dynamicTeamContext.teamName;
  return teamContext?.teamName;
}
function isTeammate() {
  const inProcessCtx = getTeammateContext();
  if (inProcessCtx)
    return true;
  return !!(dynamicTeamContext?.agentId && dynamicTeamContext?.teamName);
}
function getTeammateColor() {
  const inProcessCtx = getTeammateContext();
  if (inProcessCtx)
    return inProcessCtx.color;
  return dynamicTeamContext?.color;
}
function isPlanModeRequired() {
  const inProcessCtx = getTeammateContext();
  if (inProcessCtx)
    return inProcessCtx.planModeRequired;
  if (dynamicTeamContext !== null) {
    return dynamicTeamContext.planModeRequired;
  }
  return isEnvTruthy(process.env.CLAUDE_CODE_PLAN_MODE_REQUIRED);
}
function isTeamLead(teamContext) {
  if (!teamContext?.leadAgentId) {
    return false;
  }
  const myAgentId = getAgentId();
  const leadAgentId = teamContext.leadAgentId;
  if (myAgentId === leadAgentId) {
    return true;
  }
  if (!myAgentId) {
    return true;
  }
  return false;
}
function hasActiveInProcessTeammates(appState) {
  for (const task of Object.values(appState.tasks)) {
    if (task.type === "in_process_teammate" && task.status === "running") {
      return true;
    }
  }
  return false;
}
function hasWorkingInProcessTeammates(appState) {
  for (const task of Object.values(appState.tasks)) {
    if (task.type === "in_process_teammate" && task.status === "running" && !task.isIdle) {
      return true;
    }
  }
  return false;
}
function waitForTeammatesToBecomeIdle(setAppState, appState) {
  const workingTaskIds = [];
  for (const [taskId, task] of Object.entries(appState.tasks)) {
    if (task.type === "in_process_teammate" && task.status === "running" && !task.isIdle) {
      workingTaskIds.push(taskId);
    }
  }
  if (workingTaskIds.length === 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let remaining = workingTaskIds.length;
    const onIdle = () => {
      remaining--;
      if (remaining === 0) {
        resolve();
      }
    };
    setAppState((prev) => {
      const newTasks = { ...prev.tasks };
      for (const taskId of workingTaskIds) {
        const task = newTasks[taskId];
        if (task && task.type === "in_process_teammate") {
          if (task.isIdle) {
            onIdle();
          } else {
            newTasks[taskId] = {
              ...task,
              onIdleCallbacks: [...task.onIdleCallbacks ?? [], onIdle]
            };
          }
        }
      }
      return { ...prev, tasks: newTasks };
    });
  });
}
var dynamicTeamContext = null;
var init_teammate = __esm(() => {
  init_teammateContext();
  init_envUtils();
  init_teammateContext();
});

export { getTeammateContext, runWithTeammateContext, isInProcessTeammate, createTeammateContext, init_teammateContext, getParentSessionId, getDynamicTeamContext, getAgentId, getAgentName, getTeamName, isTeammate, getTeammateColor, isPlanModeRequired, isTeamLead, hasActiveInProcessTeammates, hasWorkingInProcessTeammates, waitForTeammatesToBecomeIdle, exports_teammate, init_teammate };

//# debugId=6128D6C65A8CAAB464756E2164756E21
//# sourceMappingURL=chunk-c79fzdwz.js.map
