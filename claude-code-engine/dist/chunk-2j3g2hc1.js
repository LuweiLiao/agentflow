// @bun
import {
  StdioServerTransport,
  init_stdio
} from "./chunk-k3q6hzy6.js";
import {
  init_sink,
  initializeAnalyticsSink
} from "./chunk-pks3y4sb.js";
import {
  getComputerUseHostAdapter,
  init_hostAdapter
} from "./chunk-t867bdcq.js";
import {
  getChicagoCoordinateMode,
  init_gates
} from "./chunk-dypm8ssd.js";
import {
  init_datadog,
  shutdownDatadog
} from "./chunk-459fm40c.js";
import {
  init_firstPartyEventLogger,
  shutdown1PEventLogging
} from "./chunk-1r8z8ez7.js";
import"./chunk-w5hnghah.js";
import"./chunk-ywnfc8g5.js";
import {
  buildComputerUseTools,
  createComputerUseMcpServer,
  init_src
} from "./chunk-s76nvx50.js";
import"./chunk-y5f62n0j.js";
import"./chunk-k92qk5av.js";
import"./chunk-vwenx8ke.js";
import {
  ListToolsRequestSchema,
  init_types
} from "./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import {
  enableConfigs,
  init_config
} from "./chunk-jyqypr4z.js";
import"./chunk-m18nccbn.js";
import"./chunk-e2jvken3.js";
import"./chunk-5zhv4jyp.js";
import"./chunk-jwyj6t5m.js";
import"./chunk-87f9np2y.js";
import"./chunk-zq3spn7d.js";
import"./chunk-jmv7k0jn.js";
import"./chunk-7fbjbgr5.js";
import"./chunk-x5wzz44g.js";
import"./chunk-r87btn9p.js";
import"./chunk-v4ypszbb.js";
import"./chunk-dw66fdss.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-fejeqe61.js";
import"./chunk-4hpfxga2.js";
import"./chunk-bt5n9f4r.js";
import"./chunk-qkkkfh9a.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-w7s0zvjq.js";
import"./chunk-w95hkggk.js";
import"./chunk-kc49dhz0.js";
import"./chunk-k51zdj4e.js";
import"./chunk-mtgfbnth.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-pyv3zrjt.js";
import"./chunk-kb3758f7.js";
import"./chunk-232p95fy.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/computerUse/appNames.ts
function isUserFacingPath(path, homeDir) {
  if (PATH_ALLOWLIST.some((root) => path.startsWith(root)))
    return true;
  if (homeDir) {
    const userApps = homeDir.endsWith("/") ? `${homeDir}Applications/` : `${homeDir}/Applications/`;
    if (path.startsWith(userApps))
      return true;
  }
  return false;
}
function isNoisyName(name) {
  return NAME_PATTERN_BLOCKLIST.some((re) => re.test(name));
}
function sanitizeCore(raw, applyCharFilter) {
  const seen = new Set;
  return raw.map((name) => name.trim()).filter((trimmed) => {
    if (!trimmed)
      return false;
    if (trimmed.length > APP_NAME_MAX_LEN)
      return false;
    if (applyCharFilter && !APP_NAME_ALLOWED.test(trimmed))
      return false;
    if (seen.has(trimmed))
      return false;
    seen.add(trimmed);
    return true;
  }).sort((a, b) => a.localeCompare(b));
}
function sanitizeAppNames(raw) {
  const filtered = sanitizeCore(raw, true);
  if (filtered.length <= APP_NAME_MAX_COUNT)
    return filtered;
  return [
    ...filtered.slice(0, APP_NAME_MAX_COUNT),
    `\u2026 and ${filtered.length - APP_NAME_MAX_COUNT} more`
  ];
}
function sanitizeTrustedNames(raw) {
  return sanitizeCore(raw, false);
}
function filterAppsForDescription(installed, homeDir) {
  const { alwaysKept, rest } = installed.reduce((acc, app) => {
    if (ALWAYS_KEEP_BUNDLE_IDS.has(app.bundleId)) {
      acc.alwaysKept.push(app.displayName);
    } else if (isUserFacingPath(app.path, homeDir) && !isNoisyName(app.displayName)) {
      acc.rest.push(app.displayName);
    }
    return acc;
  }, { alwaysKept: [], rest: [] });
  const sanitizedAlways = sanitizeTrustedNames(alwaysKept);
  const alwaysSet = new Set(sanitizedAlways);
  return [
    ...sanitizedAlways,
    ...sanitizeAppNames(rest).filter((n) => !alwaysSet.has(n))
  ];
}
var PATH_ALLOWLIST, NAME_PATTERN_BLOCKLIST, ALWAYS_KEEP_BUNDLE_IDS, APP_NAME_ALLOWED, APP_NAME_MAX_LEN = 40, APP_NAME_MAX_COUNT = 50;
var init_appNames = __esm(() => {
  PATH_ALLOWLIST = [
    "/Applications/",
    "/System/Applications/"
  ];
  NAME_PATTERN_BLOCKLIST = [
    /Helper(?:$|\s\()/,
    /Agent(?:$|\s\()/,
    /Service(?:$|\s\()/,
    /Uninstaller(?:$|\s\()/,
    /Updater(?:$|\s\()/,
    /^\./
  ];
  ALWAYS_KEEP_BUNDLE_IDS = new Set([
    "com.apple.Safari",
    "com.google.Chrome",
    "com.microsoft.edgemac",
    "org.mozilla.firefox",
    "company.thebrowser.Browser",
    "com.tinyspeck.slackmacgap",
    "us.zoom.xos",
    "com.microsoft.teams2",
    "com.microsoft.teams",
    "com.apple.MobileSMS",
    "com.apple.mail",
    "com.microsoft.Word",
    "com.microsoft.Excel",
    "com.microsoft.Powerpoint",
    "com.microsoft.Outlook",
    "com.apple.iWork.Pages",
    "com.apple.iWork.Numbers",
    "com.apple.iWork.Keynote",
    "com.google.GoogleDocs",
    "notion.id",
    "com.apple.Notes",
    "md.obsidian",
    "com.linear",
    "com.figma.Desktop",
    "com.microsoft.VSCode",
    "com.apple.Terminal",
    "com.googlecode.iterm2",
    "com.github.GitHubDesktop",
    "com.apple.finder",
    "com.apple.iCal",
    "com.apple.systempreferences"
  ]);
  APP_NAME_ALLOWED = /^[\p{L}\p{M}\p{N}_ .&'()+-]+$/u;
});

// src/utils/computerUse/mcpServer.ts
import { homedir } from "os";
async function tryGetInstalledAppNames() {
  const adapter = getComputerUseHostAdapter();
  const enumP = adapter.executor.listInstalledApps();
  let timer;
  const timeoutP = new Promise((resolve) => {
    timer = setTimeout(resolve, APP_ENUM_TIMEOUT_MS, undefined);
  });
  const installed = await Promise.race([enumP, timeoutP]).catch(() => {
    return;
  }).finally(() => clearTimeout(timer));
  if (!installed) {
    enumP.catch(() => {});
    logForDebugging(`[Computer Use MCP] app enumeration exceeded ${APP_ENUM_TIMEOUT_MS}ms or failed; tool description omits list`);
    return;
  }
  return filterAppsForDescription(installed, homedir());
}
async function createComputerUseMcpServerForCli() {
  const adapter = getComputerUseHostAdapter();
  const coordinateMode = getChicagoCoordinateMode();
  const server = createComputerUseMcpServer(adapter, coordinateMode);
  const installedAppNames = await tryGetInstalledAppNames();
  const tools = buildComputerUseTools(adapter.executor.capabilities, coordinateMode, installedAppNames);
  server.setRequestHandler(ListToolsRequestSchema, async () => adapter.isDisabled() ? { tools: [] } : { tools });
  return server;
}
async function runComputerUseMcpServer() {
  enableConfigs();
  initializeAnalyticsSink();
  const server = await createComputerUseMcpServerForCli();
  const transport = new StdioServerTransport;
  let exiting = false;
  const shutdownAndExit = async () => {
    if (exiting)
      return;
    exiting = true;
    await Promise.all([shutdown1PEventLogging(), shutdownDatadog()]);
    process.exit(0);
  };
  process.stdin.on("end", () => void shutdownAndExit());
  process.stdin.on("error", () => void shutdownAndExit());
  logForDebugging("[Computer Use MCP] Starting MCP server");
  await server.connect(transport);
  logForDebugging("[Computer Use MCP] MCP server started");
}
var APP_ENUM_TIMEOUT_MS = 1000;
var init_mcpServer = __esm(() => {
  init_src();
  init_sink();
  init_stdio();
  init_types();
  init_datadog();
  init_firstPartyEventLogger();
  init_config();
  init_debug();
  init_appNames();
  init_gates();
  init_hostAdapter();
});
init_mcpServer();

export {
  runComputerUseMcpServer,
  createComputerUseMcpServerForCli
};

//# debugId=65C061D74DBFC9A564756E2164756E21
//# sourceMappingURL=chunk-2j3g2hc1.js.map
