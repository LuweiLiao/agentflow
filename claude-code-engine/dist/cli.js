#!/usr/bin/env bun
// @bun
import {
  init_envUtils,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __require
} from "./chunk-hhsxm2yr.js";

// src/utils/performanceShim.ts
var original = globalThis.performance;
var marks = new Map;
var measures = new Map;
function now() {
  return original.now();
}
function mark(name) {
  marks.set(name, now());
  return {
    name,
    entryType: "mark",
    startTime: marks.get(name),
    duration: 0
  };
}
function measure(name, startMarkOrOptions, endMark) {
  let startTime;
  let duration;
  if (typeof startMarkOrOptions === "string") {
    const start = marks.get(startMarkOrOptions);
    const end = endMark ? marks.get(endMark) : now();
    startTime = start ?? now();
    duration = (end ?? now()) - startTime;
  } else if (startMarkOrOptions && typeof startMarkOrOptions === "object") {
    startTime = startMarkOrOptions.start ?? 0;
    duration = (startMarkOrOptions.end ?? now()) - startTime;
  } else {
    startTime = 0;
    duration = now();
  }
  measures.set(name, { name, startTime, duration });
}
function getEntriesByType(type) {
  if (type === "mark") {
    return [...marks.entries()].map(([name, startTime]) => ({
      name,
      entryType: "mark",
      startTime,
      duration: 0
    }));
  }
  if (type === "measure") {
    return [...measures.values()].map((m) => ({
      name: m.name,
      entryType: "measure",
      startTime: m.startTime,
      duration: m.duration
    }));
  }
  return [];
}
function getEntriesByName(name, type) {
  const entries = getEntriesByType(type ?? "mark").concat(type === undefined ? getEntriesByType("measure") : []);
  return entries.filter((e) => e.name === name);
}
function clearMarks(name) {
  if (name !== undefined) {
    marks.delete(name);
  } else {
    marks.clear();
  }
}
function clearMeasures(name) {
  if (name !== undefined) {
    measures.delete(name);
  } else {
    measures.clear();
  }
}
var shim = {
  now,
  mark,
  measure,
  getEntriesByType,
  getEntriesByName,
  clearMarks,
  clearMeasures,
  clearResourceTimings: () => {},
  setResourceTimingBufferSize: () => {},
  markResourceTiming: () => {},
  get timeOrigin() {
    return original.timeOrigin;
  },
  get onresourcetimingbufferfull() {
    return original.onresourcetimingbufferfull;
  },
  set onresourcetimingbufferfull(_v) {},
  toJSON() {
    return original.toJSON();
  }
};
function installPerformanceShim() {
  if (globalThis.__performanceShimInstalled)
    return;
  globalThis.__performanceShimInstalled = true;
  globalThis.performance = shim;
}
installPerformanceShim();

