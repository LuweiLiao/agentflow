// @bun
import {
  getPlatform,
  init_platform
} from "./chunk-7fbjbgr5.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-nxzx0ey9.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/settings/managedPath.ts
import { join } from "path";
var getManagedFilePath, getManagedSettingsDropInDir;
var init_managedPath = __esm(() => {
  init_memoize();
  init_platform();
  getManagedFilePath = memoize_default(function() {
    if (process.env.USER_TYPE === "ant" && process.env.CLAUDE_CODE_MANAGED_SETTINGS_PATH) {
      return process.env.CLAUDE_CODE_MANAGED_SETTINGS_PATH;
    }
    switch (getPlatform()) {
      case "macos":
        return "/Library/Application Support/ClaudeCode";
      case "windows":
        return "C:\\Program Files\\ClaudeCode";
      default:
        return "/etc/claude-code";
    }
  });
  getManagedSettingsDropInDir = memoize_default(function() {
    return join(getManagedFilePath(), "managed-settings.d");
  });
});

export { getManagedFilePath, getManagedSettingsDropInDir, init_managedPath };

//# debugId=1948774875D0630564756E2164756E21
//# sourceMappingURL=chunk-e2jvken3.js.map
