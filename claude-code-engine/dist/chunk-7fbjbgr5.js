// @bun
import {
  init_log,
  logError
} from "./chunk-kc49dhz0.js";
import {
  getFsImplementation,
  init_fsOperations
} from "./chunk-pyv3zrjt.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-nxzx0ey9.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/platform.ts
import { readdir, readFile } from "fs/promises";
import { release as osRelease } from "os";
var SUPPORTED_PLATFORMS, getPlatform, getWslVersion, getLinuxDistroInfo;
var init_platform = __esm(() => {
  init_memoize();
  init_fsOperations();
  init_log();
  SUPPORTED_PLATFORMS = ["macos", "wsl"];
  getPlatform = memoize_default(() => {
    try {
      if (process.platform === "darwin") {
        return "macos";
      }
      if (process.platform === "win32") {
        return "windows";
      }
      if (process.platform === "linux") {
        try {
          const procVersion = getFsImplementation().readFileSync("/proc/version", { encoding: "utf8" });
          if (procVersion.toLowerCase().includes("microsoft") || procVersion.toLowerCase().includes("wsl")) {
            return "wsl";
          }
        } catch (error) {
          logError(error);
        }
        return "linux";
      }
      return "unknown";
    } catch (error) {
      logError(error);
      return "unknown";
    }
  });
  getWslVersion = memoize_default(() => {
    if (process.platform !== "linux") {
      return;
    }
    try {
      const procVersion = getFsImplementation().readFileSync("/proc/version", {
        encoding: "utf8"
      });
      const wslVersionMatch = procVersion.match(/WSL(\d+)/i);
      if (wslVersionMatch && wslVersionMatch[1]) {
        return wslVersionMatch[1];
      }
      if (procVersion.toLowerCase().includes("microsoft")) {
        return "1";
      }
      return;
    } catch (error) {
      logError(error);
      return;
    }
  });
  getLinuxDistroInfo = memoize_default(async () => {
    if (process.platform !== "linux") {
      return;
    }
    const result = {
      linuxKernel: osRelease()
    };
    try {
      const content = await readFile("/etc/os-release", "utf8");
      for (const line of content.split(`
`)) {
        const match = line.match(/^(ID|VERSION_ID)=(.*)$/);
        if (match && match[1] && match[2]) {
          const value = match[2].replace(/^"|"$/g, "");
          if (match[1] === "ID") {
            result.linuxDistroId = value;
          } else {
            result.linuxDistroVersion = value;
          }
        }
      }
    } catch {}
    return result;
  });
});

export { SUPPORTED_PLATFORMS, getPlatform, getWslVersion, init_platform };

//# debugId=A9C73818F2FF16D664756E2164756E21
//# sourceMappingURL=chunk-7fbjbgr5.js.map
