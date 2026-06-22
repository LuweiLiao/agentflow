// @bun
import {
  expandPath,
  init_path
} from "./chunk-87f9np2y.js";
import {
  getPlatform,
  init_platform
} from "./chunk-7fbjbgr5.js";
import {
  getFeatureValue_CACHED_MAY_BE_STALE,
  init_growthbook
} from "./chunk-x5wzz44g.js";
import {
  init_analytics,
  logEvent
} from "./chunk-4hpfxga2.js";
import {
  getCwd,
  init_cwd
} from "./chunk-w95hkggk.js";
import {
  init_log,
  logError
} from "./chunk-kc49dhz0.js";
import {
  getFsImplementation,
  init_debug,
  init_errors,
  init_fsOperations,
  isENOENT,
  isFsInaccessible,
  logForDebugging,
  safeResolvePath
} from "./chunk-pyv3zrjt.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/fileRead.ts
function detectEncodingForResolvedPath(resolvedPath) {
  const { buffer, bytesRead } = getFsImplementation().readSync(resolvedPath, {
    length: 4096
  });
  if (bytesRead === 0) {
    return "utf8";
  }
  if (bytesRead >= 2) {
    if (buffer[0] === 255 && buffer[1] === 254)
      return "utf16le";
  }
  if (bytesRead >= 3 && buffer[0] === 239 && buffer[1] === 187 && buffer[2] === 191) {
    return "utf8";
  }
  return "utf8";
}
function detectLineEndingsForString(content) {
  let crlfCount = 0;
  let lfCount = 0;
  for (let i = 0;i < content.length; i++) {
    if (content[i] === `
`) {
      if (i > 0 && content[i - 1] === "\r") {
        crlfCount++;
      } else {
        lfCount++;
      }
    }
  }
  return crlfCount > lfCount ? "CRLF" : "LF";
}
function readFileSyncWithMetadata(filePath) {
  const fs = getFsImplementation();
  const { resolvedPath, isSymlink } = safeResolvePath(fs, filePath);
  if (isSymlink) {
    logForDebugging(`Reading through symlink: ${filePath} -> ${resolvedPath}`);
  }
  const encoding = detectEncodingForResolvedPath(resolvedPath);
  const raw = fs.readFileSync(resolvedPath, { encoding });
  const lineEndings = detectLineEndingsForString(raw.slice(0, 4096));
  return {
    content: raw.replaceAll(`\r
`, `
`),
    encoding,
    lineEndings
  };
}
function readFileSync(filePath) {
  return readFileSyncWithMetadata(filePath).content;
}
var init_fileRead = __esm(() => {
  init_debug();
  init_fsOperations();
});

// src/utils/fileReadCache.ts
class FileReadCache {
  cache = new Map;
  maxCacheSize = 1000;
  readFile(filePath) {
    const fs = getFsImplementation();
    let stats;
    try {
      stats = fs.statSync(filePath);
    } catch (error) {
      this.cache.delete(filePath);
      throw error;
    }
    const cacheKey = filePath;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData && cachedData.mtime === stats.mtimeMs) {
      return {
        content: cachedData.content,
        encoding: cachedData.encoding
      };
    }
    const encoding = detectFileEncoding(filePath);
    const content = fs.readFileSync(filePath, { encoding }).replaceAll(`\r
`, `
`);
    this.cache.set(cacheKey, {
      content,
      encoding,
      mtime: stats.mtimeMs
    });
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    return { content, encoding };
  }
  clear() {
    this.cache.clear();
  }
  invalidate(filePath) {
    this.cache.delete(filePath);
  }
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}
var fileReadCache;
var init_fileReadCache = __esm(() => {
  init_file();
  init_fsOperations();
  fileReadCache = new FileReadCache;
});

