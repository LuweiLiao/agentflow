// @bun
import {
  McpServerConfigSchema,
  init_types
} from "./chunk-d1ka4b7m.js";
import {
  init_mcpStringUtils,
  mcpInfoFromString
} from "./chunk-tavc33hf.js";
import {
  PAUSE_ICON,
  init_figures
} from "./chunk-80p148mw.js";
import {
  count,
  init_array,
  uniq
} from "./chunk-49v9e09z.js";
import {
  init_lazySchema,
  lazySchema
} from "./chunk-bgan4cpf.js";
import {
  getManagedFilePath,
  getManagedSettingsDropInDir,
  init_managedPath
} from "./chunk-e2jvken3.js";
import {
  init_json,
  safeParseJSON
} from "./chunk-5zhv4jyp.js";
import {
  init_file,
  init_fileRead,
  readFileSync,
  writeFileSyncAndFlush_DEPRECATED
} from "./chunk-jwyj6t5m.js";
import {
  getPlatform,
  init_platform
} from "./chunk-7fbjbgr5.js";
import {
  init_v4,
  v4_default
} from "./chunk-6mdh70q0.js";
import {
  exports_external,
  toJSONSchema
} from "./chunk-ch92ycde.js";
import {
  init_startupProfiler,
  profileCheckpoint
} from "./chunk-bj6zyntv.js";
import {
  dirIsInGitRepo,
  init_diagLogs,
  init_git,
  logForDiagnosticsNoPII
} from "./chunk-bt5n9f4r.js";
import {
  execFileNoThrowWithCwd,
  init_execFileNoThrow
} from "./chunk-w7s0zvjq.js";
import {
  getCwd,
  init_cwd
} from "./chunk-w95hkggk.js";
import {
  init_log,
  logError
} from "./chunk-kc49dhz0.js";
import {
  _baseAssignValue_default,
  _cloneBuffer_default,
  _cloneTypedArray_default,
  _copyArray_default,
  _copyObject_default,
  _defineProperty_default,
  _getPrototype_default,
  _initCloneObject_default,
  clone,
  getErrnoCode,
  getFsImplementation,
  init__baseAssignValue,
  init__cloneBuffer,
  init__cloneTypedArray,
  init__copyArray,
  init__copyObject,
  init__defineProperty,
  init__getPrototype,
  init__initCloneObject,
  init_debug,
  init_errors,
  init_fsOperations,
  init_keysIn,
  init_slowOperations,
  isENOENT,
  jsonParse,
  jsonStringify,
  keysIn_default,
  logForDebugging,
  safeResolvePath
} from "./chunk-pyv3zrjt.js";
import {
  _Stack_default,
  _isIndex_default,
  getAllowedSettingSources,
  getCachedParsedFile,
  getCachedSettingsForSource,
  getFlagSettingsInline,
  getFlagSettingsPath,
  getOriginalCwd,
  getPluginSettingsBase,
  getSessionSettingsCache,
  getUseCoworkPlugins,
  identity_default,
  init__Stack,
  init__isIndex,
  init_identity,
  init_isArguments,
  init_isArray,
  init_isArrayLike,
  init_isBuffer,
  init_isTypedArray,
  init_settingsCache,
  init_state,
  isArguments_default,
  isArrayLike_default,
  isArray_default,
  isBuffer_default,
  isTypedArray_default,
  resetSettingsCache,
  setCachedParsedFile,
  setCachedSettingsForSource,
  setSessionSettingsCache
} from "./chunk-232p95fy.js";
import {
  init_isObjectLike,
  isObjectLike_default
} from "./chunk-tj0dzck2.js";
import {
  getClaudeConfigHomeDir,
  init_envUtils,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import {
  eq_default,
  init_eq,
  init_isFunction,
  isFunction_default
} from "./chunk-nxzx0ey9.js";
import {
  _baseGetTag_default,
  init__baseGetTag,
  init_isObject,
  isObject_default
} from "./chunk-yes1my80.js";
import {
  __esm,
  __export,
  __toCommonJS
} from "./chunk-hhsxm2yr.js";

// src/utils/settings/constants.ts
function getSettingSourceName(source) {
  switch (source) {
    case "userSettings":
      return "user";
    case "projectSettings":
      return "project";
    case "localSettings":
      return "project, gitignored";
    case "flagSettings":
      return "cli flag";
    case "policySettings":
      return "managed";
  }
}
function getSourceDisplayName(source) {
  switch (source) {
    case "userSettings":
      return "User";
    case "projectSettings":
      return "Project";
    case "localSettings":
      return "Local";
    case "flagSettings":
      return "Flag";
    case "policySettings":
      return "Managed";
    case "plugin":
      return "Plugin";
    case "built-in":
      return "Built-in";
  }
}
function getSettingSourceDisplayNameLowercase(source) {
  switch (source) {
    case "userSettings":
      return "user settings";
    case "projectSettings":
      return "shared project settings";
    case "localSettings":
      return "project local settings";
    case "flagSettings":
      return "command line arguments";
    case "policySettings":
      return "enterprise managed settings";
    case "cliArg":
      return "CLI argument";
    case "command":
      return "command configuration";
    case "session":
      return "current session";
  }
}
function getSettingSourceDisplayNameCapitalized(source) {
  switch (source) {
    case "userSettings":
      return "User settings";
    case "projectSettings":
      return "Shared project settings";
    case "localSettings":
      return "Project local settings";
    case "flagSettings":
      return "Command line arguments";
    case "policySettings":
      return "Enterprise managed settings";
    case "cliArg":
      return "CLI argument";
    case "command":
      return "Command configuration";
    case "session":
      return "Current session";
  }
}
function parseSettingSourcesFlag(flag) {
  if (flag === "")
    return [];
  const names = flag.split(",").map((s) => s.trim());
  const result = [];
  for (const name of names) {
    switch (name) {
      case "user":
        result.push("userSettings");
        break;
      case "project":
        result.push("projectSettings");
        break;
      case "local":
        result.push("localSettings");
        break;
      default:
        throw new Error(`Invalid setting source: ${name}. Valid options are: user, project, local`);
    }
  }
  return result;
}
function getEnabledSettingSources() {
  const allowed = getAllowedSettingSources();
  const result = new Set(allowed);
  result.add("policySettings");
  result.add("flagSettings");
  return Array.from(result);
}
function isSettingSourceEnabled(source) {
  const enabled = getEnabledSettingSources();
  return enabled.includes(source);
}
var SETTING_SOURCES, SOURCES, CLAUDE_CODE_SETTINGS_SCHEMA_URL = "https://json.schemastore.org/claude-code-settings.json";
var init_constants = __esm(() => {
  init_state();
  SETTING_SOURCES = [
    "userSettings",
    "projectSettings",
    "localSettings",
    "flagSettings",
    "policySettings"
  ];
  SOURCES = [
    "localSettings",
    "projectSettings",
    "userSettings"
  ];
});

// src/utils/settings/internalWrites.ts
function markInternalWrite(path) {
  timestamps.set(path, Date.now());
}
function consumeInternalWrite(path, windowMs) {
  const ts = timestamps.get(path);
  if (ts !== undefined && Date.now() - ts < windowMs) {
    timestamps.delete(path);
    return true;
  }
  return false;
}
function clearInternalWrites() {
  timestamps.clear();
}
var timestamps;
var init_internalWrites = __esm(() => {
  timestamps = new Map;
});

// src/types/permissions.ts
var EXTERNAL_PERMISSION_MODES, INTERNAL_PERMISSION_MODES, PERMISSION_MODES;
var init_permissions = __esm(() => {
  EXTERNAL_PERMISSION_MODES = [
    "acceptEdits",
    "bypassPermissions",
    "default",
    "dontAsk",
    "plan"
  ];
  INTERNAL_PERMISSION_MODES = [
    ...EXTERNAL_PERMISSION_MODES,
    "auto"
  ];
  PERMISSION_MODES = INTERNAL_PERMISSION_MODES;
});

// src/utils/permissions/PermissionMode.ts
function isExternalPermissionMode(mode) {
  if (process.env.USER_TYPE !== "ant") {
    return true;
  }
  return mode !== "auto" && mode !== "bubble";
}
function getModeConfig(mode) {
  return PERMISSION_MODE_CONFIG[mode] ?? PERMISSION_MODE_CONFIG.default;
}
function toExternalPermissionMode(mode) {
  return getModeConfig(mode).external;
}
function permissionModeFromString(str) {
  return PERMISSION_MODES.includes(str) ? str : "default";
}
function permissionModeTitle(mode) {
  return getModeConfig(mode).title;
}
function isDefaultMode(mode) {
  return mode === "default" || mode === undefined;
}
function permissionModeShortTitle(mode) {
  return getModeConfig(mode).shortTitle;
}
function permissionModeSymbol(mode) {
  return getModeConfig(mode).symbol;
}
function getModeColor(mode) {
  return getModeConfig(mode).color;
}
var permissionModeSchema, externalPermissionModeSchema, PERMISSION_MODE_CONFIG;
var init_PermissionMode = __esm(() => {
  init_v4();
  init_figures();
  init_permissions();
  init_lazySchema();
  permissionModeSchema = lazySchema(() => v4_default.enum(PERMISSION_MODES));
  externalPermissionModeSchema = lazySchema(() => v4_default.enum(EXTERNAL_PERMISSION_MODES));
  PERMISSION_MODE_CONFIG = {
    default: {
      title: "Default",
      shortTitle: "Default",
      symbol: "",
      color: "text",
      external: "default"
    },
    plan: {
      title: "Plan Mode",
      shortTitle: "Plan",
      symbol: PAUSE_ICON,
      color: "planMode",
      external: "plan"
    },
    acceptEdits: {
      title: "Accept edits",
      shortTitle: "Accept",
      symbol: "\u23F5\u23F5",
      color: "autoAccept",
      external: "acceptEdits"
    },
    bypassPermissions: {
      title: "Bypass",
      shortTitle: "Bypass",
      symbol: "\u23F5\u23F5",
      color: "error",
      external: "bypassPermissions"
    },
    dontAsk: {
      title: "Don't Ask",
      shortTitle: "DontAsk",
      symbol: "\u23F5\u23F5",
      color: "error",
      external: "dontAsk"
    },
    auto: {
      title: "Auto",
      shortTitle: "Auto",
      symbol: "\u23F5\u23F5",
      color: "warning",
      external: "default"
    }
  };
});

// src/utils/shell/shellProvider.ts
var SHELL_TYPES, DEFAULT_HOOK_SHELL = "bash";
var init_shellProvider = __esm(() => {
  SHELL_TYPES = ["bash", "powershell"];
});

// src/entrypoints/agentSdkTypes.js
var HOOK_EVENTS;
var init_agentSdkTypes = __esm(() => {
  HOOK_EVENTS = [
    "PreToolUse",
    "PostToolUse",
    "PostToolUseFailure",
    "Notification",
    "UserPromptSubmit",
    "SessionStart",
    "SessionEnd",
    "Stop",
    "StopFailure",
    "SubagentStart",
    "SubagentStop",
    "PreCompact",
    "PostCompact",
    "PermissionRequest",
    "PermissionDenied",
    "Setup",
    "TeammateIdle",
    "TaskCreated",
    "TaskCompleted",
    "Elicitation",
    "ElicitationResult",
    "ConfigChange",
    "WorktreeCreate",
    "WorktreeRemove",
    "InstructionsLoaded",
    "CwdChanged",
    "FileChanged"
  ];
});

// src/schemas/hooks.ts
function buildHookSchemas() {
  const BashCommandHookSchema = exports_external.object({
    type: exports_external.literal("command").describe("Shell command hook type"),
    command: exports_external.string().describe("Shell command to execute"),
    if: IfConditionSchema(),
    shell: exports_external.enum(SHELL_TYPES).optional().describe("Shell interpreter. 'bash' uses your $SHELL (bash/zsh/sh); 'powershell' uses pwsh. Defaults to bash."),
    timeout: exports_external.number().positive().optional().describe("Timeout in seconds for this specific command"),
    statusMessage: exports_external.string().optional().describe("Custom status message to display in spinner while hook runs"),
    once: exports_external.boolean().optional().describe("If true, hook runs once and is removed after execution"),
    async: exports_external.boolean().optional().describe("If true, hook runs in background without blocking"),
    asyncRewake: exports_external.boolean().optional().describe("If true, hook runs in background and wakes the model on exit code 2 (blocking error). Implies async.")
  });
  const PromptHookSchema = exports_external.object({
    type: exports_external.literal("prompt").describe("LLM prompt hook type"),
    prompt: exports_external.string().describe("Prompt to evaluate with LLM. Use $ARGUMENTS placeholder for hook input JSON."),
    if: IfConditionSchema(),
    timeout: exports_external.number().positive().optional().describe("Timeout in seconds for this specific prompt evaluation"),
    model: exports_external.string().optional().describe('Model to use for this prompt hook (e.g., "claude-sonnet-4-6"). If not specified, uses the default small fast model.'),
    statusMessage: exports_external.string().optional().describe("Custom status message to display in spinner while hook runs"),
    once: exports_external.boolean().optional().describe("If true, hook runs once and is removed after execution")
  });
  const HttpHookSchema = exports_external.object({
    type: exports_external.literal("http").describe("HTTP hook type"),
    url: exports_external.string().url().describe("URL to POST the hook input JSON to"),
    if: IfConditionSchema(),
    timeout: exports_external.number().positive().optional().describe("Timeout in seconds for this specific request"),
    headers: exports_external.record(exports_external.string(), exports_external.string()).optional().describe('Additional headers to include in the request. Values may reference environment variables using $VAR_NAME or ${VAR_NAME} syntax (e.g., "Authorization": "Bearer $MY_TOKEN"). Only variables listed in allowedEnvVars will be interpolated.'),
    allowedEnvVars: exports_external.array(exports_external.string()).optional().describe("Explicit list of environment variable names that may be interpolated in header values. Only variables listed here will be resolved; all other $VAR references are left as empty strings. Required for env var interpolation to work."),
    statusMessage: exports_external.string().optional().describe("Custom status message to display in spinner while hook runs"),
    once: exports_external.boolean().optional().describe("If true, hook runs once and is removed after execution")
  });
  const AgentHookSchema = exports_external.object({
    type: exports_external.literal("agent").describe("Agentic verifier hook type"),
    prompt: exports_external.string().describe('Prompt describing what to verify (e.g. "Verify that unit tests ran and passed."). Use $ARGUMENTS placeholder for hook input JSON.'),
    if: IfConditionSchema(),
    timeout: exports_external.number().positive().optional().describe("Timeout in seconds for agent execution (default 60)"),
    model: exports_external.string().optional().describe('Model to use for this agent hook (e.g., "claude-sonnet-4-6"). If not specified, uses Haiku.'),
    statusMessage: exports_external.string().optional().describe("Custom status message to display in spinner while hook runs"),
    once: exports_external.boolean().optional().describe("If true, hook runs once and is removed after execution")
  });
  return {
    BashCommandHookSchema,
    PromptHookSchema,
    HttpHookSchema,
    AgentHookSchema
  };
}
var IfConditionSchema, HookCommandSchema, HookMatcherSchema, HooksSchema;
var init_hooks = __esm(() => {
  init_agentSdkTypes();
  init_v4();
  init_lazySchema();
  init_shellProvider();
  IfConditionSchema = lazySchema(() => exports_external.string().optional().describe('Permission rule syntax to filter when this hook runs (e.g., "Bash(git *)"). ' + "Only runs if the tool call matches the pattern. Avoids spawning hooks for non-matching commands."));
  HookCommandSchema = lazySchema(() => {
    const {
      BashCommandHookSchema,
      PromptHookSchema,
      AgentHookSchema,
      HttpHookSchema
    } = buildHookSchemas();
    return exports_external.discriminatedUnion("type", [
      BashCommandHookSchema,
      PromptHookSchema,
      AgentHookSchema,
      HttpHookSchema
    ]);
  });
  HookMatcherSchema = lazySchema(() => exports_external.object({
    matcher: exports_external.string().optional().describe('String pattern to match (e.g. tool names like "Write")'),
    hooks: exports_external.array(HookCommandSchema()).describe("List of hooks to execute when the matcher matches")
  }));
  HooksSchema = lazySchema(() => exports_external.partialRecord(exports_external.enum(HOOK_EVENTS), exports_external.array(HookMatcherSchema())));
});

// src/utils/plugins/schemas.ts
function isMarketplaceAutoUpdate(marketplaceName, entry) {
  const normalizedName = marketplaceName.toLowerCase();
  return entry.autoUpdate ?? (ALLOWED_OFFICIAL_MARKETPLACE_NAMES.has(normalizedName) && !NO_AUTO_UPDATE_OFFICIAL_MARKETPLACES.has(normalizedName));
}
function isBlockedOfficialName(name) {
  if (ALLOWED_OFFICIAL_MARKETPLACE_NAMES.has(name.toLowerCase())) {
    return false;
  }
  if (NON_ASCII_PATTERN.test(name)) {
    return true;
  }
  return BLOCKED_OFFICIAL_NAME_PATTERN.test(name);
}
function validateOfficialNameSource(name, source) {
  const normalizedName = name.toLowerCase();
  if (!ALLOWED_OFFICIAL_MARKETPLACE_NAMES.has(normalizedName)) {
    return null;
  }
  if (source.source === "github") {
    const repo = source.repo || "";
    if (!repo.toLowerCase().startsWith(`${OFFICIAL_GITHUB_ORG}/`)) {
      return `The name '${name}' is reserved for official AgentFlow marketplaces. Only repositories from 'github.com/${OFFICIAL_GITHUB_ORG}/' can use this name.`;
    }
    return null;
  }
  if (source.source === "git" && source.url) {
    const url = source.url.toLowerCase();
    const isHttpsAnthropics = url.includes("github.com/anthropics/");
    const isSshAnthropics = url.includes("git@github.com:anthropics/");
    if (isHttpsAnthropics || isSshAnthropics) {
      return null;
    }
    return `The name '${name}' is reserved for official AgentFlow marketplaces. Only repositories from 'github.com/${OFFICIAL_GITHUB_ORG}/' can use this name.`;
  }
  return `The name '${name}' is reserved for official AgentFlow marketplaces and can only be used with GitHub sources from the '${OFFICIAL_GITHUB_ORG}' organization.`;
}
function isLocalPluginSource(source) {
  return typeof source === "string" && source.startsWith("./");
}
function isLocalMarketplaceSource(source) {
  return source.source === "file" || source.source === "directory";
}
var ALLOWED_OFFICIAL_MARKETPLACE_NAMES, NO_AUTO_UPDATE_OFFICIAL_MARKETPLACES, BLOCKED_OFFICIAL_NAME_PATTERN, NON_ASCII_PATTERN, OFFICIAL_GITHUB_ORG = "anthropics", RelativePath, RelativeJSONPath, McpbPath, RelativeMarkdownPath, RelativeCommandPath, MarketplaceNameSchema, PluginAuthorSchema, PluginManifestMetadataSchema, PluginHooksSchema, PluginManifestHooksSchema, CommandMetadataSchema, PluginManifestCommandsSchema, PluginManifestAgentsSchema, PluginManifestSkillsSchema, PluginManifestOutputStylesSchema, nonEmptyString, fileExtension, PluginManifestMcpServerSchema, PluginUserConfigOptionSchema, PluginManifestUserConfigSchema, PluginManifestChannelsSchema, LspServerConfigSchema, PluginManifestLspServerSchema, NpmPackageNameSchema, PluginManifestSettingsSchema, PluginManifestSchema, MarketplaceSourceSchema, gitSha, PluginSourceSchema, SettingsMarketplacePluginSchema, PluginMarketplaceEntrySchema, PluginMarketplaceSchema, PluginIdSchema, DEP_REF_REGEX, DependencyRefSchema, SettingsPluginEntrySchema, InstalledPluginSchema, InstalledPluginsFileSchemaV1, PluginScopeSchema, PluginInstallationEntrySchema, InstalledPluginsFileSchemaV2, InstalledPluginsFileSchema, KnownMarketplaceSchema, KnownMarketplacesFileSchema;
var init_schemas = __esm(() => {
  init_v4();
  init_hooks();
  init_types();
  init_lazySchema();
  ALLOWED_OFFICIAL_MARKETPLACE_NAMES = new Set([
    "claude-code-marketplace",
    "claude-code-plugins",
    "claude-plugins-official",
    "anthropic-marketplace",
    "anthropic-plugins",
    "agent-skills",
    "life-sciences",
    "knowledge-work-plugins"
  ]);
  NO_AUTO_UPDATE_OFFICIAL_MARKETPLACES = new Set(["knowledge-work-plugins"]);
  BLOCKED_OFFICIAL_NAME_PATTERN = /(?:official[^a-z0-9]*(anthropic|claude)|(?:anthropic|claude)[^a-z0-9]*official|^(?:anthropic|claude)[^a-z0-9]*(marketplace|plugins|official))/i;
  NON_ASCII_PATTERN = /[^\u0020-\u007E]/;
  RelativePath = lazySchema(() => exports_external.string().startsWith("./"));
  RelativeJSONPath = lazySchema(() => RelativePath().endsWith(".json"));
  McpbPath = lazySchema(() => exports_external.union([
    RelativePath().refine((path) => path.endsWith(".mcpb") || path.endsWith(".dxt"), {
      message: "MCPB file path must end with .mcpb or .dxt"
    }).describe("Path to MCPB file relative to plugin root"),
    exports_external.string().url().refine((url) => url.endsWith(".mcpb") || url.endsWith(".dxt"), {
      message: "MCPB URL must end with .mcpb or .dxt"
    }).describe("URL to MCPB file")
  ]));
  RelativeMarkdownPath = lazySchema(() => RelativePath().endsWith(".md"));
  RelativeCommandPath = lazySchema(() => exports_external.union([
    RelativeMarkdownPath(),
    RelativePath()
  ]));
  MarketplaceNameSchema = lazySchema(() => exports_external.string().min(1, "Marketplace must have a name").refine((name) => !name.includes(" "), {
    message: 'Marketplace name cannot contain spaces. Use kebab-case (e.g., "my-marketplace")'
  }).refine((name) => !name.includes("/") && !name.includes("\\") && !name.includes("..") && name !== ".", {
    message: 'Marketplace name cannot contain path separators (/ or \\), ".." sequences, or be "."'
  }).refine((name) => !isBlockedOfficialName(name), {
    message: "Marketplace name impersonates an official AgentFlow/Claude marketplace"
  }).refine((name) => name.toLowerCase() !== "inline", {
    message: 'Marketplace name "inline" is reserved for --plugin-dir session plugins'
  }).refine((name) => name.toLowerCase() !== "builtin", {
    message: 'Marketplace name "builtin" is reserved for built-in plugins'
  }));
  PluginAuthorSchema = lazySchema(() => exports_external.object({
    name: exports_external.string().min(1, "Author name cannot be empty").describe("Display name of the plugin author or organization"),
    email: exports_external.string().optional().describe("Contact email for support or feedback"),
    url: exports_external.string().optional().describe("Website, GitHub profile, or organization URL")
  }));
  PluginManifestMetadataSchema = lazySchema(() => exports_external.object({
    name: exports_external.string().min(1, "Plugin name cannot be empty").refine((name) => !name.includes(" "), {
      message: 'Plugin name cannot contain spaces. Use kebab-case (e.g., "my-plugin")'
    }).describe("Unique identifier for the plugin, used for namespacing (prefer kebab-case)"),
    version: exports_external.string().optional().describe("Semantic version (e.g., 1.2.3) following semver.org specification"),
    description: exports_external.string().optional().describe("Brief, user-facing explanation of what the plugin provides"),
    author: PluginAuthorSchema().optional().describe("Information about the plugin creator or maintainer"),
    homepage: exports_external.string().url().optional().describe("Plugin homepage or documentation URL"),
    repository: exports_external.string().optional().describe("Source code repository URL"),
    license: exports_external.string().optional().describe("SPDX license identifier (e.g., MIT, Apache-2.0)"),
    keywords: exports_external.array(exports_external.string()).optional().describe("Tags for plugin discovery and categorization"),
    dependencies: exports_external.array(DependencyRefSchema()).optional().describe(`Plugins that must be enabled for this plugin to function. Bare names (no "@marketplace") are resolved against the declaring plugin's own marketplace.`)
  }));
  PluginHooksSchema = lazySchema(() => exports_external.object({
    description: exports_external.string().optional().describe("Brief, user-facing explanation of what these hooks provide"),
    hooks: exports_external.lazy(() => HooksSchema()).describe("The hooks provided by the plugin, in the same format as the one used for settings")
  }));
  PluginManifestHooksSchema = lazySchema(() => exports_external.object({
    hooks: exports_external.union([
      RelativeJSONPath().describe("Path to file with additional hooks (in addition to those in hooks/hooks.json, if it exists), relative to the plugin root"),
      exports_external.lazy(() => HooksSchema()).describe("Additional hooks (in addition to those in hooks/hooks.json, if it exists)"),
      exports_external.array(exports_external.union([
        RelativeJSONPath().describe("Path to file with additional hooks (in addition to those in hooks/hooks.json, if it exists), relative to the plugin root"),
        exports_external.lazy(() => HooksSchema()).describe("Additional hooks (in addition to those in hooks/hooks.json, if it exists)")
      ]))
    ])
  }));
  CommandMetadataSchema = lazySchema(() => exports_external.object({
    source: RelativeCommandPath().optional().describe("Path to command markdown file, relative to plugin root"),
    content: exports_external.string().optional().describe("Inline markdown content for the command"),
    description: exports_external.string().optional().describe("Command description override"),
    argumentHint: exports_external.string().optional().describe('Hint for command arguments (e.g., "[file]")'),
    model: exports_external.string().optional().describe("Default model for this command"),
    allowedTools: exports_external.array(exports_external.string()).optional().describe("Tools allowed when command runs")
  }).refine((data) => data.source && !data.content || !data.source && data.content, {
    message: 'Command must have either "source" (file path) or "content" (inline markdown), but not both'
  }));
  PluginManifestCommandsSchema = lazySchema(() => exports_external.object({
    commands: exports_external.union([
      RelativeCommandPath().describe("Path to additional command file or skill directory (in addition to those in the commands/ directory, if it exists), relative to the plugin root"),
      exports_external.array(RelativeCommandPath().describe("Path to additional command file or skill directory (in addition to those in the commands/ directory, if it exists), relative to the plugin root")).describe("List of paths to additional command files or skill directories"),
      exports_external.record(exports_external.string(), CommandMetadataSchema()).describe('Object mapping of command names to their metadata and source files. Command name becomes the slash command name (e.g., "about" \u2192 "/plugin:about")')
    ])
  }));
  PluginManifestAgentsSchema = lazySchema(() => exports_external.object({
    agents: exports_external.union([
      RelativeMarkdownPath().describe("Path to additional agent file (in addition to those in the agents/ directory, if it exists), relative to the plugin root"),
      exports_external.array(RelativeMarkdownPath().describe("Path to additional agent file (in addition to those in the agents/ directory, if it exists), relative to the plugin root")).describe("List of paths to additional agent files")
    ])
  }));
  PluginManifestSkillsSchema = lazySchema(() => exports_external.object({
    skills: exports_external.union([
      RelativePath().describe("Path to additional skill directory (in addition to those in the skills/ directory, if it exists), relative to the plugin root"),
      exports_external.array(RelativePath().describe("Path to additional skill directory (in addition to those in the skills/ directory, if it exists), relative to the plugin root")).describe("List of paths to additional skill directories")
    ])
  }));
  PluginManifestOutputStylesSchema = lazySchema(() => exports_external.object({
    outputStyles: exports_external.union([
      RelativePath().describe("Path to additional output styles directory or file (in addition to those in the output-styles/ directory, if it exists), relative to the plugin root"),
      exports_external.array(RelativePath().describe("Path to additional output styles directory or file (in addition to those in the output-styles/ directory, if it exists), relative to the plugin root")).describe("List of paths to additional output styles directories or files")
    ])
  }));
  nonEmptyString = lazySchema(() => exports_external.string().min(1));
  fileExtension = lazySchema(() => exports_external.string().min(2).refine((ext) => ext.startsWith("."), {
    message: 'File extensions must start with dot (e.g., ".ts", not "ts")'
  }));
  PluginManifestMcpServerSchema = lazySchema(() => exports_external.object({
    mcpServers: exports_external.union([
      RelativeJSONPath().describe("MCP servers to include in the plugin (in addition to those in the .mcp.json file, if it exists)"),
      McpbPath().describe("Path or URL to MCPB file containing MCP server configuration"),
      exports_external.record(exports_external.string(), McpServerConfigSchema()).describe("MCP server configurations keyed by server name"),
      exports_external.array(exports_external.union([
        RelativeJSONPath().describe("Path to MCP servers configuration file"),
        McpbPath().describe("Path or URL to MCPB file"),
        exports_external.record(exports_external.string(), McpServerConfigSchema()).describe("Inline MCP server configurations")
      ])).describe("Array of MCP server configurations (paths, MCPB files, or inline definitions)")
    ])
  }));
  PluginUserConfigOptionSchema = lazySchema(() => exports_external.object({
    type: exports_external.enum(["string", "number", "boolean", "directory", "file"]).describe("Type of the configuration value"),
    title: exports_external.string().describe("Human-readable label shown in the config dialog"),
    description: exports_external.string().describe("Help text shown beneath the field in the config dialog"),
    required: exports_external.boolean().optional().describe("If true, validation fails when this field is empty"),
    default: exports_external.union([exports_external.string(), exports_external.number(), exports_external.boolean(), exports_external.array(exports_external.string())]).optional().describe("Default value used when the user provides nothing"),
    multiple: exports_external.boolean().optional().describe("For string type: allow an array of strings"),
    sensitive: exports_external.boolean().optional().describe("If true, masks dialog input and stores value in secure storage (keychain/credentials file) instead of settings.json"),
    min: exports_external.number().optional().describe("Minimum value (number type only)"),
    max: exports_external.number().optional().describe("Maximum value (number type only)")
  }).strict());
  PluginManifestUserConfigSchema = lazySchema(() => exports_external.object({
    userConfig: exports_external.record(exports_external.string().regex(/^[A-Za-z_]\w*$/, "Option keys must be valid identifiers (letters, digits, underscore; no leading digit) \u2014 they become CLAUDE_PLUGIN_OPTION_<KEY> env vars in hooks"), PluginUserConfigOptionSchema()).optional().describe("User-configurable values this plugin needs. Prompted at enable time. " + "Non-sensitive values saved to settings.json; sensitive values to secure storage " + "(macOS keychain or .credentials.json). Available as ${user_config.KEY} in " + "MCP/LSP server config, hook commands, and (non-sensitive only) skill/agent content. " + "Note: sensitive values share a single keychain entry with OAuth tokens \u2014 keep " + "secret counts small to stay under the ~2KB stdin-safe limit (see INC-3028).")
  }));
  PluginManifestChannelsSchema = lazySchema(() => exports_external.object({
    channels: exports_external.array(exports_external.object({
      server: exports_external.string().min(1).describe("Name of the MCP server this channel binds to. Must match a key in this plugin's mcpServers."),
      displayName: exports_external.string().optional().describe('Human-readable name shown in the config dialog title (e.g., "Telegram"). Defaults to the server name.'),
      userConfig: exports_external.record(exports_external.string(), PluginUserConfigOptionSchema()).optional().describe("Fields to prompt the user for when enabling this plugin in assistant mode. " + "Saved values are substituted into ${user_config.KEY} references in the mcpServers env.")
    }).strict()).describe("Channels this plugin provides. Each entry declares an MCP server as a message channel " + "and optionally specifies user configuration to prompt for at enable time.")
  }));
  LspServerConfigSchema = lazySchema(() => exports_external.strictObject({
    command: exports_external.string().min(1).refine((cmd) => {
      if (cmd.includes(" ") && !cmd.startsWith("/")) {
        return false;
      }
      return true;
    }, {
      message: "Command should not contain spaces. Use args array for arguments."
    }).describe('Command to execute the LSP server (e.g., "typescript-language-server")'),
    args: exports_external.array(nonEmptyString()).optional().describe("Command-line arguments to pass to the server"),
    extensionToLanguage: exports_external.record(fileExtension(), nonEmptyString()).refine((record) => Object.keys(record).length > 0, {
      message: "extensionToLanguage must have at least one mapping"
    }).describe("Mapping from file extension to LSP language ID. File extensions and languages are derived from this mapping."),
    transport: exports_external.enum(["stdio", "socket"]).default("stdio").describe("Communication transport mechanism"),
    env: exports_external.record(exports_external.string(), exports_external.string()).optional().describe("Environment variables to set when starting the server"),
    initializationOptions: exports_external.unknown().optional().describe("Initialization options passed to the server during initialization"),
    settings: exports_external.unknown().optional().describe("Settings passed to the server via workspace/didChangeConfiguration"),
    workspaceFolder: exports_external.string().optional().describe("Workspace folder path to use for the server"),
    startupTimeout: exports_external.number().int().positive().optional().describe("Maximum time to wait for server startup (milliseconds)"),
    shutdownTimeout: exports_external.number().int().positive().optional().describe("Maximum time to wait for graceful shutdown (milliseconds)"),
    restartOnCrash: exports_external.boolean().optional().describe("Whether to restart the server if it crashes"),
    maxRestarts: exports_external.number().int().nonnegative().optional().describe("Maximum number of restart attempts before giving up")
  }));
  PluginManifestLspServerSchema = lazySchema(() => exports_external.object({
    lspServers: exports_external.union([
      RelativeJSONPath().describe("Path to .lsp.json configuration file relative to plugin root"),
      exports_external.record(exports_external.string(), LspServerConfigSchema()).describe("LSP server configurations keyed by server name"),
      exports_external.array(exports_external.union([
        RelativeJSONPath().describe("Path to LSP configuration file"),
        exports_external.record(exports_external.string(), LspServerConfigSchema()).describe("Inline LSP server configurations")
      ])).describe("Array of LSP server configurations (paths or inline definitions)")
    ])
  }));
  NpmPackageNameSchema = lazySchema(() => exports_external.string().refine((name) => !name.includes("..") && !name.includes("//"), "Package name cannot contain path traversal patterns").refine((name) => {
    const scopedPackageRegex = /^@[a-z0-9][a-z0-9-._]*\/[a-z0-9][a-z0-9-._]*$/;
    const regularPackageRegex = /^[a-z0-9][a-z0-9-._]*$/;
    return scopedPackageRegex.test(name) || regularPackageRegex.test(name);
  }, "Invalid npm package name format"));
  PluginManifestSettingsSchema = lazySchema(() => exports_external.object({
    settings: exports_external.record(exports_external.string(), exports_external.unknown()).optional().describe("Settings to merge when plugin is enabled. " + "Only allowlisted keys are kept (currently: agent)")
  }));
  PluginManifestSchema = lazySchema(() => exports_external.object({
    ...PluginManifestMetadataSchema().shape,
    ...PluginManifestHooksSchema().partial().shape,
    ...PluginManifestCommandsSchema().partial().shape,
    ...PluginManifestAgentsSchema().partial().shape,
    ...PluginManifestSkillsSchema().partial().shape,
    ...PluginManifestOutputStylesSchema().partial().shape,
    ...PluginManifestChannelsSchema().partial().shape,
    ...PluginManifestMcpServerSchema().partial().shape,
    ...PluginManifestLspServerSchema().partial().shape,
    ...PluginManifestSettingsSchema().partial().shape,
    ...PluginManifestUserConfigSchema().partial().shape
  }));
  MarketplaceSourceSchema = lazySchema(() => exports_external.discriminatedUnion("source", [
    exports_external.object({
      source: exports_external.literal("url"),
      url: exports_external.string().url().describe("Direct URL to marketplace.json file"),
      headers: exports_external.record(exports_external.string(), exports_external.string()).optional().describe("Custom HTTP headers (e.g., for authentication)")
    }),
    exports_external.object({
      source: exports_external.literal("github"),
      repo: exports_external.string().describe("GitHub repository in owner/repo format"),
      ref: exports_external.string().optional().describe('Git branch or tag to use (e.g., "main", "v1.0.0"). Defaults to repository default branch.'),
      path: exports_external.string().optional().describe("Path to marketplace.json within repo (defaults to .claude-plugin/marketplace.json)"),
      sparsePaths: exports_external.array(exports_external.string()).optional().describe("Directories to include via git sparse-checkout (cone mode). " + "Use for monorepos where the marketplace lives in a subdirectory. " + 'Example: [".claude-plugin", "plugins"]. ' + "If omitted, the full repository is cloned.")
    }),
    exports_external.object({
      source: exports_external.literal("git"),
      url: exports_external.string().describe("Full git repository URL"),
      ref: exports_external.string().optional().describe('Git branch or tag to use (e.g., "main", "v1.0.0"). Defaults to repository default branch.'),
      path: exports_external.string().optional().describe("Path to marketplace.json within repo (defaults to .claude-plugin/marketplace.json)"),
      sparsePaths: exports_external.array(exports_external.string()).optional().describe("Directories to include via git sparse-checkout (cone mode). " + "Use for monorepos where the marketplace lives in a subdirectory. " + 'Example: [".claude-plugin", "plugins"]. ' + "If omitted, the full repository is cloned.")
    }),
    exports_external.object({
      source: exports_external.literal("npm"),
      package: NpmPackageNameSchema().describe("NPM package containing marketplace.json")
    }),
    exports_external.object({
      source: exports_external.literal("file"),
      path: exports_external.string().describe("Local file path to marketplace.json")
    }),
    exports_external.object({
      source: exports_external.literal("directory"),
      path: exports_external.string().describe("Local directory containing .claude-plugin/marketplace.json")
    }),
    exports_external.object({
      source: exports_external.literal("hostPattern"),
      hostPattern: exports_external.string().describe("Regex pattern to match the host/domain extracted from any marketplace source type. " + 'For github sources, matches against "github.com". For git sources (SSH or HTTPS), ' + "extracts the hostname from the URL. Use in strictKnownMarketplaces to allow all " + 'marketplaces from a specific host (e.g., "^github\\.mycompany\\.com$").')
    }),
    exports_external.object({
      source: exports_external.literal("pathPattern"),
      pathPattern: exports_external.string().describe("Regex pattern matched against the .path field of file and directory sources. " + "Use in strictKnownMarketplaces to allow filesystem-based marketplaces alongside " + 'hostPattern restrictions for network sources. Use ".*" to allow all filesystem ' + 'paths, or a narrower pattern (e.g., "^/opt/approved/") to restrict to specific ' + "directories.")
    }),
    exports_external.object({
      source: exports_external.literal("settings"),
      name: MarketplaceNameSchema().refine((name) => !ALLOWED_OFFICIAL_MARKETPLACE_NAMES.has(name.toLowerCase()), {
        message: "Reserved official marketplace names cannot be used with settings sources. " + "validateOfficialNameSource only accepts github/git sources from anthropics/* " + "for these names; a settings source would be rejected after " + "loadAndCacheMarketplace has already written to disk with cleanupNeeded=false."
      }).describe("Marketplace name. Must match the extraKnownMarketplaces key (enforced); " + "the synthetic manifest is written under this name. Same validation " + "as PluginMarketplaceSchema plus reserved-name rejection \u2014 " + "validateOfficialNameSource runs after the disk write, too late to clean up."),
      plugins: exports_external.array(SettingsMarketplacePluginSchema()).describe("Plugin entries declared inline in settings.json"),
      owner: PluginAuthorSchema().optional()
    }).describe("Inline marketplace manifest defined directly in settings.json. " + "The reconciler writes a synthetic marketplace.json to the cache; " + "diffMarketplaces detects edits via isEqual on the stored source " + "(the plugins array is inside this object, so edits surface as sourceChanged).")
  ]));
  gitSha = lazySchema(() => exports_external.string().length(40).regex(/^[a-f0-9]{40}$/, "Must be a full 40-character lowercase git commit SHA"));
  PluginSourceSchema = lazySchema(() => exports_external.union([
    RelativePath().describe("Path to the plugin root, relative to the marketplace root (the directory containing .claude-plugin/, not .claude-plugin/ itself)"),
    exports_external.object({
      source: exports_external.literal("npm"),
      package: NpmPackageNameSchema().or(exports_external.string()).describe("Package name (or url, or local path, or anything else that can be passed to `npm` as a package)"),
      version: exports_external.string().optional().describe("Specific version or version range (e.g., ^1.0.0, ~2.1.0)"),
      registry: exports_external.string().url().optional().describe("Custom NPM registry URL (defaults to using system default, likely npmjs.org)")
    }).describe("NPM package as plugin source"),
    exports_external.object({
      source: exports_external.literal("pip"),
      package: exports_external.string().describe("Python package name as it appears on PyPI"),
      version: exports_external.string().optional().describe("Version specifier (e.g., ==1.0.0, >=2.0.0, <3.0.0)"),
      registry: exports_external.string().url().optional().describe("Custom PyPI registry URL (defaults to using system default, likely pypi.org)")
    }).describe("Python package as plugin source"),
    exports_external.object({
      source: exports_external.literal("url"),
      url: exports_external.string().describe("Full git repository URL (https:// or git@)"),
      ref: exports_external.string().optional().describe('Git branch or tag to use (e.g., "main", "v1.0.0"). Defaults to repository default branch.'),
      sha: gitSha().optional().describe("Specific commit SHA to use")
    }),
    exports_external.object({
      source: exports_external.literal("github"),
      repo: exports_external.string().describe("GitHub repository in owner/repo format"),
      ref: exports_external.string().optional().describe('Git branch or tag to use (e.g., "main", "v1.0.0"). Defaults to repository default branch.'),
      sha: gitSha().optional().describe("Specific commit SHA to use")
    }),
    exports_external.object({
      source: exports_external.literal("git-subdir"),
      url: exports_external.string().describe("Git repository: GitHub owner/repo shorthand, https://, or git@ URL"),
      path: exports_external.string().min(1).describe('Subdirectory within the repo containing the plugin (e.g., "tools/claude-plugin"). ' + "Cloned sparsely using partial clone (--filter=tree:0) to minimize bandwidth for monorepos."),
      ref: exports_external.string().optional().describe('Git branch or tag to use (e.g., "main", "v1.0.0"). Defaults to repository default branch.'),
      sha: gitSha().optional().describe("Specific commit SHA to use")
    }).describe("Plugin located in a subdirectory of a larger repository (monorepo). " + "Only the specified subdirectory is materialized; the rest of the repo is not downloaded.")
  ]));
  SettingsMarketplacePluginSchema = lazySchema(() => exports_external.object({
    name: exports_external.string().min(1, "Plugin name cannot be empty").refine((name) => !name.includes(" "), {
      message: 'Plugin name cannot contain spaces. Use kebab-case (e.g., "my-plugin")'
    }).describe("Plugin name as it appears in the target repository"),
    source: PluginSourceSchema().describe("Where to fetch the plugin from. Must be a remote source \u2014 relative " + "paths have no marketplace repository to resolve against."),
    description: exports_external.string().optional(),
    version: exports_external.string().optional(),
    strict: exports_external.boolean().optional()
  }).refine((p) => typeof p.source !== "string", {
    message: "Plugins in a settings-sourced marketplace must use remote sources " + '(github, git-subdir, npm, url, pip). Relative-path sources like "./foo" ' + "have no marketplace repository to resolve against."
  }));
  PluginMarketplaceEntrySchema = lazySchema(() => PluginManifestSchema().partial().extend({
    name: exports_external.string().min(1, "Plugin name cannot be empty").refine((name) => !name.includes(" "), {
      message: 'Plugin name cannot contain spaces. Use kebab-case (e.g., "my-plugin")'
    }).describe("Unique identifier matching the plugin name"),
    source: PluginSourceSchema().describe("Where to fetch the plugin from"),
    category: exports_external.string().optional().describe('Category for organizing plugins (e.g., "productivity", "development")'),
    tags: exports_external.array(exports_external.string()).optional().describe("Tags for searchability and discovery"),
    strict: exports_external.boolean().optional().default(true).describe("Require the plugin manifest to be present in the plugin folder. If false, the marketplace entry provides the manifest.")
  }));
  PluginMarketplaceSchema = lazySchema(() => exports_external.object({
    name: MarketplaceNameSchema(),
    owner: PluginAuthorSchema().describe("Marketplace maintainer or curator information"),
    plugins: exports_external.array(PluginMarketplaceEntrySchema()).describe("Collection of available plugins in this marketplace"),
    forceRemoveDeletedPlugins: exports_external.boolean().optional().describe("When true, plugins removed from this marketplace will be automatically uninstalled and flagged for users"),
    metadata: exports_external.object({
      pluginRoot: exports_external.string().optional().describe("Base path for relative plugin sources"),
      version: exports_external.string().optional().describe("Marketplace version"),
      description: exports_external.string().optional().describe("Marketplace description")
    }).optional().describe("Optional marketplace metadata"),
    allowCrossMarketplaceDependenciesOn: exports_external.array(exports_external.string()).optional().describe("Marketplace names whose plugins may be auto-installed as dependencies. Only the root marketplace's allowlist applies \u2014 no transitive trust.")
  }));
  PluginIdSchema = lazySchema(() => exports_external.string().regex(/^[a-z0-9][-a-z0-9._]*@[a-z0-9][-a-z0-9._]*$/i, "Plugin ID must be in format: plugin@marketplace"));
  DEP_REF_REGEX = /^[a-z0-9][-a-z0-9._]*(@[a-z0-9][-a-z0-9._]*)?(@\^[^@]*)?$/i;
  DependencyRefSchema = lazySchema(() => exports_external.union([
    exports_external.string().regex(DEP_REF_REGEX, "Dependency must be a plugin name, optionally qualified with @marketplace").transform((s) => s.replace(/@\^[^@]*$/, "")),
    exports_external.object({
      name: exports_external.string().min(1).regex(/^[a-z0-9][-a-z0-9._]*$/i),
      marketplace: exports_external.string().min(1).regex(/^[a-z0-9][-a-z0-9._]*$/i).optional()
    }).loose().transform((o) => o.marketplace ? `${o.name}@${o.marketplace}` : o.name)
  ]));
  SettingsPluginEntrySchema = lazySchema(() => exports_external.union([
    PluginIdSchema(),
    exports_external.object({
      id: PluginIdSchema().describe('Plugin identifier (e.g., "formatter@tools")'),
      version: exports_external.string().optional().describe('Version constraint (e.g., "^2.0.0")'),
      required: exports_external.boolean().optional().describe("If true, cannot be disabled"),
      config: exports_external.record(exports_external.string(), exports_external.unknown()).optional().describe("Plugin-specific configuration")
    })
  ]));
  InstalledPluginSchema = lazySchema(() => exports_external.object({
    version: exports_external.string().describe("Currently installed version"),
    installedAt: exports_external.string().describe("ISO 8601 timestamp of installation"),
    lastUpdated: exports_external.string().optional().describe("ISO 8601 timestamp of last update"),
    installPath: exports_external.string().describe("Absolute path to the installed plugin directory"),
    gitCommitSha: exports_external.string().optional().describe("Git commit SHA for git-based plugins (for version tracking)")
  }));
  InstalledPluginsFileSchemaV1 = lazySchema(() => exports_external.object({
    version: exports_external.literal(1).describe("Schema version 1"),
    plugins: exports_external.record(PluginIdSchema(), InstalledPluginSchema()).describe("Map of plugin IDs to their installation metadata")
  }));
  PluginScopeSchema = lazySchema(() => exports_external.enum(["managed", "user", "project", "local"]));
  PluginInstallationEntrySchema = lazySchema(() => exports_external.object({
    scope: PluginScopeSchema().describe("Installation scope"),
    projectPath: exports_external.string().optional().describe("Project path (required for project/local scopes)"),
    installPath: exports_external.string().describe("Absolute path to the versioned plugin directory"),
    version: exports_external.string().optional().describe("Currently installed version"),
    installedAt: exports_external.string().optional().describe("ISO 8601 timestamp of installation"),
    lastUpdated: exports_external.string().optional().describe("ISO 8601 timestamp of last update"),
    gitCommitSha: exports_external.string().optional().describe("Git commit SHA for git-based plugins")
  }));
  InstalledPluginsFileSchemaV2 = lazySchema(() => exports_external.object({
    version: exports_external.literal(2).describe("Schema version 2"),
    plugins: exports_external.record(PluginIdSchema(), exports_external.array(PluginInstallationEntrySchema())).describe("Map of plugin IDs to arrays of installation entries")
  }));
  InstalledPluginsFileSchema = lazySchema(() => exports_external.union([InstalledPluginsFileSchemaV1(), InstalledPluginsFileSchemaV2()]));
  KnownMarketplaceSchema = lazySchema(() => exports_external.object({
    source: MarketplaceSourceSchema().describe("Where to fetch the marketplace from"),
    installLocation: exports_external.string().describe("Local cache path where marketplace manifest is stored"),
    lastUpdated: exports_external.string().describe("ISO 8601 timestamp of last marketplace refresh"),
    autoUpdate: exports_external.boolean().optional().describe("Whether to automatically update this marketplace and its installed plugins on startup")
  }));
  KnownMarketplacesFileSchema = lazySchema(() => exports_external.record(exports_external.string(), KnownMarketplaceSchema()));
});

// packages/builtin-tools/src/tools/AgentTool/constants.ts
var AGENT_TOOL_NAME = "Agent", LEGACY_AGENT_TOOL_NAME = "Task", VERIFICATION_AGENT_TYPE = "verification", ONE_SHOT_BUILTIN_AGENT_TYPES;
var init_constants2 = __esm(() => {
  ONE_SHOT_BUILTIN_AGENT_TYPES = new Set([
    "Explore",
    "Plan"
  ]);
});

// packages/builtin-tools/src/tools/BriefTool/prompt.ts
var exports_prompt = {};
__export(exports_prompt, {
  LEGACY_BRIEF_TOOL_NAME: () => LEGACY_BRIEF_TOOL_NAME,
  DESCRIPTION: () => DESCRIPTION,
  BRIEF_TOOL_PROMPT: () => BRIEF_TOOL_PROMPT,
  BRIEF_TOOL_NAME: () => BRIEF_TOOL_NAME,
  BRIEF_PROACTIVE_SECTION: () => BRIEF_PROACTIVE_SECTION
});
var BRIEF_TOOL_NAME = "SendUserMessage", LEGACY_BRIEF_TOOL_NAME = "Brief", DESCRIPTION = "Send a message to the user", BRIEF_TOOL_PROMPT = `Send a message the user will read. Text outside this tool is visible in the detail view, but most won't open it \u2014 the answer lives here.

\`message\` supports markdown. \`attachments\` takes file paths (absolute or cwd-relative) for images, diffs, logs.

\`status\` labels intent: 'normal' when replying to what they just asked; 'proactive' when you're initiating \u2014 a scheduled task finished, a blocker surfaced during background work, you need input on something they haven't asked about. Set it honestly; downstream routing uses it.`, BRIEF_PROACTIVE_SECTION;
var init_prompt = __esm(() => {
  BRIEF_PROACTIVE_SECTION = `## Talking to the user

${BRIEF_TOOL_NAME} is where your replies go. Text outside it is visible if the user expands the detail view, but most won't \u2014 assume unread. Anything you want them to actually see goes through ${BRIEF_TOOL_NAME}. The failure mode: the real answer lives in plain text while ${BRIEF_TOOL_NAME} just says "done!" \u2014 they see "done!" and miss everything.

So: every time the user says something, the reply they actually read comes through ${BRIEF_TOOL_NAME}. Even for "hi". Even for "thanks".

If you can answer right away, send the answer. If you need to go look \u2014 run a command, read files, check something \u2014 ack first in one line ("On it \u2014 checking the test output"), then work, then send the result. Without the ack they're staring at a spinner.

For longer work: ack \u2192 work \u2192 result. Between those, send a checkpoint when something useful happened \u2014 a decision you made, a surprise you hit, a phase boundary. Skip the filler ("running tests...") \u2014 a checkpoint earns its place by carrying information.

Keep messages tight \u2014 the decision, the file:line, the PR number. Second person always ("your config"), never third.`;
});

// packages/builtin-tools/src/tools/TaskOutputTool/constants.ts
var TASK_OUTPUT_TOOL_NAME = "TaskOutput";
var init_constants3 = () => {};

// packages/builtin-tools/src/tools/TaskStopTool/prompt.ts
var TASK_STOP_TOOL_NAME = "TaskStop", DESCRIPTION2 = `
- Stops a running background task by its ID
- Takes a task_id parameter identifying the task to stop
- Returns a success or failure status
- Use this tool when you need to terminate a long-running task
`;
var init_prompt2 = () => {};

// src/utils/permissions/permissionRuleParser.ts
function normalizeLegacyToolName(name) {
  return LEGACY_TOOL_NAME_ALIASES[name] ?? name;
}
function getLegacyToolNames(canonicalName) {
  const result = [];
  for (const [legacy, canonical] of Object.entries(LEGACY_TOOL_NAME_ALIASES)) {
    if (canonical === canonicalName)
      result.push(legacy);
  }
  return result;
}
function escapeRuleContent(content) {
  return content.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
function unescapeRuleContent(content) {
  return content.replace(/\\\(/g, "(").replace(/\\\)/g, ")").replace(/\\\\/g, "\\");
}
function permissionRuleValueFromString(ruleString) {
  const openParenIndex = findFirstUnescapedChar(ruleString, "(");
  if (openParenIndex === -1) {
    return { toolName: normalizeLegacyToolName(ruleString) };
  }
  const closeParenIndex = findLastUnescapedChar(ruleString, ")");
  if (closeParenIndex === -1 || closeParenIndex <= openParenIndex) {
    return { toolName: normalizeLegacyToolName(ruleString) };
  }
  if (closeParenIndex !== ruleString.length - 1) {
    return { toolName: normalizeLegacyToolName(ruleString) };
  }
  const toolName = ruleString.substring(0, openParenIndex);
  const rawContent = ruleString.substring(openParenIndex + 1, closeParenIndex);
  if (!toolName) {
    return { toolName: normalizeLegacyToolName(ruleString) };
  }
  if (rawContent === "" || rawContent === "*") {
    return { toolName: normalizeLegacyToolName(toolName) };
  }
  const ruleContent = unescapeRuleContent(rawContent);
  return { toolName: normalizeLegacyToolName(toolName), ruleContent };
}
function permissionRuleValueToString(ruleValue) {
  if (!ruleValue.ruleContent) {
    return ruleValue.toolName;
  }
  const escapedContent = escapeRuleContent(ruleValue.ruleContent);
  return `${ruleValue.toolName}(${escapedContent})`;
}
function findFirstUnescapedChar(str, char) {
  for (let i = 0;i < str.length; i++) {
    if (str[i] === char) {
      let backslashCount = 0;
      let j = i - 1;
      while (j >= 0 && str[j] === "\\") {
        backslashCount++;
        j--;
      }
      if (backslashCount % 2 === 0) {
        return i;
      }
    }
  }
  return -1;
}
function findLastUnescapedChar(str, char) {
  for (let i = str.length - 1;i >= 0; i--) {
    if (str[i] === char) {
      let backslashCount = 0;
      let j = i - 1;
      while (j >= 0 && str[j] === "\\") {
        backslashCount++;
        j--;
      }
      if (backslashCount % 2 === 0) {
        return i;
      }
    }
  }
  return -1;
}
var BRIEF_TOOL_NAME2, LEGACY_TOOL_NAME_ALIASES;
var init_permissionRuleParser = __esm(() => {
  init_constants2();
  init_constants3();
  init_prompt2();
  BRIEF_TOOL_NAME2 = (init_prompt(), __toCommonJS(exports_prompt)).BRIEF_TOOL_NAME;
  LEGACY_TOOL_NAME_ALIASES = {
    Task: AGENT_TOOL_NAME,
    KillShell: TASK_STOP_TOOL_NAME,
    AgentOutputTool: TASK_OUTPUT_TOOL_NAME,
    BashOutputTool: TASK_OUTPUT_TOOL_NAME,
    ...BRIEF_TOOL_NAME2 ? { Brief: BRIEF_TOOL_NAME2 } : {}
  };
});

// src/utils/stringUtils.ts
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function plural(n, word, pluralWord = word + "s") {
  return n === 1 ? word : pluralWord;
}
function firstLineOf(s) {
  const nl = s.indexOf(`
`);
  return nl === -1 ? s : s.slice(0, nl);
}
function countCharInString(str, char, start = 0) {
  let count2 = 0;
  let i = str.indexOf(char, start);
  while (i !== -1) {
    count2++;
    i = str.indexOf(char, i + 1);
  }
  return count2;
}
function normalizeFullWidthDigits(input) {
  return input.replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 65248));
}
function normalizeFullWidthSpace(input) {
  return input.replace(/\u3000/g, " ");
}
function safeJoinLines(lines, delimiter = ",", maxSize = MAX_STRING_LENGTH) {
  const truncationMarker = "...[truncated]";
  let result = "";
  for (const line of lines) {
    const delimiterToAdd = result ? delimiter : "";
    const fullAddition = delimiterToAdd + line;
    if (result.length + fullAddition.length <= maxSize) {
      result += fullAddition;
    } else {
      const remainingSpace = maxSize - result.length - delimiterToAdd.length - truncationMarker.length;
      if (remainingSpace > 0) {
        result += delimiterToAdd + line.slice(0, remainingSpace) + truncationMarker;
      } else {
        result += truncationMarker;
      }
      return result;
    }
  }
  return result;
}

