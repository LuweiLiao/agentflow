// @bun
import {
  init_partition,
  partition_default
} from "./chunk-v7s3bqyb.js";
import {
  exports_coordinatorMode,
  init_coordinatorMode,
  init_uniqBy,
  init_utils1 as init_utils,
  isMcpTool,
  uniqBy_default
} from "./chunk-xzgt0njb.js";
import {
  COORDINATOR_MODE_ALLOWED_TOOLS,
  init_tools
} from "./chunk-kvjvqgcx.js";
import {
  __esm,
  __toCommonJS
} from "./chunk-hhsxm2yr.js";

// src/utils/toolPool.ts
function isPrActivitySubscriptionTool(name) {
  return PR_ACTIVITY_TOOL_SUFFIXES.some((suffix) => name.endsWith(suffix));
}
function applyCoordinatorToolFilter(tools) {
  return tools.filter((t) => COORDINATOR_MODE_ALLOWED_TOOLS.has(t.name) || isPrActivitySubscriptionTool(t.name));
}
function mergeAndFilterTools(initialTools, assembled, _mode) {
  const [mcp, builtIn] = partition_default(uniqBy_default([...initialTools, ...assembled], "name"), isMcpTool);
  const byName = (a, b) => a.name.localeCompare(b.name);
  const tools = [...builtIn.sort(byName), ...mcp.sort(byName)];
  if (coordinatorModeModule) {
    if (coordinatorModeModule.isCoordinatorMode()) {
      return applyCoordinatorToolFilter(tools);
    }
  }
  return tools;
}
var PR_ACTIVITY_TOOL_SUFFIXES, coordinatorModeModule;
var init_toolPool = __esm(() => {
  init_partition();
  init_uniqBy();
  init_tools();
  init_utils();
  PR_ACTIVITY_TOOL_SUFFIXES = [
    "subscribe_pr_activity",
    "unsubscribe_pr_activity"
  ];
  coordinatorModeModule = (init_coordinatorMode(), __toCommonJS(exports_coordinatorMode));
});

export { isPrActivitySubscriptionTool, applyCoordinatorToolFilter, mergeAndFilterTools, init_toolPool };

//# debugId=B2F621723670E1D364756E2164756E21
//# sourceMappingURL=chunk-q992s9e2.js.map