// src/utils/file.ts
import { chmodSync, writeFileSync as fsWriteFileSync } from "fs";
import { realpath, stat } from "fs/promises";
import { homedir } from "os";
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  normalize,
  relative,
  resolve,
  sep
} from "path";
async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
function readFileSafe(filepath) {
  try {
    const fs = getFsImplementation();
    return fs.readFileSync(filepath, { encoding: "utf8" });
  } catch (error) {
    logError(error);
    return null;
  }
}
function getFileModificationTime(filePath) {
  const fs = getFsImplementation();
  return Math.floor(fs.statSync(filePath).mtimeMs);
}
async function getFileModificationTimeAsync(filePath) {
  const s = await getFsImplementation().stat(filePath);
  return Math.floor(s.mtimeMs);
}
function writeTextContent(filePath, content, encoding, endings) {
  let toWrite = content;
  if (endings === "CRLF") {
    toWrite = content.replaceAll(`\r
`, `
`).split(`
`).join(`\r
`);
  }
  writeFileSyncAndFlush_DEPRECATED(filePath, toWrite, { encoding });
}
function detectFileEncoding(filePath) {
  try {
    const fs = getFsImplementation();
    const { resolvedPath } = safeResolvePath(fs, filePath);
    return detectEncodingForResolvedPath(resolvedPath);
  } catch (error) {
    if (isFsInaccessible(error)) {
      logForDebugging(`detectFileEncoding failed for expected reason: ${error.code}`, {
        level: "debug"
      });
    } else {
      logError(error);
    }
    return "utf8";
  }
}
function detectLineEndings(filePath, encoding = "utf8") {
  try {
    const fs = getFsImplementation();
    const { resolvedPath } = safeResolvePath(fs, filePath);
    const { buffer, bytesRead } = fs.readSync(resolvedPath, { length: 4096 });
    const content = buffer.toString(encoding, 0, bytesRead);
    return detectLineEndingsForString(content);
  } catch (error) {
    logError(error);
    return "LF";
  }
}
function convertLeadingTabsToSpaces(content) {
  if (!content.includes("\t"))
    return content;
  return content.replace(/^\t+/gm, (_) => "  ".repeat(_.length));
}
function getAbsoluteAndRelativePaths(path) {
  const absolutePath = path ? expandPath(path) : undefined;
  const relativePath = absolutePath ? relative(getCwd(), absolutePath) : undefined;
  return { absolutePath, relativePath };
}
function getDisplayPath(filePath) {
  const { relativePath } = getAbsoluteAndRelativePaths(filePath);
  if (relativePath && !relativePath.startsWith("..")) {
    return relativePath;
  }
  const homeDir = homedir();
  if (filePath.startsWith(homeDir + sep)) {
    return "~" + filePath.slice(homeDir.length);
  }
  return filePath;
}
function findSimilarFile(filePath) {
  const fs = getFsImplementation();
  try {
    const dir = dirname(filePath);
    const fileBaseName = basename(filePath, extname(filePath));
    const files = fs.readdirSync(dir);
    const similarFiles = files.filter((file) => basename(file.name, extname(file.name)) === fileBaseName && join(dir, file.name) !== filePath);
    const firstMatch = similarFiles[0];
    if (firstMatch) {
      return firstMatch.name;
    }
    return;
  } catch (error) {
    if (!isENOENT(error)) {
      logError(error);
    }
    return;
  }
}
async function suggestPathUnderCwd(requestedPath) {
  const cwd = getCwd();
  const cwdParent = dirname(cwd);
  let resolvedPath = requestedPath;
  try {
    const resolvedDir = await realpath(dirname(requestedPath));
    resolvedPath = join(resolvedDir, basename(requestedPath));
  } catch {}
  const cwdParentPrefix = cwdParent === sep ? sep : cwdParent + sep;
  if (!resolvedPath.startsWith(cwdParentPrefix) || resolvedPath.startsWith(cwd + sep) || resolvedPath === cwd) {
    return;
  }
  const relFromParent = relative(cwdParent, resolvedPath);
  const correctedPath = join(cwd, relFromParent);
  try {
    await stat(correctedPath);
    return correctedPath;
  } catch {
    return;
  }
}
function isCompactLinePrefixEnabled() {
  return !getFeatureValue_CACHED_MAY_BE_STALE("tengu_compact_line_prefix_killswitch", false);
}
function addLineNumbers({
  content,
  startLine
}) {
  if (!content) {
    return "";
  }
  const lines = content.split(/\r?\n/);
  if (isCompactLinePrefixEnabled()) {
    return lines.map((line, index) => `${index + startLine}	${line}`).join(`
`);
  }
  return lines.map((line, index) => {
    const numStr = String(index + startLine);
    if (numStr.length >= 6) {
      return `${numStr}\u2192${line}`;
    }
    return `${numStr.padStart(6, " ")}\u2192${line}`;
  }).join(`
`);
}
function stripLineNumberPrefix(line) {
  const match = line.match(/^\s*\d+[\u2192\t](.*)$/);
  return match?.[1] ?? line;
}
function isDirEmpty(dirPath) {
  try {
    return getFsImplementation().isDirEmptySync(dirPath);
  } catch (e) {
    return isENOENT(e);
  }
}
function readFileSyncCached(filePath) {
  const { content } = fileReadCache.readFile(filePath);
  return content;
}
function writeFileSyncAndFlush_DEPRECATED(filePath, content, options = { encoding: "utf-8" }) {
  const fs = getFsImplementation();
  let targetPath = filePath;
  try {
    const linkTarget = fs.readlinkSync(filePath);
    targetPath = isAbsolute(linkTarget) ? linkTarget : resolve(dirname(filePath), linkTarget);
    logForDebugging(`Writing through symlink: ${filePath} -> ${targetPath}`);
  } catch {}
  const tempPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  let targetMode;
  let targetExists = false;
  try {
    targetMode = fs.statSync(targetPath).mode;
    targetExists = true;
    logForDebugging(`Preserving file permissions: ${targetMode.toString(8)}`);
  } catch (e) {
    if (!isENOENT(e))
      throw e;
    if (options.mode !== undefined) {
      targetMode = options.mode;
      logForDebugging(`Setting permissions for new file: ${targetMode.toString(8)}`);
    }
  }
  try {
    logForDebugging(`Writing to temp file: ${tempPath}`);
    const writeOptions = {
      encoding: options.encoding,
      flush: true
    };
    if (!targetExists && options.mode !== undefined) {
      writeOptions.mode = options.mode;
    }
    fsWriteFileSync(tempPath, content, writeOptions);
    logForDebugging(`Temp file written successfully, size: ${content.length} bytes`);
    if (targetExists && targetMode !== undefined) {
      chmodSync(tempPath, targetMode);
      logForDebugging(`Applied original permissions to temp file`);
    }
    logForDebugging(`Renaming ${tempPath} to ${targetPath}`);
    fs.renameSync(tempPath, targetPath);
    logForDebugging(`File ${targetPath} written atomically`);
  } catch (atomicError) {
    logForDebugging(`Failed to write file atomically: ${atomicError}`, {
      level: "error"
    });
    logEvent("tengu_atomic_write_error", {});
    try {
      logForDebugging(`Cleaning up temp file: ${tempPath}`);
      fs.unlinkSync(tempPath);
    } catch (cleanupError) {
      logForDebugging(`Failed to clean up temp file: ${cleanupError}`);
    }
    logForDebugging(`Falling back to non-atomic write for ${targetPath}`);
    try {
      const fallbackOptions = {
        encoding: options.encoding,
        flush: true
      };
      if (!targetExists && options.mode !== undefined) {
        fallbackOptions.mode = options.mode;
      }
      fsWriteFileSync(targetPath, content, fallbackOptions);
      logForDebugging(`File ${targetPath} written successfully with non-atomic fallback`);
    } catch (fallbackError) {
      logForDebugging(`Non-atomic write also failed: ${fallbackError}`);
      throw fallbackError;
    }
  }
}
function getDesktopPath() {
  const platform = getPlatform();
  const homeDir = homedir();
  if (platform === "macos") {
    return join(homeDir, "Desktop");
  }
  if (platform === "windows") {
    const windowsHome = process.env.USERPROFILE ? process.env.USERPROFILE.replace(/\\/g, "/") : null;
    if (windowsHome) {
      const wslPath = windowsHome.replace(/^[A-Z]:/, "");
      const desktopPath2 = `/mnt/c${wslPath}/Desktop`;
      if (getFsImplementation().existsSync(desktopPath2)) {
        return desktopPath2;
      }
    }
    try {
      const usersDir = "/mnt/c/Users";
      const userDirs = getFsImplementation().readdirSync(usersDir);
      for (const user of userDirs) {
        if (user.name === "Public" || user.name === "Default" || user.name === "Default User" || user.name === "All Users") {
          continue;
        }
        const potentialDesktopPath = join(usersDir, user.name, "Desktop");
        if (getFsImplementation().existsSync(potentialDesktopPath)) {
          return potentialDesktopPath;
        }
      }
    } catch (error) {
      logError(error);
    }
  }
  const desktopPath = join(homeDir, "Desktop");
  if (getFsImplementation().existsSync(desktopPath)) {
    return desktopPath;
  }
  return homeDir;
}
function isFileWithinReadSizeLimit(filePath, maxSizeBytes = MAX_OUTPUT_SIZE) {
  try {
    const stats = getFsImplementation().statSync(filePath);
    return stats.size <= maxSizeBytes;
  } catch {
    return false;
  }
}
function normalizePathForComparison(filePath) {
  let normalized = normalize(filePath);
  normalized = normalized.replace(/\\/g, "/");
  if (getPlatform() === "windows") {
    normalized = normalized.toLowerCase();
  }
  return normalized;
}
function pathsEqual(path1, path2) {
  return normalizePathForComparison(path1) === normalizePathForComparison(path2);
}
var MAX_OUTPUT_SIZE, FILE_NOT_FOUND_CWD_NOTE = "Note: your current working directory is";
var init_file = __esm(() => {
  init_analytics();
  init_growthbook();
  init_cwd();
  init_debug();
  init_errors();
  init_fileRead();
  init_fileReadCache();
  init_fsOperations();
  init_log();
  init_path();
  init_platform();
  MAX_OUTPUT_SIZE = 0.25 * 1024 * 1024;
});

export { detectEncodingForResolvedPath, readFileSyncWithMetadata, readFileSync, init_fileRead, pathExists, MAX_OUTPUT_SIZE, readFileSafe, getFileModificationTime, getFileModificationTimeAsync, writeTextContent, detectFileEncoding, detectLineEndings, convertLeadingTabsToSpaces, getDisplayPath, findSimilarFile, FILE_NOT_FOUND_CWD_NOTE, suggestPathUnderCwd, isCompactLinePrefixEnabled, addLineNumbers, stripLineNumberPrefix, isDirEmpty, readFileSyncCached, writeFileSyncAndFlush_DEPRECATED, getDesktopPath, isFileWithinReadSizeLimit, normalizePathForComparison, pathsEqual, init_file };

//# debugId=DE71C999FA1F135A64756E2164756E21
//# sourceMappingURL=chunk-jwyj6t5m.js.map
