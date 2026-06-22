// @bun
import {
  init_lockfile,
  lockSync
} from "./chunk-m18nccbn.js";
import {
  getManagedFilePath,
  init_managedPath
} from "./chunk-e2jvken3.js";
import {
  init_json,
  init_jsonRead,
  safeParseJSON,
  stripBOM
} from "./chunk-5zhv4jyp.js";
import {
  init_file,
  writeFileSyncAndFlush_DEPRECATED
} from "./chunk-jwyj6t5m.js";
import {
  init_path,
  normalizePathForConfigKey
} from "./chunk-87f9np2y.js";
import {
  getGlobalClaudeFile,
  init_env
} from "./chunk-r87btn9p.js";
import {
  init_analytics,
  logEvent
} from "./chunk-4hpfxga2.js";
import {
  findCanonicalGitRoot,
  init_diagLogs,
  init_git,
  logForDiagnosticsNoPII
} from "./chunk-bt5n9f4r.js";
import {
  getCwd,
  init_cwd
} from "./chunk-w95hkggk.js";
import {
  getEssentialTrafficOnlyReason,
  init_log,
  init_privacyLevel,
  logError
} from "./chunk-kc49dhz0.js";
import {
  ConfigParseError,
  _assignValue_default,
  _getAllKeysIn_default,
  getErrnoCode,
  getFsImplementation,
  init__assignValue,
  init__getAllKeysIn,
  init_cleanupRegistry,
  init_debug,
  init_errors,
  init_fsOperations,
  init_slowOperations,
  jsonParse,
  jsonStringify,
  logForDebugging,
  registerCleanup
} from "./chunk-pyv3zrjt.js";
import {
  _arrayMap_default,
  _baseGet_default,
  _baseIteratee_default,
  _castPath_default,
  _isIndex_default,
  _toKey_default,
  getOriginalCwd,
  getSessionTrustAccepted,
  init__arrayMap,
  init__baseGet,
  init__baseIteratee,
  init__castPath,
  init__isIndex,
  init__toKey,
  init_state
} from "./chunk-232p95fy.js";
import {
  getClaudeConfigHomeDir,
  init_envUtils,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-nxzx0ey9.js";
import {
  init_isObject,
  isObject_default
} from "./chunk-yes1my80.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseSet.js
function baseSet(object, path, value, customizer) {
  if (!isObject_default(object)) {
    return object;
  }
  path = _castPath_default(path, object);
  var index = -1, length = path.length, lastIndex = length - 1, nested = object;
  while (nested != null && ++index < length) {
    var key = _toKey_default(path[index]), newValue = value;
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return object;
    }
    if (index != lastIndex) {
      var objValue = nested[key];
      newValue = customizer ? customizer(objValue, key, nested) : undefined;
      if (newValue === undefined) {
        newValue = isObject_default(objValue) ? objValue : _isIndex_default(path[index + 1]) ? [] : {};
      }
    }
    _assignValue_default(nested, key, newValue);
    nested = nested[key];
  }
  return object;
}
var _baseSet_default;
var init__baseSet = __esm(() => {
  init__assignValue();
  init__castPath();
  init__isIndex();
  init_isObject();
  init__toKey();
  _baseSet_default = baseSet;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_basePickBy.js
function basePickBy(object, paths, predicate) {
  var index = -1, length = paths.length, result = {};
  while (++index < length) {
    var path = paths[index], value = _baseGet_default(object, path);
    if (predicate(value, path)) {
      _baseSet_default(result, _castPath_default(path, object), value);
    }
  }
  return result;
}
var _basePickBy_default;
var init__basePickBy = __esm(() => {
  init__baseGet();
  init__baseSet();
  init__castPath();
  _basePickBy_default = basePickBy;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/pickBy.js
function pickBy(object, predicate) {
  if (object == null) {
    return {};
  }
  var props = _arrayMap_default(_getAllKeysIn_default(object), function(prop) {
    return [prop];
  });
  predicate = _baseIteratee_default(predicate);
  return _basePickBy_default(object, props, function(value, path) {
    return predicate(value, path[0]);
  });
}
var pickBy_default;
var init_pickBy = __esm(() => {
  init__arrayMap();
  init__baseIteratee();
  init__basePickBy();
  init__getAllKeysIn();
  pickBy_default = pickBy;
});

// src/memdir/paths.ts
function getAutoMemEntrypoint() {
  return "";
}
function getMemoryBaseDir(..._args) {
  return;
}
function isAutoMemoryEnabled(..._args) {
  return;
}
function getAutoMemPath(..._args) {
  return;
}
function isAutoMemPath(..._args) {
  return;
}
function isExtractModeActive(..._args) {
  return;
}
function hasAutoMemPathOverride(..._args) {
  return;
}
var init_paths = () => {};

// src/utils/configConstants.ts
var NOTIFICATION_CHANNELS, EDITOR_MODES, TEAMMATE_MODES;
var init_configConstants = __esm(() => {
  NOTIFICATION_CHANNELS = [
    "auto",
    "iterm2",
    "iterm2_with_bell",
    "terminal_bell",
    "kitty",
    "ghostty",
    "notifications_disabled"
  ];
  EDITOR_MODES = ["normal", "vim"];
  TEAMMATE_MODES = ["auto", "tmux", "in-process"];
});

// src/utils/config.ts
import { randomBytes } from "crypto";
import { unwatchFile, watchFile } from "fs";
import { basename, dirname, join, resolve } from "path";
function createDefaultGlobalConfig() {
  return {
    numStartups: 0,
    installMethod: undefined,
    autoUpdates: undefined,
    theme: "dark",
    preferredNotifChannel: "auto",
    verbose: false,
    editorMode: "normal",
    autoCompactEnabled: true,
    showTurnDuration: true,
    hasSeenTasksHint: false,
    hasUsedStash: false,
    hasUsedBackgroundTask: false,
    queuedCommandUpHintCount: 0,
    diffTool: "auto",
    customApiKeyResponses: {
      approved: [],
      rejected: []
    },
    env: {},
    tipsHistory: {},
    memoryUsageCount: 0,
    promptQueueUseCount: 0,
    btwUseCount: 0,
    todoFeatureEnabled: true,
    showExpandedTodos: false,
    messageIdleNotifThresholdMs: 60000,
    autoConnectIde: false,
    autoInstallIdeExtension: true,
    fileCheckpointingEnabled: true,
    terminalProgressBarEnabled: true,
    cachedStatsigGates: {},
    cachedDynamicConfigs: {},
    cachedGrowthBookFeatures: {},
    respectGitignore: true,
    copyFullResponse: false
  };
}
function isGlobalConfigKey(key) {
  return GLOBAL_CONFIG_KEYS.includes(key);
}
function resetTrustDialogAcceptedCacheForTesting() {
  _trustAccepted = false;
}
function checkHasTrustDialogAccepted() {
  return _trustAccepted ||= computeTrustDialogAccepted();
}
function computeTrustDialogAccepted() {
  if (getSessionTrustAccepted()) {
    return true;
  }
  const config = getGlobalConfig();
  const projectPath = getProjectPathForConfig();
  const projectConfig = config.projects?.[projectPath];
  if (projectConfig?.hasTrustDialogAccepted) {
    return true;
  }
  let currentPath = normalizePathForConfigKey(getCwd());
  while (true) {
    const pathConfig = config.projects?.[currentPath];
    if (pathConfig?.hasTrustDialogAccepted) {
      return true;
    }
    const parentPath = normalizePathForConfigKey(resolve(currentPath, ".."));
    if (parentPath === currentPath) {
      break;
    }
    currentPath = parentPath;
  }
  return false;
}
function isPathTrusted(dir) {
  const config = getGlobalConfig();
  let currentPath = normalizePathForConfigKey(resolve(dir));
  while (true) {
    if (config.projects?.[currentPath]?.hasTrustDialogAccepted)
      return true;
    const parentPath = normalizePathForConfigKey(resolve(currentPath, ".."));
    if (parentPath === currentPath)
      return false;
    currentPath = parentPath;
  }
}
function isProjectConfigKey(key) {
  return PROJECT_CONFIG_KEYS.includes(key);
}
function wouldLoseAuthState(fresh) {
  const cached = globalConfigCache.config;
  if (!cached)
    return false;
  const lostOauth = cached.oauthAccount !== undefined && fresh.oauthAccount === undefined;
  const lostOnboarding = cached.hasCompletedOnboarding === true && fresh.hasCompletedOnboarding !== true;
  return lostOauth || lostOnboarding;
}
function saveGlobalConfig(updater) {
  if (false) {}
  let written = null;
  try {
    const didWrite = saveConfigWithLock(getGlobalClaudeFile(), createDefaultGlobalConfig, (current) => {
      const config = updater(current);
      if (config === current) {
        return current;
      }
      written = {
        ...config,
        projects: removeProjectHistory(current.projects)
      };
      return written;
    });
    if (didWrite && written) {
      writeThroughGlobalConfigCache(written);
    }
  } catch (error) {
    logForDebugging(`Failed to save config with lock: ${error}`, {
      level: "error"
    });
    const currentConfig = getConfig(getGlobalClaudeFile(), createDefaultGlobalConfig);
    if (wouldLoseAuthState(currentConfig)) {
      logForDebugging("saveGlobalConfig fallback: re-read config is missing auth that cache has; refusing to write. See GH #3117.", { level: "error" });
      logEvent("tengu_config_auth_loss_prevented", {});
      return;
    }
    const config = updater(currentConfig);
    if (config === currentConfig) {
      return;
    }
    written = {
      ...config,
      projects: removeProjectHistory(currentConfig.projects)
    };
    saveConfig(getGlobalClaudeFile(), written, DEFAULT_GLOBAL_CONFIG);
    writeThroughGlobalConfigCache(written);
  }
}
function getGlobalConfigWriteCount() {
  return globalConfigWriteCount;
}
function reportConfigCacheStats() {
  const total = configCacheHits + configCacheMisses;
  if (total > 0) {
    logEvent("tengu_config_cache_stats", {
      cache_hits: configCacheHits,
      cache_misses: configCacheMisses,
      hit_rate: configCacheHits / total
    });
  }
  configCacheHits = 0;
  configCacheMisses = 0;
}
function migrateConfigFields(config) {
  if (config.installMethod !== undefined) {
    return config;
  }
  const legacy = config;
  let installMethod = "unknown";
  let autoUpdates = config.autoUpdates ?? true;
  switch (legacy.autoUpdaterStatus) {
    case "migrated":
      installMethod = "local";
      break;
    case "installed":
      installMethod = "native";
      break;
    case "disabled":
      autoUpdates = false;
      break;
    case "enabled":
    case "no_permissions":
    case "not_configured":
      installMethod = "global";
      break;
    case undefined:
      break;
  }
  return {
    ...config,
    installMethod,
    autoUpdates
  };
}
function removeProjectHistory(projects) {
  if (!projects) {
    return projects;
  }
  const cleanedProjects = {};
  let needsCleaning = false;
  for (const [path, projectConfig] of Object.entries(projects)) {
    const legacy = projectConfig;
    if (legacy.history !== undefined) {
      needsCleaning = true;
      const { history, ...cleanedConfig } = legacy;
      cleanedProjects[path] = cleanedConfig;
    } else {
      cleanedProjects[path] = projectConfig;
    }
  }
  return needsCleaning ? cleanedProjects : projects;
}
function startGlobalConfigFreshnessWatcher() {
  if (freshnessWatcherStarted || false)
    return;
  freshnessWatcherStarted = true;
  const file = getGlobalClaudeFile();
  watchFile(file, { interval: CONFIG_FRESHNESS_POLL_MS, persistent: false }, (curr) => {
    if (curr.mtimeMs <= globalConfigCache.mtime)
      return;
    getFsImplementation().readFile(file, { encoding: "utf-8" }).then((content) => {
      if (curr.mtimeMs <= globalConfigCache.mtime)
        return;
      const parsed = safeParseJSON(stripBOM(content));
      if (parsed === null || typeof parsed !== "object")
        return;
      globalConfigCache = {
        config: migrateConfigFields({
          ...createDefaultGlobalConfig(),
          ...parsed
        }),
        mtime: curr.mtimeMs
      };
      lastReadFileStats = { mtime: curr.mtimeMs, size: curr.size };
    }).catch(() => {});
  });
  registerCleanup(async () => {
    unwatchFile(file);
    freshnessWatcherStarted = false;
  });
}
function writeThroughGlobalConfigCache(config) {
  globalConfigCache = { config, mtime: Date.now() };
  lastReadFileStats = null;
}
function getGlobalConfig() {
  if (false) {}
  if (globalConfigCache.config) {
    configCacheHits++;
    return globalConfigCache.config;
  }
  configCacheMisses++;
  try {
    let stats = null;
    try {
      stats = getFsImplementation().statSync(getGlobalClaudeFile());
    } catch {}
    const config = migrateConfigFields(getConfig(getGlobalClaudeFile(), createDefaultGlobalConfig));
    globalConfigCache = {
      config,
      mtime: stats?.mtimeMs ?? Date.now()
    };
    lastReadFileStats = stats ? { mtime: stats.mtimeMs, size: stats.size } : null;
    startGlobalConfigFreshnessWatcher();
    return config;
  } catch {
    return migrateConfigFields(getConfig(getGlobalClaudeFile(), createDefaultGlobalConfig));
  }
}
function getRemoteControlAtStartup() {
  const explicit = getGlobalConfig().remoteControlAtStartup;
  if (explicit !== undefined)
    return explicit;
  if (false) {}
  return false;
}
function getCustomApiKeyStatus(truncatedApiKey) {
  const config = getGlobalConfig();
  if (config.customApiKeyResponses?.approved?.includes(truncatedApiKey)) {
    return "approved";
  }
  if (config.customApiKeyResponses?.rejected?.includes(truncatedApiKey)) {
    return "rejected";
  }
  return "new";
}
function saveConfig(file, config, defaultConfig) {
  const dir = dirname(file);
  const fs = getFsImplementation();
  fs.mkdirSync(dir);
  const filteredConfig = pickBy_default(config, (value, key) => jsonStringify(value) !== jsonStringify(defaultConfig[key]));
  writeFileSyncAndFlush_DEPRECATED(file, jsonStringify(filteredConfig, null, 2), {
    encoding: "utf-8",
    mode: 384
  });
  if (file === getGlobalClaudeFile()) {
    globalConfigWriteCount++;
  }
}
function saveConfigWithLock(file, createDefault, mergeFn) {
  const defaultConfig = createDefault();
  const dir = dirname(file);
  const fs = getFsImplementation();
  fs.mkdirSync(dir);
  let release;
  try {
    const lockFilePath = `${file}.lock`;
    const startTime = Date.now();
    release = lockSync(file, {
      lockfilePath: lockFilePath,
      onCompromised: (err) => {
        logForDebugging(`Config lock compromised: ${err}`, { level: "error" });
      }
    });
    const lockTime = Date.now() - startTime;
    if (lockTime > 100) {
      logForDebugging("Lock acquisition took longer than expected - another Claude instance may be running");
      logEvent("tengu_config_lock_contention", {
        lock_time_ms: lockTime
      });
    }
    if (lastReadFileStats && file === getGlobalClaudeFile()) {
      try {
        const currentStats = fs.statSync(file);
        if (currentStats.mtimeMs !== lastReadFileStats.mtime || currentStats.size !== lastReadFileStats.size) {
          logEvent("tengu_config_stale_write", {
            read_mtime: lastReadFileStats.mtime,
            write_mtime: currentStats.mtimeMs,
            read_size: lastReadFileStats.size,
            write_size: currentStats.size
          });
        }
      } catch (e) {
        const code = getErrnoCode(e);
        if (code !== "ENOENT") {
          throw e;
        }
      }
    }
    const currentConfig = getConfig(file, createDefault);
    if (file === getGlobalClaudeFile() && wouldLoseAuthState(currentConfig)) {
      logForDebugging("saveConfigWithLock: re-read config is missing auth that cache has; refusing to write to avoid wiping ~/.claude.json. See GH #3117.", { level: "error" });
      logEvent("tengu_config_auth_loss_prevented", {});
      return false;
    }
    const mergedConfig = mergeFn(currentConfig);
    if (mergedConfig === currentConfig) {
      return false;
    }
    const filteredConfig = pickBy_default(mergedConfig, (value, key) => jsonStringify(value) !== jsonStringify(defaultConfig[key]));
    try {
      const fileBase = basename(file);
      const backupDir = getConfigBackupDir();
      try {
        fs.mkdirSync(backupDir);
      } catch (mkdirErr) {
        const mkdirCode = getErrnoCode(mkdirErr);
        if (mkdirCode !== "EEXIST") {
          throw mkdirErr;
        }
      }
      const MIN_BACKUP_INTERVAL_MS = 60000;
      const existingBackups = fs.readdirStringSync(backupDir).filter((f) => f.startsWith(`${fileBase}.backup.`)).sort().reverse();
      const mostRecentBackup = existingBackups[0];
      const mostRecentTimestamp = mostRecentBackup ? Number(mostRecentBackup.split(".backup.").pop()) : 0;
      const shouldCreateBackup = Number.isNaN(mostRecentTimestamp) || Date.now() - mostRecentTimestamp >= MIN_BACKUP_INTERVAL_MS;
      if (shouldCreateBackup) {
        const backupPath = join(backupDir, `${fileBase}.backup.${Date.now()}`);
        fs.copyFileSync(file, backupPath);
      }
      const MAX_BACKUPS = 5;
      const backupsForCleanup = shouldCreateBackup ? fs.readdirStringSync(backupDir).filter((f) => f.startsWith(`${fileBase}.backup.`)).sort().reverse() : existingBackups;
      for (const oldBackup of backupsForCleanup.slice(MAX_BACKUPS)) {
        try {
          fs.unlinkSync(join(backupDir, oldBackup));
        } catch {}
      }
    } catch (e) {
      const code = getErrnoCode(e);
      if (code !== "ENOENT") {
        logForDebugging(`Failed to backup config: ${e}`, {
          level: "error"
        });
      }
    }
    writeFileSyncAndFlush_DEPRECATED(file, jsonStringify(filteredConfig, null, 2), {
      encoding: "utf-8",
      mode: 384
    });
    if (file === getGlobalClaudeFile()) {
      globalConfigWriteCount++;
    }
    return true;
  } finally {
    if (release) {
      release();
    }
  }
}
function enableConfigs() {
  if (configReadingAllowed) {
    return;
  }
  const startTime = Date.now();
  logForDiagnosticsNoPII("info", "enable_configs_started");
  configReadingAllowed = true;
  getConfig(getGlobalClaudeFile(), createDefaultGlobalConfig, true);
  logForDiagnosticsNoPII("info", "enable_configs_completed", {
    duration_ms: Date.now() - startTime
  });
}
function getConfigBackupDir() {
  return join(getClaudeConfigHomeDir(), "backups");
}
function findMostRecentBackup(file) {
  const fs = getFsImplementation();
  const fileBase = basename(file);
  const backupDir = getConfigBackupDir();
  try {
    const backups = fs.readdirStringSync(backupDir).filter((f) => f.startsWith(`${fileBase}.backup.`)).sort();
    const mostRecent = backups.at(-1);
    if (mostRecent) {
      return join(backupDir, mostRecent);
    }
  } catch {}
  const fileDir = dirname(file);
  try {
    const backups = fs.readdirStringSync(fileDir).filter((f) => f.startsWith(`${fileBase}.backup.`)).sort();
    const mostRecent = backups.at(-1);
    if (mostRecent) {
      return join(fileDir, mostRecent);
    }
    const legacyBackup = `${file}.backup`;
    try {
      fs.statSync(legacyBackup);
      return legacyBackup;
    } catch {}
  } catch {}
  return null;
}
function getConfig(file, createDefault, throwOnInvalid) {
  if (!configReadingAllowed && true) {
    throw new Error("Config accessed before allowed.");
  }
  const fs = getFsImplementation();
  try {
    const fileContent = fs.readFileSync(file, {
      encoding: "utf-8"
    });
    try {
      const parsedConfig = jsonParse(stripBOM(fileContent));
      return {
        ...createDefault(),
        ...parsedConfig
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ConfigParseError(errorMessage, file, createDefault());
    }
  } catch (error) {
    const errCode = getErrnoCode(error);
    if (errCode === "ENOENT") {
      const backupPath = findMostRecentBackup(file);
      if (backupPath) {
        process.stderr.write(`
Claude configuration file not found at: ${file}
` + `A backup file exists at: ${backupPath}
` + `You can manually restore it by running: cp "${backupPath}" "${file}"

`);
      }
      return createDefault();
    }
    if (error instanceof ConfigParseError && throwOnInvalid) {
      throw error;
    }
    if (error instanceof ConfigParseError) {
      logForDebugging(`Config file corrupted, resetting to defaults: ${error.message}`, { level: "error" });
      if (!insideGetConfig) {
        insideGetConfig = true;
        try {
          logError(error);
          let hasBackup = false;
          try {
            fs.statSync(`${file}.backup`);
            hasBackup = true;
          } catch {}
          logEvent("tengu_config_parse_error", {
            has_backup: hasBackup
          });
        } finally {
          insideGetConfig = false;
        }
      }
      process.stderr.write(`
Claude configuration file at ${file} is corrupted: ${error.message}
`);
      const fileBase = basename(file);
      const corruptedBackupDir = getConfigBackupDir();
      try {
        fs.mkdirSync(corruptedBackupDir);
      } catch (mkdirErr) {
        const mkdirCode = getErrnoCode(mkdirErr);
        if (mkdirCode !== "EEXIST") {
          throw mkdirErr;
        }
      }
      const existingCorruptedBackups = fs.readdirStringSync(corruptedBackupDir).filter((f) => f.startsWith(`${fileBase}.corrupted.`));
      let corruptedBackupPath;
      let alreadyBackedUp = false;
      const currentContent = fs.readFileSync(file, { encoding: "utf-8" });
      for (const backup of existingCorruptedBackups) {
        try {
          const backupContent = fs.readFileSync(join(corruptedBackupDir, backup), { encoding: "utf-8" });
          if (currentContent === backupContent) {
            alreadyBackedUp = true;
            break;
          }
        } catch {}
      }
      if (!alreadyBackedUp) {
        corruptedBackupPath = join(corruptedBackupDir, `${fileBase}.corrupted.${Date.now()}`);
        try {
          fs.copyFileSync(file, corruptedBackupPath);
          logForDebugging(`Corrupted config backed up to: ${corruptedBackupPath}`, {
            level: "error"
          });
        } catch {}
      }
      const backupPath = findMostRecentBackup(file);
      if (corruptedBackupPath) {
        process.stderr.write(`The corrupted file has been backed up to: ${corruptedBackupPath}
`);
      } else if (alreadyBackedUp) {
        process.stderr.write(`The corrupted file has already been backed up.
`);
      }
      if (backupPath) {
        process.stderr.write(`A backup file exists at: ${backupPath}
` + `You can manually restore it by running: cp "${backupPath}" "${file}"

`);
      } else {
        process.stderr.write(`
`);
      }
    }
    return createDefault();
  }
}
function getCurrentProjectConfig() {
  if (false) {}
  const absolutePath = getProjectPathForConfig();
  const config = getGlobalConfig();
  if (!config.projects) {
    return DEFAULT_PROJECT_CONFIG;
  }
  const projectConfig = config.projects[absolutePath] ?? DEFAULT_PROJECT_CONFIG;
  if (typeof projectConfig.allowedTools === "string") {
    projectConfig.allowedTools = safeParseJSON(projectConfig.allowedTools) ?? [];
  }
  return projectConfig;
}
function saveCurrentProjectConfig(updater) {
  if (false) {}
  const absolutePath = getProjectPathForConfig();
  let written = null;
  try {
    const didWrite = saveConfigWithLock(getGlobalClaudeFile(), createDefaultGlobalConfig, (current) => {
      const currentProjectConfig = current.projects?.[absolutePath] ?? DEFAULT_PROJECT_CONFIG;
      const newProjectConfig = updater(currentProjectConfig);
      if (newProjectConfig === currentProjectConfig) {
        return current;
      }
      written = {
        ...current,
        projects: {
          ...current.projects,
          [absolutePath]: newProjectConfig
        }
      };
      return written;
    });
    if (didWrite && written) {
      writeThroughGlobalConfigCache(written);
    }
  } catch (error) {
    logForDebugging(`Failed to save config with lock: ${error}`, {
      level: "error"
    });
    const config = getConfig(getGlobalClaudeFile(), createDefaultGlobalConfig);
    if (wouldLoseAuthState(config)) {
      logForDebugging("saveCurrentProjectConfig fallback: re-read config is missing auth that cache has; refusing to write. See GH #3117.", { level: "error" });
      logEvent("tengu_config_auth_loss_prevented", {});
      return;
    }
    const currentProjectConfig = config.projects?.[absolutePath] ?? DEFAULT_PROJECT_CONFIG;
    const newProjectConfig = updater(currentProjectConfig);
    if (newProjectConfig === currentProjectConfig) {
      return;
    }
    written = {
      ...config,
      projects: {
        ...config.projects,
        [absolutePath]: newProjectConfig
      }
    };
    saveConfig(getGlobalClaudeFile(), written, DEFAULT_GLOBAL_CONFIG);
    writeThroughGlobalConfigCache(written);
  }
}
function isAutoUpdaterDisabled() {
  return getAutoUpdaterDisabledReason() !== null;
}
function shouldSkipPluginAutoupdate() {
  return isAutoUpdaterDisabled() && !isEnvTruthy(process.env.FORCE_AUTOUPDATE_PLUGINS);
}
function formatAutoUpdaterDisabledReason(reason) {
  switch (reason.type) {
    case "development":
      return "development build";
    case "env":
      return `${reason.envVar} set`;
    case "config":
      return "config";
  }
}
function getAutoUpdaterDisabledReason() {
  if (false) {}
  if (!isEnvTruthy(process.env.ENABLE_AUTOUPDATER)) {
    return { type: "config" };
  }
  if (isEnvTruthy(process.env.DISABLE_AUTOUPDATER)) {
    return { type: "env", envVar: "DISABLE_AUTOUPDATER" };
  }
  const essentialTrafficEnvVar = getEssentialTrafficOnlyReason();
  if (essentialTrafficEnvVar) {
    return { type: "env", envVar: essentialTrafficEnvVar };
  }
  const config = getGlobalConfig();
  if (config.autoUpdates === false && (config.installMethod !== "native" || config.autoUpdatesProtectedForNative !== true)) {
    return { type: "config" };
  }
  return null;
}
function getOrCreateUserID() {
  const config = getGlobalConfig();
  if (config.userID) {
    return config.userID;
  }
  const userID = randomBytes(32).toString("hex");
  saveGlobalConfig((current) => ({ ...current, userID }));
  return userID;
}
function recordFirstStartTime() {
  const config = getGlobalConfig();
  if (!config.firstStartTime) {
    const firstStartTime = new Date().toISOString();
    saveGlobalConfig((current) => ({
      ...current,
      firstStartTime: current.firstStartTime ?? firstStartTime
    }));
  }
}
function getMemoryPath(memoryType) {
  const cwd = getOriginalCwd();
  switch (memoryType) {
    case "User":
      return join(getClaudeConfigHomeDir(), "CLAUDE.md");
    case "Local":
      return join(cwd, "CLAUDE.local.md");
    case "Project":
      return join(cwd, "CLAUDE.md");
    case "Managed":
      return join(getManagedFilePath(), "CLAUDE.md");
    case "AutoMem":
      return getAutoMemEntrypoint();
  }
  if (false) {}
  return "";
}
function getManagedClaudeRulesDir() {
  return join(getManagedFilePath(), ".claude", "rules");
}
function getUserClaudeRulesDir() {
  return join(getClaudeConfigHomeDir(), "rules");
}
function _setGlobalConfigCacheForTesting(config) {
  globalConfigCache.config = config;
  globalConfigCache.mtime = config ? Date.now() : 0;
}
var insideGetConfig = false, DEFAULT_PROJECT_CONFIG, DEFAULT_GLOBAL_CONFIG, GLOBAL_CONFIG_KEYS, PROJECT_CONFIG_KEYS, _trustAccepted = false, TEST_GLOBAL_CONFIG_FOR_TESTING, TEST_PROJECT_CONFIG_FOR_TESTING, globalConfigCache, lastReadFileStats = null, configCacheHits = 0, configCacheMisses = 0, globalConfigWriteCount = 0, CONFIG_WRITE_DISPLAY_THRESHOLD = 20, CONFIG_FRESHNESS_POLL_MS = 1000, freshnessWatcherStarted = false, configReadingAllowed = false, getProjectPathForConfig, _getConfigForTesting, _wouldLoseAuthStateForTesting;
var init_config = __esm(() => {
  init_memoize();
  init_pickBy();
  init_state();
  init_paths();
  init_analytics();
  init_cwd();
  init_cleanupRegistry();
  init_debug();
  init_diagLogs();
  init_env();
  init_envUtils();
  init_errors();
  init_file();
  init_fsOperations();
  init_git();
  init_json();
  init_jsonRead();
  init_lockfile();
  init_log();
  init_path();
  init_privacyLevel();
  init_managedPath();
  init_slowOperations();
  init_configConstants();
  DEFAULT_PROJECT_CONFIG = {
    allowedTools: [],
    mcpContextUris: [],
    mcpServers: {},
    enabledMcpjsonServers: [],
    disabledMcpjsonServers: [],
    hasTrustDialogAccepted: false,
    projectOnboardingSeenCount: 0,
    hasClaudeMdExternalIncludesApproved: false,
    hasClaudeMdExternalIncludesWarningShown: false
  };
  DEFAULT_GLOBAL_CONFIG = createDefaultGlobalConfig();
  GLOBAL_CONFIG_KEYS = [
    "apiKeyHelper",
    "installMethod",
    "autoUpdates",
    "autoUpdatesProtectedForNative",
    "theme",
    "verbose",
    "preferredNotifChannel",
    "shiftEnterKeyBindingInstalled",
    "editorMode",
    "hasUsedBackslashReturn",
    "autoCompactEnabled",
    "showTurnDuration",
    "diffTool",
    "env",
    "tipsHistory",
    "todoFeatureEnabled",
    "showExpandedTodos",
    "messageIdleNotifThresholdMs",
    "autoConnectIde",
    "autoInstallIdeExtension",
    "fileCheckpointingEnabled",
    "terminalProgressBarEnabled",
    "showStatusInTerminalTab",
    "taskCompleteNotifEnabled",
    "inputNeededNotifEnabled",
    "agentPushNotifEnabled",
    "respectGitignore",
    "claudeInChromeDefaultEnabled",
    "hasCompletedClaudeInChromeOnboarding",
    "lspRecommendationDisabled",
    "lspRecommendationNeverPlugins",
    "lspRecommendationIgnoredCount",
    "copyFullResponse",
    "copyOnSelect",
    "permissionExplainerEnabled",
    "prStatusFooterEnabled",
    "remoteControlAtStartup",
    "remoteDialogSeen"
  ];
  PROJECT_CONFIG_KEYS = [
    "allowedTools",
    "hasTrustDialogAccepted",
    "hasCompletedProjectOnboarding"
  ];
  TEST_GLOBAL_CONFIG_FOR_TESTING = {
    ...DEFAULT_GLOBAL_CONFIG,
    autoUpdates: false
  };
  TEST_PROJECT_CONFIG_FOR_TESTING = {
    ...DEFAULT_PROJECT_CONFIG
  };
  globalConfigCache = {
    config: null,
    mtime: 0
  };
  registerCleanup(async () => {
    reportConfigCacheStats();
  });
  getProjectPathForConfig = memoize_default(() => {
    const originalCwd = getOriginalCwd();
    const gitRoot = findCanonicalGitRoot(originalCwd);
    if (gitRoot) {
      return normalizePathForConfigKey(gitRoot);
    }
    return normalizePathForConfigKey(resolve(originalCwd));
  });
  _getConfigForTesting = getConfig;
  _wouldLoseAuthStateForTesting = wouldLoseAuthState;
});

export { _baseSet_default, init__baseSet, pickBy_default, init_pickBy, getAutoMemEntrypoint, getMemoryBaseDir, isAutoMemoryEnabled, getAutoMemPath, isAutoMemPath, isExtractModeActive, hasAutoMemPathOverride, init_paths, NOTIFICATION_CHANNELS, EDITOR_MODES, TEAMMATE_MODES, init_configConstants, DEFAULT_GLOBAL_CONFIG, GLOBAL_CONFIG_KEYS, isGlobalConfigKey, PROJECT_CONFIG_KEYS, resetTrustDialogAcceptedCacheForTesting, checkHasTrustDialogAccepted, isPathTrusted, isProjectConfigKey, saveGlobalConfig, getGlobalConfigWriteCount, CONFIG_WRITE_DISPLAY_THRESHOLD, getGlobalConfig, getRemoteControlAtStartup, getCustomApiKeyStatus, enableConfigs, getProjectPathForConfig, getCurrentProjectConfig, saveCurrentProjectConfig, isAutoUpdaterDisabled, shouldSkipPluginAutoupdate, formatAutoUpdaterDisabledReason, getAutoUpdaterDisabledReason, getOrCreateUserID, recordFirstStartTime, getMemoryPath, getManagedClaudeRulesDir, getUserClaudeRulesDir, _getConfigForTesting, _wouldLoseAuthStateForTesting, _setGlobalConfigCacheForTesting, init_config };

//# debugId=33E418A36540987C64756E2164756E21
//# sourceMappingURL=chunk-jyqypr4z.js.map