class EndTruncatingAccumulator {
  maxSize;
  content = "";
  isTruncated = false;
  totalBytesReceived = 0;
  constructor(maxSize = MAX_STRING_LENGTH) {
    this.maxSize = maxSize;
  }
  append(data) {
    const str = typeof data === "string" ? data : data.toString();
    this.totalBytesReceived += str.length;
    if (this.isTruncated && this.content.length >= this.maxSize) {
      return;
    }
    if (this.content.length + str.length > this.maxSize) {
      const remainingSpace = this.maxSize - this.content.length;
      if (remainingSpace > 0) {
        this.content += str.slice(0, remainingSpace);
      }
      this.isTruncated = true;
    } else {
      this.content += str;
    }
  }
  toString() {
    if (!this.isTruncated) {
      return this.content;
    }
    const truncatedBytes = this.totalBytesReceived - this.maxSize;
    const truncatedKB = Math.round(truncatedBytes / 1024);
    return this.content + `
... [output truncated - ${truncatedKB}KB removed]`;
  }
  clear() {
    this.content = "";
    this.isTruncated = false;
    this.totalBytesReceived = 0;
  }
  get length() {
    return this.content.length;
  }
  get truncated() {
    return this.isTruncated;
  }
  get totalBytes() {
    return this.totalBytesReceived;
  }
}
function truncateToLines(text, maxLines) {
  const lines = text.split(`
`);
  if (lines.length <= maxLines) {
    return text;
  }
  return lines.slice(0, maxLines).join(`
`) + "\u2026";
}
var MAX_STRING_LENGTH;
var init_stringUtils = __esm(() => {
  MAX_STRING_LENGTH = 2 ** 21;
});

