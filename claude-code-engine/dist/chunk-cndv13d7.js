// @bun
import {
  acquireProcessLifetimeLock,
  cleanupStaleLocks,
  filterClaudeAliases,
  getCurrentInstallationType,
  getMaxVersion,
  getShellConfigPaths,
  getShellType,
  init_autoUpdater,
  init_doctorDiagnostic,
  init_localInstaller,
  init_pidLock,
  init_shellConfig,
  isLockActive,
  isPidBasedLockingEnabled,
  readFileLines,
  readLockContent,
  shouldSkipVersion,
  withLock,
  writeFileLines
} from "./chunk-rfqp1ahm.js";
import {
  getUserBinDir,
  getXDGCacheHome,
  getXDGDataHome,
  getXDGStateHome,
  init_xdg
} from "./chunk-14p6wvsq.js";
import {
  gt,
  gte,
  init_semver
} from "./chunk-4spgkgr3.js";
import {
  envDynamic,
  init_envDynamic
} from "./chunk-bvcfzg7t.js";
import {
  getGlobalConfig,
  init_config,
  saveGlobalConfig
} from "./chunk-jyqypr4z.js";
import {
  check,
  init_lockfile,
  lock
} from "./chunk-m18nccbn.js";
import {
  init_sleep,
  sleep
} from "./chunk-jmv7k0jn.js";
import {
  env,
  init_env
} from "./chunk-r87btn9p.js";
import {
  init_analytics,
  logEvent
} from "./chunk-4hpfxga2.js";
import {
  axios_default,
  init_axios
} from "./chunk-pecy49yr.js";
import {
  execFileNoThrowWithCwd,
  init_execFileNoThrow
} from "./chunk-w7s0zvjq.js";
import {
  init_log,
  logError
} from "./chunk-kc49dhz0.js";
import {
  errorMessage,
  getErrnoCode,
  getFsImplementation,
  init_cleanupRegistry,
  init_debug,
  init_errors,
  init_fsOperations,
  init_slowOperations,
  isENOENT,
  jsonStringify,
  logForDebugging,
  registerCleanup,
  toError,
  writeFileSync_DEPRECATED
} from "./chunk-pyv3zrjt.js";
import {
  init_envUtils,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/nativeInstaller/download.ts
import { createHash } from "crypto";
import { chmod, writeFile } from "fs/promises";
import { join } from "path";
async function getLatestVersionFromArtifactory(tag = "latest") {
  const startTime = Date.now();
  const { stdout, code, stderr } = await execFileNoThrowWithCwd("npm", [
    "view",
    `${""}@${tag}`,
    "version",
    "--prefer-online",
    "--registry",
    ARTIFACTORY_REGISTRY_URL
  ], {
    timeout: 30000,
    preserveOutputOnError: true
  });
  const latencyMs = Date.now() - startTime;
  if (code !== 0) {
    logEvent("tengu_version_check_failure", {
      latency_ms: latencyMs,
      source_npm: true,
      exit_code: code
    });
    const error = new Error(`npm view failed with code ${code}: ${stderr}`);
    logError(error);
    throw error;
  }
  logEvent("tengu_version_check_success", {
    latency_ms: latencyMs,
    source_npm: true
  });
  logForDebugging(`npm view ${""}@${tag} version: ${stdout}`);
  const latestVersion = stdout.trim();
  return latestVersion;
}
async function getLatestVersionFromBinaryRepo(channel = "latest", baseUrl, authConfig) {
  const startTime = Date.now();
  try {
    const response = await axios_default.get(`${baseUrl}/${channel}`, {
      timeout: 30000,
      responseType: "text",
      ...authConfig
    });
    const latencyMs = Date.now() - startTime;
    logEvent("tengu_version_check_success", {
      latency_ms: latencyMs
    });
    return response.data.trim();
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage2 = error instanceof Error ? error.message : String(error);
    let httpStatus;
    if (axios_default.isAxiosError(error) && error.response) {
      httpStatus = error.response.status;
    }
    logEvent("tengu_version_check_failure", {
      latency_ms: latencyMs,
      http_status: httpStatus,
      is_timeout: errorMessage2.includes("timeout")
    });
    const fetchError = new Error(`Failed to fetch version from ${baseUrl}/${channel}: ${errorMessage2}`);
    logError(fetchError);
    throw fetchError;
  }
}
async function getLatestVersion(channelOrVersion) {
  if (/^v?\d+\.\d+\.\d+(-\S+)?$/.test(channelOrVersion)) {
    const normalized = channelOrVersion.startsWith("v") ? channelOrVersion.slice(1) : channelOrVersion;
    if (/^99\.99\./.test(normalized) && true) {
      throw new Error(`Version ${normalized} is not available for installation. Use 'stable' or 'latest'.`);
    }
    return normalized;
  }
  const channel = channelOrVersion;
  if (channel !== "stable" && channel !== "latest") {
    throw new Error(`Invalid channel: ${channelOrVersion}. Use 'stable' or 'latest'`);
  }
  if (process.env.USER_TYPE === "ant") {
    const npmTag = channel === "stable" ? "stable" : "latest";
    return getLatestVersionFromArtifactory(npmTag);
  }
  return getLatestVersionFromBinaryRepo(channel, GCS_BUCKET_URL);
}
async function downloadVersionFromArtifactory(version, stagingPath) {
  const fs = getFsImplementation();
  await fs.rm(stagingPath, { recursive: true, force: true });
  const platform = getPlatform();
  const platformPackageName = `${""}-${platform}`;
  logForDebugging(`Fetching integrity hash for ${platformPackageName}@${version}`);
  const {
    stdout: integrityOutput,
    code,
    stderr
  } = await execFileNoThrowWithCwd("npm", [
    "view",
    `${platformPackageName}@${version}`,
    "dist.integrity",
    "--registry",
    ARTIFACTORY_REGISTRY_URL
  ], {
    timeout: 30000,
    preserveOutputOnError: true
  });
  if (code !== 0) {
    throw new Error(`npm view integrity failed with code ${code}: ${stderr}`);
  }
  const integrity = integrityOutput.trim();
  if (!integrity) {
    throw new Error(`Failed to fetch integrity hash for ${platformPackageName}@${version}`);
  }
  logForDebugging(`Got integrity hash for ${platform}: ${integrity}`);
  await fs.mkdir(stagingPath);
  const packageJson = {
    name: "claude-native-installer",
    version: "0.0.1",
    dependencies: {
      [""]: version
    }
  };
  const packageLock = {
    name: "claude-native-installer",
    version: "0.0.1",
    lockfileVersion: 3,
    requires: true,
    packages: {
      "": {
        name: "claude-native-installer",
        version: "0.0.1",
        dependencies: {
          [""]: version
        }
      },
      [`node_modules/${""}`]: {
        version,
        optionalDependencies: {
          [platformPackageName]: version
        }
      },
      [`node_modules/${platformPackageName}`]: {
        version,
        integrity
      }
    }
  };
  writeFileSync_DEPRECATED(join(stagingPath, "package.json"), jsonStringify(packageJson, null, 2), { encoding: "utf8", flush: true });
  writeFileSync_DEPRECATED(join(stagingPath, "package-lock.json"), jsonStringify(packageLock, null, 2), { encoding: "utf8", flush: true });
  const result = await execFileNoThrowWithCwd("npm", ["ci", "--prefer-online", "--registry", ARTIFACTORY_REGISTRY_URL], {
    timeout: 60000,
    preserveOutputOnError: true,
    cwd: stagingPath
  });
  if (result.code !== 0) {
    throw new Error(`npm ci failed with code ${result.code}: ${result.stderr}`);
  }
  logForDebugging(`Successfully downloaded and verified ${""}@${version}`);
}
function getStallTimeoutMs() {
  return Number(process.env.CLAUDE_CODE_STALL_TIMEOUT_MS_FOR_TESTING) || DEFAULT_STALL_TIMEOUT_MS;
}
async function downloadAndVerifyBinary(binaryUrl, expectedChecksum, binaryPath, requestConfig = {}) {
  let lastError;
  for (let attempt = 1;attempt <= MAX_DOWNLOAD_RETRIES; attempt++) {
    const controller = new AbortController;
    let stallTimer;
    const clearStallTimer = () => {
      if (stallTimer) {
        clearTimeout(stallTimer);
        stallTimer = undefined;
      }
    };
    const resetStallTimer = () => {
      clearStallTimer();
      stallTimer = setTimeout((c) => c.abort(), getStallTimeoutMs(), controller);
    };
    try {
      resetStallTimer();
      const response = await axios_default.get(binaryUrl, {
        timeout: 5 * 60000,
        responseType: "arraybuffer",
        signal: controller.signal,
        onDownloadProgress: () => {
          resetStallTimer();
        },
        ...requestConfig
      });
      clearStallTimer();
      const hash = createHash("sha256");
      hash.update(response.data);
      const actualChecksum = hash.digest("hex");
      if (actualChecksum !== expectedChecksum) {
        throw new Error(`Checksum mismatch: expected ${expectedChecksum}, got ${actualChecksum}`);
      }
      await writeFile(binaryPath, Buffer.from(response.data));
      await chmod(binaryPath, 493);
      return;
    } catch (error) {
      clearStallTimer();
      const isStallTimeout = axios_default.isCancel(error);
      if (isStallTimeout) {
        lastError = new StallTimeoutError;
      } else {
        lastError = toError(error);
      }
      if (isStallTimeout && attempt < MAX_DOWNLOAD_RETRIES) {
        logForDebugging(`Download stalled on attempt ${attempt}/${MAX_DOWNLOAD_RETRIES}, retrying...`);
        await sleep(1000);
        continue;
      }
      throw lastError;
    }
  }
  throw lastError ?? new Error("Download failed after all retries");
}
async function downloadVersionFromBinaryRepo(version, stagingPath, baseUrl, authConfig) {
  const fs = getFsImplementation();
  await fs.rm(stagingPath, { recursive: true, force: true });
  const platform = getPlatform();
  const startTime = Date.now();
  logEvent("tengu_binary_download_attempt", {});
  let manifest;
  try {
    const manifestResponse = await axios_default.get(`${baseUrl}/${version}/manifest.json`, {
      timeout: 1e4,
      responseType: "json",
      ...authConfig
    });
    manifest = manifestResponse.data;
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage2 = error instanceof Error ? error.message : String(error);
    let httpStatus;
    if (axios_default.isAxiosError(error) && error.response) {
      httpStatus = error.response.status;
    }
    logEvent("tengu_binary_manifest_fetch_failure", {
      latency_ms: latencyMs,
      http_status: httpStatus,
      is_timeout: errorMessage2.includes("timeout")
    });
    logError(new Error(`Failed to fetch manifest from ${baseUrl}/${version}/manifest.json: ${errorMessage2}`));
    throw error;
  }
  const platformInfo = manifest.platforms[platform];
  if (!platformInfo) {
    logEvent("tengu_binary_platform_not_found", {});
    throw new Error(`Platform ${platform} not found in manifest for version ${version}`);
  }
  const expectedChecksum = platformInfo.checksum;
  const binaryName = getBinaryName(platform);
  const binaryUrl = `${baseUrl}/${version}/${platform}/${binaryName}`;
  await fs.mkdir(stagingPath);
  const binaryPath = join(stagingPath, binaryName);
  try {
    await downloadAndVerifyBinary(binaryUrl, expectedChecksum, binaryPath, authConfig || {});
    const latencyMs = Date.now() - startTime;
    logEvent("tengu_binary_download_success", {
      latency_ms: latencyMs
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage2 = error instanceof Error ? error.message : String(error);
    let httpStatus;
    if (axios_default.isAxiosError(error) && error.response) {
      httpStatus = error.response.status;
    }
    logEvent("tengu_binary_download_failure", {
      latency_ms: latencyMs,
      http_status: httpStatus,
      is_timeout: errorMessage2.includes("timeout"),
      is_checksum_mismatch: errorMessage2.includes("Checksum mismatch")
    });
    logError(new Error(`Failed to download binary from ${binaryUrl}: ${errorMessage2}`));
    throw error;
  }
}
async function downloadVersion(version, stagingPath) {
  if (false) {}
  if (process.env.USER_TYPE === "ant") {
    await downloadVersionFromArtifactory(version, stagingPath);
    return "npm";
  }
  await downloadVersionFromBinaryRepo(version, stagingPath, GCS_BUCKET_URL);
  return "binary";
}
var GCS_BUCKET_URL = "https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases", ARTIFACTORY_REGISTRY_URL = "https://artifactory.infra.ant.dev/artifactory/api/npm/npm-all/", DEFAULT_STALL_TIMEOUT_MS = 60000, MAX_DOWNLOAD_RETRIES = 3, StallTimeoutError;
var init_download = __esm(() => {
  init_axios();
  init_analytics();
  init_debug();
  init_errors();
  init_execFileNoThrow();
  init_fsOperations();
  init_log();
  init_sleep();
  init_slowOperations();
  init_installer();
  StallTimeoutError = class StallTimeoutError extends Error {
    constructor() {
      super("Download stalled: no data received for 60 seconds");
      this.name = "StallTimeoutError";
    }
  };
});

// src/utils/nativeInstaller/installer.ts
import { constants as fsConstants } from "fs";
import {
  access,
  chmod as chmod2,
  copyFile,
  lstat,
  mkdir,
  readdir,
  readlink,
  realpath,
  rename,
  rm,
  rmdir,
  stat,
  symlink,
  unlink,
  writeFile as writeFile2
} from "fs/promises";
import { homedir } from "os";
import { basename, delimiter, dirname, join as join2, resolve } from "path";
function getPlatform() {
  const os = env.platform;
  const arch = process.arch === "x64" ? "x64" : process.arch === "arm64" ? "arm64" : null;
  if (!arch) {
    const error = new Error(`Unsupported architecture: ${process.arch}`);
    logForDebugging(`Native installer does not support architecture: ${process.arch}`, { level: "error" });
    throw error;
  }
  if (os === "linux" && envDynamic.isMuslEnvironment()) {
    return `linux-${arch}-musl`;
  }
  return `${os}-${arch}`;
}
function getBinaryName(platform) {
  return platform.startsWith("win32") ? "claude.exe" : "claude";
}
function getBaseDirectories() {
  const platform = getPlatform();
  const executableName = getBinaryName(platform);
  return {
    versions: join2(getXDGDataHome(), "claude", "versions"),
    staging: join2(getXDGCacheHome(), "claude", "staging"),
    locks: join2(getXDGStateHome(), "claude", "locks"),
    executable: join2(getUserBinDir(), executableName)
  };
}
async function isPossibleClaudeBinary(filePath) {
  try {
    const stats = await stat(filePath);
    if (!stats.isFile() || stats.size === 0) {
      return false;
    }
    await access(filePath, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}
async function getVersionPaths(version) {
  const dirs = getBaseDirectories();
  const dirsToCreate = [dirs.versions, dirs.staging, dirs.locks];
  await Promise.all(dirsToCreate.map((dir) => mkdir(dir, { recursive: true })));
  const executableParentDir = dirname(dirs.executable);
  await mkdir(executableParentDir, { recursive: true });
  const installPath = join2(dirs.versions, version);
  try {
    await stat(installPath);
  } catch {
    await writeFile2(installPath, "", { encoding: "utf8" });
  }
  return {
    stagingPath: join2(dirs.staging, version),
    installPath
  };
}
async function tryWithVersionLock(versionFilePath, callback, retries = 0) {
  const dirs = getBaseDirectories();
  const lockfilePath = getLockFilePathFromVersionPath(dirs, versionFilePath);
  await mkdir(dirs.locks, { recursive: true });
  if (isPidBasedLockingEnabled()) {
    let attempts = 0;
    const maxAttempts = retries + 1;
    const minTimeout = retries > 0 ? 1000 : 100;
    const maxTimeout = retries > 0 ? 5000 : 500;
    while (attempts < maxAttempts) {
      const success = await withLock(versionFilePath, lockfilePath, async () => {
        try {
          await callback();
        } catch (error) {
          logError(error);
          throw error;
        }
      });
      if (success) {
        logEvent("tengu_version_lock_acquired", {
          is_pid_based: true,
          is_lifetime_lock: false,
          attempts: attempts + 1
        });
        return true;
      }
      attempts++;
      if (attempts < maxAttempts) {
        const timeout = Math.min(minTimeout * 2 ** (attempts - 1), maxTimeout);
        await sleep(timeout);
      }
    }
    logEvent("tengu_version_lock_failed", {
      is_pid_based: true,
      is_lifetime_lock: false,
      attempts: maxAttempts
    });
    logLockAcquisitionError(versionFilePath, new Error("Lock held by another process"));
    return false;
  }
  let release = null;
  try {
    try {
      release = await lock(versionFilePath, {
        stale: LOCK_STALE_MS,
        retries: {
          retries,
          minTimeout: retries > 0 ? 1000 : 100,
          maxTimeout: retries > 0 ? 5000 : 500
        },
        lockfilePath,
        onCompromised: (err) => {
          logForDebugging(`NON-FATAL: Version lock was compromised during operation: ${err.message}`, { level: "info" });
        }
      });
    } catch (lockError) {
      logEvent("tengu_version_lock_failed", {
        is_pid_based: false,
        is_lifetime_lock: false
      });
      logLockAcquisitionError(versionFilePath, lockError);
      return false;
    }
    try {
      await callback();
      logEvent("tengu_version_lock_acquired", {
        is_pid_based: false,
        is_lifetime_lock: false
      });
      return true;
    } catch (error) {
      logError(error);
      throw error;
    }
  } finally {
    if (release) {
      await release();
    }
  }
}
async function atomicMoveToInstallPath(stagedBinaryPath, installPath) {
  await mkdir(dirname(installPath), { recursive: true });
  const tempInstallPath = `${installPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    await copyFile(stagedBinaryPath, tempInstallPath);
    await chmod2(tempInstallPath, 493);
    await rename(tempInstallPath, installPath);
    logForDebugging(`Atomically installed binary to ${installPath}`);
  } catch (error) {
    try {
      await unlink(tempInstallPath);
    } catch {}
    throw error;
  }
}
async function installVersionFromPackage(stagingPath, installPath) {
  try {
    const nodeModulesDir = join2(stagingPath, "node_modules", "@anthropic-ai");
    const entries = await readdir(nodeModulesDir);
    const nativePackage = entries.find((entry) => entry.startsWith("claude-cli-native-"));
    if (!nativePackage) {
      logEvent("tengu_native_install_package_failure", {
        stage_find_package: true,
        error_package_not_found: true
      });
      const error = new Error("Could not find platform-specific native package");
      throw error;
    }
    const stagedBinaryPath = join2(nodeModulesDir, nativePackage, "cli");
    try {
      await stat(stagedBinaryPath);
    } catch {
      logEvent("tengu_native_install_package_failure", {
        stage_binary_exists: true,
        error_binary_not_found: true
      });
      const error = new Error("Native binary not found in staged package");
      throw error;
    }
    await atomicMoveToInstallPath(stagedBinaryPath, installPath);
    await rm(stagingPath, { recursive: true, force: true });
    logEvent("tengu_native_install_package_success", {});
  } catch (error) {
    const msg = errorMessage(error);
    if (!msg.includes("Could not find platform-specific") && !msg.includes("Native binary not found")) {
      logEvent("tengu_native_install_package_failure", {
        stage_atomic_move: true,
        error_move_failed: true
      });
    }
    logError(toError(error));
    throw error;
  }
}
async function installVersionFromBinary(stagingPath, installPath) {
  try {
    const platform = getPlatform();
    const binaryName = getBinaryName(platform);
    const stagedBinaryPath = join2(stagingPath, binaryName);
    try {
      await stat(stagedBinaryPath);
    } catch {
      logEvent("tengu_native_install_binary_failure", {
        stage_binary_exists: true,
        error_binary_not_found: true
      });
      const error = new Error("Staged binary not found");
      throw error;
    }
    await atomicMoveToInstallPath(stagedBinaryPath, installPath);
    await rm(stagingPath, { recursive: true, force: true });
    logEvent("tengu_native_install_binary_success", {});
  } catch (error) {
    if (!errorMessage(error).includes("Staged binary not found")) {
      logEvent("tengu_native_install_binary_failure", {
        stage_atomic_move: true,
        error_move_failed: true
      });
    }
    logError(toError(error));
    throw error;
  }
}
async function installVersion(stagingPath, installPath, downloadType) {
  if (downloadType === "npm") {
    await installVersionFromPackage(stagingPath, installPath);
  } else {
    await installVersionFromBinary(stagingPath, installPath);
  }
}
async function performVersionUpdate(version, forceReinstall) {
  const { stagingPath: baseStagingPath, installPath } = await getVersionPaths(version);
  const { executable: executablePath } = getBaseDirectories();
  const stagingPath = isEnvTruthy(process.env.ENABLE_LOCKLESS_UPDATES) ? `${baseStagingPath}.${process.pid}.${Date.now()}` : baseStagingPath;
  const needsInstall = !await versionIsAvailable(version) || forceReinstall;
  if (needsInstall) {
    logForDebugging(forceReinstall ? `Force reinstalling native installer version ${version}` : `Downloading native installer version ${version}`);
    const downloadType = await downloadVersion(version, stagingPath);
    await installVersion(stagingPath, installPath, downloadType);
  } else {
    logForDebugging(`Version ${version} already installed, updating symlink`);
  }
  await removeDirectoryIfEmpty(executablePath);
  await updateSymlink(executablePath, installPath);
  if (!await isPossibleClaudeBinary(executablePath)) {
    let installPathExists = false;
    try {
      await stat(installPath);
      installPathExists = true;
    } catch {}
    throw new Error(`Failed to create executable at ${executablePath}. ` + `Source file exists: ${installPathExists}. ` + `Check write permissions to ${executablePath}.`);
  }
  return needsInstall;
}
async function versionIsAvailable(version) {
  const { installPath } = await getVersionPaths(version);
  return isPossibleClaudeBinary(installPath);
}
async function updateLatest(channelOrVersion, forceReinstall = false) {
  const startTime = Date.now();
  let version = await getLatestVersion(channelOrVersion);
  const { executable: executablePath } = getBaseDirectories();
  logForDebugging(`Checking for native installer update to version ${version}`);
  if (!forceReinstall) {
    const maxVersion = await getMaxVersion();
    if (maxVersion && gt(version, maxVersion)) {
      logForDebugging(`Native installer: maxVersion ${maxVersion} is set, capping update from ${version} to ${maxVersion}`);
      if (gte("5.0.0", maxVersion)) {
        logForDebugging(`Native installer: current version ${"5.0.0"} is already at or above maxVersion ${maxVersion}, skipping update`);
        logEvent("tengu_native_update_skipped_max_version", {
          latency_ms: Date.now() - startTime,
          max_version: maxVersion,
          available_version: version
        });
        return { success: true, latestVersion: version };
      }
      version = maxVersion;
    }
  }
  if (!forceReinstall && version === "5.0.0" && await versionIsAvailable(version) && await isPossibleClaudeBinary(executablePath)) {
    logForDebugging(`Found ${version} at ${executablePath}, skipping install`);
    logEvent("tengu_native_update_complete", {
      latency_ms: Date.now() - startTime,
      was_new_install: false,
      was_force_reinstall: false,
      was_already_running: true
    });
    return { success: true, latestVersion: version };
  }
  if (!forceReinstall && shouldSkipVersion(version)) {
    logEvent("tengu_native_update_skipped_minimum_version", {
      latency_ms: Date.now() - startTime,
      target_version: version
    });
    return { success: true, latestVersion: version };
  }
  let wasNewInstall = false;
  let latencyMs;
  if (isEnvTruthy(process.env.ENABLE_LOCKLESS_UPDATES)) {
    wasNewInstall = await performVersionUpdate(version, forceReinstall);
    latencyMs = Date.now() - startTime;
  } else {
    const { installPath } = await getVersionPaths(version);
    if (forceReinstall) {
      await forceRemoveLock(installPath);
    }
    const lockAcquired = await tryWithVersionLock(installPath, async () => {
      wasNewInstall = await performVersionUpdate(version, forceReinstall);
    }, 3);
    latencyMs = Date.now() - startTime;
    if (!lockAcquired) {
      const dirs = getBaseDirectories();
      let lockHolderPid;
      if (isPidBasedLockingEnabled()) {
        const lockfilePath = getLockFilePathFromVersionPath(dirs, installPath);
        if (isLockActive(lockfilePath)) {
          lockHolderPid = readLockContent(lockfilePath)?.pid;
        }
      }
      logEvent("tengu_native_update_lock_failed", {
        latency_ms: latencyMs,
        lock_holder_pid: lockHolderPid
      });
      return {
        success: false,
        latestVersion: version,
        lockFailed: true,
        lockHolderPid
      };
    }
  }
  logEvent("tengu_native_update_complete", {
    latency_ms: latencyMs,
    was_new_install: wasNewInstall,
    was_force_reinstall: forceReinstall
  });
  logForDebugging(`Successfully updated to version ${version}`);
  return { success: true, latestVersion: version };
}
async function removeDirectoryIfEmpty(path) {
  try {
    await rmdir(path);
    logForDebugging(`Removed empty directory at ${path}`);
  } catch (error) {
    const code = getErrnoCode(error);
    if (code !== "ENOTDIR" && code !== "ENOENT" && code !== "ENOTEMPTY") {
      logForDebugging(`Could not remove directory at ${path}: ${error}`);
    }
  }
}
async function updateSymlink(symlinkPath, targetPath) {
  const platform = getPlatform();
  const isWindows = platform.startsWith("win32");
  if (isWindows) {
    try {
      const parentDir2 = dirname(symlinkPath);
      await mkdir(parentDir2, { recursive: true });
      let existingStats;
      try {
        existingStats = await stat(symlinkPath);
      } catch {}
      if (existingStats) {
        try {
          const targetStats = await stat(targetPath);
          if (existingStats.size === targetStats.size) {
            return false;
          }
        } catch {}
        const oldFileName = `${symlinkPath}.old.${Date.now()}`;
        await rename(symlinkPath, oldFileName);
        try {
          await copyFile(targetPath, symlinkPath);
          try {
            await unlink(oldFileName);
          } catch {}
        } catch (copyError) {
          try {
            await rename(oldFileName, symlinkPath);
          } catch (restoreError) {
            const errorWithCause = new Error(`Failed to restore old executable: ${restoreError}`, { cause: copyError });
            logError(errorWithCause);
            throw errorWithCause;
          }
          throw copyError;
        }
      } else {
        try {
          await copyFile(targetPath, symlinkPath);
        } catch (e) {
          if (isENOENT(e)) {
            throw new Error(`Source file does not exist: ${targetPath}`);
          }
          throw e;
        }
      }
      return true;
    } catch (error) {
      logError(new Error(`Failed to copy executable from ${targetPath} to ${symlinkPath}: ${error}`));
      return false;
    }
  }
  const parentDir = dirname(symlinkPath);
  try {
    await mkdir(parentDir, { recursive: true });
    logForDebugging(`Created directory ${parentDir} for symlink`);
  } catch (mkdirError) {
    logError(new Error(`Failed to create directory ${parentDir}: ${mkdirError}`));
    return false;
  }
  try {
    let symlinkExists = false;
    try {
      await stat(symlinkPath);
      symlinkExists = true;
    } catch {}
    if (symlinkExists) {
      try {
        const currentTarget = await readlink(symlinkPath);
        const resolvedCurrentTarget = resolve(dirname(symlinkPath), currentTarget);
        const resolvedTargetPath = resolve(targetPath);
        if (resolvedCurrentTarget === resolvedTargetPath) {
          return false;
        }
      } catch {}
      await unlink(symlinkPath);
    }
  } catch (error) {
    logError(new Error(`Failed to check/remove existing symlink: ${error}`));
  }
  const tempSymlink = `${symlinkPath}.tmp.${process.pid}.${Date.now()}`;
  try {
    await symlink(targetPath, tempSymlink);
    await rename(tempSymlink, symlinkPath);
    logForDebugging(`Atomically updated symlink ${symlinkPath} -> ${targetPath}`);
    return true;
  } catch (error) {
    try {
      await unlink(tempSymlink);
    } catch {}
    logError(new Error(`Failed to create symlink from ${symlinkPath} to ${targetPath}: ${error}`));
    return false;
  }
}
async function checkInstall(force = false) {
  if (isEnvTruthy(process.env.DISABLE_INSTALLATION_CHECKS)) {
    return [];
  }
  const installationType = await getCurrentInstallationType();
  if (installationType === "development") {
    return [];
  }
  const config = getGlobalConfig();
  const shouldCheckNative = force || installationType === "native" || config.installMethod === "native";
  if (!shouldCheckNative) {
    return [];
  }
  const dirs = getBaseDirectories();
  const messages = [];
  const localBinDir = dirname(dirs.executable);
  const resolvedLocalBinPath = resolve(localBinDir);
  const platform = getPlatform();
  const isWindows = platform.startsWith("win32");
  try {
    await access(localBinDir);
  } catch {
    messages.push({
      message: `installMethod is native, but directory ${localBinDir} does not exist`,
      userActionRequired: true,
      type: "error"
    });
  }
  if (isWindows) {
    if (!await isPossibleClaudeBinary(dirs.executable)) {
      messages.push({
        message: `installMethod is native, but claude command is missing or invalid at ${dirs.executable}`,
        userActionRequired: true,
        type: "error"
      });
    }
  } else {
    try {
      const target = await readlink(dirs.executable);
      const absoluteTarget = resolve(dirname(dirs.executable), target);
      if (!await isPossibleClaudeBinary(absoluteTarget)) {
        messages.push({
          message: `Claude symlink points to missing or invalid binary: ${target}`,
          userActionRequired: true,
          type: "error"
        });
      }
    } catch (e) {
      if (isENOENT(e)) {
        messages.push({
          message: `installMethod is native, but claude command not found at ${dirs.executable}`,
          userActionRequired: true,
          type: "error"
        });
      } else {
        if (!await isPossibleClaudeBinary(dirs.executable)) {
          messages.push({
            message: `${dirs.executable} exists but is not a valid Claude binary`,
            userActionRequired: true,
            type: "error"
          });
        }
      }
    }
  }
  const isInCurrentPath = (process.env.PATH || "").split(delimiter).some((entry) => {
    try {
      const resolvedEntry = resolve(entry);
      if (isWindows) {
        return resolvedEntry.toLowerCase() === resolvedLocalBinPath.toLowerCase();
      }
      return resolvedEntry === resolvedLocalBinPath;
    } catch {
      return false;
    }
  });
  if (!isInCurrentPath) {
    if (isWindows) {
      const windowsBinPath = localBinDir.replace(/\//g, "\\");
      messages.push({
        message: `Native installation exists but ${windowsBinPath} is not in your PATH. Add it by opening: System Properties \u2192 Environment Variables \u2192 Edit User PATH \u2192 New \u2192 Add the path above. Then restart your terminal.`,
        userActionRequired: true,
        type: "path"
      });
    } else {
      const shellType = getShellType();
      const configPaths = getShellConfigPaths();
      const configFile = configPaths[shellType];
      const displayPath = configFile ? configFile.replace(homedir(), "~") : "your shell config file";
      messages.push({
        message: `Native installation exists but ~/.local/bin is not in your PATH. Run:

echo 'export PATH="$HOME/.local/bin:$PATH"' >> ${displayPath} && source ${displayPath}`,
        userActionRequired: true,
        type: "path"
      });
    }
  }
  return messages;
}
function installLatest(channelOrVersion, forceReinstall = false) {
  if (forceReinstall) {
    return installLatestImpl(channelOrVersion, forceReinstall);
  }
  if (inFlightInstall) {
    logForDebugging("installLatest: joining in-flight call");
    return inFlightInstall;
  }
  const promise = installLatestImpl(channelOrVersion, forceReinstall);
  inFlightInstall = promise;
  const clear = () => {
    inFlightInstall = null;
  };
  promise.then(clear, clear);
  return promise;
}
async function installLatestImpl(channelOrVersion, forceReinstall = false) {
  const updateResult = await updateLatest(channelOrVersion, forceReinstall);
  if (!updateResult.success) {
    return {
      latestVersion: null,
      wasUpdated: false,
      lockFailed: updateResult.lockFailed,
      lockHolderPid: updateResult.lockHolderPid
    };
  }
  const config = getGlobalConfig();
  if (config.installMethod !== "native") {
    saveGlobalConfig((current) => ({
      ...current,
      installMethod: "native",
      autoUpdates: false,
      autoUpdatesProtectedForNative: true
    }));
    logForDebugging('Native installer: Set installMethod to "native" and disabled legacy auto-updater for protection');
  }
  cleanupOldVersions();
  return {
    latestVersion: updateResult.latestVersion,
    wasUpdated: updateResult.success,
    lockFailed: false
  };
}
async function getVersionFromSymlink(symlinkPath) {
  try {
    const target = await readlink(symlinkPath);
    const absoluteTarget = resolve(dirname(symlinkPath), target);
    if (await isPossibleClaudeBinary(absoluteTarget)) {
      return absoluteTarget;
    }
  } catch {}
  return null;
}
function getLockFilePathFromVersionPath(dirs, versionPath) {
  const versionName = basename(versionPath);
  return join2(dirs.locks, `${versionName}.lock`);
}
async function lockCurrentVersion() {
  const dirs = getBaseDirectories();
  if (!process.execPath.includes(dirs.versions)) {
    return;
  }
  const versionPath = resolve(process.execPath);
  try {
    const lockfilePath = getLockFilePathFromVersionPath(dirs, versionPath);
    await mkdir(dirs.locks, { recursive: true });
    if (isPidBasedLockingEnabled()) {
      const acquired = await acquireProcessLifetimeLock(versionPath, lockfilePath);
      if (!acquired) {
        logEvent("tengu_version_lock_failed", {
          is_pid_based: true,
          is_lifetime_lock: true
        });
        logLockAcquisitionError(versionPath, new Error("Lock already held by another process"));
        return;
      }
      logEvent("tengu_version_lock_acquired", {
        is_pid_based: true,
        is_lifetime_lock: true
      });
      logForDebugging(`Acquired PID lock on running version: ${versionPath}`);
    } else {
      let release;
      try {
        release = await lock(versionPath, {
          stale: LOCK_STALE_MS,
          retries: 0,
          lockfilePath,
          onCompromised: (err) => {
            logForDebugging(`NON-FATAL: Lock on running version was compromised: ${err.message}`, { level: "info" });
          }
        });
        logEvent("tengu_version_lock_acquired", {
          is_pid_based: false,
          is_lifetime_lock: true
        });
        logForDebugging(`Acquired mtime-based lock on running version: ${versionPath}`);
        registerCleanup(async () => {
          try {
            await release?.();
          } catch {}
        });
      } catch (lockError) {
        if (isENOENT(lockError)) {
          logForDebugging(`Cannot lock current version - file does not exist: ${versionPath}`, { level: "info" });
          return;
        }
        logEvent("tengu_version_lock_failed", {
          is_pid_based: false,
          is_lifetime_lock: true
        });
        logLockAcquisitionError(versionPath, lockError);
        return;
      }
    }
  } catch (error) {
    if (isENOENT(error)) {
      logForDebugging(`Cannot lock current version - file does not exist: ${versionPath}`, { level: "info" });
      return;
    }
    logForDebugging(`NON-FATAL: Failed to lock current version during execution ${errorMessage(error)}`, { level: "info" });
  }
}
function logLockAcquisitionError(versionPath, lockError) {
  logError(new Error(`NON-FATAL: Lock acquisition failed for ${versionPath} (expected in multi-process scenarios)`, { cause: lockError }));
}
async function forceRemoveLock(versionFilePath) {
  const dirs = getBaseDirectories();
  const lockfilePath = getLockFilePathFromVersionPath(dirs, versionFilePath);
  try {
    await unlink(lockfilePath);
    logForDebugging(`Force-removed lock file at ${lockfilePath}`);
  } catch (error) {
    logForDebugging(`Failed to force-remove lock file: ${errorMessage(error)}`);
  }
}
async function cleanupOldVersions() {
  await Promise.resolve();
  const dirs = getBaseDirectories();
  const oneHourAgo = Date.now() - 3600000;
  if (getPlatform().startsWith("win32")) {
    const executableDir = dirname(dirs.executable);
    try {
      const files = await readdir(executableDir);
      let cleanedCount = 0;
      for (const file of files) {
        if (!/^claude\.exe\.old\.\d+$/.test(file))
          continue;
        try {
          await unlink(join2(executableDir, file));
          cleanedCount++;
        } catch {}
      }
      if (cleanedCount > 0) {
        logForDebugging(`Cleaned up ${cleanedCount} old Windows executables on startup`);
      }
    } catch (error) {
      if (!isENOENT(error)) {
        logForDebugging(`Failed to clean up old Windows executables: ${error}`);
      }
    }
  }
  try {
    const stagingEntries = await readdir(dirs.staging);
    let stagingCleanedCount = 0;
    for (const entry of stagingEntries) {
      const stagingPath = join2(dirs.staging, entry);
      try {
        const stats = await stat(stagingPath);
        if (stats.mtime.getTime() < oneHourAgo) {
          await rm(stagingPath, { recursive: true, force: true });
          stagingCleanedCount++;
          logForDebugging(`Cleaned up old staging directory: ${entry}`);
        }
      } catch {}
    }
    if (stagingCleanedCount > 0) {
      logForDebugging(`Cleaned up ${stagingCleanedCount} orphaned staging directories`);
      logEvent("tengu_native_staging_cleanup", {
        cleaned_count: stagingCleanedCount
      });
    }
  } catch (error) {
    if (!isENOENT(error)) {
      logForDebugging(`Failed to clean up staging directories: ${error}`);
    }
  }
  if (isPidBasedLockingEnabled()) {
    const staleLocksCleaned = cleanupStaleLocks(dirs.locks);
    if (staleLocksCleaned > 0) {
      logForDebugging(`Cleaned up ${staleLocksCleaned} stale version locks`);
      logEvent("tengu_native_stale_locks_cleanup", {
        cleaned_count: staleLocksCleaned
      });
    }
  }
  let versionEntries;
  try {
    versionEntries = await readdir(dirs.versions);
  } catch (error) {
    if (!isENOENT(error)) {
      logForDebugging(`Failed to readdir versions directory: ${error}`);
    }
    return;
  }
  const versionFiles = [];
  let tempFilesCleanedCount = 0;
  for (const entry of versionEntries) {
    const entryPath = join2(dirs.versions, entry);
    if (/\.tmp\.\d+\.\d+$/.test(entry)) {
      try {
        const stats = await stat(entryPath);
        if (stats.mtime.getTime() < oneHourAgo) {
          await unlink(entryPath);
          tempFilesCleanedCount++;
          logForDebugging(`Cleaned up orphaned temp install file: ${entry}`);
        }
      } catch {}
      continue;
    }
    try {
      const stats = await stat(entryPath);
      if (!stats.isFile())
        continue;
      if (process.platform !== "win32" && stats.size > 0 && (stats.mode & 73) === 0) {
        continue;
      }
      versionFiles.push({
        name: entry,
        path: entryPath,
        resolvedPath: resolve(entryPath),
        mtime: stats.mtime
      });
    } catch {}
  }
  if (tempFilesCleanedCount > 0) {
    logForDebugging(`Cleaned up ${tempFilesCleanedCount} orphaned temp install files`);
    logEvent("tengu_native_temp_files_cleanup", {
      cleaned_count: tempFilesCleanedCount
    });
  }
  if (versionFiles.length === 0) {
    return;
  }
  try {
    const currentBinaryPath = process.execPath;
    const protectedVersions = new Set;
    if (currentBinaryPath && currentBinaryPath.includes(dirs.versions)) {
      protectedVersions.add(resolve(currentBinaryPath));
    }
    const currentSymlinkVersion = await getVersionFromSymlink(dirs.executable);
    if (currentSymlinkVersion) {
      protectedVersions.add(currentSymlinkVersion);
    }
    for (const v of versionFiles) {
      if (protectedVersions.has(v.resolvedPath))
        continue;
      const lockFilePath = getLockFilePathFromVersionPath(dirs, v.resolvedPath);
      let hasActiveLock = false;
      if (isPidBasedLockingEnabled()) {
        hasActiveLock = isLockActive(lockFilePath);
      } else {
        try {
          hasActiveLock = await check(v.resolvedPath, {
            stale: LOCK_STALE_MS,
            lockfilePath: lockFilePath
          });
        } catch {
          hasActiveLock = false;
        }
      }
      if (hasActiveLock) {
        protectedVersions.add(v.resolvedPath);
        logForDebugging(`Protecting locked version from cleanup: ${v.name}`);
      }
    }
    const eligibleVersions = versionFiles.filter((v) => !protectedVersions.has(v.resolvedPath)).sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    const versionsToDelete = eligibleVersions.slice(VERSION_RETENTION_COUNT);
    if (versionsToDelete.length === 0) {
      logEvent("tengu_native_version_cleanup", {
        total_count: versionFiles.length,
        deleted_count: 0,
        protected_count: protectedVersions.size,
        retained_count: VERSION_RETENTION_COUNT,
        lock_failed_count: 0,
        error_count: 0
      });
      return;
    }
    let deletedCount = 0;
    let lockFailedCount = 0;
    let errorCount = 0;
    await Promise.all(versionsToDelete.map(async (version) => {
      try {
        const deleted = await tryWithVersionLock(version.path, async () => {
          await unlink(version.path);
        });
        if (deleted) {
          deletedCount++;
        } else {
          lockFailedCount++;
          logForDebugging(`Skipping deletion of ${version.name} - locked by another process`);
        }
      } catch (error) {
        errorCount++;
        logError(new Error(`Failed to delete version ${version.name}: ${error}`));
      }
    }));
    logEvent("tengu_native_version_cleanup", {
      total_count: versionFiles.length,
      deleted_count: deletedCount,
      protected_count: protectedVersions.size,
      retained_count: VERSION_RETENTION_COUNT,
      lock_failed_count: lockFailedCount,
      error_count: errorCount
    });
  } catch (error) {
    if (!isENOENT(error)) {
      logError(new Error(`Version cleanup failed: ${error}`));
    }
  }
}
async function cleanupShellAliases() {
  const messages = [];
  const configMap = getShellConfigPaths();
  for (const [shellType, configFile] of Object.entries(configMap)) {
    try {
      const lines = await readFileLines(configFile);
      if (!lines)
        continue;
      const { filtered, hadAlias } = filterClaudeAliases(lines);
      if (hadAlias) {
        await writeFileLines(configFile, filtered);
        messages.push({
          message: `Removed claude alias from ${configFile}. Run: unalias claude`,
          userActionRequired: true,
          type: "alias"
        });
        logForDebugging(`Cleaned up claude alias from ${shellType} config`);
      }
    } catch (error) {
      logError(error);
      messages.push({
        message: `Failed to clean up ${configFile}: ${error}`,
        userActionRequired: false,
        type: "error"
      });
    }
  }
  return messages;
}
async function manualRemoveNpmPackage(packageName) {
  try {
    const prefixResult = await execFileNoThrowWithCwd("npm", [
      "config",
      "get",
      "prefix"
    ]);
    if (prefixResult.code !== 0 || !prefixResult.stdout) {
      return {
        success: false,
        error: "Failed to get npm global prefix"
      };
    }
    const globalPrefix = prefixResult.stdout.trim();
    let manuallyRemoved = false;
    async function tryRemove(filePath, description) {
      try {
        await unlink(filePath);
        logForDebugging(`Manually removed ${description}: ${filePath}`);
        return true;
      } catch {
        return false;
      }
    }
    if (getPlatform().startsWith("win32")) {
      const binCmd = join2(globalPrefix, "claude.cmd");
      const binPs1 = join2(globalPrefix, "claude.ps1");
      const binExe = join2(globalPrefix, "claude");
      if (await tryRemove(binCmd, "bin script")) {
        manuallyRemoved = true;
      }
      if (await tryRemove(binPs1, "PowerShell script")) {
        manuallyRemoved = true;
      }
      if (await tryRemove(binExe, "bin executable")) {
        manuallyRemoved = true;
      }
    } else {
      const binSymlink = join2(globalPrefix, "bin", "claude");
      if (await tryRemove(binSymlink, "bin symlink")) {
        manuallyRemoved = true;
      }
    }
    if (manuallyRemoved) {
      logForDebugging(`Successfully removed ${packageName} manually`);
      const nodeModulesPath = getPlatform().startsWith("win32") ? join2(globalPrefix, "node_modules", packageName) : join2(globalPrefix, "lib", "node_modules", packageName);
      return {
        success: true,
        warning: `${packageName} executables removed, but node_modules directory was left intact for safety. You may manually delete it later at: ${nodeModulesPath}`
      };
    } else {
      return { success: false };
    }
  } catch (manualError) {
    logForDebugging(`Manual removal failed: ${manualError}`, {
      level: "error"
    });
    return {
      success: false,
      error: `Manual removal failed: ${manualError}`
    };
  }
}
async function attemptNpmUninstall(packageName) {
  const { code, stderr } = await execFileNoThrowWithCwd("npm", ["uninstall", "-g", packageName], { cwd: process.cwd() });
  if (code === 0) {
    logForDebugging(`Removed global npm installation of ${packageName}`);
    return { success: true };
  } else if (stderr && !stderr.includes("npm ERR! code E404")) {
    if (stderr.includes("npm error code ENOTEMPTY")) {
      logForDebugging(`Failed to uninstall global npm package ${packageName}: ${stderr}`, { level: "error" });
      logForDebugging(`Attempting manual removal due to ENOTEMPTY error`);
      const manualResult = await manualRemoveNpmPackage(packageName);
      if (manualResult.success) {
        return { success: true, warning: manualResult.warning };
      } else if (manualResult.error) {
        return {
          success: false,
          error: `Failed to remove global npm installation of ${packageName}: ${stderr}. Manual removal also failed: ${manualResult.error}`
        };
      }
    }
    logForDebugging(`Failed to uninstall global npm package ${packageName}: ${stderr}`, { level: "error" });
    return {
      success: false,
      error: `Failed to remove global npm installation of ${packageName}: ${stderr}`
    };
  }
  return { success: false };
}
async function cleanupNpmInstallations() {
  const errors = [];
  const warnings = [];
  let removed = 0;
  const codePackageResult = await attemptNpmUninstall("@anthropic-ai/claude-code");
  if (codePackageResult.success) {
    removed++;
    if (codePackageResult.warning) {
      warnings.push(codePackageResult.warning);
    }
  } else if (codePackageResult.error) {
    errors.push(codePackageResult.error);
  }
  if ("") {}
  const localInstallDir = join2(homedir(), ".claude", "local");
  try {
    await rm(localInstallDir, { recursive: true });
    removed++;
    logForDebugging(`Removed local installation at ${localInstallDir}`);
  } catch (error) {
    if (!isENOENT(error)) {
      errors.push(`Failed to remove ${localInstallDir}: ${error}`);
      logForDebugging(`Failed to remove local installation: ${error}`, {
        level: "error"
      });
    }
  }
  return { removed, errors, warnings };
}
var VERSION_RETENTION_COUNT = 2, LOCK_STALE_MS, inFlightInstall = null;
var init_installer = __esm(() => {
  init_analytics();
  init_autoUpdater();
  init_cleanupRegistry();
  init_config();
  init_debug();
  init_doctorDiagnostic();
  init_env();
  init_envDynamic();
  init_envUtils();
  init_errors();
  init_execFileNoThrow();
  init_localInstaller();
  init_lockfile();
  init_log();
  init_semver();
  init_shellConfig();
  init_sleep();
  init_xdg();
  init_download();
  init_pidLock();
  LOCK_STALE_MS = 7 * 24 * 60 * 60 * 1000;
});

// src/utils/nativeInstaller/index.ts
var init_nativeInstaller = __esm(() => {
  init_installer();
});

export { checkInstall, installLatest, lockCurrentVersion, cleanupOldVersions, cleanupShellAliases, cleanupNpmInstallations, init_nativeInstaller };

//# debugId=419CB1DE784DC33564756E2164756E21
//# sourceMappingURL=chunk-cndv13d7.js.map
