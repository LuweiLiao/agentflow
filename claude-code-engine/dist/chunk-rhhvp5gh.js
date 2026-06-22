// @bun
import {
  init_slowOperations,
  slowLogging
} from "./chunk-1tytvdt1.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/execSyncWrapper.ts
import {
  execSync as nodeExecSync
} from "child_process";
function execSync_DEPRECATED(command, options) {
  using _ = slowLogging`execSync: ${command.slice(0, 100)}`;
  return nodeExecSync(command, options);
}
var init_execSyncWrapper = __esm(() => {
  init_slowOperations();
});

export { execSync_DEPRECATED, init_execSyncWrapper };

//# debugId=677AFC5E52556EBD64756E2164756E21
//# sourceMappingURL=chunk-rhhvp5gh.js.map
