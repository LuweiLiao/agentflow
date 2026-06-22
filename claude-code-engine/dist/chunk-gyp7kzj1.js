// @bun
import {
  getMcpConfigsByScope,
  init_config
} from "./chunk-xzgt0njb.js";
import {
  getSettingsWithErrors,
  init_settings1 as init_settings
} from "./chunk-h2edgmqn.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/settings/allErrors.ts
function getSettingsWithAllErrors() {
  const result = getSettingsWithErrors();
  const scopes = ["user", "project", "local"];
  const mcpErrors = scopes.flatMap((scope) => getMcpConfigsByScope(scope).errors);
  return {
    settings: result.settings,
    errors: [...result.errors, ...mcpErrors]
  };
}
var init_allErrors = __esm(() => {
  init_config();
  init_settings();
});

export { getSettingsWithAllErrors, init_allErrors };

//# debugId=ED5F287B968876D564756E2164756E21
//# sourceMappingURL=chunk-gyp7kzj1.js.map
