// @bun
import {
  distRoot,
  init_distRoot
} from "./chunk-djt39ze3.js";
import {
  buildMcpToolName,
  init_mcpStringUtils
} from "./chunk-tavc33hf.js";
import {
  getChicagoCoordinateMode,
  init_gates
} from "./chunk-dypm8ssd.js";
import {
  buildComputerUseTools,
  init_src
} from "./chunk-s76nvx50.js";
import {
  CLI_CU_CAPABILITIES,
  COMPUTER_USE_MCP_SERVER_NAME,
  init_common
} from "./chunk-k92qk5av.js";
import"./chunk-vwenx8ke.js";
import"./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import"./chunk-x5wzz44g.js";
import"./chunk-r87btn9p.js";
import {
  init_bundledMode,
  isInBundledMode
} from "./chunk-v4ypszbb.js";
import"./chunk-dw66fdss.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-k51zdj4e.js";
import"./chunk-mtgfbnth.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import"./chunk-pyv3zrjt.js";
import"./chunk-kb3758f7.js";
import"./chunk-232p95fy.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-hhsxm2yr.js";

// src/utils/computerUse/setup.ts
init_src();
init_mcpStringUtils();
init_bundledMode();
init_distRoot();
init_common();
init_gates();
import { join } from "path";
function setupComputerUseMCP() {
  const allowedTools = buildComputerUseTools(CLI_CU_CAPABILITIES, getChicagoCoordinateMode()).map((t) => buildMcpToolName(COMPUTER_USE_MCP_SERVER_NAME, t.name));
  const args = isInBundledMode() ? ["--computer-use-mcp"] : [join(distRoot, "cli.js"), "--computer-use-mcp"];
  return {
    mcpConfig: {
      [COMPUTER_USE_MCP_SERVER_NAME]: {
        type: "stdio",
        command: process.execPath,
        args,
        scope: "dynamic"
      }
    },
    allowedTools
  };
}
export {
  setupComputerUseMCP
};

//# debugId=3390F1A9B3A13F8564756E2164756E21
//# sourceMappingURL=chunk-1v9r1ymm.js.map