// src/entrypoints/sandboxTypes.ts
var SandboxNetworkConfigSchema, SandboxFilesystemConfigSchema, SandboxSettingsSchema;
var init_sandboxTypes = __esm(() => {
  init_v4();
  init_lazySchema();
  SandboxNetworkConfigSchema = lazySchema(() => exports_external.object({
    allowedDomains: exports_external.array(exports_external.string()).optional(),
    allowManagedDomainsOnly: exports_external.boolean().optional().describe("When true (and set in managed settings), only allowedDomains and WebFetch(domain:...) allow rules from managed settings are respected. " + "User, project, local, and flag settings domains are ignored. Denied domains are still respected from all sources."),
    allowUnixSockets: exports_external.array(exports_external.string()).optional().describe("macOS only: Unix socket paths to allow. Ignored on Linux (seccomp cannot filter by path)."),
    allowAllUnixSockets: exports_external.boolean().optional().describe("If true, allow all Unix sockets (disables blocking on both platforms)."),
    allowLocalBinding: exports_external.boolean().optional(),
    httpProxyPort: exports_external.number().optional(),
    socksProxyPort: exports_external.number().optional()
  }).optional());
  SandboxFilesystemConfigSchema = lazySchema(() => exports_external.object({
    allowWrite: exports_external.array(exports_external.string()).optional().describe("Additional paths to allow writing within the sandbox. " + "Merged with paths from Edit(...) allow permission rules."),
    denyWrite: exports_external.array(exports_external.string()).optional().describe("Additional paths to deny writing within the sandbox. " + "Merged with paths from Edit(...) deny permission rules."),
    denyRead: exports_external.array(exports_external.string()).optional().describe("Additional paths to deny reading within the sandbox. " + "Merged with paths from Read(...) deny permission rules."),
    allowRead: exports_external.array(exports_external.string()).optional().describe("Paths to re-allow reading within denyRead regions. " + "Takes precedence over denyRead for matching paths."),
    allowManagedReadPathsOnly: exports_external.boolean().optional().describe("When true (set in managed settings), only allowRead paths from policySettings are used.")
  }).optional());
  SandboxSettingsSchema = lazySchema(() => exports_external.object({
    enabled: exports_external.boolean().optional(),
    failIfUnavailable: exports_external.boolean().optional().describe("Exit with an error at startup if sandbox.enabled is true but the sandbox cannot start " + "(missing dependencies, unsupported platform, or platform not in enabledPlatforms). " + "When false (default), a warning is shown and commands run unsandboxed. " + "Intended for managed-settings deployments that require sandboxing as a hard gate."),
    autoAllowBashIfSandboxed: exports_external.boolean().optional(),
    allowUnsandboxedCommands: exports_external.boolean().optional().describe("Allow commands to run outside the sandbox via the dangerouslyDisableSandbox parameter. " + "When false, the dangerouslyDisableSandbox parameter is completely ignored and all commands must run sandboxed. " + "Default: true."),
    network: SandboxNetworkConfigSchema(),
    filesystem: SandboxFilesystemConfigSchema(),
    ignoreViolations: exports_external.record(exports_external.string(), exports_external.array(exports_external.string())).optional(),
    enableWeakerNestedSandbox: exports_external.boolean().optional(),
    enableWeakerNetworkIsolation: exports_external.boolean().optional().describe("macOS only: Allow access to com.apple.trustd.agent in the sandbox. " + "Needed for Go-based CLI tools (gh, gcloud, terraform, etc.) to verify TLS certificates " + "when using httpProxyPort with a MITM proxy and custom CA. " + "**Reduces security** \u2014 opens a potential data exfiltration vector through the trustd service. Default: false"),
    excludedCommands: exports_external.array(exports_external.string()).optional(),
    ripgrep: exports_external.object({
      command: exports_external.string(),
      args: exports_external.array(exports_external.string()).optional()
    }).optional().describe("Custom ripgrep configuration for bundled ripgrep support")
  }).passthrough());
});

