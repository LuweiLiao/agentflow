// @bun
import {
  getGlobalConfig,
  init_config1 as init_config,
  init_file,
  pathExists,
  saveGlobalConfig
} from "./chunk-w55zdf7f.js";
import {
  detectCurrentRepository,
  init_detectRepository,
  parseGitHubRepository
} from "./chunk-3975w415.js";
import {
  findGitRoot,
  getRemoteUrlForDir,
  init_git,
  init_gitFilesystem
} from "./chunk-23170t3x.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-1tytvdt1.js";
import {
  getOriginalCwd,
  init_state
} from "./chunk-xqs9r7pg.js";

// src/utils/githubRepoPathMapping.ts
init_state();
init_config();
init_debug();
init_detectRepository();
init_file();
init_gitFilesystem();
init_git();
import { realpath } from "fs/promises";
async function updateGithubRepoPathMapping() {
  try {
    const repo = await detectCurrentRepository();
    if (!repo) {
      logForDebugging("Not in a GitHub repository, skipping path mapping update");
      return;
    }
    const cwd = getOriginalCwd();
    const gitRoot = findGitRoot(cwd);
    const basePath = gitRoot ?? cwd;
    let currentPath;
    try {
      currentPath = (await realpath(basePath)).normalize("NFC");
    } catch {
      currentPath = basePath;
    }
    const repoKey = repo.toLowerCase();
    const config = getGlobalConfig();
    const existingPaths = config.githubRepoPaths?.[repoKey] ?? [];
    if (existingPaths[0] === currentPath) {
      logForDebugging(`Path ${currentPath} already tracked for repo ${repoKey}`);
      return;
    }
    const withoutCurrent = existingPaths.filter((p) => p !== currentPath);
    const updatedPaths = [currentPath, ...withoutCurrent];
    saveGlobalConfig((current) => ({
      ...current,
      githubRepoPaths: {
        ...current.githubRepoPaths,
        [repoKey]: updatedPaths
      }
    }));
    logForDebugging(`Added ${currentPath} to tracked paths for repo ${repoKey}`);
  } catch (error) {
    logForDebugging(`Error updating repo path mapping: ${error}`);
  }
}
function getKnownPathsForRepo(repo) {
  const config = getGlobalConfig();
  const repoKey = repo.toLowerCase();
  return config.githubRepoPaths?.[repoKey] ?? [];
}
async function filterExistingPaths(paths) {
  const results = await Promise.all(paths.map(pathExists));
  return paths.filter((_, i) => results[i]);
}
async function validateRepoAtPath(path, expectedRepo) {
  try {
    const remoteUrl = await getRemoteUrlForDir(path);
    if (!remoteUrl) {
      return false;
    }
    const actualRepo = parseGitHubRepository(remoteUrl);
    if (!actualRepo) {
      return false;
    }
    return actualRepo.toLowerCase() === expectedRepo.toLowerCase();
  } catch {
    return false;
  }
}
function removePathFromRepo(repo, pathToRemove) {
  const config = getGlobalConfig();
  const repoKey = repo.toLowerCase();
  const existingPaths = config.githubRepoPaths?.[repoKey] ?? [];
  const updatedPaths = existingPaths.filter((path) => path !== pathToRemove);
  if (updatedPaths.length === existingPaths.length) {
    return;
  }
  const updatedMapping = { ...config.githubRepoPaths };
  if (updatedPaths.length === 0) {
    delete updatedMapping[repoKey];
  } else {
    updatedMapping[repoKey] = updatedPaths;
  }
  saveGlobalConfig((current) => ({
    ...current,
    githubRepoPaths: updatedMapping
  }));
  logForDebugging(`Removed ${pathToRemove} from tracked paths for repo ${repoKey}`);
}

export { updateGithubRepoPathMapping, getKnownPathsForRepo, filterExistingPaths, validateRepoAtPath, removePathFromRepo };

//# debugId=5199FA4D82CDB8D864756E2164756E21
//# sourceMappingURL=chunk-66rejxh8.js.map
