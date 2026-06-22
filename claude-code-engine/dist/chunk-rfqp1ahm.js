// @bun
import {
  SandboxManager,
  getRipgrepStatus,
  init_gracefulShutdown,
  init_ripgrep,
  init_sandbox_adapter
} from "./chunk-xzgt0njb.js";
import {
  gte,
  init_semver
} from "./chunk-4spgkgr3.js";
import {
  CUSTOMIZATION_SURFACES,
  getInitialSettings,
  init_settings1 as init_settings,
  init_types
} from "./chunk-h2edgmqn.js";
import {
  getProcessCommand,
  init_genericProcessUtils
} from "./chunk-k2hff9tm.js";
import {
  formatAutoUpdaterDisabledReason,
  getAutoUpdaterDisabledReason,
  getGlobalConfig,
  init_config
} from "./chunk-jyqypr4z.js";
import {
  getManagedFilePath,
  init_managedPath
} from "./chunk-e2jvken3.js";
import {
  getPlatform,
  init_platform
} from "./chunk-7fbjbgr5.js";
import {
  getDynamicConfig_BLOCKS_ON_INIT,
  getFeatureValue_CACHED_MAY_BE_STALE,
  init_growthbook
} from "./chunk-x5wzz44g.js";
import {
  env,
  init_env
} from "./chunk-r87btn9p.js";
import {
  init_bundledMode,
  isInBundledMode
} from "./chunk-v4ypszbb.js";
import {
  init_analytics
} from "./chunk-4hpfxga2.js";
import {
  axios_default,
  init_axios
} from "./chunk-pecy49yr.js";
import {
  execFileNoThrow,
  execFileNoThrowWithCwd,
  init_execFileNoThrow
} from "./chunk-w7s0zvjq.js";
import {
  init_cwd
} from "./chunk-w95hkggk.js";
import {
  init_log,
  logError
} from "./chunk-kc49dhz0.js";
import {
  init_which,
  which
} from "./chunk-k51zdj4e.js";
import {
  execa,
  init_execa
} from "./chunk-c1yc761e.js";
import {
  ClaudeError,
  getFsImplementation,
  init_debug,
  init_errors,
  init_fsOperations,
  init_slowOperations,
  isENOENT,
  isFsInaccessible,
  jsonParse,
  jsonStringify,
  logForDebugging,
  toError,
  writeFileSync_DEPRECATED
} from "./chunk-pyv3zrjt.js";
import {
  getClaudeConfigHomeDir,
  init_envUtils,
  isEnvDefinedFalsy,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-nxzx0ey9.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/localInstaller.ts
import { access, chmod, writeFile } from "fs/promises";
import { join } from "path";
function getLocalInstallDir() {
  return join(getClaudeConfigHomeDir(), "local");
}
function getLocalClaudePath() {
  return join(getLocalInstallDir(), "claude");
}
function isRunningFromLocalInstallation() {
  const execPath = process.argv[1] || "";
  return execPath.includes("/.claude/local/node_modules/");
}
async function localInstallationExists() {
  try {
    await access(join(getLocalInstallDir(), "node_modules", ".bin", "claude"));
    return true;
  } catch {
    return false;
  }
}
function getShellType() {
  const shellPath = process.env.SHELL || "";
  if (shellPath.includes("zsh"))
    return "zsh";
  if (shellPath.includes("bash"))
    return "bash";
  if (shellPath.includes("fish"))
    return "fish";
  return "unknown";
}
var init_localInstaller = __esm(() => {
  init_config();
  init_envUtils();
  init_errors();
  init_execFileNoThrow();
  init_fsOperations();
  init_log();
  init_slowOperations();
});

// src/utils/shellConfig.ts
import { open, readFile, stat } from "fs/promises";
import { homedir as osHomedir } from "os";
import { join as join2 } from "path";
function getShellConfigPaths(options) {
  const home = options?.homedir ?? osHomedir();
  const env2 = options?.env ?? process.env;
  const zshConfigDir = env2.ZDOTDIR || home;
  return {
    zsh: join2(zshConfigDir, ".zshrc"),
    bash: join2(home, ".bashrc"),
    fish: join2(home, ".config/fish/config.fish")
  };
}
function filterClaudeAliases(lines) {
  let hadAlias = false;
  const filtered = lines.filter((line) => {
    if (CLAUDE_ALIAS_REGEX.test(line)) {
      let match = line.match(/alias\s+claude\s*=\s*["']([^"']+)["']/);
      if (!match) {
        match = line.match(/alias\s+claude\s*=\s*([^#\n]+)/);
      }
      if (match && match[1]) {
        const target = match[1].trim();
        if (target === getLocalClaudePath()) {
          hadAlias = true;
          return false;
        }
      }
    }
    return true;
  });
  return { filtered, hadAlias };
}
async function readFileLines(filePath) {
  try {
    const content = await readFile(filePath, { encoding: "utf8" });
    return content.split(`
`);
  } catch (e) {
    if (isFsInaccessible(e))
      return null;
    throw e;
  }
}
async function writeFileLines(filePath, lines) {
  const fh = await open(filePath, "w");
  try {
    await fh.writeFile(lines.join(`
`), { encoding: "utf8" });
    await fh.datasync();
  } finally {
    await fh.close();
  }
}
async function findClaudeAlias(options) {
  const configs = getShellConfigPaths(options);
  for (const configPath of Object.values(configs)) {
    const lines = await readFileLines(configPath);
    if (!lines)
      continue;
    for (const line of lines) {
      if (CLAUDE_ALIAS_REGEX.test(line)) {
        const match = line.match(/alias\s+claude=["']?([^"'\s]+)/);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
  }
  return null;
}
async function findValidClaudeAlias(options) {
  const aliasTarget = await findClaudeAlias(options);
  if (!aliasTarget)
    return null;
  const home = options?.homedir ?? osHomedir();
  const expandedPath = aliasTarget.startsWith("~") ? aliasTarget.replace("~", home) : aliasTarget;
  try {
    const stats = await stat(expandedPath);
    if (stats.isFile() || stats.isSymbolicLink()) {
      return aliasTarget;
    }
  } catch {}
  return null;
}
var CLAUDE_ALIAS_REGEX;
var init_shellConfig = __esm(() => {
  init_errors();
  init_localInstaller();
  CLAUDE_ALIAS_REGEX = /^\s*alias\s+claude\s*=/;
});

// src/utils/autoUpdater.ts
import { constants as fsConstants } from "fs";
import { access as access2, writeFile as writeFile2 } from "fs/promises";
import { homedir } from "os";
async function getMaxVersion() {
  const config = await getMaxVersionConfig();
  if (process.env.USER_TYPE === "ant") {
    return config.ant || undefined;
  }
  return config.external || undefined;
}
async function getMaxVersionConfig() {
  try {
    return await getDynamicConfig_BLOCKS_ON_INIT("tengu_max_version_config", {});
  } catch (error) {
    logError(error);
    return {};
  }
}
function shouldSkipVersion(targetVersion) {
  const settings = getInitialSettings();
  const minimumVersion = settings?.minimumVersion;
  if (!minimumVersion) {
    return false;
  }
  const shouldSkip = !gte(targetVersion, minimumVersion);
  if (shouldSkip) {
    logForDebugging(`Skipping update to ${targetVersion} - below minimumVersion ${minimumVersion}`);
  }
  return shouldSkip;
}
async function getInstallationPrefix() {
  const isBun = env.isRunningWithBun();
  let prefixResult = null;
  if (isBun) {
    prefixResult = await execFileNoThrowWithCwd("bun", ["pm", "bin", "-g"], {
      cwd: homedir()
    });
  } else {
    prefixResult = await execFileNoThrowWithCwd("npm", ["-g", "config", "get", "prefix"], { cwd: homedir() });
  }
  if (prefixResult.code !== 0) {
    logError(new Error(`Failed to check ${isBun ? "bun" : "npm"} permissions`));
    return null;
  }
  return prefixResult.stdout.trim();
}
async function checkGlobalInstallPermissions() {
  try {
    const prefix = await getInstallationPrefix();
    if (!prefix) {
      return { hasPermissions: false, npmPrefix: null };
    }
    try {
      await access2(prefix, fsConstants.W_OK);
      return { hasPermissions: true, npmPrefix: prefix };
    } catch {
      logError(new AutoUpdaterError("Insufficient permissions for global npm install."));
      return { hasPermissions: false, npmPrefix: prefix };
    }
  } catch (error) {
    logError(error);
    return { hasPermissions: false, npmPrefix: null };
  }
}
async function getNpmDistTags() {
  const result = await execFileNoThrowWithCwd("npm", ["view", "", "dist-tags", "--json", "--prefer-online"], { abortSignal: AbortSignal.timeout(5000), cwd: homedir() });
  if (result.code !== 0) {
    logForDebugging(`npm view dist-tags failed with code ${result.code}`);
    return { latest: null, stable: null };
  }
  try {
    const parsed = jsonParse(result.stdout.trim());
    return {
      latest: typeof parsed.latest === "string" ? parsed.latest : null,
      stable: typeof parsed.stable === "string" ? parsed.stable : null
    };
  } catch (error) {
    logForDebugging(`Failed to parse dist-tags: ${error}`);
    return { latest: null, stable: null };
  }
}
async function getLatestVersionFromGcs(channel) {
  try {
    const response = await axios_default.get(`${GCS_BUCKET_URL}/${channel}`, {
      timeout: 5000,
      responseType: "text"
    });
    return response.data.trim();
  } catch (error) {
    logForDebugging(`Failed to fetch ${channel} from GCS: ${error}`);
    return null;
  }
}
async function getGcsDistTags() {
  const [latest, stable] = await Promise.all([
    getLatestVersionFromGcs("latest"),
    getLatestVersionFromGcs("stable")
  ]);
  return { latest, stable };
}
var GCS_BUCKET_URL = "https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases", AutoUpdaterError, LOCK_TIMEOUT_MS;
var init_autoUpdater = __esm(() => {
  init_axios();
  init_growthbook();
  init_analytics();
  init_config();
  init_debug();
  init_env();
  init_envUtils();
  init_errors();
  init_execFileNoThrow();
  init_fsOperations();
  init_gracefulShutdown();
  init_log();
  init_semver();
  init_settings();
  init_shellConfig();
  init_slowOperations();
  AutoUpdaterError = class AutoUpdaterError extends ClaudeError {
  };
  LOCK_TIMEOUT_MS = 5 * 60 * 1000;
});

// src/utils/nativeInstaller/packageManagers.ts
import { readFile as readFile2 } from "fs/promises";
function isDistroFamily(osRelease, families) {
  return families.includes(osRelease.id) || osRelease.idLike.some((like) => families.includes(like));
}
function detectMise() {
  const execPath = process.execPath || process.argv[0] || "";
  if (/[/\\]mise[/\\]installs[/\\]/i.test(execPath)) {
    logForDebugging(`Detected mise installation: ${execPath}`);
    return true;
  }
  return false;
}
function detectAsdf() {
  const execPath = process.execPath || process.argv[0] || "";
  if (/[/\\]\.?asdf[/\\]installs[/\\]/i.test(execPath)) {
    logForDebugging(`Detected asdf installation: ${execPath}`);
    return true;
  }
  return false;
}
function detectHomebrew() {
  const platform = getPlatform();
  if (platform !== "macos" && platform !== "linux" && platform !== "wsl") {
    return false;
  }
  const execPath = process.execPath || process.argv[0] || "";
  if (execPath.includes("/Caskroom/")) {
    logForDebugging(`Detected Homebrew cask installation: ${execPath}`);
    return true;
  }
  return false;
}
function detectWinget() {
  const platform = getPlatform();
  if (platform !== "windows") {
    return false;
  }
  const execPath = process.execPath || process.argv[0] || "";
  const wingetPatterns = [
    /Microsoft[/\\]WinGet[/\\]Packages/i,
    /Microsoft[/\\]WinGet[/\\]Links/i
  ];
  for (const pattern of wingetPatterns) {
    if (pattern.test(execPath)) {
      logForDebugging(`Detected winget installation: ${execPath}`);
      return true;
    }
  }
  return false;
}
var getOsRelease, detectPacman, detectDeb, detectRpm, detectApk, getPackageManager;
var init_packageManagers = __esm(() => {
  init_memoize();
  init_debug();
  init_execFileNoThrow();
  init_platform();
  getOsRelease = memoize_default(async () => {
    try {
      const content = await readFile2("/etc/os-release", "utf8");
      const idMatch = content.match(/^ID=["']?(\S+?)["']?\s*$/m);
      const idLikeMatch = content.match(/^ID_LIKE=["']?(.+?)["']?\s*$/m);
      return {
        id: idMatch?.[1] ?? "",
        idLike: idLikeMatch?.[1]?.split(" ") ?? []
      };
    } catch {
      return null;
    }
  });
  detectPacman = memoize_default(async () => {
    const platform = getPlatform();
    if (platform !== "linux") {
      return false;
    }
    const osRelease = await getOsRelease();
    if (osRelease && !isDistroFamily(osRelease, ["arch"])) {
      return false;
    }
    const execPath = process.execPath || process.argv[0] || "";
    const result = await execFileNoThrow("pacman", ["-Qo", execPath], {
      timeout: 5000,
      useCwd: false
    });
    if (result.code === 0 && result.stdout) {
      logForDebugging(`Detected pacman installation: ${result.stdout.trim()}`);
      return true;
    }
    return false;
  });
  detectDeb = memoize_default(async () => {
    const platform = getPlatform();
    if (platform !== "linux") {
      return false;
    }
    const osRelease = await getOsRelease();
    if (osRelease && !isDistroFamily(osRelease, ["debian"])) {
      return false;
    }
    const execPath = process.execPath || process.argv[0] || "";
    const result = await execFileNoThrow("dpkg", ["-S", execPath], {
      timeout: 5000,
      useCwd: false
    });
    if (result.code === 0 && result.stdout) {
      logForDebugging(`Detected deb installation: ${result.stdout.trim()}`);
      return true;
    }
    return false;
  });
  detectRpm = memoize_default(async () => {
    const platform = getPlatform();
    if (platform !== "linux") {
      return false;
    }
    const osRelease = await getOsRelease();
    if (osRelease && !isDistroFamily(osRelease, ["fedora", "rhel", "suse"])) {
      return false;
    }
    const execPath = process.execPath || process.argv[0] || "";
    const result = await execFileNoThrow("rpm", ["-qf", execPath], {
      timeout: 5000,
      useCwd: false
    });
    if (result.code === 0 && result.stdout) {
      logForDebugging(`Detected rpm installation: ${result.stdout.trim()}`);
      return true;
    }
    return false;
  });
  detectApk = memoize_default(async () => {
    const platform = getPlatform();
    if (platform !== "linux") {
      return false;
    }
    const osRelease = await getOsRelease();
    if (osRelease && !isDistroFamily(osRelease, ["alpine"])) {
      return false;
    }
    const execPath = process.execPath || process.argv[0] || "";
    const result = await execFileNoThrow("apk", ["info", "--who-owns", execPath], {
      timeout: 5000,
      useCwd: false
    });
    if (result.code === 0 && result.stdout) {
      logForDebugging(`Detected apk installation: ${result.stdout.trim()}`);
      return true;
    }
    return false;
  });
  getPackageManager = memoize_default(async () => {
    if (detectHomebrew()) {
      return "homebrew";
    }
    if (detectWinget()) {
      return "winget";
    }
    if (detectMise()) {
      return "mise";
    }
    if (detectAsdf()) {
      return "asdf";
    }
    if (await detectPacman()) {
      return "pacman";
    }
    if (await detectApk()) {
      return "apk";
    }
    if (await detectDeb()) {
      return "deb";
    }
    if (await detectRpm()) {
      return "rpm";
    }
    return "unknown";
  });
});

// src/utils/doctorDiagnostic.ts
import { readFile as readFile3, realpath } from "fs/promises";
import { homedir as homedir2 } from "os";
import { delimiter, join as join3, posix, win32 } from "path";
function getNormalizedPaths() {
  let invokedPath = process.argv[1] || "";
  let execPath = process.execPath || process.argv[0] || "";
  if (getPlatform() === "windows") {
    invokedPath = invokedPath.split(win32.sep).join(posix.sep);
    execPath = execPath.split(win32.sep).join(posix.sep);
  }
  return [invokedPath, execPath];
}
async function getCurrentInstallationType() {
  if (false) {}
  const [invokedPath] = getNormalizedPaths();
  if (isInBundledMode()) {
    if (detectHomebrew() || detectWinget() || detectMise() || detectAsdf() || await detectPacman() || await detectDeb() || await detectRpm() || await detectApk()) {
      return "package-manager";
    }
    return "native";
  }
  if (isRunningFromLocalInstallation()) {
    return "npm-local";
  }
  const npmGlobalPaths = [
    "/usr/local/lib/node_modules",
    "/usr/lib/node_modules",
    "/opt/homebrew/lib/node_modules",
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/.nvm/versions/node/"
  ];
  if (npmGlobalPaths.some((path) => invokedPath.includes(path))) {
    return "npm-global";
  }
  if (invokedPath.includes("/npm/") || invokedPath.includes("/nvm/")) {
    return "npm-global";
  }
  const npmConfigResult = await execa("npm config get prefix", {
    shell: true,
    reject: false
  });
  const globalPrefix = npmConfigResult.exitCode === 0 ? npmConfigResult.stdout.trim() : null;
  if (globalPrefix && invokedPath.startsWith(globalPrefix)) {
    return "npm-global";
  }
  return "unknown";
}
async function getInstallationPath() {
  if (false) {}
  if (isInBundledMode()) {
    try {
      return await realpath(process.execPath);
    } catch {}
    try {
      const path = await which("claude");
      if (path) {
        return path;
      }
    } catch {}
    try {
      await getFsImplementation().stat(join3(homedir2(), ".local/bin/claude"));
      return join3(homedir2(), ".local/bin/claude");
    } catch {}
    return "native";
  }
  try {
    return process.argv[0] || "unknown";
  } catch {
    return "unknown";
  }
}
function getInvokedBinary() {
  try {
    if (isInBundledMode()) {
      return process.execPath || "unknown";
    }
    return process.argv[1] || "unknown";
  } catch {
    return "unknown";
  }
}
async function detectMultipleInstallations() {
  const fs = getFsImplementation();
  const installations = [];
  const localPath = join3(homedir2(), ".claude", "local");
  if (await localInstallationExists()) {
    installations.push({ type: "npm-local", path: localPath });
  }
  const packagesToCheck = ["@anthropic-ai/claude-code"];
  if ("") {}
  const npmResult = await execFileNoThrow("npm", [
    "-g",
    "config",
    "get",
    "prefix"
  ]);
  if (npmResult.code === 0 && npmResult.stdout) {
    const npmPrefix = npmResult.stdout.trim();
    const isWindows = getPlatform() === "windows";
    const globalBinPath = isWindows ? join3(npmPrefix, "claude") : join3(npmPrefix, "bin", "claude");
    let globalBinExists = false;
    try {
      await fs.stat(globalBinPath);
      globalBinExists = true;
    } catch {}
    if (globalBinExists) {
      let isCurrentHomebrewInstallation = false;
      try {
        const realPath = await realpath(globalBinPath);
        if (realPath.includes("/Caskroom/")) {
          isCurrentHomebrewInstallation = detectHomebrew();
        }
      } catch {}
      if (!isCurrentHomebrewInstallation) {
        installations.push({ type: "npm-global", path: globalBinPath });
      }
    } else {
      for (const packageName of packagesToCheck) {
        const globalPackagePath = isWindows ? join3(npmPrefix, "node_modules", packageName) : join3(npmPrefix, "lib", "node_modules", packageName);
        try {
          await fs.stat(globalPackagePath);
          installations.push({
            type: "npm-global-orphan",
            path: globalPackagePath
          });
        } catch {}
      }
    }
  }
  const nativeBinPath = join3(homedir2(), ".local", "bin", "claude");
  try {
    await fs.stat(nativeBinPath);
    installations.push({ type: "native", path: nativeBinPath });
  } catch {}
  const config = getGlobalConfig();
  if (config.installMethod === "native") {
    const nativeDataPath = join3(homedir2(), ".local", "share", "claude");
    try {
      await fs.stat(nativeDataPath);
      if (!installations.some((i) => i.type === "native")) {
        installations.push({ type: "native", path: nativeDataPath });
      }
    } catch {}
  }
  return installations;
}
async function detectConfigurationIssues(type) {
  const warnings = [];
  try {
    const raw = await readFile3(join3(getManagedFilePath(), "managed-settings.json"), "utf-8");
    const parsed = jsonParse(raw);
    const field = parsed && typeof parsed === "object" ? parsed.strictPluginOnlyCustomization : undefined;
    if (field !== undefined && typeof field !== "boolean") {
      if (!Array.isArray(field)) {
        warnings.push({
          issue: `managed-settings.json: strictPluginOnlyCustomization has an invalid value (expected true or an array, got ${typeof field})`,
          fix: `The field is silently ignored (schema .catch rescues it). Set it to true, or an array of: ${CUSTOMIZATION_SURFACES.join(", ")}.`
        });
      } else {
        const unknown = field.filter((x) => typeof x === "string" && !CUSTOMIZATION_SURFACES.includes(x));
        if (unknown.length > 0) {
          warnings.push({
            issue: `managed-settings.json: strictPluginOnlyCustomization has ${unknown.length} value(s) this client doesn't recognize: ${unknown.map(String).join(", ")}`,
            fix: `These are silently ignored (forwards-compat). Known surfaces for this version: ${CUSTOMIZATION_SURFACES.join(", ")}. Either remove them, or this client is older than the managed-settings intended.`
          });
        }
      }
    }
  } catch {}
  const config = getGlobalConfig();
  if (type === "development") {
    return warnings;
  }
  if (type === "native") {
    const path = process.env.PATH || "";
    const pathDirectories = path.split(delimiter);
    const homeDir = homedir2();
    const localBinPath = join3(homeDir, ".local", "bin");
    let normalizedLocalBinPath = localBinPath;
    if (getPlatform() === "windows") {
      normalizedLocalBinPath = localBinPath.split(win32.sep).join(posix.sep);
    }
    const localBinInPath = pathDirectories.some((dir) => {
      let normalizedDir = dir;
      if (getPlatform() === "windows") {
        normalizedDir = dir.split(win32.sep).join(posix.sep);
      }
      const trimmedDir = normalizedDir.replace(/\/+$/, "");
      const trimmedRawDir = dir.replace(/[/\\]+$/, "");
      return trimmedDir === normalizedLocalBinPath || trimmedRawDir === "~/.local/bin" || trimmedRawDir === "$HOME/.local/bin";
    });
    if (!localBinInPath) {
      const isWindows = getPlatform() === "windows";
      if (isWindows) {
        const windowsLocalBinPath = localBinPath.split(posix.sep).join(win32.sep);
        warnings.push({
          issue: `Native installation exists but ${windowsLocalBinPath} is not in your PATH`,
          fix: `Add it by opening: System Properties \u2192 Environment Variables \u2192 Edit User PATH \u2192 New \u2192 Add the path above. Then restart your terminal.`
        });
      } else {
        const shellType = getShellType();
        const configPaths = getShellConfigPaths();
        const configFile = configPaths[shellType];
        const displayPath = configFile ? configFile.replace(homedir2(), "~") : "your shell config file";
        warnings.push({
          issue: "Native installation exists but ~/.local/bin is not in your PATH",
          fix: `Run: echo 'export PATH="$HOME/.local/bin:$PATH"' >> ${displayPath} then open a new terminal or run: source ${displayPath}`
        });
      }
    }
  }
  if (!isEnvTruthy(process.env.DISABLE_INSTALLATION_CHECKS)) {
    if (type === "npm-local" && config.installMethod !== "local") {
      warnings.push({
        issue: `Running from local installation but config install method is '${config.installMethod}'`,
        fix: "Consider using native installation: claude install"
      });
    }
    if (type === "native" && config.installMethod !== "native") {
      warnings.push({
        issue: `Running native installation but config install method is '${config.installMethod}'`,
        fix: "Run claude install to update configuration"
      });
    }
  }
  if (type === "npm-global" && await localInstallationExists()) {
    warnings.push({
      issue: "Local installation exists but not being used",
      fix: "Consider using native installation: claude install"
    });
  }
  const existingAlias = await findClaudeAlias();
  const validAlias = await findValidClaudeAlias();
  if (type === "npm-local") {
    const whichResult = await which("claude");
    const claudeInPath = !!whichResult;
    if (!claudeInPath && !validAlias) {
      if (existingAlias) {
        warnings.push({
          issue: "Local installation not accessible",
          fix: `Alias exists but points to invalid target: ${existingAlias}. Update alias: alias claude="~/.claude/local/claude"`
        });
      } else {
        warnings.push({
          issue: "Local installation not accessible",
          fix: 'Create alias: alias claude="~/.claude/local/claude"'
        });
      }
    }
  }
  return warnings;
}
function detectLinuxGlobPatternWarnings() {
  if (getPlatform() !== "linux") {
    return [];
  }
  const warnings = [];
  const globPatterns = SandboxManager.getLinuxGlobPatternWarnings();
  if (globPatterns.length > 0) {
    const displayPatterns = globPatterns.slice(0, 3).join(", ");
    const remaining = globPatterns.length - 3;
    const patternList = remaining > 0 ? `${displayPatterns} (${remaining} more)` : displayPatterns;
    warnings.push({
      issue: `Glob patterns in sandbox permission rules are not fully supported on Linux`,
      fix: `Found ${globPatterns.length} pattern(s): ${patternList}. On Linux, glob patterns in Edit/Read rules will be ignored.`
    });
  }
  return warnings;
}
async function getDoctorDiagnostic() {
  const installationType = await getCurrentInstallationType();
  const version = typeof MACRO !== "undefined" ? "5.0.0" : "unknown";
  const installationPath = await getInstallationPath();
  const invokedBinary = getInvokedBinary();
  const multipleInstallations = await detectMultipleInstallations();
  const warnings = await detectConfigurationIssues(installationType);
  warnings.push(...detectLinuxGlobPatternWarnings());
  if (installationType === "native") {
    const npmInstalls = multipleInstallations.filter((i) => i.type === "npm-global" || i.type === "npm-global-orphan" || i.type === "npm-local");
    const isWindows = getPlatform() === "windows";
    for (const install of npmInstalls) {
      if (install.type === "npm-global") {
        let uninstallCmd = "npm -g uninstall @anthropic-ai/claude-code";
        if ("") {}
        warnings.push({
          issue: `Leftover npm global installation at ${install.path}`,
          fix: `Run: ${uninstallCmd}`
        });
      } else if (install.type === "npm-global-orphan") {
        warnings.push({
          issue: `Orphaned npm global package at ${install.path}`,
          fix: isWindows ? `Run: rmdir /s /q "${install.path}"` : `Run: rm -rf ${install.path}`
        });
      } else if (install.type === "npm-local") {
        warnings.push({
          issue: `Leftover npm local installation at ${install.path}`,
          fix: isWindows ? `Run: rmdir /s /q "${install.path}"` : `Run: rm -rf ${install.path}`
        });
      }
    }
  }
  const config = getGlobalConfig();
  const configInstallMethod = config.installMethod || "not set";
  let hasUpdatePermissions = null;
  if (installationType === "npm-global") {
    const permCheck = await checkGlobalInstallPermissions();
    hasUpdatePermissions = permCheck.hasPermissions;
    if (!hasUpdatePermissions && !getAutoUpdaterDisabledReason()) {
      warnings.push({
        issue: "Insufficient permissions for auto-updates",
        fix: "Do one of: (1) Re-install node without sudo, or (2) Use `claude install` for native installation"
      });
    }
  }
  const ripgrepStatusRaw = getRipgrepStatus();
  const ripgrepStatus = {
    working: ripgrepStatusRaw.working ?? true,
    mode: ripgrepStatusRaw.mode,
    systemPath: ripgrepStatusRaw.mode === "system" ? ripgrepStatusRaw.path : null
  };
  const packageManager = installationType === "package-manager" ? await getPackageManager() : undefined;
  const diagnostic = {
    installationType,
    version,
    installationPath,
    invokedBinary,
    configInstallMethod,
    autoUpdates: (() => {
      const reason = getAutoUpdaterDisabledReason();
      return reason ? `disabled (${formatAutoUpdaterDisabledReason(reason)})` : "enabled";
    })(),
    hasUpdatePermissions,
    multipleInstallations,
    warnings,
    packageManager,
    ripgrepStatus
  };
  return diagnostic;
}
var init_doctorDiagnostic = __esm(() => {
  init_execa();
  init_autoUpdater();
  init_bundledMode();
  init_config();
  init_cwd();
  init_envUtils();
  init_execFileNoThrow();
  init_fsOperations();
  init_localInstaller();
  init_packageManagers();
  init_platform();
  init_ripgrep();
  init_sandbox_adapter();
  init_managedPath();
  init_types();
  init_shellConfig();
  init_slowOperations();
  init_which();
});

// src/utils/nativeInstaller/pidLock.ts
import { basename, join as join4 } from "path";
function isPidBasedLockingEnabled() {
  const envVar = process.env.ENABLE_PID_BASED_VERSION_LOCKING;
  if (isEnvTruthy(envVar)) {
    return true;
  }
  if (isEnvDefinedFalsy(envVar)) {
    return false;
  }
  return getFeatureValue_CACHED_MAY_BE_STALE("tengu_pid_based_version_locking", false);
}
function isProcessRunning(pid) {
  if (pid <= 1) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
function isClaudeProcess(pid, expectedExecPath) {
  if (!isProcessRunning(pid)) {
    return false;
  }
  if (pid === process.pid) {
    return true;
  }
  try {
    const command = getProcessCommand(pid);
    if (!command) {
      return true;
    }
    const normalizedCommand = command.toLowerCase();
    const normalizedExecPath = expectedExecPath.toLowerCase();
    return normalizedCommand.includes("claude") || normalizedCommand.includes(normalizedExecPath);
  } catch {
    return true;
  }
}
function readLockContent(lockFilePath) {
  const fs = getFsImplementation();
  try {
    const content = fs.readFileSync(lockFilePath, { encoding: "utf8" });
    if (!content || content.trim() === "") {
      return null;
    }
    const parsed = jsonParse(content);
    if (typeof parsed.pid !== "number" || !parsed.version || !parsed.execPath) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
function isLockActive(lockFilePath) {
  const content = readLockContent(lockFilePath);
  if (!content) {
    return false;
  }
  const { pid, execPath } = content;
  if (!isProcessRunning(pid)) {
    return false;
  }
  if (!isClaudeProcess(pid, execPath)) {
    logForDebugging(`Lock PID ${pid} is running but does not appear to be Claude - treating as stale`);
    return false;
  }
  const fs = getFsImplementation();
  try {
    const stats = fs.statSync(lockFilePath);
    const age = Date.now() - stats.mtimeMs;
    if (age > FALLBACK_STALE_MS) {
      if (!isProcessRunning(pid)) {
        return false;
      }
    }
  } catch {}
  return true;
}
function writeLockFile(lockFilePath, content) {
  const fs = getFsImplementation();
  const tempPath = `${lockFilePath}.tmp.${process.pid}.${Date.now()}`;
  try {
    writeFileSync_DEPRECATED(tempPath, jsonStringify(content, null, 2), {
      encoding: "utf8",
      flush: true
    });
    fs.renameSync(tempPath, lockFilePath);
  } catch (error) {
    try {
      fs.unlinkSync(tempPath);
    } catch {}
    throw error;
  }
}
async function tryAcquireLock(versionPath, lockFilePath) {
  const fs = getFsImplementation();
  const versionName = basename(versionPath);
  if (isLockActive(lockFilePath)) {
    const existingContent = readLockContent(lockFilePath);
    logForDebugging(`Cannot acquire lock for ${versionName} - held by PID ${existingContent?.pid}`);
    return null;
  }
  const lockContent = {
    pid: process.pid,
    version: versionName,
    execPath: process.execPath,
    acquiredAt: Date.now()
  };
  try {
    writeLockFile(lockFilePath, lockContent);
    const verifyContent = readLockContent(lockFilePath);
    if (verifyContent?.pid !== process.pid) {
      return null;
    }
    logForDebugging(`Acquired PID lock for ${versionName} (PID ${process.pid})`);
    return () => {
      try {
        const currentContent = readLockContent(lockFilePath);
        if (currentContent?.pid === process.pid) {
          fs.unlinkSync(lockFilePath);
          logForDebugging(`Released PID lock for ${versionName}`);
        }
      } catch (error) {
        logForDebugging(`Failed to release lock for ${versionName}: ${error}`);
      }
    };
  } catch (error) {
    logForDebugging(`Failed to acquire lock for ${versionName}: ${error}`);
    return null;
  }
}
async function acquireProcessLifetimeLock(versionPath, lockFilePath) {
  const release = await tryAcquireLock(versionPath, lockFilePath);
  if (!release) {
    return false;
  }
  const cleanup = () => {
    try {
      release();
    } catch {}
  };
  process.on("exit", cleanup);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  return true;
}
async function withLock(versionPath, lockFilePath, callback) {
  const release = await tryAcquireLock(versionPath, lockFilePath);
  if (!release) {
    return false;
  }
  try {
    await callback();
    return true;
  } finally {
    release();
  }
}
function getAllLockInfo(locksDir) {
  const fs = getFsImplementation();
  const lockInfos = [];
  try {
    const lockFiles = fs.readdirStringSync(locksDir).filter((f) => f.endsWith(".lock"));
    for (const lockFile of lockFiles) {
      const lockFilePath = join4(locksDir, lockFile);
      const content = readLockContent(lockFilePath);
      if (content) {
        lockInfos.push({
          version: content.version,
          pid: content.pid,
          isProcessRunning: isProcessRunning(content.pid),
          execPath: content.execPath,
          acquiredAt: new Date(content.acquiredAt),
          lockFilePath
        });
      }
    }
  } catch (error) {
    if (isENOENT(error)) {
      return lockInfos;
    }
    logError(toError(error));
  }
  return lockInfos;
}
function cleanupStaleLocks(locksDir) {
  const fs = getFsImplementation();
  let cleanedCount = 0;
  try {
    const lockEntries = fs.readdirStringSync(locksDir).filter((f) => f.endsWith(".lock"));
    for (const lockEntry of lockEntries) {
      const lockFilePath = join4(locksDir, lockEntry);
      try {
        const stats = fs.lstatSync(lockFilePath);
        if (stats.isDirectory()) {
          fs.rmSync(lockFilePath, { recursive: true, force: true });
          cleanedCount++;
          logForDebugging(`Cleaned up legacy directory lock: ${lockEntry}`);
        } else if (!isLockActive(lockFilePath)) {
          fs.unlinkSync(lockFilePath);
          cleanedCount++;
          logForDebugging(`Cleaned up stale lock: ${lockEntry}`);
        }
      } catch {}
    }
  } catch (error) {
    if (isENOENT(error)) {
      return 0;
    }
    logError(toError(error));
  }
  return cleanedCount;
}
var FALLBACK_STALE_MS;
var init_pidLock = __esm(() => {
  init_growthbook();
  init_debug();
  init_envUtils();
  init_errors();
  init_fsOperations();
  init_genericProcessUtils();
  init_log();
  init_slowOperations();
  FALLBACK_STALE_MS = 2 * 60 * 60 * 1000;
});

export { getShellType, init_localInstaller, getShellConfigPaths, filterClaudeAliases, readFileLines, writeFileLines, init_shellConfig, getMaxVersion, shouldSkipVersion, getNpmDistTags, getGcsDistTags, init_autoUpdater, getCurrentInstallationType, getDoctorDiagnostic, init_doctorDiagnostic, isPidBasedLockingEnabled, readLockContent, isLockActive, acquireProcessLifetimeLock, withLock, getAllLockInfo, cleanupStaleLocks, init_pidLock };

//# debugId=A2BE0288285B04FF64756E2164756E21
//# sourceMappingURL=chunk-rfqp1ahm.js.map