// src/utils/settings/toolValidationConfig.ts
function isFilePatternTool(toolName) {
  return TOOL_VALIDATION_CONFIG.filePatternTools.includes(toolName);
}
function isBashPrefixTool(toolName) {
  return TOOL_VALIDATION_CONFIG.bashPrefixTools.includes(toolName);
}
function getCustomValidation(toolName) {
  return TOOL_VALIDATION_CONFIG.customValidation[toolName];
}
var TOOL_VALIDATION_CONFIG;
var init_toolValidationConfig = __esm(() => {
  TOOL_VALIDATION_CONFIG = {
    filePatternTools: [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "NotebookRead",
      "NotebookEdit"
    ],
    bashPrefixTools: ["Bash"],
    customValidation: {
      WebSearch: (content) => {
        if (content.includes("*") || content.includes("?")) {
          return {
            valid: false,
            error: "WebSearch does not support wildcards",
            suggestion: "Use exact search terms without * or ?",
            examples: ["WebSearch(claude ai)", "WebSearch(typescript tutorial)"]
          };
        }
        return { valid: true };
      },
      WebFetch: (content) => {
        if (content.includes("://") || content.startsWith("http")) {
          return {
            valid: false,
            error: "WebFetch permissions use domain format, not URLs",
            suggestion: 'Use "domain:hostname" format',
            examples: [
              "WebFetch(domain:example.com)",
              "WebFetch(domain:github.com)"
            ]
          };
        }
        if (!content.startsWith("domain:")) {
          return {
            valid: false,
            error: 'WebFetch permissions must use "domain:" prefix',
            suggestion: 'Use "domain:hostname" format',
            examples: [
              "WebFetch(domain:example.com)",
              "WebFetch(domain:*.google.com)"
            ]
          };
        }
        return { valid: true };
      }
    }
  };
});

