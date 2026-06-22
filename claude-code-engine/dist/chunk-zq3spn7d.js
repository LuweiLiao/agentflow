// @bun
import {
  getPlatform,
  init_platform
} from "./chunk-7fbjbgr5.js";
import {
  init_memoize as init_memoize2,
  memoizeWithLRU
} from "./chunk-qkkkfh9a.js";
import {
  getCwd,
  init_cwd
} from "./chunk-w95hkggk.js";
import {
  execSync_DEPRECATED,
  init_execSyncWrapper
} from "./chunk-mtgfbnth.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-pyv3zrjt.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-nxzx0ey9.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/windowsPaths.ts
import { existsSync } from "fs";
import * as path from "path";
import * as pathWin32 from "path/win32";
function checkPathExists(filePath) {
  return existsSync(filePath);
}
function findExecutable(executable) {
  if (executable === "git") {
    const defaultLocations = [
      "C:\\Program Files\\Git\\cmd\\git.exe",
      "C:\\Program Files (x86)\\Git\\cmd\\git.exe"
    ];
    for (const location of defaultLocations) {
      if (checkPathExists(location)) {
        return location;
      }
    }
  }
  try {
    const result = execSync_DEPRECATED(`where.exe ${executable}`, {
      stdio: "pipe",
      encoding: "utf8"
    }).trim();
    const paths = result.split(`\r
`).filter(Boolean);
    const cwd = getCwd().toLowerCase();
    for (const candidatePath of paths) {
      const normalizedPath = path.resolve(candidatePath).toLowerCase();
      const pathDir = path.dirname(normalizedPath).toLowerCase();
      if (pathDir === cwd || normalizedPath.startsWith(cwd + path.sep)) {
        logForDebugging(`Skipping potentially malicious executable in current directory: ${candidatePath}`);
        continue;
      }
      return candidatePath;
    }
    return null;
  } catch {
    return null;
  }
}
function setShellIfWindows() {
  if (getPlatform() === "windows") {
    const gitBashPath = findGitBashPath();
    process.env.SHELL = gitBashPath;
    process.env.CLAUDE_CODE_GIT_BASH_PATH = gitBashPath;
    logForDebugging(`Using bash path: "${gitBashPath}"`);
  }
}
var findGitBashPath, windowsPathToPosixPath, posixPathToWindowsPath;
var init_windowsPaths = __esm(() => {
  init_memoize();
  init_cwd();
  init_debug();
  init_execSyncWrapper();
  init_memoize2();
  init_platform();
  findGitBashPath = memoize_default(() => {
    if (process.env.CLAUDE_CODE_GIT_BASH_PATH) {
      if (checkPathExists(process.env.CLAUDE_CODE_GIT_BASH_PATH)) {
        return process.env.CLAUDE_CODE_GIT_BASH_PATH;
      }
      console.error(`AgentFlow-Code was unable to find CLAUDE_CODE_GIT_BASH_PATH path "${process.env.CLAUDE_CODE_GIT_BASH_PATH}"`);
      process.exit(1);
    }
    const gitPath = findExecutable("git");
    if (gitPath) {
      const bashPath = pathWin32.join(gitPath, "..", "..", "bin", "bash.exe");
      if (checkPathExists(bashPath)) {
        return bashPath;
      }
    }
    console.error("AgentFlow-Code on Windows requires git-bash (https://git-scm.com/downloads/win). If installed but not in PATH, set environment variable pointing to your bash.exe, similar to: CLAUDE_CODE_GIT_BASH_PATH=C:\\Program Files\\Git\\bin\\bash.exe");
    process.exit(1);
  });
  windowsPathToPosixPath = memoizeWithLRU((windowsPath) => {
    if (windowsPath.startsWith("\\\\")) {
      return windowsPath.replace(/\\/g, "/");
    }
    const match = windowsPath.match(/^([A-Za-z]):[/\\]/);
    if (match) {
      const driveLetter = match[1].toLowerCase();
      return "/" + driveLetter + windowsPath.slice(2).replace(/\\/g, "/");
    }
    return windowsPath.replace(/\\/g, "/");
  }, (p) => p, 500);
  posixPathToWindowsPath = memoizeWithLRU((posixPath) => {
    if (posixPath.startsWith("//")) {
      return posixPath.replace(/\//g, "\\");
    }
    const cygdriveMatch = posixPath.match(/^\/cygdrive\/([A-Za-z])(\/|$)/);
    if (cygdriveMatch) {
      const driveLetter = cygdriveMatch[1].toUpperCase();
      const rest = posixPath.slice(("/cygdrive/" + cygdriveMatch[1]).length);
      return driveLetter + ":" + (rest || "\\").replace(/\//g, "\\");
    }
    const driveMatch = posixPath.match(/^\/([A-Za-z])(\/|$)/);
    if (driveMatch) {
      const driveLetter = driveMatch[1].toUpperCase();
      const rest = posixPath.slice(2);
      return driveLetter + ":" + (rest || "\\").replace(/\//g, "\\");
    }
    return posixPath.replace(/\//g, "\\");
  }, (p) => p, 500);
});

export { setShellIfWindows, findGitBashPath, windowsPathToPosixPath, posixPathToWindowsPath, init_windowsPaths };

//# debugId=F6EF485DF431374964756E2164756E21
//# sourceMappingURL=chunk-zq3spn7d.js.map