// src/entrypoints/cli.tsx
init_envUtils();
if (typeof globalThis.MACRO === "undefined") {
  globalThis.MACRO = {
    VERSION: process.env.CLAUDE_CODE_VERSION || "2.1.888",
    BUILD_TIME: new Date().toISOString(),
    FEEDBACK_CHANNEL: "",
    ISSUES_EXPLAINER: "",
    NATIVE_PACKAGE_URL: "",
    PACKAGE_URL: "",
    VERSION_CHANGELOG: ""
  };
}
if (isEnvTruthy(process.env.CLAUDE_CODE_FORCE_INTERACTIVE)) {
  for (const stream of [process.stdin, process.stdout, process.stderr]) {
    if (!stream.isTTY) {
      try {
        Object.defineProperty(stream, "isTTY", {
          value: true,
          configurable: true
        });
      } catch {}
    }
  }
}
process.env.COREPACK_ENABLE_AUTO_PIN = "0";
if (process.env.CLAUDE_CODE_REMOTE === "true") {
  const existing = process.env.NODE_OPTIONS || "";
  process.env.NODE_OPTIONS = existing ? `${existing} --max-old-space-size=8192` : "--max-old-space-size=8192";
}
if (false) {}
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && (args[0] === "--version" || args[0] === "-v" || args[0] === "-V")) {
    console.log(`${"2.7.0"} (Claude Code)`);
    return;
  }
  const { profileCheckpoint } = await import("./chunk-dx6jwg4s.js");
  profileCheckpoint("cli_entry");
  if (false) {}
  if (process.argv[2] === "--claude-in-chrome-mcp") {
    profileCheckpoint("cli_claude_in_chrome_mcp_path");
    const { runClaudeInChromeMcpServer } = await import("./chunk-7bsp4aag.js");
    await runClaudeInChromeMcpServer();
    return;
  } else if (process.argv[2] === "--chrome-native-host") {
    profileCheckpoint("cli_chrome_native_host_path");
    const { runChromeNativeHost } = await import("./chunk-syf0yv1n.js");
    await runChromeNativeHost();
    return;
  } else if (process.argv[2] === "--computer-use-mcp") {
    profileCheckpoint("cli_computer_use_mcp_path");
    const { runComputerUseMcpServer } = await import("./chunk-vr9bgvdm.js");
    await runComputerUseMcpServer();
    return;
  }
  if (process.argv[2] === "--acp") {
    profileCheckpoint("cli_acp_path");
    const { runAcpAgent } = await import("./chunk-10y7qas8.js");
    await runAcpAgent();
    return;
  }
  if (args[0] === "weixin") {
    profileCheckpoint("cli_weixin_path");
    const { handleWeixinCli } = await import("./chunk-7rz2wah9.js");
    const { enableConfigs } = await import("./chunk-j3819msd.js");
    const { initializeAnalyticsSink } = await import("./chunk-sh4g80km.js");
    const { shutdownDatadog } = await import("./chunk-ppw569at.js");
    const { shutdown1PEventLogging } = await import("./chunk-z1zp3ca5.js");
    const { logForDebugging } = await import("./chunk-4pc4xsr3.js");
    const { ChannelPermissionRequestNotificationSchema } = await import("./chunk-mw00ahtt.js");
    await handleWeixinCli(args.slice(1), {
      enableConfigs,
      initializeAnalyticsSink,
      shutdownDatadog,
      shutdown1PEventLogging,
      logForDebugging,
      registerPermissionHandler(server, handler) {
        server.setNotificationHandler(ChannelPermissionRequestNotificationSchema(), async (notification) => handler(notification.params));
      }
    }, "2.7.0");
    return;
  }
  if (args[0] === "--daemon-worker" || args[0]?.startsWith("--daemon-worker=")) {
    if (false) {}
    const kind = args[0] === "--daemon-worker" ? args[1] : args[0].split("=")[1];
    const { runDaemonWorker } = await import("./chunk-wg4fxf7p.js");
    await runDaemonWorker(kind);
    return;
  }
  if (args[0] === "remote-control" || args[0] === "rc" || args[0] === "remote" || args[0] === "sync" || args[0] === "bridge") {
    profileCheckpoint("cli_bridge_path");
    const { enableConfigs } = await import("./chunk-j3819msd.js");
    enableConfigs();
    const { getBridgeDisabledReason, checkBridgeMinVersion } = await import("./chunk-88fffmc4.js");
    const { BRIDGE_LOGIN_ERROR } = await import("./chunk-13qesvnw.js");
    const { bridgeMain } = await import("./chunk-q9wxhvn1.js");
    const { exitWithError } = await import("./chunk-3vfxjn7g.js");
    const { getClaudeAIOAuthTokens } = await import("./chunk-9vycs6kn.js");
    const { getBridgeAccessToken } = await import("./chunk-5xq5xtqh.js");
    if (!getClaudeAIOAuthTokens()?.accessToken && !getBridgeAccessToken()) {
      exitWithError(BRIDGE_LOGIN_ERROR);
    }
    const disabledReason = await getBridgeDisabledReason();
    if (disabledReason) {
      exitWithError(`Error: ${disabledReason}`);
    }
    const versionError = checkBridgeMinVersion();
    if (versionError) {
      exitWithError(versionError);
    }
    const { waitForPolicyLimitsToLoad, isPolicyAllowed } = await import("./chunk-bskjrxxy.js");
    await waitForPolicyLimitsToLoad();
    if (!isPolicyAllowed("allow_remote_control")) {
      exitWithError("Error: Remote Control is disabled by your organization's policy.");
    }
    await bridgeMain(args.slice(1));
    return;
  }
  if (args[0] === "daemon") {
    profileCheckpoint("cli_daemon_path");
    const { enableConfigs } = await import("./chunk-j3819msd.js");
    enableConfigs();
    const { setShellIfWindows } = await import("./chunk-mhxen7e7.js");
    setShellIfWindows();
    const { initSinks } = await import("./chunk-grj29450.js");
    initSinks();
    const { daemonMain } = await import("./chunk-a6j7vg59.js");
    await daemonMain(args.slice(1));
    return;
  }
  if (args[0] === "autonomy") {
    profileCheckpoint("cli_autonomy_path");
    const { getAutonomyCommandText } = await import("./chunk-jvm8084e.js");
    const text = await getAutonomyCommandText(args.slice(1).join(" "));
    await new Promise((resolve, reject) => {
      process.stdout.write(`${text}
`, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    process.exit(0);
  }
  if (args.includes("--bg") || args.includes("--background")) {
    profileCheckpoint("cli_daemon_path");
    const { enableConfigs } = await import("./chunk-j3819msd.js");
    enableConfigs();
    const { setShellIfWindows } = await import("./chunk-mhxen7e7.js");
    setShellIfWindows();
    const bg = await import("./chunk-p3m1y6rx.js");
    await bg.handleBgStart(args.filter((a) => a !== "--bg" && a !== "--background"));
    return;
  }
  if (args[0] === "ps" || args[0] === "logs" || args[0] === "attach" || args[0] === "kill") {
    const mapped = args[0] === "ps" ? "status" : args[0];
    console.error(`[deprecated] Use: claude daemon ${mapped}${args[1] ? " " + args[1] : ""}`);
    profileCheckpoint("cli_daemon_path");
    const { enableConfigs } = await import("./chunk-j3819msd.js");
    enableConfigs();
    const { setShellIfWindows } = await import("./chunk-mhxen7e7.js");
    setShellIfWindows();
    const { initSinks } = await import("./chunk-grj29450.js");
    initSinks();
    const { daemonMain } = await import("./chunk-a6j7vg59.js");
    await daemonMain([args[0] === "ps" ? "status" : args[0], ...args.slice(1)]);
    return;
  }
  if (args[0] === "job") {
    profileCheckpoint("cli_templates_path");
    const { templatesMain } = await import("./chunk-w0tmm8s0.js");
    await templatesMain(args.slice(1));
    process.exit(0);
  }
  if (args[0] === "new" || args[0] === "list" || args[0] === "reply") {
    console.error(`[deprecated] Use: claude job ${args[0]} ${args.slice(1).join(" ")}`.trim());
    profileCheckpoint("cli_templates_path");
    const { templatesMain } = await import("./chunk-w0tmm8s0.js");
    await templatesMain(args);
    process.exit(0);
  }
  if (false) {}
  if (false) {}
  const hasTmuxFlag = args.includes("--tmux") || args.includes("--tmux=classic");
  if (hasTmuxFlag && (args.includes("-w") || args.includes("--worktree") || args.some((a) => a.startsWith("--worktree=")))) {
    profileCheckpoint("cli_tmux_worktree_fast_path");
    const { enableConfigs } = await import("./chunk-j3819msd.js");
    enableConfigs();
    const { isWorktreeModeEnabled } = await import("./chunk-h12a4f4x.js");
    if (isWorktreeModeEnabled()) {
      const { execIntoTmuxWorktree } = await import("./chunk-1wc7rtjx.js");
      const result = await execIntoTmuxWorktree(args);
      if (result.handled) {
        return;
      }
      if (result.error) {
        const { exitWithError } = await import("./chunk-3vfxjn7g.js");
        exitWithError(result.error);
      }
    }
  }
  if (args.length === 1 && (args[0] === "--update" || args[0] === "--upgrade")) {
    process.argv = [process.argv[0], process.argv[1], "update"];
  }
  if (args.includes("--bare")) {
    process.env.CLAUDE_CODE_SIMPLE = "1";
  }
  const { startCapturingEarlyInput } = await import("./chunk-4tjdwtyy.js");
  startCapturingEarlyInput();
  profileCheckpoint("cli_before_main_import");
  const { main: cliMain } = await import("./chunk-e9az5f8k.js");
  profileCheckpoint("cli_after_main_import");
  await cliMain();
  profileCheckpoint("cli_after_main_complete");
}
await main();

//# debugId=7642A208AD686B3764756E2164756E21
//# sourceMappingURL=cli.js.map
