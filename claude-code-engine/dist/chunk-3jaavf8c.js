// @bun
import {
  init_toolPool,
  mergeAndFilterTools
} from "./chunk-q992s9e2.js";
import {
  assembleToolPool,
  init_tools
} from "./chunk-xzgt0njb.js";
import {
  require_react
} from "./chunk-0k4kr3h5.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/hooks/useMergedTools.ts
function useMergedTools(initialTools, mcpTools, toolPermissionContext) {
  let replBridgeEnabled = false;
  let replBridgeOutboundOnly = false;
  return import_react.useMemo(() => {
    const assembled = assembleToolPool(toolPermissionContext, mcpTools);
    return mergeAndFilterTools(initialTools, assembled, toolPermissionContext.mode);
  }, [
    initialTools,
    mcpTools,
    toolPermissionContext,
    replBridgeEnabled,
    replBridgeOutboundOnly
  ]);
}
var import_react;
var init_useMergedTools = __esm(() => {
  init_tools();
  init_toolPool();
  import_react = __toESM(require_react(), 1);
});

export { useMergedTools, init_useMergedTools };

//# debugId=63D3DAF864EC47AF64756E2164756E21
//# sourceMappingURL=chunk-3jaavf8c.js.map
