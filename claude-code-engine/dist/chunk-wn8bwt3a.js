// @bun
import {
  __require
} from "./chunk-hhsxm2yr.js";

// src/cli/rollback.ts
async function rollback(target, options) {
  if (options?.list) {
    console.log("Recent versions:");
    console.log("  (version listing requires access to the release registry)");
    console.log("  Use `claude update --list` for available versions.");
    return;
  }
  if (options?.safe) {
    console.log("Safe rollback: would install the server-pinned safe version.");
    if (options.dryRun) {
      console.log("  (dry run \u2014 no changes made)");
      return;
    }
    console.log("  Safe version pinning requires access to the release API.");
    console.log("  Contact oncall for the current safe version.");
    return;
  }
  if (!target) {
    console.error(`Usage: claude rollback [target]

` + `Options:
` + `  -l, --list     List recent published versions
` + `  --dry-run      Show what would be installed
` + `  --safe         Roll back to server-pinned safe version

` + `Examples:
` + `  agentflow-code rollback 5.0.0
` + `  claude rollback --list
` + "  claude rollback --safe");
    process.exitCode = 1;
    return;
  }
  console.log(`Rolling back to version ${target}...`);
  if (options?.dryRun) {
    console.log(`  (dry run \u2014 would install ${target})`);
    return;
  }
  const { spawnSync } = await import("child_process");
  const result = spawnSync("npm", ["install", "-g", `@anthropic-ai/claude-code@${target}`], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`Rollback failed with exit code ${result.status}`);
    process.exitCode = result.status ?? 1;
  } else {
    console.log(`Rolled back to ${target} successfully.`);
  }
}
export {
  rollback
};

//# debugId=5D73A9D877AE9FE964756E2164756E21
//# sourceMappingURL=chunk-wn8bwt3a.js.map