// src/utils/settings/permissionValidation.ts
function isEscaped(str, index) {
  let backslashCount = 0;
  let j = index - 1;
  while (j >= 0 && str[j] === "\\") {
    backslashCount++;
    j--;
  }
  return backslashCount % 2 !== 0;
}
function countUnescapedChar(str, char) {
  let count2 = 0;
  for (let i = 0;i < str.length; i++) {
    if (str[i] === char && !isEscaped(str, i)) {
      count2++;
    }
  }
  return count2;
}
function hasUnescapedEmptyParens(str) {
  for (let i = 0;i < str.length - 1; i++) {
    if (str[i] === "(" && str[i + 1] === ")") {
      if (!isEscaped(str, i)) {
        return true;
      }
    }
  }
  return false;
}
function validatePermissionRule(rule, behavior) {
  if (!rule || rule.trim() === "") {
    return { valid: false, error: "Permission rule cannot be empty" };
  }
  const openCount = countUnescapedChar(rule, "(");
  const closeCount = countUnescapedChar(rule, ")");
  if (openCount !== closeCount) {
    return {
      valid: false,
      error: "Mismatched parentheses",
      suggestion: "Ensure all opening parentheses have matching closing parentheses"
    };
  }
  if (hasUnescapedEmptyParens(rule)) {
    const toolName = rule.substring(0, rule.indexOf("("));
    if (!toolName) {
      return {
        valid: false,
        error: "Empty parentheses with no tool name",
        suggestion: "Specify a tool name before the parentheses"
      };
    }
    return {
      valid: false,
      error: "Empty parentheses",
      suggestion: `Either specify a pattern or use just "${toolName}" without parentheses`,
      examples: [`${toolName}`, `${toolName}(some-pattern)`]
    };
  }
  const parsed = permissionRuleValueFromString(rule);
  const mcpInfo = mcpInfoFromString(parsed.toolName);
  if (mcpInfo) {
    if (parsed.ruleContent !== undefined || countUnescapedChar(rule, "(") > 0) {
      return {
        valid: false,
        error: "MCP rules do not support patterns in parentheses",
        suggestion: `Use "${parsed.toolName}" without parentheses, or use "mcp__${mcpInfo.serverName}__*" for all tools`,
        examples: [
          `mcp__${mcpInfo.serverName}`,
          `mcp__${mcpInfo.serverName}__*`,
          mcpInfo.toolName && mcpInfo.toolName !== "*" ? `mcp__${mcpInfo.serverName}__${mcpInfo.toolName}` : undefined
        ].filter(Boolean)
      };
    }
    return { valid: true };
  }
  if (!parsed.toolName || parsed.toolName.length === 0) {
    return { valid: false, error: "Tool name cannot be empty" };
  }
  if (parsed.toolName[0] !== parsed.toolName[0]?.toUpperCase()) {
    return {
      valid: false,
      error: "Tool names must start with uppercase",
      suggestion: `Use "${capitalize(String(parsed.toolName))}"`
    };
  }
  const customValidation = getCustomValidation(parsed.toolName);
  if (customValidation && parsed.ruleContent !== undefined) {
    const customResult = customValidation(parsed.ruleContent);
    if (!customResult.valid) {
      return customResult;
    }
  }
  if (isBashPrefixTool(parsed.toolName) && parsed.ruleContent !== undefined) {
    const content = parsed.ruleContent;
    if (content.includes(":*") && !content.endsWith(":*")) {
      return {
        valid: false,
        error: "The :* pattern must be at the end",
        suggestion: "Move :* to the end for prefix matching, or use * for wildcard matching",
        examples: [
          "Bash(npm run:*) - prefix matching (legacy)",
          "Bash(npm run *) - wildcard matching"
        ]
      };
    }
    if (content === ":*") {
      return {
        valid: false,
        error: "Prefix cannot be empty before :*",
        suggestion: "Specify a command prefix before :*",
        examples: ["Bash(npm:*)", "Bash(git:*)"]
      };
    }
  }
  if (isFilePatternTool(parsed.toolName) && parsed.ruleContent !== undefined) {
    const content = parsed.ruleContent;
    if (content.includes(":*")) {
      return {
        valid: false,
        error: 'The ":*" syntax is only for Bash prefix rules',
        suggestion: 'Use glob patterns like "*" or "**" for file matching',
        examples: [
          `${parsed.toolName}(*.ts) - matches .ts files`,
          `${parsed.toolName}(src/**) - matches all files in src`,
          `${parsed.toolName}(**/*.test.ts) - matches test files`
        ]
      };
    }
    if (content.includes("*") && !content.match(/^\*|\*$|\*\*|\/\*|\*\.|\*\)/) && !content.includes("**")) {
      return {
        valid: false,
        error: "Wildcard placement might be incorrect",
        suggestion: "Wildcards are typically used at path boundaries",
        examples: [
          `${parsed.toolName}(*.js) - all .js files`,
          `${parsed.toolName}(src/*) - all files directly in src`,
          `${parsed.toolName}(src/**) - all files recursively in src`
        ]
      };
    }
  }
  if (parsed && parsed.toolName === "VaultHttpFetch" && parsed.ruleContent !== undefined) {
    const rc = parsed.ruleContent;
    if (rc.length > 384) {
      return {
        valid: false,
        error: `VaultHttpFetch rule content is too long (${rc.length} chars; max 384)`,
        suggestion: "Use a shorter key name and host, or use the wildcard form <key>@*"
      };
    }
    if (/[\x00-\x1F\x7F]/.test(rc)) {
      return {
        valid: false,
        error: "VaultHttpFetch rule content contains control characters (only printable ASCII allowed in key@host)",
        suggestion: "Remove control characters from the rule content"
      };
    }
  }
  if (parsed && parsed.toolName === "VaultHttpFetch" && behavior === "deny" && parsed.ruleContent !== undefined && !/^[A-Za-z0-9._-]{1,128}@(?:\*|(?:\[[A-Fa-f0-9:]+\]|[A-Za-z0-9.-]{1,253})(?::(?:[1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?)$/.test(parsed.ruleContent)) {
    return {
      valid: false,
      error: `VaultHttpFetch deny rule content must be '<key>@<host>' or '<key>@*' (or whole-tool deny without parentheses for kill switch)`,
      suggestion: `Found '${parsed.ruleContent}'. Use 'VaultHttpFetch' (no parens) for kill switch, or 'VaultHttpFetch(${parsed.ruleContent}@*)' for any-host.`,
      examples: [
        "VaultHttpFetch \u2014 whole-tool kill switch",
        `VaultHttpFetch(${parsed.ruleContent}@api.github.com)`,
        `VaultHttpFetch(${parsed.ruleContent}@*)`
      ]
    };
  }
  if (behavior === "allow" && parsed) {
    if (parsed.ruleContent === undefined && VAULT_WHOLE_TOOL_ALLOW_FORBIDDEN.has(parsed.toolName)) {
      return {
        valid: false,
        error: `Whole-tool allow forbidden for vault tool '${parsed.toolName}'`,
        suggestion: `Use per-key + per-host allow: '${parsed.toolName}(your-key-name@host)'`,
        examples: [
          `${parsed.toolName}(github-token@api.github.com)`,
          `${parsed.toolName}(my-api@*) - allow any host (advanced)`
        ]
      };
    }
    if (parsed.toolName === "VaultHttpFetch" && parsed.ruleContent !== undefined && !/^[A-Za-z0-9._-]{1,128}@(?:\*|(?:\[[A-Fa-f0-9:]+\]|[A-Za-z0-9.-]{1,253})(?::(?:[1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?)$/.test(parsed.ruleContent)) {
      return {
        valid: false,
        error: `VaultHttpFetch rule content must be '<key>@<host>' or '<key>@*'`,
        suggestion: `Found '${parsed.ruleContent}'. Use e.g. 'github-token@api.github.com' or 'admin-key@127.0.0.1:8443' to bind a key to a host.`,
        examples: [
          "VaultHttpFetch(github-token@api.github.com)",
          "VaultHttpFetch(local-admin@localhost:8443)",
          "VaultHttpFetch(stripe-key@*) - any host (advanced)"
        ]
      };
    }
  }
  return { valid: true };
}
var VAULT_WHOLE_TOOL_ALLOW_FORBIDDEN, PermissionRuleSchema;
var init_permissionValidation = __esm(() => {
  init_v4();
  init_mcpStringUtils();
  init_lazySchema();
  init_permissionRuleParser();
  init_stringUtils();
  init_toolValidationConfig();
  VAULT_WHOLE_TOOL_ALLOW_FORBIDDEN = new Set([
    "LocalVaultFetch",
    "VaultHttpFetch"
  ]);
  PermissionRuleSchema = lazySchema(() => exports_external.string().superRefine((val, ctx) => {
    const result = validatePermissionRule(val);
    if (!result.valid) {
      let message = result.error;
      if (result.suggestion) {
        message += `. ${result.suggestion}`;
      }
      if (result.examples && result.examples.length > 0) {
        message += `. Examples: ${result.examples.join(", ")}`;
      }
      ctx.addIssue({
        code: exports_external.ZodIssueCode.custom,
        message,
        params: { received: val }
      });
    }
  }));
});

// src/utils/settings/types.ts
function isMcpServerNameEntry(entry) {
  return "serverName" in entry && entry.serverName !== undefined;
}
function isMcpServerCommandEntry(entry) {
  return "serverCommand" in entry && entry.serverCommand !== undefined;
}
function isMcpServerUrlEntry(entry) {
  return "serverUrl" in entry && entry.serverUrl !== undefined;
}
var EnvironmentVariablesSchema, PermissionsSchema, ExtraKnownMarketplaceSchema, AllowedMcpServerEntrySchema, DeniedMcpServerEntrySchema, CUSTOMIZATION_SURFACES, SettingsSchema;
var init_types2 = __esm(() => {
  init_v4();
  init_sandboxTypes();
  init_envUtils();
  init_lazySchema();
  init_PermissionMode();
  init_schemas();
  init_constants();
  init_permissionValidation();
  init_hooks();
  init_hooks();
  init_array();
  EnvironmentVariablesSchema = lazySchema(() => exports_external.record(exports_external.string(), exports_external.coerce.string()));
  PermissionsSchema = lazySchema(() => exports_external.object({
    allow: exports_external.array(PermissionRuleSchema()).optional().describe("List of permission rules for allowed operations"),
    deny: exports_external.array(PermissionRuleSchema()).optional().describe("List of permission rules for denied operations"),
    ask: exports_external.array(PermissionRuleSchema()).optional().describe("List of permission rules that should always prompt for confirmation"),
    defaultMode: exports_external.enum(PERMISSION_MODES).optional().describe("Default permission mode when AgentFlow-Code needs access"),
    disableBypassPermissionsMode: exports_external.enum(["disable"]).optional().describe("Disable the ability to bypass permission prompts"),
    ...{
      disableAutoMode: exports_external.enum(["disable"]).optional().describe("Disable auto mode")
    },
    additionalDirectories: exports_external.array(exports_external.string()).optional().describe("Additional directories to include in the permission scope")
  }).passthrough());
  ExtraKnownMarketplaceSchema = lazySchema(() => exports_external.object({
    source: MarketplaceSourceSchema().describe("Where to fetch the marketplace from"),
    installLocation: exports_external.string().optional().describe("Local cache path where marketplace manifest is stored (auto-generated if not provided)"),
    autoUpdate: exports_external.boolean().optional().describe("Whether to automatically update this marketplace and its installed plugins on startup")
  }));
  AllowedMcpServerEntrySchema = lazySchema(() => exports_external.object({
    serverName: exports_external.string().regex(/^[a-zA-Z0-9_-]+$/, "Server name can only contain letters, numbers, hyphens, and underscores").optional().describe("Name of the MCP server that users are allowed to configure"),
    serverCommand: exports_external.array(exports_external.string()).min(1, "Server command must have at least one element (the command)").optional().describe("Command array [command, ...args] to match exactly for allowed stdio servers"),
    serverUrl: exports_external.string().optional().describe('URL pattern with wildcard support (e.g., "https://*.example.com/*") for allowed remote MCP servers')
  }).refine((data) => {
    const defined = count([
      data.serverName !== undefined,
      data.serverCommand !== undefined,
      data.serverUrl !== undefined
    ], Boolean);
    return defined === 1;
  }, {
    message: 'Entry must have exactly one of "serverName", "serverCommand", or "serverUrl"'
  }));
  DeniedMcpServerEntrySchema = lazySchema(() => exports_external.object({
    serverName: exports_external.string().regex(/^[a-zA-Z0-9_-]+$/, "Server name can only contain letters, numbers, hyphens, and underscores").optional().describe("Name of the MCP server that is explicitly blocked"),
    serverCommand: exports_external.array(exports_external.string()).min(1, "Server command must have at least one element (the command)").optional().describe("Command array [command, ...args] to match exactly for blocked stdio servers"),
    serverUrl: exports_external.string().optional().describe('URL pattern with wildcard support (e.g., "https://*.example.com/*") for blocked remote MCP servers')
  }).refine((data) => {
    const defined = count([
      data.serverName !== undefined,
      data.serverCommand !== undefined,
      data.serverUrl !== undefined
    ], Boolean);
    return defined === 1;
  }, {
    message: 'Entry must have exactly one of "serverName", "serverCommand", or "serverUrl"'
  }));
  CUSTOMIZATION_SURFACES = [
    "skills",
    "agents",
    "hooks",
    "mcp"
  ];
  SettingsSchema = lazySchema(() => exports_external.object({
    $schema: exports_external.literal(CLAUDE_CODE_SETTINGS_SCHEMA_URL).optional().describe("JSON Schema reference for AgentFlow-Code settings"),
    apiKeyHelper: exports_external.string().optional().describe("Path to a script that outputs authentication values"),
    awsCredentialExport: exports_external.string().optional().describe("Path to a script that exports AWS credentials"),
    awsAuthRefresh: exports_external.string().optional().describe("Path to a script that refreshes AWS authentication"),
    gcpAuthRefresh: exports_external.string().optional().describe("Command to refresh GCP authentication (e.g., gcloud auth application-default login)"),
    ...isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_XAA) ? {
      xaaIdp: exports_external.object({
        issuer: exports_external.string().url().describe("IdP issuer URL for OIDC discovery"),
        clientId: exports_external.string().describe("AgentFlow-Code's client_id registered at the IdP"),
        callbackPort: exports_external.number().int().positive().optional().describe("Fixed loopback callback port for the IdP OIDC login. " + "Only needed if the IdP does not honor RFC 8252 port-any matching.")
      }).optional().describe("XAA (SEP-990) IdP connection. Configure once; all XAA-enabled MCP servers reuse this.")
    } : {},
    fileSuggestion: exports_external.object({
      type: exports_external.literal("command"),
      command: exports_external.string()
    }).optional().describe("Custom file suggestion configuration for @ mentions"),
    respectGitignore: exports_external.boolean().optional().describe("Whether file picker should respect .gitignore files (default: true). " + "Note: .ignore files are always respected."),
    cleanupPeriodDays: exports_external.number().nonnegative().int().optional().describe("Number of days to retain chat transcripts (default: 30). Setting to 0 disables session persistence entirely: no transcripts are written and existing transcripts are deleted at startup."),
    env: EnvironmentVariablesSchema().optional().describe("Environment variables to set for AgentFlow-Code sessions"),
    attribution: exports_external.object({
      commit: exports_external.string().optional().describe("Attribution text for git commits, including any trailers. " + "Empty string hides attribution."),
      pr: exports_external.string().optional().describe("Attribution text for pull request descriptions. " + "Empty string hides attribution.")
    }).optional().describe("Customize attribution text for commits and PRs. " + "Each field defaults to the standard AgentFlow-Code attribution if not set."),
    includeCoAuthoredBy: exports_external.boolean().optional().describe("Deprecated: Use attribution instead. " + "Whether to include Claude's co-authored by attribution in commits and PRs (defaults to true)"),
    includeGitInstructions: exports_external.boolean().optional().describe("Include built-in commit and PR workflow instructions in Claude's system prompt (default: true)"),
    permissions: PermissionsSchema().optional().describe("Tool usage permissions configuration"),
    modelType: exports_external.enum(["anthropic", "openai", "gemini", "grok"]).optional().describe('API provider type. "anthropic" uses the AgentFlow API (default), "openai" uses the OpenAI Chat Completions API, "gemini" uses the Gemini API, and "grok" uses the xAI Grok API (OpenAI-compatible). ' + 'When set to "openai", configure OPENAI_API_KEY, OPENAI_BASE_URL, and OPENAI_MODEL. When set to "gemini", configure GEMINI_API_KEY and optional GEMINI_BASE_URL. When set to "grok", configure GROK_API_KEY (or XAI_API_KEY), optional GROK_BASE_URL, GROK_MODEL, and GROK_MODEL_MAP.'),
    model: exports_external.string().optional().describe("Override the default model used by AgentFlow-Code"),
    availableModels: exports_external.array(exports_external.string()).optional().describe("Allowlist of models that users can select. " + 'Accepts family aliases ("opus" allows any opus version), ' + 'version prefixes ("opus-4-5" allows only that version), ' + "and full model IDs. " + "If undefined, all models are available. If empty array, only the default model is available. " + "Typically set in managed settings by enterprise administrators."),
    modelOverrides: exports_external.record(exports_external.string(), exports_external.string()).optional().describe('Override mapping from AgentFlow model ID (e.g. "claude-opus-4-6") to provider-specific ' + "model ID (e.g. a Bedrock inference profile ARN). Typically set in managed settings by " + "enterprise administrators."),
    enableAllProjectMcpServers: exports_external.boolean().optional().describe("Whether to automatically approve all MCP servers in the project"),
    enabledMcpjsonServers: exports_external.array(exports_external.string()).optional().describe("List of approved MCP servers from .mcp.json"),
    disabledMcpjsonServers: exports_external.array(exports_external.string()).optional().describe("List of rejected MCP servers from .mcp.json"),
    allowedMcpServers: exports_external.array(AllowedMcpServerEntrySchema()).optional().describe("Enterprise allowlist of MCP servers that can be used. " + "Applies to all scopes including enterprise servers from managed-mcp.json. " + "If undefined, all servers are allowed. If empty array, no servers are allowed. " + "Denylist takes precedence - if a server is on both lists, it is denied."),
    deniedMcpServers: exports_external.array(DeniedMcpServerEntrySchema()).optional().describe("Enterprise denylist of MCP servers that are explicitly blocked. " + "If a server is on the denylist, it will be blocked across all scopes including enterprise. " + "Denylist takes precedence over allowlist - if a server is on both lists, it is denied."),
    hooks: HooksSchema().optional().describe("Custom commands to run before/after tool executions"),
    worktree: exports_external.object({
      symlinkDirectories: exports_external.array(exports_external.string()).optional().describe("Directories to symlink from main repository to worktrees to avoid disk bloat. " + "Must be explicitly configured - no directories are symlinked by default. " + 'Common examples: "node_modules", ".cache", ".bin"'),
      sparsePaths: exports_external.array(exports_external.string()).optional().describe("Directories to include when creating worktrees, via git sparse-checkout (cone mode). " + "Dramatically faster in large monorepos \u2014 only the listed paths are written to disk.")
    }).optional().describe("Git worktree configuration for --worktree flag."),
    disableAllHooks: exports_external.boolean().optional().describe("Disable all hooks and statusLine execution"),
    defaultShell: exports_external.enum(["bash", "powershell"]).optional().describe("Default shell for input-box ! commands. " + "Defaults to 'bash' on all platforms (no Windows auto-flip)."),
    allowManagedHooksOnly: exports_external.boolean().optional().describe("When true (and set in managed settings), only hooks from managed settings run. " + "User, project, and local hooks are ignored."),
    allowedHttpHookUrls: exports_external.array(exports_external.string()).optional().describe("Allowlist of URL patterns that HTTP hooks may target. " + 'Supports * as a wildcard (e.g. "https://hooks.example.com/*"). ' + "When set, HTTP hooks with non-matching URLs are blocked. " + "If undefined, all URLs are allowed. If empty array, no HTTP hooks are allowed. " + "Arrays merge across settings sources (same semantics as allowedMcpServers)."),
    httpHookAllowedEnvVars: exports_external.array(exports_external.string()).optional().describe("Allowlist of environment variable names HTTP hooks may interpolate into headers. " + "When set, each hook's effective allowedEnvVars is the intersection with this list. " + "If undefined, no restriction is applied. " + "Arrays merge across settings sources (same semantics as allowedMcpServers)."),
    allowManagedPermissionRulesOnly: exports_external.boolean().optional().describe("When true (and set in managed settings), only permission rules (allow/deny/ask) from managed settings are respected. " + "User, project, local, and CLI argument permission rules are ignored."),
    allowManagedMcpServersOnly: exports_external.boolean().optional().describe("When true (and set in managed settings), allowedMcpServers is only read from managed settings. " + "deniedMcpServers still merges from all sources, so users can deny servers for themselves. " + "Users can still add their own MCP servers, but only the admin-defined allowlist applies."),
    strictPluginOnlyCustomization: exports_external.preprocess((v) => Array.isArray(v) ? v.filter((x) => CUSTOMIZATION_SURFACES.includes(x)) : v, exports_external.union([exports_external.boolean(), exports_external.array(exports_external.enum(CUSTOMIZATION_SURFACES))])).optional().catch(undefined).describe("When set in managed settings, blocks non-plugin customization sources for the listed surfaces. " + 'Array form locks specific surfaces (e.g. ["skills", "hooks"]); `true` locks all four; `false` is an explicit no-op. ' + "Blocked: ~/.claude/{surface}/, .claude/{surface}/ (project), settings.json hooks, .mcp.json. " + "NOT blocked: managed (policySettings) sources, plugin-provided customizations. " + "Composes with strictKnownMarketplaces for end-to-end admin control \u2014 plugins gated by " + "marketplace allowlist, everything else blocked here."),
    statusLine: exports_external.object({
      type: exports_external.literal("command"),
      command: exports_external.string(),
      padding: exports_external.number().optional(),
      refreshInterval: exports_external.number().optional()
    }).optional().describe("Custom status line display configuration"),
    statusLineEnabled: exports_external.boolean().optional().describe("Whether to render the fork built-in status line (model + ctx + 5h/7d limits + cost + cache pill). Toggled with /statusline."),
    enabledPlugins: exports_external.record(exports_external.string(), exports_external.union([exports_external.array(exports_external.string()), exports_external.boolean(), exports_external.undefined()])).optional().describe('Enabled plugins using plugin-id@marketplace-id format. Example: { "formatter@anthropic-tools": true }. Also supports extended format with version constraints.'),
    extraKnownMarketplaces: exports_external.record(exports_external.string(), ExtraKnownMarketplaceSchema()).check((ctx) => {
      for (const [key, entry] of Object.entries(ctx.value)) {
        if (entry.source.source === "settings" && entry.source.name !== key) {
          ctx.issues.push({
            code: "custom",
            input: entry.source.name,
            path: [key, "source", "name"],
            message: `Settings-sourced marketplace name must match its extraKnownMarketplaces key ` + `(got key "${key}" but source.name "${entry.source.name}")`
          });
        }
      }
    }).optional().describe("Additional marketplaces to make available for this repository. Typically used in repository .claude/settings.json to ensure team members have required plugin sources."),
    strictKnownMarketplaces: exports_external.array(MarketplaceSourceSchema()).optional().describe("Enterprise strict list of allowed marketplace sources. When set in managed settings, " + "ONLY these exact sources can be added as marketplaces. The check happens BEFORE " + "downloading, so blocked sources never touch the filesystem. " + "Note: this is a policy gate only \u2014 it does NOT register marketplaces. " + "To pre-register allowed marketplaces for users, also set extraKnownMarketplaces."),
    blockedMarketplaces: exports_external.array(MarketplaceSourceSchema()).optional().describe("Enterprise blocklist of marketplace sources. When set in managed settings, " + "these exact sources are blocked from being added as marketplaces. The check happens BEFORE " + "downloading, so blocked sources never touch the filesystem."),
    forceLoginMethod: exports_external.enum(["claudeai", "console"]).optional().describe('Force a specific login method: "claudeai" for Claude Pro/Max, "console" for Console billing'),
    forceLoginOrgUUID: exports_external.string().optional().describe("Organization UUID to use for OAuth login"),
    otelHeadersHelper: exports_external.string().optional().describe("Path to a script that outputs OpenTelemetry headers"),
    outputStyle: exports_external.string().optional().describe("Controls the output style for assistant responses"),
    language: exports_external.string().optional().describe('Preferred language for Claude responses and voice dictation (e.g., "japanese", "spanish")'),
    skipWebFetchPreflight: exports_external.boolean().optional().describe("Skip the WebFetch blocklist check for enterprise environments with restrictive security policies"),
    sandbox: SandboxSettingsSchema().optional(),
    feedbackSurveyRate: exports_external.number().min(0).max(1).optional().describe("Probability (0\u20131) that the session quality survey appears when eligible. 0.05 is a reasonable starting point."),
    spinnerTipsEnabled: exports_external.boolean().optional().describe("Whether to show tips in the spinner"),
    spinnerVerbs: exports_external.object({
      mode: exports_external.enum(["append", "replace"]),
      verbs: exports_external.array(exports_external.string())
    }).optional().describe('Customize spinner verbs. mode: "append" adds verbs to defaults, "replace" uses only your verbs.'),
    spinnerTipsOverride: exports_external.object({
      excludeDefault: exports_external.boolean().optional(),
      tips: exports_external.array(exports_external.string())
    }).optional().describe("Override spinner tips. tips: array of tip strings. excludeDefault: if true, only show custom tips (default: false)."),
    syntaxHighlightingDisabled: exports_external.boolean().optional().describe("Whether to disable syntax highlighting in diffs"),
    terminalTitleFromRename: exports_external.boolean().optional().describe("Whether /rename updates the terminal tab title (defaults to true). Set to false to keep auto-generated topic titles."),
    alwaysThinkingEnabled: exports_external.boolean().optional().describe("When false, thinking is disabled. When absent or true, thinking is " + "enabled automatically for supported models."),
    effortLevel: exports_external.enum(process.env.USER_TYPE === "ant" ? ["low", "medium", "high", "xhigh", "max"] : ["low", "medium", "high", "xhigh"]).optional().catch(undefined).describe("Persisted effort level for supported models."),
    advisorModel: exports_external.string().optional().describe("Advisor model for the server-side advisor tool."),
    fastMode: exports_external.boolean().optional().describe("When true, fast mode is enabled. When absent or false, fast mode is off."),
    fastModePerSessionOptIn: exports_external.boolean().optional().describe("When true, fast mode does not persist across sessions. Each session starts with fast mode off."),
    promptSuggestionEnabled: exports_external.boolean().optional().describe("When false, prompt suggestions are disabled. When absent or true, " + "prompt suggestions are enabled."),
    poorMode: exports_external.boolean().optional().describe("When true, poor mode is active \u2014 extract_memories and prompt_suggestion are disabled to save tokens."),
    showClearContextOnPlanAccept: exports_external.boolean().optional().describe('When true, the plan-approval dialog offers a "clear context" option. Defaults to false.'),
    agent: exports_external.string().optional().describe("Name of an agent (built-in or custom) to use for the main thread. " + "Applies the agent's system prompt, tool restrictions, and model."),
    companyAnnouncements: exports_external.array(exports_external.string()).optional().describe("Company announcements to display at startup (one will be randomly selected if multiple are provided)"),
    pluginConfigs: exports_external.record(exports_external.string(), exports_external.object({
      mcpServers: exports_external.record(exports_external.string(), exports_external.record(exports_external.string(), exports_external.union([
        exports_external.string(),
        exports_external.number(),
        exports_external.boolean(),
        exports_external.array(exports_external.string())
      ]))).optional().describe("User configuration values for MCP servers keyed by server name"),
      options: exports_external.record(exports_external.string(), exports_external.union([
        exports_external.string(),
        exports_external.number(),
        exports_external.boolean(),
        exports_external.array(exports_external.string())
      ])).optional().describe("Non-sensitive option values from plugin manifest userConfig, keyed by option name. Sensitive values go to secure storage instead.")
    })).optional().describe("Per-plugin configuration including MCP server user configs, keyed by plugin ID (plugin@marketplace format)"),
    remote: exports_external.object({
      defaultEnvironmentId: exports_external.string().optional().describe("Default environment ID to use for remote sessions")
    }).optional().describe("Remote session configuration"),
    autoUpdatesChannel: exports_external.enum(["latest", "stable"]).optional().describe("Release channel for auto-updates (latest or stable)"),
    ...{
      disableDeepLinkRegistration: exports_external.enum(["disable"]).optional().describe("Prevent claude-cli:// protocol handler registration with the OS")
    },
    minimumVersion: exports_external.string().optional().describe("Minimum version to stay on - prevents downgrades when switching to stable channel"),
    plansDirectory: exports_external.string().optional().describe("Custom directory for plan files, relative to project root. " + "If not set, defaults to ~/.claude/plans/"),
    ...process.env.USER_TYPE === "ant" ? {
      classifierPermissionsEnabled: exports_external.boolean().optional().describe("Enable AI-based classification for Bash(prompt:...) permission rules")
    } : {},
    ...{
      minSleepDurationMs: exports_external.number().nonnegative().int().optional().describe("Minimum duration in milliseconds that the Sleep tool must sleep for. " + "Useful for throttling proactive tick frequency."),
      maxSleepDurationMs: exports_external.number().int().min(-1).optional().describe("Maximum duration in milliseconds that the Sleep tool can sleep for. " + "Set to -1 for indefinite sleep (waits for user input). " + "Useful for limiting idle time in remote/managed environments.")
    },
    ...{
      voiceEnabled: exports_external.boolean().optional().describe("Enable voice mode (hold-to-talk dictation)"),
      voiceProvider: exports_external.enum(["anthropic", "doubao"]).optional().describe('Voice STT backend: "anthropic" (default) or "doubao" (Doubao ASR)')
    },
    ...{
      assistant: exports_external.boolean().optional().describe("Start Claude in assistant mode (custom system prompt, brief view, scheduled check-in skills)"),
      assistantName: exports_external.string().optional().describe("Display name for the assistant, shown in the claude.ai session list")
    },
    channelsEnabled: exports_external.boolean().optional().describe("Teams/Enterprise opt-in for channel notifications (MCP servers with the " + "claude/channel capability pushing inbound messages). Default off. " + "Set true to allow; users then select servers via --channels."),
    allowedChannelPlugins: exports_external.array(exports_external.object({
      marketplace: exports_external.string(),
      plugin: exports_external.string()
    })).optional().describe("Teams/Enterprise allowlist of channel plugins. When set, " + "replaces the default AgentFlow allowlist \u2014 admins decide which " + "plugins may push inbound messages. Undefined falls back to the default. " + "Requires channelsEnabled: true."),
    ...{
      defaultView: exports_external.enum(["chat", "transcript"]).optional().describe("Default transcript view: chat (SendUserMessage checkpoints only) or transcript (full)")
    },
    prefersReducedMotion: exports_external.boolean().optional().describe("Reduce or disable animations for accessibility (spinner shimmer, flash effects, etc.)"),
    autoMemoryEnabled: exports_external.boolean().optional().describe("Enable auto-memory for this project. When false, Claude will not read from or write to the auto-memory directory."),
    autoMemoryDirectory: exports_external.string().optional().describe("Custom directory path for auto-memory storage. Supports ~/ prefix for home directory expansion. Ignored if set in projectSettings (checked-in .claude/settings.json) for security. When unset, defaults to ~/.claude/projects/<sanitized-cwd>/memory/."),
    autoDreamEnabled: exports_external.boolean().optional().describe("Enable background memory consolidation (auto-dream). When set, overrides the server-side default."),
    showThinkingSummaries: exports_external.boolean().optional().describe("Show thinking summaries in the transcript view (ctrl+o). Default: false."),
    skipDangerousModePermissionPrompt: exports_external.boolean().optional().describe("Whether the user has accepted the bypass permissions mode dialog"),
    ...{
      skipAutoPermissionPrompt: exports_external.boolean().optional().describe("Whether the user has accepted the auto mode opt-in dialog"),
      useAutoModeDuringPlan: exports_external.boolean().optional().describe("Whether plan mode uses auto mode semantics when auto mode is available (default: true)"),
      autoMode: exports_external.object({
        allow: exports_external.array(exports_external.string()).optional().describe("Rules for the auto mode classifier allow section"),
        soft_deny: exports_external.array(exports_external.string()).optional().describe("Rules for the auto mode classifier deny section"),
        ...process.env.USER_TYPE === "ant" ? {
          deny: exports_external.array(exports_external.string()).optional()
        } : {},
        environment: exports_external.array(exports_external.string()).optional().describe("Entries for the auto mode classifier environment section")
      }).optional().describe("Auto mode classifier prompt customization")
    },
    disableAutoMode: exports_external.enum(["disable"]).optional().describe("Disable auto mode"),
    sshConfigs: exports_external.array(exports_external.object({
      id: exports_external.string().describe("Unique identifier for this SSH config. Used to match configs across settings sources."),
      name: exports_external.string().describe("Display name for the SSH connection"),
      sshHost: exports_external.string().describe('SSH host in format "user@hostname" or "hostname", or a host alias from ~/.ssh/config'),
      sshPort: exports_external.number().int().optional().describe("SSH port (default: 22)"),
      sshIdentityFile: exports_external.string().optional().describe("Path to SSH identity file (private key)"),
      startDirectory: exports_external.string().optional().describe("Default working directory on the remote host. " + "Supports tilde expansion (e.g. ~/projects). " + "If not specified, defaults to the remote user home directory. " + "Can be overridden by the [dir] positional argument in `claude ssh <config> [dir]`.")
    })).optional().describe("SSH connection configurations for remote environments. " + "Typically set in managed settings by enterprise administrators " + "to pre-configure SSH connections for team members."),
    claudeMdExcludes: exports_external.array(exports_external.string()).optional().describe("Glob patterns or absolute paths of CLAUDE.md files to exclude from loading. " + "Patterns are matched against absolute file paths using picomatch. " + "Only applies to User, Project, and Local memory types (Managed/policy files cannot be excluded). " + 'Examples: "/home/user/monorepo/CLAUDE.md", "**/code/CLAUDE.md", "**/some-dir/.claude/rules/**"'),
    cacheThreshold: exports_external.number().int().min(0).max(100).optional().describe("Prompt cache hit rate threshold (0-100). Warnings shown when cache hit rate falls below this percentage. Default: 80."),
    cacheWarningEnabled: exports_external.boolean().optional().describe("Whether to show cache hit rate warnings in the message flow when the rate falls below cacheThreshold. Default: true."),
    pluginTrustMessage: exports_external.string().optional().describe("Custom message to append to the plugin trust warning shown before installation. " + "Only read from policy settings (managed-settings.json / MDM). " + "Useful for enterprise administrators to add organization-specific context " + '(e.g., "All plugins from our internal marketplace are vetted and approved.").'),
    workspaceApiKey: exports_external.string().optional().describe("Workspace API key (sk-ant-api03-*) saved via /login UI. " + "Stored in plaintext \u2014 keep this file gitignored and restrict its permissions. " + "ANTHROPIC_API_KEY environment variable takes precedence when both are set.")
  }).passthrough());
});

// src/utils/settings/mdm/constants.ts
import { homedir, userInfo } from "os";
import { join } from "path";
function getMacOSPlistPaths() {
  let username = "";
  try {
    username = userInfo().username;
  } catch {}
  const paths = [];
  if (username) {
    paths.push({
      path: `/Library/Managed Preferences/${username}/${MACOS_PREFERENCE_DOMAIN}.plist`,
      label: "per-user managed preferences"
    });
  }
  paths.push({
    path: `/Library/Managed Preferences/${MACOS_PREFERENCE_DOMAIN}.plist`,
    label: "device-level managed preferences"
  });
  if (process.env.USER_TYPE === "ant") {
    paths.push({
      path: join(homedir(), "Library", "Preferences", `${MACOS_PREFERENCE_DOMAIN}.plist`),
      label: "user preferences (ant-only)"
    });
  }
  return paths;
}
var MACOS_PREFERENCE_DOMAIN = "com.anthropic.claudecode", WINDOWS_REGISTRY_KEY_PATH_HKLM = "HKLM\\SOFTWARE\\Policies\\ClaudeCode", WINDOWS_REGISTRY_KEY_PATH_HKCU = "HKCU\\SOFTWARE\\Policies\\ClaudeCode", WINDOWS_REGISTRY_VALUE_NAME = "Settings", PLUTIL_PATH = "/usr/bin/plutil", PLUTIL_ARGS_PREFIX, MDM_SUBPROCESS_TIMEOUT_MS = 5000;
var init_constants4 = __esm(() => {
  PLUTIL_ARGS_PREFIX = ["-convert", "json", "-o", "-", "--"];
});

// src/utils/settings/mdm/rawRead.ts
import { execFile } from "child_process";
import { existsSync } from "fs";
function execFilePromise(cmd, args) {
  return new Promise((resolve) => {
    execFile(cmd, args, { encoding: "utf-8", timeout: MDM_SUBPROCESS_TIMEOUT_MS }, (err, stdout) => {
      resolve({ stdout: stdout ?? "", code: err ? 1 : 0 });
    });
  });
}
function fireRawRead() {
  return (async () => {
    if (process.platform === "darwin") {
      const plistPaths = getMacOSPlistPaths();
      const allResults = await Promise.all(plistPaths.map(async ({ path, label }) => {
        if (!existsSync(path)) {
          return { stdout: "", label, ok: false };
        }
        const { stdout, code } = await execFilePromise(PLUTIL_PATH, [
          ...PLUTIL_ARGS_PREFIX,
          path
        ]);
        return { stdout, label, ok: code === 0 && !!stdout };
      }));
      const winner = allResults.find((r) => r.ok);
      return {
        plistStdouts: winner ? [{ stdout: winner.stdout, label: winner.label }] : [],
        hklmStdout: null,
        hkcuStdout: null
      };
    }
    if (process.platform === "win32") {
      const [hklm, hkcu] = await Promise.all([
        execFilePromise("reg", [
          "query",
          WINDOWS_REGISTRY_KEY_PATH_HKLM,
          "/v",
          WINDOWS_REGISTRY_VALUE_NAME
        ]),
        execFilePromise("reg", [
          "query",
          WINDOWS_REGISTRY_KEY_PATH_HKCU,
          "/v",
          WINDOWS_REGISTRY_VALUE_NAME
        ])
      ]);
      return {
        plistStdouts: null,
        hklmStdout: hklm.code === 0 ? hklm.stdout : null,
        hkcuStdout: hkcu.code === 0 ? hkcu.stdout : null
      };
    }
    return { plistStdouts: null, hklmStdout: null, hkcuStdout: null };
  })();
}
function startMdmRawRead() {
  if (rawReadPromise)
    return;
  rawReadPromise = fireRawRead();
}
function getMdmRawReadPromise() {
  return rawReadPromise;
}
var rawReadPromise = null;
var init_rawRead = __esm(() => {
  init_constants4();
});

// src/utils/settings/schemaOutput.ts
function generateSettingsJSONSchema() {
  const jsonSchema = toJSONSchema(SettingsSchema(), { unrepresentable: "any" });
  return jsonStringify(jsonSchema, null, 2);
}
var init_schemaOutput = __esm(() => {
  init_v4();
  init_slowOperations();
  init_types2();
});

// src/utils/settings/validationTips.ts
function getValidationTip(context) {
  const matcher = TIP_MATCHERS.find((m) => m.matches(context));
  if (!matcher)
    return null;
  const tip = { ...matcher.tip };
  if (context.code === "invalid_value" && context.enumValues && !tip.suggestion) {
    tip.suggestion = `Valid values: ${context.enumValues.map((v) => `"${v}"`).join(", ")}`;
  }
  if (!tip.docLink && context.path) {
    const pathPrefix = context.path.split(".")[0];
    if (pathPrefix) {
      tip.docLink = PATH_DOC_LINKS[pathPrefix];
    }
  }
  return tip;
}
var DOCUMENTATION_BASE = "https://code.claude.com/docs/en", TIP_MATCHERS, PATH_DOC_LINKS;
var init_validationTips = __esm(() => {
  TIP_MATCHERS = [
    {
      matches: (ctx) => ctx.path === "permissions.defaultMode" && ctx.code === "invalid_value",
      tip: {
        suggestion: 'Valid modes: "acceptEdits" (ask before file changes), "plan" (analysis only), "bypassPermissions" (auto-accept all), or "default" (standard behavior)',
        docLink: `${DOCUMENTATION_BASE}/iam#permission-modes`
      }
    },
    {
      matches: (ctx) => ctx.path === "apiKeyHelper" && ctx.code === "invalid_type",
      tip: {
        suggestion: 'Provide a shell command that outputs your API key to stdout. The script should output only the API key. Example: "/bin/generate_temp_api_key.sh"'
      }
    },
    {
      matches: (ctx) => ctx.path === "cleanupPeriodDays" && ctx.code === "too_small" && ctx.expected === "0",
      tip: {
        suggestion: "Must be 0 or greater. Set a positive number for days to retain transcripts (default is 30). Setting 0 disables session persistence entirely: no transcripts are written and existing transcripts are deleted at startup."
      }
    },
    {
      matches: (ctx) => ctx.path.startsWith("env.") && ctx.code === "invalid_type",
      tip: {
        suggestion: 'Environment variables must be strings. Wrap numbers and booleans in quotes. Example: "DEBUG": "true", "PORT": "3000"',
        docLink: `${DOCUMENTATION_BASE}/settings#environment-variables`
      }
    },
    {
      matches: (ctx) => (ctx.path === "permissions.allow" || ctx.path === "permissions.deny") && ctx.code === "invalid_type" && ctx.expected === "array",
      tip: {
        suggestion: 'Permission rules must be in an array. Format: ["Tool(specifier)"]. Examples: ["Bash(npm run build)", "Edit(docs/**)", "Read(~/.zshrc)"]. Use * for wildcards.'
      }
    },
    {
      matches: (ctx) => ctx.path.includes("hooks") && ctx.code === "invalid_type",
      tip: {
        suggestion: 'Hooks use a matcher + hooks array. The matcher is a string: a tool name ("Bash"), pipe-separated list ("Edit|Write"), or empty to match all. Example: {"PostToolUse": [{"matcher": "Edit|Write", "hooks": [{"type": "command", "command": "echo Done"}]}]}'
      }
    },
    {
      matches: (ctx) => ctx.code === "invalid_type" && ctx.expected === "boolean",
      tip: {
        suggestion: 'Use true or false without quotes. Example: "includeCoAuthoredBy": true'
      }
    },
    {
      matches: (ctx) => ctx.code === "unrecognized_keys",
      tip: {
        suggestion: "Check for typos or refer to the documentation for valid fields",
        docLink: `${DOCUMENTATION_BASE}/settings`
      }
    },
    {
      matches: (ctx) => ctx.code === "invalid_value" && ctx.enumValues !== undefined,
      tip: {
        suggestion: undefined
      }
    },
    {
      matches: (ctx) => ctx.code === "invalid_type" && ctx.expected === "object" && ctx.received === null && ctx.path === "",
      tip: {
        suggestion: "Check for missing commas, unmatched brackets, or trailing commas. Use a JSON validator to identify the exact syntax error."
      }
    },
    {
      matches: (ctx) => ctx.path === "permissions.additionalDirectories" && ctx.code === "invalid_type",
      tip: {
        suggestion: 'Must be an array of directory paths. Example: ["~/projects", "/tmp/workspace"]. You can also use --add-dir flag or /add-dir command',
        docLink: `${DOCUMENTATION_BASE}/iam#working-directories`
      }
    }
  ];
  PATH_DOC_LINKS = {
    permissions: `${DOCUMENTATION_BASE}/iam#configuring-permissions`,
    env: `${DOCUMENTATION_BASE}/settings#environment-variables`,
    hooks: `${DOCUMENTATION_BASE}/hooks`
  };
});

// src/utils/settings/validation.ts
function isInvalidTypeIssue(issue) {
  return issue.code === "invalid_type";
}
function isInvalidValueIssue(issue) {
  return issue.code === "invalid_value";
}
function isUnrecognizedKeysIssue(issue) {
  return issue.code === "unrecognized_keys";
}
function isTooSmallIssue(issue) {
  return issue.code === "too_small";
}
function getReceivedType(value) {
  if (value === null)
    return "null";
  if (value === undefined)
    return "undefined";
  if (Array.isArray(value))
    return "array";
  return typeof value;
}
function extractReceivedFromMessage(msg) {
  const match = msg.match(/received (\w+)/);
  return match ? match[1] : undefined;
}
function formatZodError(error, filePath) {
  return error.issues.map((issue) => {
    const path = issue.path.map(String).join(".");
    let message = issue.message;
    let expected;
    let enumValues;
    let expectedValue;
    let receivedValue;
    let invalidValue;
    if (isInvalidValueIssue(issue)) {
      enumValues = issue.values.map((v) => String(v));
      expectedValue = enumValues.join(" | ");
      receivedValue = undefined;
      invalidValue = undefined;
    } else if (isInvalidTypeIssue(issue)) {
      expectedValue = issue.expected;
      const receivedType = extractReceivedFromMessage(issue.message);
      receivedValue = receivedType ?? getReceivedType(issue.input);
      invalidValue = receivedType ?? getReceivedType(issue.input);
    } else if (isTooSmallIssue(issue)) {
      expectedValue = String(issue.minimum);
    } else if (issue.code === "custom" && "params" in issue) {
      const params = issue.params;
      receivedValue = params.received;
      invalidValue = receivedValue;
    }
    const tip = getValidationTip({
      path,
      code: issue.code,
      expected: expectedValue,
      received: receivedValue,
      enumValues,
      message: issue.message,
      value: receivedValue
    });
    if (isInvalidValueIssue(issue)) {
      expected = enumValues?.map((v) => `"${v}"`).join(", ");
      message = `Invalid value. Expected one of: ${expected}`;
    } else if (isInvalidTypeIssue(issue)) {
      const receivedType = extractReceivedFromMessage(issue.message) ?? getReceivedType(issue.input);
      if (issue.expected === "object" && receivedType === "null" && path === "") {
        message = "Invalid or malformed JSON";
      } else {
        message = `Expected ${issue.expected}, but received ${receivedType}`;
      }
    } else if (isUnrecognizedKeysIssue(issue)) {
      const keys = issue.keys.join(", ");
      message = `Unrecognized ${plural(issue.keys.length, "field")}: ${keys}`;
    } else if (isTooSmallIssue(issue)) {
      message = `Number must be greater than or equal to ${issue.minimum}`;
      expected = String(issue.minimum);
    }
    return {
      file: filePath,
      path,
      message,
      expected,
      invalidValue,
      suggestion: tip?.suggestion,
      docLink: tip?.docLink
    };
  });
}
function validateSettingsFileContent(content) {
  try {
    const jsonData = jsonParse(content);
    const result = SettingsSchema().strict().safeParse(jsonData);
    if (result.success) {
      return { isValid: true };
    }
    const errors = formatZodError(result.error, "settings");
    const errorMessage = `Settings validation failed:
` + errors.map((err) => `- ${err.path}: ${err.message}`).join(`
`);
    return {
      isValid: false,
      error: errorMessage,
      fullSchema: generateSettingsJSONSchema()
    };
  } catch (parseError) {
    return {
      isValid: false,
      error: `Invalid JSON: ${parseError instanceof Error ? parseError.message : "Unknown parsing error"}`,
      fullSchema: generateSettingsJSONSchema()
    };
  }
}
function filterInvalidPermissionRules(data, filePath) {
  if (!data || typeof data !== "object")
    return [];
  const obj = data;
  if (!obj.permissions || typeof obj.permissions !== "object")
    return [];
  const perms = obj.permissions;
  const warnings = [];
  for (const key of ["allow", "deny", "ask"]) {
    const rules = perms[key];
    if (!Array.isArray(rules))
      continue;
    perms[key] = rules.filter((rule) => {
      if (typeof rule !== "string") {
        warnings.push({
          file: filePath,
          path: `permissions.${key}`,
          message: `Non-string value in ${key} array was removed`,
          invalidValue: rule
        });
        return false;
      }
      const result = validatePermissionRule(rule, key);
      if (!result.valid) {
        let message = `Invalid permission rule "${rule}" was skipped`;
        if (result.error)
          message += `: ${result.error}`;
        if (result.suggestion)
          message += `. ${result.suggestion}`;
        warnings.push({
          file: filePath,
          path: `permissions.${key}`,
          message,
          invalidValue: rule
        });
        return false;
      }
      return true;
    });
  }
  return warnings;
}
var init_validation = __esm(() => {
  init_slowOperations();
  init_stringUtils();
  init_permissionValidation();
  init_schemaOutput();
  init_types2();
  init_validationTips();
});

// src/utils/settings/mdm/settings.ts
import { join as join2 } from "path";
function startMdmSettingsLoad() {
  if (mdmLoadPromise)
    return;
  mdmLoadPromise = (async () => {
    profileCheckpoint("mdm_load_start");
    const startTime = Date.now();
    const rawPromise = getMdmRawReadPromise() ?? fireRawRead();
    const { mdm, hkcu } = consumeRawReadResult(await rawPromise);
    mdmCache = mdm;
    hkcuCache = hkcu;
    profileCheckpoint("mdm_load_end");
    const duration = Date.now() - startTime;
    logForDebugging(`MDM settings load completed in ${duration}ms`);
    if (Object.keys(mdm.settings).length > 0) {
      logForDebugging(`MDM settings found: ${Object.keys(mdm.settings).join(", ")}`);
      try {
        logForDiagnosticsNoPII("info", "mdm_settings_loaded", {
          duration_ms: duration,
          key_count: Object.keys(mdm.settings).length,
          error_count: mdm.errors.length
        });
      } catch {}
    }
  })();
}
async function ensureMdmSettingsLoaded() {
  if (!mdmLoadPromise) {
    startMdmSettingsLoad();
  }
  await mdmLoadPromise;
}
function getMdmSettings() {
  return mdmCache ?? EMPTY_RESULT;
}
function getHkcuSettings() {
  return hkcuCache ?? EMPTY_RESULT;
}
function setMdmSettingsCache(mdm, hkcu) {
  mdmCache = mdm;
  hkcuCache = hkcu;
}
async function refreshMdmSettings() {
  const raw = await fireRawRead();
  return consumeRawReadResult(raw);
}
function parseCommandOutputAsSettings(stdout, sourcePath) {
  const data = safeParseJSON(stdout, false);
  if (!data || typeof data !== "object") {
    return { settings: {}, errors: [] };
  }
  const ruleWarnings = filterInvalidPermissionRules(data, sourcePath);
  const parseResult = SettingsSchema().safeParse(data);
  if (!parseResult.success) {
    const errors = formatZodError(parseResult.error, sourcePath);
    return { settings: {}, errors: [...ruleWarnings, ...errors] };
  }
  return { settings: parseResult.data, errors: ruleWarnings };
}
function parseRegQueryStdout(stdout, valueName = "Settings") {
  const lines = stdout.split(/\r?\n/);
  const escaped = valueName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^\\s+${escaped}\\s+REG_(?:EXPAND_)?SZ\\s+(.*)$`, "i");
  for (const line of lines) {
    const match = line.match(re);
    if (match && match[1]) {
      return match[1].trimEnd();
    }
  }
  return null;
}
function consumeRawReadResult(raw) {
  if (raw.plistStdouts && raw.plistStdouts.length > 0) {
    const { stdout, label } = raw.plistStdouts[0];
    const result = parseCommandOutputAsSettings(stdout, label);
    if (Object.keys(result.settings).length > 0) {
      return { mdm: result, hkcu: EMPTY_RESULT };
    }
  }
  if (raw.hklmStdout) {
    const jsonString = parseRegQueryStdout(raw.hklmStdout);
    if (jsonString) {
      const result = parseCommandOutputAsSettings(jsonString, `Registry: ${WINDOWS_REGISTRY_KEY_PATH_HKLM}\\${WINDOWS_REGISTRY_VALUE_NAME}`);
      if (Object.keys(result.settings).length > 0) {
        return { mdm: result, hkcu: EMPTY_RESULT };
      }
    }
  }
  if (hasManagedSettingsFile()) {
    return { mdm: EMPTY_RESULT, hkcu: EMPTY_RESULT };
  }
  if (raw.hkcuStdout) {
    const jsonString = parseRegQueryStdout(raw.hkcuStdout);
    if (jsonString) {
      const result = parseCommandOutputAsSettings(jsonString, `Registry: ${WINDOWS_REGISTRY_KEY_PATH_HKCU}\\${WINDOWS_REGISTRY_VALUE_NAME}`);
      return { mdm: EMPTY_RESULT, hkcu: result };
    }
  }
  return { mdm: EMPTY_RESULT, hkcu: EMPTY_RESULT };
}
function hasManagedSettingsFile() {
  try {
    const filePath = join2(getManagedFilePath(), "managed-settings.json");
    const content = readFileSync(filePath);
    const data = safeParseJSON(content, false);
    if (data && typeof data === "object" && Object.keys(data).length > 0) {
      return true;
    }
  } catch {}
  try {
    const dropInDir = getManagedSettingsDropInDir();
    const entries = getFsImplementation().readdirSync(dropInDir);
    for (const d of entries) {
      if (!(d.isFile() || d.isSymbolicLink()) || !d.name.endsWith(".json") || d.name.startsWith(".")) {
        continue;
      }
      try {
        const content = readFileSync(join2(dropInDir, d.name));
        const data = safeParseJSON(content, false);
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          return true;
        }
      } catch {}
    }
  } catch {}
  return false;
}
var EMPTY_RESULT, mdmCache = null, hkcuCache = null, mdmLoadPromise = null;
var init_settings = __esm(() => {
  init_debug();
  init_diagLogs();
  init_fileRead();
  init_fsOperations();
  init_json();
  init_startupProfiler();
  init_managedPath();
  init_types2();
  init_validation();
  init_constants4();
  init_rawRead();
  EMPTY_RESULT = Object.freeze({ settings: {}, errors: [] });
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_assignMergeValue.js
function assignMergeValue(object, key, value) {
  if (value !== undefined && !eq_default(object[key], value) || value === undefined && !(key in object)) {
    _baseAssignValue_default(object, key, value);
  }
}
var _assignMergeValue_default;
var init__assignMergeValue = __esm(() => {
  init__baseAssignValue();
  init_eq();
  _assignMergeValue_default = assignMergeValue;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_createBaseFor.js
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}
var _createBaseFor_default;
var init__createBaseFor = __esm(() => {
  _createBaseFor_default = createBaseFor;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseFor.js
var baseFor, _baseFor_default;
var init__baseFor = __esm(() => {
  init__createBaseFor();
  baseFor = _createBaseFor_default();
  _baseFor_default = baseFor;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/isArrayLikeObject.js
function isArrayLikeObject(value) {
  return isObjectLike_default(value) && isArrayLike_default(value);
}
var isArrayLikeObject_default;
var init_isArrayLikeObject = __esm(() => {
  init_isArrayLike();
  init_isObjectLike();
  isArrayLikeObject_default = isArrayLikeObject;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/isPlainObject.js
function isPlainObject(value) {
  if (!isObjectLike_default(value) || _baseGetTag_default(value) != objectTag) {
    return false;
  }
  var proto = _getPrototype_default(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
}
var objectTag = "[object Object]", funcProto, objectProto, funcToString, hasOwnProperty, objectCtorString, isPlainObject_default;
var init_isPlainObject = __esm(() => {
  init__baseGetTag();
  init__getPrototype();
  init_isObjectLike();
  funcProto = Function.prototype;
  objectProto = Object.prototype;
  funcToString = funcProto.toString;
  hasOwnProperty = objectProto.hasOwnProperty;
  objectCtorString = funcToString.call(Object);
  isPlainObject_default = isPlainObject;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_safeGet.js
function safeGet(object, key) {
  if (key === "constructor" && typeof object[key] === "function") {
    return;
  }
  if (key == "__proto__") {
    return;
  }
  return object[key];
}
var _safeGet_default;
var init__safeGet = __esm(() => {
  _safeGet_default = safeGet;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/toPlainObject.js
function toPlainObject(value) {
  return _copyObject_default(value, keysIn_default(value));
}
var toPlainObject_default;
var init_toPlainObject = __esm(() => {
  init__copyObject();
  init_keysIn();
  toPlainObject_default = toPlainObject;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseMergeDeep.js
function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
  var objValue = _safeGet_default(object, key), srcValue = _safeGet_default(source, key), stacked = stack.get(srcValue);
  if (stacked) {
    _assignMergeValue_default(object, key, stacked);
    return;
  }
  var newValue = customizer ? customizer(objValue, srcValue, key + "", object, source, stack) : undefined;
  var isCommon = newValue === undefined;
  if (isCommon) {
    var isArr = isArray_default(srcValue), isBuff = !isArr && isBuffer_default(srcValue), isTyped = !isArr && !isBuff && isTypedArray_default(srcValue);
    newValue = srcValue;
    if (isArr || isBuff || isTyped) {
      if (isArray_default(objValue)) {
        newValue = objValue;
      } else if (isArrayLikeObject_default(objValue)) {
        newValue = _copyArray_default(objValue);
      } else if (isBuff) {
        isCommon = false;
        newValue = _cloneBuffer_default(srcValue, true);
      } else if (isTyped) {
        isCommon = false;
        newValue = _cloneTypedArray_default(srcValue, true);
      } else {
        newValue = [];
      }
    } else if (isPlainObject_default(srcValue) || isArguments_default(srcValue)) {
      newValue = objValue;
      if (isArguments_default(objValue)) {
        newValue = toPlainObject_default(objValue);
      } else if (!isObject_default(objValue) || isFunction_default(objValue)) {
        newValue = _initCloneObject_default(srcValue);
      }
    } else {
      isCommon = false;
    }
  }
  if (isCommon) {
    stack.set(srcValue, newValue);
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
    stack["delete"](srcValue);
  }
  _assignMergeValue_default(object, key, newValue);
}
var _baseMergeDeep_default;
var init__baseMergeDeep = __esm(() => {
  init__assignMergeValue();
  init__cloneBuffer();
  init__cloneTypedArray();
  init__copyArray();
  init__initCloneObject();
  init_isArguments();
  init_isArray();
  init_isArrayLikeObject();
  init_isBuffer();
  init_isFunction();
  init_isObject();
  init_isPlainObject();
  init_isTypedArray();
  init__safeGet();
  init_toPlainObject();
  _baseMergeDeep_default = baseMergeDeep;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseMerge.js
function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  _baseFor_default(source, function(srcValue, key) {
    stack || (stack = new _Stack_default);
    if (isObject_default(srcValue)) {
      _baseMergeDeep_default(object, source, key, srcIndex, baseMerge, customizer, stack);
    } else {
      var newValue = customizer ? customizer(_safeGet_default(object, key), srcValue, key + "", object, source, stack) : undefined;
      if (newValue === undefined) {
        newValue = srcValue;
      }
      _assignMergeValue_default(object, key, newValue);
    }
  }, keysIn_default);
}
var _baseMerge_default;
var init__baseMerge = __esm(() => {
  init__Stack();
  init__assignMergeValue();
  init__baseFor();
  init__baseMergeDeep();
  init_isObject();
  init_keysIn();
  init__safeGet();
  _baseMerge_default = baseMerge;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_apply.js
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}
var _apply_default;
var init__apply = __esm(() => {
  _apply_default = apply;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_overRest.js
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? func.length - 1 : start, 0);
  return function() {
    var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array(length);
    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return _apply_default(func, this, otherArgs);
  };
}
var nativeMax, _overRest_default;
var init__overRest = __esm(() => {
  init__apply();
  nativeMax = Math.max;
  _overRest_default = overRest;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/constant.js
function constant(value) {
  return function() {
    return value;
  };
}
var constant_default;
var init_constant = __esm(() => {
  constant_default = constant;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseSetToString.js
var baseSetToString, _baseSetToString_default;
var init__baseSetToString = __esm(() => {
  init_constant();
  init__defineProperty();
  init_identity();
  baseSetToString = !_defineProperty_default ? identity_default : function(func, string) {
    return _defineProperty_default(func, "toString", {
      configurable: true,
      enumerable: false,
      value: constant_default(string),
      writable: true
    });
  };
  _baseSetToString_default = baseSetToString;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_shortOut.js
function shortOut(func) {
  var count2 = 0, lastCalled = 0;
  return function() {
    var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
    lastCalled = stamp;
    if (remaining > 0) {
      if (++count2 >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count2 = 0;
    }
    return func.apply(undefined, arguments);
  };
}
var HOT_COUNT = 800, HOT_SPAN = 16, nativeNow, _shortOut_default;
var init__shortOut = __esm(() => {
  nativeNow = Date.now;
  _shortOut_default = shortOut;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_setToString.js
var setToString, _setToString_default;
var init__setToString = __esm(() => {
  init__baseSetToString();
  init__shortOut();
  setToString = _shortOut_default(_baseSetToString_default);
  _setToString_default = setToString;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_baseRest.js
function baseRest(func, start) {
  return _setToString_default(_overRest_default(func, start, identity_default), func + "");
}
var _baseRest_default;
var init__baseRest = __esm(() => {
  init_identity();
  init__overRest();
  init__setToString();
  _baseRest_default = baseRest;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_isIterateeCall.js
function isIterateeCall(value, index, object) {
  if (!isObject_default(object)) {
    return false;
  }
  var type = typeof index;
  if (type == "number" ? isArrayLike_default(object) && _isIndex_default(index, object.length) : type == "string" && (index in object)) {
    return eq_default(object[index], value);
  }
  return false;
}
var _isIterateeCall_default;
var init__isIterateeCall = __esm(() => {
  init_eq();
  init_isArrayLike();
  init__isIndex();
  init_isObject();
  _isIterateeCall_default = isIterateeCall;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/_createAssigner.js
function createAssigner(assigner) {
  return _baseRest_default(function(object, sources) {
    var index = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : undefined, guard = length > 2 ? sources[2] : undefined;
    customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, customizer) : undefined;
    if (guard && _isIterateeCall_default(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}
var _createAssigner_default;
var init__createAssigner = __esm(() => {
  init__baseRest();
  init__isIterateeCall();
  _createAssigner_default = createAssigner;
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/mergeWith.js
var mergeWith, mergeWith_default;
var init_mergeWith = __esm(() => {
  init__baseMerge();
  init__createAssigner();
  mergeWith = _createAssigner_default(function(object, source, srcIndex, customizer) {
    _baseMerge_default(object, source, srcIndex, customizer);
  });
  mergeWith_default = mergeWith;
});

// src/services/remoteManagedSettings/syncCacheState.ts
function getRemoteManagedSettingsSyncFromCache(..._args) {
  return;
}
var init_syncCacheState = () => {};

// src/utils/git/gitignore.ts
import { appendFile, mkdir, readFile, writeFile } from "fs/promises";
import { homedir as homedir2 } from "os";
import { dirname, join as join3 } from "path";
async function isPathGitignored(filePath, cwd) {
  const { code } = await execFileNoThrowWithCwd("git", ["check-ignore", filePath], {
    preserveOutputOnError: false,
    cwd
  });
  return code === 0;
}
function getGlobalGitignorePath() {
  return join3(homedir2(), ".config", "git", "ignore");
}
async function addFileGlobRuleToGitignore(filename, cwd = getCwd()) {
  try {
    if (!await dirIsInGitRepo(cwd)) {
      return;
    }
    const gitignoreEntry = `**/${filename}`;
    const testPath = filename.endsWith("/") ? `${filename}sample-file.txt` : filename;
    if (await isPathGitignored(testPath, cwd)) {
      return;
    }
    const globalGitignorePath = getGlobalGitignorePath();
    const configGitDir = dirname(globalGitignorePath);
    await mkdir(configGitDir, { recursive: true });
    try {
      const content = await readFile(globalGitignorePath, { encoding: "utf-8" });
      if (content.includes(gitignoreEntry)) {
        return;
      }
      await appendFile(globalGitignorePath, `
${gitignoreEntry}
`);
    } catch (e) {
      const code = getErrnoCode(e);
      if (code === "ENOENT") {
        await writeFile(globalGitignorePath, `${gitignoreEntry}
`, "utf-8");
      } else {
        throw e;
      }
    }
  } catch (error) {
    logError(error);
  }
}
var init_gitignore = __esm(() => {
  init_cwd();
  init_errors();
  init_execFileNoThrow();
  init_git();
  init_log();
});

// src/utils/settings/settings.ts
import { dirname as dirname2, join as join4, resolve } from "path";
function getManagedSettingsFilePath() {
  return join4(getManagedFilePath(), "managed-settings.json");
}
function loadManagedFileSettings() {
  const errors = [];
  let merged = {};
  let found = false;
  const { settings, errors: baseErrors } = parseSettingsFile(getManagedSettingsFilePath());
  errors.push(...baseErrors);
  if (settings && Object.keys(settings).length > 0) {
    merged = mergeWith_default(merged, settings, settingsMergeCustomizer);
    found = true;
  }
  const dropInDir = getManagedSettingsDropInDir();
  try {
    const entries = getFsImplementation().readdirSync(dropInDir).filter((d) => (d.isFile() || d.isSymbolicLink()) && d.name.endsWith(".json") && !d.name.startsWith(".")).map((d) => d.name).sort();
    for (const name of entries) {
      const { settings: settings2, errors: fileErrors } = parseSettingsFile(join4(dropInDir, name));
      errors.push(...fileErrors);
      if (settings2 && Object.keys(settings2).length > 0) {
        merged = mergeWith_default(merged, settings2, settingsMergeCustomizer);
        found = true;
      }
    }
  } catch (e) {
    const code = getErrnoCode(e);
    if (code !== "ENOENT" && code !== "ENOTDIR") {
      logError(e);
    }
  }
  return { settings: found ? merged : null, errors };
}
function getManagedFileSettingsPresence() {
  const { settings: base } = parseSettingsFile(getManagedSettingsFilePath());
  const hasBase = !!base && Object.keys(base).length > 0;
  let hasDropIns = false;
  const dropInDir = getManagedSettingsDropInDir();
  try {
    hasDropIns = getFsImplementation().readdirSync(dropInDir).some((d) => (d.isFile() || d.isSymbolicLink()) && d.name.endsWith(".json") && !d.name.startsWith("."));
  } catch {}
  return { hasBase, hasDropIns };
}
function handleFileSystemError(error, path) {
  if (typeof error === "object" && error && "code" in error && error.code === "ENOENT") {
    logForDebugging(`Broken symlink or missing file encountered for settings.json at path: ${path}`);
  } else {
    logError(error);
  }
}
function parseSettingsFile(path) {
  const cached = getCachedParsedFile(path);
  if (cached) {
    return {
      settings: cached.settings ? clone(cached.settings) : null,
      errors: cached.errors
    };
  }
  const result = parseSettingsFileUncached(path);
  setCachedParsedFile(path, result);
  return {
    settings: result.settings ? clone(result.settings) : null,
    errors: result.errors
  };
}
function parseSettingsFileUncached(path) {
  try {
    const { resolvedPath } = safeResolvePath(getFsImplementation(), path);
    const content = readFileSync(resolvedPath);
    if (content.trim() === "") {
      return { settings: {}, errors: [] };
    }
    const data = safeParseJSON(content, false);
    const ruleWarnings = filterInvalidPermissionRules(data, path);
    const result = SettingsSchema().safeParse(data);
    if (!result.success) {
      const errors = formatZodError(result.error, path);
      return { settings: null, errors: [...ruleWarnings, ...errors] };
    }
    return { settings: result.data, errors: ruleWarnings };
  } catch (error) {
    handleFileSystemError(error, path);
    return { settings: null, errors: [] };
  }
}
function getSettingsRootPathForSource(source) {
  switch (source) {
    case "userSettings":
      return resolve(getClaudeConfigHomeDir());
    case "policySettings":
    case "projectSettings":
    case "localSettings": {
      return resolve(getOriginalCwd());
    }
    case "flagSettings": {
      const path = getFlagSettingsPath();
      return path ? dirname2(resolve(path)) : resolve(getOriginalCwd());
    }
  }
}
function getUserSettingsFilePath() {
  if (getUseCoworkPlugins() || isEnvTruthy(process.env.CLAUDE_CODE_USE_COWORK_PLUGINS)) {
    return "cowork_settings.json";
  }
  return "settings.json";
}
function getSettingsFilePathForSource(source) {
  switch (source) {
    case "userSettings":
      return join4(getSettingsRootPathForSource(source), getUserSettingsFilePath());
    case "projectSettings":
    case "localSettings": {
      return join4(getSettingsRootPathForSource(source), getRelativeSettingsFilePathForSource(source));
    }
    case "policySettings":
      return getManagedSettingsFilePath();
    case "flagSettings": {
      return getFlagSettingsPath();
    }
  }
}
function getRelativeSettingsFilePathForSource(source) {
  switch (source) {
    case "projectSettings":
      return join4(".claude", "settings.json");
    case "localSettings":
      return join4(".claude", "settings.local.json");
  }
}
function getSettingsForSource(source) {
  const cached = getCachedSettingsForSource(source);
  if (cached !== undefined)
    return cached;
  const result = getSettingsForSourceUncached(source);
  setCachedSettingsForSource(source, result);
  return result;
}
function getSettingsForSourceUncached(source) {
  if (source === "policySettings") {
    const remoteSettings = getRemoteManagedSettingsSyncFromCache();
    if (remoteSettings && Object.keys(remoteSettings).length > 0) {
      return remoteSettings;
    }
    const mdmResult = getMdmSettings();
    if (Object.keys(mdmResult.settings).length > 0) {
      return mdmResult.settings;
    }
    const { settings: fileSettings2 } = loadManagedFileSettings();
    if (fileSettings2) {
      return fileSettings2;
    }
    const hkcu = getHkcuSettings();
    if (Object.keys(hkcu.settings).length > 0) {
      return hkcu.settings;
    }
    return null;
  }
  const settingsFilePath = getSettingsFilePathForSource(source);
  const { settings: fileSettings } = settingsFilePath ? parseSettingsFile(settingsFilePath) : { settings: null };
  if (source === "flagSettings") {
    const inlineSettings = getFlagSettingsInline();
    if (inlineSettings) {
      const parsed = SettingsSchema().safeParse(inlineSettings);
      if (parsed.success) {
        return mergeWith_default(fileSettings || {}, parsed.data, settingsMergeCustomizer);
      }
    }
  }
  return fileSettings;
}
function getPolicySettingsOrigin() {
  const remoteSettings = getRemoteManagedSettingsSyncFromCache();
  if (remoteSettings && Object.keys(remoteSettings).length > 0) {
    return "remote";
  }
  const mdmResult = getMdmSettings();
  if (Object.keys(mdmResult.settings).length > 0) {
    return getPlatform() === "macos" ? "plist" : "hklm";
  }
  const { settings: fileSettings } = loadManagedFileSettings();
  if (fileSettings) {
    return "file";
  }
  const hkcu = getHkcuSettings();
  if (Object.keys(hkcu.settings).length > 0) {
    return "hkcu";
  }
  return null;
}
function updateSettingsForSource(source, settings) {
  if (source === "policySettings" || source === "flagSettings") {
    return { error: null };
  }
  const filePath = getSettingsFilePathForSource(source);
  if (!filePath) {
    return { error: null };
  }
  try {
    getFsImplementation().mkdirSync(dirname2(filePath));
    let existingSettings = getSettingsForSourceUncached(source);
    if (!existingSettings) {
      let content = null;
      try {
        content = readFileSync(filePath);
      } catch (e) {
        if (!isENOENT(e)) {
          throw e;
        }
      }
      if (content !== null) {
        const rawData = safeParseJSON(content);
        if (rawData === null) {
          return {
            error: new Error(`Invalid JSON syntax in settings file at ${filePath}`)
          };
        }
        if (rawData && typeof rawData === "object") {
          existingSettings = rawData;
          logForDebugging(`Using raw settings from ${filePath} due to validation failure`);
        }
      }
    }
    const updatedSettings = mergeWith_default(existingSettings || {}, settings, (_objValue, srcValue, key, object) => {
      if (srcValue === undefined && object && typeof key === "string") {
        delete object[key];
        return;
      }
      if (Array.isArray(srcValue)) {
        return srcValue;
      }
      return;
    });
    markInternalWrite(filePath);
    writeFileSyncAndFlush_DEPRECATED(filePath, jsonStringify(updatedSettings, null, 2) + `
`);
    resetSettingsCache();
    if (source === "localSettings") {
      addFileGlobRuleToGitignore(getRelativeSettingsFilePathForSource("localSettings"), getOriginalCwd());
    }
  } catch (e) {
    const error = new Error(`Failed to read raw settings from ${filePath}: ${e}`);
    logError(error);
    return { error };
  }
  return { error: null };
}
function mergeArrays(targetArray, sourceArray) {
  return uniq([...targetArray, ...sourceArray]);
}
function settingsMergeCustomizer(objValue, srcValue) {
  if (Array.isArray(objValue) && Array.isArray(srcValue)) {
    return mergeArrays(objValue, srcValue);
  }
  return;
}
function getManagedSettingsKeysForLogging(settings) {
  const validSettings = SettingsSchema().strip().parse(settings);
  const keysToExpand = ["permissions", "sandbox", "hooks"];
  const allKeys = [];
  const validNestedKeys = {
    permissions: new Set([
      "allow",
      "deny",
      "ask",
      "defaultMode",
      "disableBypassPermissionsMode",
      ...["disableAutoMode"],
      "additionalDirectories"
    ]),
    sandbox: new Set([
      "enabled",
      "failIfUnavailable",
      "allowUnsandboxedCommands",
      "network",
      "filesystem",
      "ignoreViolations",
      "excludedCommands",
      "autoAllowBashIfSandboxed",
      "enableWeakerNestedSandbox",
      "enableWeakerNetworkIsolation",
      "ripgrep"
    ]),
    hooks: new Set([
      "PreToolUse",
      "PostToolUse",
      "Notification",
      "UserPromptSubmit",
      "SessionStart",
      "SessionEnd",
      "Stop",
      "SubagentStop",
      "PreCompact",
      "PostCompact",
      "TeammateIdle",
      "TaskCreated",
      "TaskCompleted"
    ])
  };
  for (const key of Object.keys(validSettings)) {
    if (keysToExpand.includes(key) && validSettings[key] && typeof validSettings[key] === "object") {
      const nestedObj = validSettings[key];
      const validKeys = validNestedKeys[key];
      if (validKeys) {
        for (const nestedKey of Object.keys(nestedObj)) {
          if (validKeys.has(nestedKey)) {
            allKeys.push(`${key}.${nestedKey}`);
          }
        }
      }
    } else {
      allKeys.push(key);
    }
  }
  return allKeys.sort();
}
function loadSettingsFromDisk() {
  if (isLoadingSettings) {
    return { settings: {}, errors: [] };
  }
  const startTime = Date.now();
  profileCheckpoint("loadSettingsFromDisk_start");
  logForDiagnosticsNoPII("info", "settings_load_started");
  isLoadingSettings = true;
  try {
    const pluginSettings = getPluginSettingsBase();
    let mergedSettings = {};
    if (pluginSettings) {
      mergedSettings = mergeWith_default(mergedSettings, pluginSettings, settingsMergeCustomizer);
    }
    const allErrors = [];
    const seenErrors = new Set;
    const seenFiles = new Set;
    for (const source of getEnabledSettingSources()) {
      if (source === "policySettings") {
        let policySettings = null;
        const policyErrors = [];
        const remoteSettings = getRemoteManagedSettingsSyncFromCache();
        if (remoteSettings && Object.keys(remoteSettings).length > 0) {
          const result = SettingsSchema().safeParse(remoteSettings);
          if (result.success) {
            policySettings = result.data;
          } else {
            policyErrors.push(...formatZodError(result.error, "remote managed settings"));
          }
        }
        if (!policySettings) {
          const mdmResult = getMdmSettings();
          if (Object.keys(mdmResult.settings).length > 0) {
            policySettings = mdmResult.settings;
          }
          policyErrors.push(...mdmResult.errors);
        }
        if (!policySettings) {
          const { settings, errors } = loadManagedFileSettings();
          if (settings) {
            policySettings = settings;
          }
          policyErrors.push(...errors);
        }
        if (!policySettings) {
          const hkcu = getHkcuSettings();
          if (Object.keys(hkcu.settings).length > 0) {
            policySettings = hkcu.settings;
          }
          policyErrors.push(...hkcu.errors);
        }
        if (policySettings) {
          mergedSettings = mergeWith_default(mergedSettings, policySettings, settingsMergeCustomizer);
        }
        for (const error of policyErrors) {
          const errorKey = `${error.file}:${error.path}:${error.message}`;
          if (!seenErrors.has(errorKey)) {
            seenErrors.add(errorKey);
            allErrors.push(error);
          }
        }
        continue;
      }
      const filePath = getSettingsFilePathForSource(source);
      if (filePath) {
        const resolvedPath = resolve(filePath);
        if (!seenFiles.has(resolvedPath)) {
          seenFiles.add(resolvedPath);
          const { settings, errors } = parseSettingsFile(filePath);
          for (const error of errors) {
            const errorKey = `${error.file}:${error.path}:${error.message}`;
            if (!seenErrors.has(errorKey)) {
              seenErrors.add(errorKey);
              allErrors.push(error);
            }
          }
          if (settings) {
            mergedSettings = mergeWith_default(mergedSettings, settings, settingsMergeCustomizer);
          }
        }
      }
      if (source === "flagSettings") {
        const inlineSettings = getFlagSettingsInline();
        if (inlineSettings) {
          const parsed = SettingsSchema().safeParse(inlineSettings);
          if (parsed.success) {
            mergedSettings = mergeWith_default(mergedSettings, parsed.data, settingsMergeCustomizer);
          }
        }
      }
    }
    logForDiagnosticsNoPII("info", "settings_load_completed", {
      duration_ms: Date.now() - startTime,
      source_count: seenFiles.size,
      error_count: allErrors.length
    });
    return { settings: mergedSettings, errors: allErrors };
  } finally {
    isLoadingSettings = false;
  }
}
function getInitialSettings() {
  const { settings } = getSettingsWithErrors();
  return settings || {};
}
function getSettingsWithSources() {
  resetSettingsCache();
  const sources = [];
  for (const source of getEnabledSettingSources()) {
    const settings = getSettingsForSource(source);
    if (settings && Object.keys(settings).length > 0) {
      sources.push({ source, settings });
    }
  }
  return { effective: getInitialSettings(), sources };
}
function getSettingsWithErrors() {
  const cached = getSessionSettingsCache();
  if (cached !== null) {
    return cached;
  }
  const result = loadSettingsFromDisk();
  profileCheckpoint("loadSettingsFromDisk_end");
  setSessionSettingsCache(result);
  return result;
}
function hasSkipDangerousModePermissionPrompt() {
  return !!(getSettingsForSource("userSettings")?.skipDangerousModePermissionPrompt || getSettingsForSource("localSettings")?.skipDangerousModePermissionPrompt || getSettingsForSource("flagSettings")?.skipDangerousModePermissionPrompt || getSettingsForSource("policySettings")?.skipDangerousModePermissionPrompt);
}
function hasAutoModeOptIn() {
  return true;
}
function getUseAutoModeDuringPlan() {
  if (true) {
    return getSettingsForSource("policySettings")?.useAutoModeDuringPlan !== false && getSettingsForSource("flagSettings")?.useAutoModeDuringPlan !== false && getSettingsForSource("userSettings")?.useAutoModeDuringPlan !== false && getSettingsForSource("localSettings")?.useAutoModeDuringPlan !== false;
  }
  return true;
}
function getAutoModeConfig() {
  if (true) {
    const schema = exports_external.object({
      allow: exports_external.array(exports_external.string()).optional(),
      soft_deny: exports_external.array(exports_external.string()).optional(),
      deny: exports_external.array(exports_external.string()).optional(),
      environment: exports_external.array(exports_external.string()).optional()
    });
    const allow = [];
    const soft_deny = [];
    const environment = [];
    for (const source of [
      "userSettings",
      "localSettings",
      "flagSettings",
      "policySettings"
    ]) {
      const settings = getSettingsForSource(source);
      if (!settings)
        continue;
      const result = schema.safeParse(settings.autoMode);
      if (result.success) {
        if (result.data.allow)
          allow.push(...result.data.allow);
        if (result.data.soft_deny)
          soft_deny.push(...result.data.soft_deny);
        if (process.env.USER_TYPE === "ant") {
          if (result.data.deny)
            soft_deny.push(...result.data.deny);
        }
        if (result.data.environment)
          environment.push(...result.data.environment);
      }
    }
    if (allow.length > 0 || soft_deny.length > 0 || environment.length > 0) {
      return {
        ...allow.length > 0 && { allow },
        ...soft_deny.length > 0 && { soft_deny },
        ...environment.length > 0 && { environment }
      };
    }
  }
  return;
}
function rawSettingsContainsKey(key) {
  for (const source of getEnabledSettingSources()) {
    if (source === "policySettings") {
      continue;
    }
    const filePath = getSettingsFilePathForSource(source);
    if (!filePath) {
      continue;
    }
    try {
      const { resolvedPath } = safeResolvePath(getFsImplementation(), filePath);
      const content = readFileSync(resolvedPath);
      if (!content.trim()) {
        continue;
      }
      const rawData = safeParseJSON(content, false);
      if (rawData && typeof rawData === "object" && key in rawData) {
        return true;
      }
    } catch (error) {
      handleFileSystemError(error, filePath);
    }
  }
  return false;
}
var isLoadingSettings = false, getSettings_DEPRECATED;
var init_settings2 = __esm(() => {
  init_mergeWith();
  init_v4();
  init_state();
  init_syncCacheState();
  init_array();
  init_debug();
  init_diagLogs();
  init_envUtils();
  init_errors();
  init_file();
  init_fileRead();
  init_fsOperations();
  init_gitignore();
  init_json();
  init_log();
  init_platform();
  init_slowOperations();
  init_startupProfiler();
  init_constants();
  init_internalWrites();
  init_managedPath();
  init_settings();
  init_settingsCache();
  init_types2();
  init_validation();
  getSettings_DEPRECATED = getInitialSettings;
});

export { _baseFor_default, init__baseFor, isPlainObject_default, init_isPlainObject, _overRest_default, init__overRest, _setToString_default, init__setToString, isPathGitignored, init_gitignore, SETTING_SOURCES, getSettingSourceName, getSourceDisplayName, getSettingSourceDisplayNameLowercase, getSettingSourceDisplayNameCapitalized, parseSettingSourcesFlag, getEnabledSettingSources, isSettingSourceEnabled, SOURCES, init_constants, consumeInternalWrite, clearInternalWrites, init_internalWrites, PERMISSION_MODES, init_permissions, permissionModeSchema, externalPermissionModeSchema, isExternalPermissionMode, toExternalPermissionMode, permissionModeFromString, permissionModeTitle, isDefaultMode, permissionModeShortTitle, permissionModeSymbol, getModeColor, init_PermissionMode, HOOK_EVENTS, init_agentSdkTypes, DEFAULT_HOOK_SHELL, init_shellProvider, HooksSchema, ALLOWED_OFFICIAL_MARKETPLACE_NAMES, isMarketplaceAutoUpdate, validateOfficialNameSource, PluginHooksSchema, LspServerConfigSchema, PluginManifestSchema, isLocalPluginSource, isLocalMarketplaceSource, PluginMarketplaceEntrySchema, PluginMarketplaceSchema, PluginIdSchema, InstalledPluginsFileSchemaV1, InstalledPluginsFileSchemaV2, KnownMarketplacesFileSchema, init_schemas, AGENT_TOOL_NAME, LEGACY_AGENT_TOOL_NAME, VERIFICATION_AGENT_TYPE, ONE_SHOT_BUILTIN_AGENT_TYPES, init_constants2 as init_constants1, TASK_OUTPUT_TOOL_NAME, init_constants3 as init_constants2, TASK_STOP_TOOL_NAME, DESCRIPTION2 as DESCRIPTION, init_prompt2 as init_prompt, BRIEF_TOOL_NAME, LEGACY_BRIEF_TOOL_NAME, DESCRIPTION as DESCRIPTION1, BRIEF_TOOL_PROMPT, exports_prompt, init_prompt as init_prompt1, normalizeLegacyToolName, getLegacyToolNames, permissionRuleValueFromString, permissionRuleValueToString, init_permissionRuleParser, escapeRegExp, capitalize, plural, firstLineOf, countCharInString, normalizeFullWidthDigits, normalizeFullWidthSpace, safeJoinLines, EndTruncatingAccumulator, truncateToLines, init_stringUtils, CUSTOMIZATION_SURFACES, SettingsSchema, isMcpServerNameEntry, isMcpServerCommandEntry, isMcpServerUrlEntry, init_types2 as init_types, validateSettingsFileContent, init_validation, startMdmRawRead, init_rawRead, ensureMdmSettingsLoaded, getMdmSettings, getHkcuSettings, setMdmSettingsCache, refreshMdmSettings, init_settings, getManagedFileSettingsPresence, parseSettingsFile, getSettingsRootPathForSource, getSettingsFilePathForSource, getRelativeSettingsFilePathForSource, getSettingsForSource, getPolicySettingsOrigin, updateSettingsForSource, getManagedSettingsKeysForLogging, getInitialSettings, getSettings_DEPRECATED, getSettingsWithSources, getSettingsWithErrors, hasSkipDangerousModePermissionPrompt, hasAutoModeOptIn, getUseAutoModeDuringPlan, getAutoModeConfig, rawSettingsContainsKey, init_settings2 as init_settings1 };

//# debugId=2EA62E53B2485B7B64756E2164756E21
//# sourceMappingURL=chunk-h2edgmqn.js.map
