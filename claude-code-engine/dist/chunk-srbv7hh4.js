// @bun
import {
  capitalize,
  getInitialSettings,
  getSettingsForSource,
  getSettings_DEPRECATED,
  init_settings1 as init_settings,
  init_stringUtils,
  updateSettingsForSource
} from "./chunk-h2edgmqn.js";
import {
  LIGHTNING_BOLT,
  init_figures
} from "./chunk-80p148mw.js";
import {
  getAWSClientProxyConfig,
  getProxyFetchOptions,
  init_proxy
} from "./chunk-hdhvk68c.js";
import {
  init_lazySchema,
  lazySchema
} from "./chunk-bgan4cpf.js";
import {
  getUserAgent,
  init_http
} from "./chunk-35jsjk7z.js";
import {
  checkAndRefreshOAuthTokenIfNeeded,
  getAnthropicApiKey,
  getApiKeyFromApiKeyHelper,
  getClaudeAIOAuthTokens,
  getSubscriptionType,
  handleOAuth401Error,
  hasProfileScope,
  init_auth,
  isClaudeAISubscriber,
  isMaxSubscriber,
  isProSubscriber,
  isTeamPremiumSubscriber,
  refreshAndGetAwsCredentials,
  refreshGcpCredentialsIfNeeded
} from "./chunk-e45319yt.js";
import {
  getGlobalConfig,
  init_config,
  saveGlobalConfig
} from "./chunk-jyqypr4z.js";
import {
  init_json,
  safeParseJSON
} from "./chunk-5zhv4jyp.js";
import {
  getFeatureValue_CACHED_MAY_BE_STALE,
  init_growthbook
} from "./chunk-x5wzz44g.js";
import {
  init_bundledMode,
  isInBundledMode
} from "./chunk-v4ypszbb.js";
import {
  OAUTH_BETA_HEADER,
  getOauthConfig,
  init_oauth
} from "./chunk-dw66fdss.js";
import {
  init_v4
} from "./chunk-6mdh70q0.js";
import {
  exports_external
} from "./chunk-ch92ycde.js";
import {
  init_analytics,
  logEvent
} from "./chunk-4hpfxga2.js";
import {
  axios_default,
  init_axios
} from "./chunk-pecy49yr.js";
import {
  init_log,
  init_privacyLevel,
  isEssentialTrafficOnly,
  logError
} from "./chunk-kc49dhz0.js";
import {
  init_debug,
  init_slowOperations,
  isDebugToStdErr,
  jsonStringify,
  logForDebugging
} from "./chunk-pyv3zrjt.js";
import {
  _baseIsEqual_default,
  createSignal,
  getIsNonInteractiveSession,
  getKairosActive,
  getMainLoopModelOverride,
  getModelStrings,
  getSessionId,
  init__baseIsEqual,
  init_signal,
  init_state,
  preferThirdPartyAuthentication,
  setHasUnknownModelCost,
  setModelStrings
} from "./chunk-232p95fy.js";
import {
  init_sdk
} from "./chunk-ns1htxgd.js";
import {
  Anthropic
} from "./chunk-ztqzmfx1.js";
import {
  getAWSRegion,
  getClaudeConfigHomeDir,
  getVertexRegionForModel,
  init_envUtils,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-nxzx0ey9.js";
import {
  __esm,
  __require,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/utils/model/providers.ts
function getAPIProvider(settings = getInitialSettings()) {
  const modelType = settings.modelType;
  if (modelType === "openai")
    return "openai";
  if (modelType === "gemini")
    return "gemini";
  if (modelType === "grok")
    return "grok";
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK))
    return "bedrock";
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX))
    return "vertex";
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY))
    return "foundry";
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_OPENAI))
    return "openai";
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_GEMINI))
    return "gemini";
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_GROK))
    return "grok";
  return "firstParty";
}
function getAPIProviderForStatsig() {
  return getAPIProvider();
}
function isFirstPartyAnthropicBaseUrl() {
  const baseUrl = process.env.ANTHROPIC_BASE_URL;
  if (!baseUrl) {
    return true;
  }
  try {
    const host = new URL(baseUrl).host;
    const allowedHosts = ["api.anthropic.com"];
    if (process.env.USER_TYPE === "ant") {
      allowedHosts.push("api-staging.anthropic.com");
    }
    return allowedHosts.includes(host);
  } catch {
    return false;
  }
}
var init_providers = __esm(() => {
  init_settings();
  init_envUtils();
});

// node_modules/.bun/lodash-es@4.18.1/node_modules/lodash-es/isEqual.js
function isEqual(value, other) {
  return _baseIsEqual_default(value, other);
}
var isEqual_default;
var init_isEqual = __esm(() => {
  init__baseIsEqual();
  isEqual_default = isEqual;
});

// src/utils/model/antModels.ts
function getAntModelOverrideConfig() {
  if (process.env.USER_TYPE !== "ant") {
    return null;
  }
  return getFeatureValue_CACHED_MAY_BE_STALE("tengu_ant_model_override", null);
}
function getAntModels() {
  if (process.env.USER_TYPE !== "ant") {
    return [];
  }
  return getAntModelOverrideConfig()?.antModels ?? [];
}
function resolveAntModel(model) {
  if (process.env.USER_TYPE !== "ant") {
    return;
  }
  if (model === undefined) {
    return;
  }
  const lower = model.toLowerCase();
  return getAntModels().find((m) => m.alias === model || lower.includes(m.model.toLowerCase()));
}
var init_antModels = __esm(() => {
  init_growthbook();
});

// src/constants/betas.ts
var CLAUDE_CODE_20250219_BETA_HEADER = "claude-code-20250219", INTERLEAVED_THINKING_BETA_HEADER = "interleaved-thinking-2025-05-14", CONTEXT_1M_BETA_HEADER = "context-1m-2025-08-07", CONTEXT_MANAGEMENT_BETA_HEADER = "context-management-2025-06-27", STRUCTURED_OUTPUTS_BETA_HEADER = "structured-outputs-2025-12-15", WEB_SEARCH_BETA_HEADER = "web-search-2025-03-05", SEARCH_EXTRA_TOOLS_BETA_HEADER_3P = "tool-search-tool-2025-10-19", EFFORT_BETA_HEADER = "effort-2025-11-24", TASK_BUDGETS_BETA_HEADER = "task-budgets-2026-03-13", PROMPT_CACHING_SCOPE_BETA_HEADER = "prompt-caching-scope-2026-01-05", FAST_MODE_BETA_HEADER = "fast-mode-2026-02-01", REDACT_THINKING_BETA_HEADER = "redact-thinking-2026-02-12", TOKEN_EFFICIENT_TOOLS_BETA_HEADER = "token-efficient-tools-2026-03-28", AFK_MODE_BETA_HEADER = "afk-mode-2026-01-31", CLI_INTERNAL_BETA_HEADER, ADVISOR_BETA_HEADER = "advisor-tool-2026-03-01", BEDROCK_EXTRA_PARAMS_HEADERS, VERTEX_COUNT_TOKENS_ALLOWED_BETAS;
var init_betas = __esm(() => {
  CLI_INTERNAL_BETA_HEADER = process.env.USER_TYPE === "ant" ? "cli-internal-2026-02-09" : "";
  BEDROCK_EXTRA_PARAMS_HEADERS = new Set([
    INTERLEAVED_THINKING_BETA_HEADER,
    CONTEXT_1M_BETA_HEADER,
    SEARCH_EXTRA_TOOLS_BETA_HEADER_3P
  ]);
  VERTEX_COUNT_TOKENS_ALLOWED_BETAS = new Set([
    CLAUDE_CODE_20250219_BETA_HEADER,
    INTERLEAVED_THINKING_BETA_HEADER,
    CONTEXT_MANAGEMENT_BETA_HEADER
  ]);
});

// src/utils/context.ts
function is1mContextDisabled() {
  return isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_1M_CONTEXT);
}
function has1mContext(model) {
  if (is1mContextDisabled()) {
    return false;
  }
  return /\[1m\]/i.test(model);
}
function modelSupports1M(model) {
  if (is1mContextDisabled()) {
    return false;
  }
  const canonical = getCanonicalName(model);
  return canonical.includes("claude-sonnet-4") || canonical.includes("opus-4-6") || canonical.includes("opus-4-7");
}
function getContextWindowForModel(model, betas) {
  if (process.env.USER_TYPE === "ant" && process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS) {
    const override = parseInt(process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS, 10);
    if (!isNaN(override) && override > 0) {
      return override;
    }
  }
  if (has1mContext(model)) {
    return 1e6;
  }
  const cap = getModelCapability(model);
  if (cap?.max_input_tokens && cap.max_input_tokens >= 1e5) {
    if (cap.max_input_tokens > MODEL_CONTEXT_WINDOW_DEFAULT && is1mContextDisabled()) {
      return MODEL_CONTEXT_WINDOW_DEFAULT;
    }
    return cap.max_input_tokens;
  }
  if (betas?.includes(CONTEXT_1M_BETA_HEADER) && modelSupports1M(model)) {
    return 1e6;
  }
  if (getSonnet1mExpTreatmentEnabled(model)) {
    return 1e6;
  }
  if (process.env.USER_TYPE === "ant") {
    const antModel = resolveAntModel(model);
    if (antModel?.contextWindow) {
      return antModel.contextWindow;
    }
  }
  return MODEL_CONTEXT_WINDOW_DEFAULT;
}
function getSonnet1mExpTreatmentEnabled(model) {
  if (is1mContextDisabled()) {
    return false;
  }
  if (has1mContext(model)) {
    return false;
  }
  if (!getCanonicalName(model).includes("sonnet-4-6")) {
    return false;
  }
  return getGlobalConfig().clientDataCache?.["coral_reef_sonnet"] === "true";
}
function calculateContextPercentages(currentUsage, contextWindowSize) {
  if (!currentUsage) {
    return { used: null, remaining: null };
  }
  const totalInputTokens = currentUsage.input_tokens + currentUsage.cache_creation_input_tokens + currentUsage.cache_read_input_tokens;
  if (totalInputTokens === 0) {
    return { used: null, remaining: null };
  }
  const usedPercentage = Math.round(totalInputTokens / contextWindowSize * 100);
  const clampedUsed = Math.min(100, Math.max(0, usedPercentage));
  return {
    used: clampedUsed,
    remaining: 100 - clampedUsed
  };
}
function getModelMaxOutputTokens(model) {
  let defaultTokens;
  let upperLimit;
  if (process.env.USER_TYPE === "ant") {
    const antModel = resolveAntModel(model.toLowerCase());
    if (antModel) {
      defaultTokens = antModel.defaultMaxTokens ?? MAX_OUTPUT_TOKENS_DEFAULT;
      upperLimit = antModel.upperMaxTokensLimit ?? MAX_OUTPUT_TOKENS_UPPER_LIMIT;
      return { default: defaultTokens, upperLimit };
    }
  }
  const m = getCanonicalName(model);
  if (m.includes("opus-4-7")) {
    defaultTokens = 64000;
    upperLimit = 128000;
  } else if (m.includes("opus-4-6")) {
    defaultTokens = 64000;
    upperLimit = 128000;
  } else if (m.includes("sonnet-4-6")) {
    defaultTokens = 32000;
    upperLimit = 128000;
  } else if (m.includes("opus-4-5") || m.includes("sonnet-4") || m.includes("haiku-4")) {
    defaultTokens = 32000;
    upperLimit = 64000;
  } else if (m.includes("opus-4-1") || m.includes("opus-4")) {
    defaultTokens = 32000;
    upperLimit = 32000;
  } else if (m.includes("claude-3-opus")) {
    defaultTokens = 4096;
    upperLimit = 4096;
  } else if (m.includes("claude-3-sonnet")) {
    defaultTokens = 8192;
    upperLimit = 8192;
  } else if (m.includes("claude-3-haiku")) {
    defaultTokens = 4096;
    upperLimit = 4096;
  } else if (m.includes("3-5-sonnet") || m.includes("3-5-haiku")) {
    defaultTokens = 8192;
    upperLimit = 8192;
  } else if (m.includes("3-7-sonnet")) {
    defaultTokens = 32000;
    upperLimit = 64000;
  } else {
    defaultTokens = MAX_OUTPUT_TOKENS_DEFAULT;
    upperLimit = MAX_OUTPUT_TOKENS_UPPER_LIMIT;
  }
  const cap = getModelCapability(model);
  if (cap?.max_tokens && cap.max_tokens >= 4096) {
    upperLimit = cap.max_tokens;
    defaultTokens = Math.min(defaultTokens, upperLimit);
  }
  return { default: defaultTokens, upperLimit };
}
function getMaxThinkingTokensForModel(model) {
  return getModelMaxOutputTokens(model).upperLimit - 1;
}
var MODEL_CONTEXT_WINDOW_DEFAULT = 200000, COMPACT_MAX_OUTPUT_TOKENS = 20000, MAX_OUTPUT_TOKENS_DEFAULT = 32000, MAX_OUTPUT_TOKENS_UPPER_LIMIT = 64000, CAPPED_DEFAULT_MAX_TOKENS = 8000, ESCALATED_MAX_TOKENS = 64000;
var init_context = __esm(() => {
  init_betas();
  init_config();
  init_envUtils();
  init_model();
  init_antModels();
  init_modelCapabilities();
});

// src/utils/sequential.ts
function sequential(fn) {
  const queue = [];
  let processing = false;
  async function processQueue() {
    if (processing)
      return;
    if (queue.length === 0)
      return;
    processing = true;
    while (queue.length > 0) {
      const { args, resolve, reject, context } = queue.shift();
      try {
        const result = await fn.apply(context, args);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
    processing = false;
    if (queue.length > 0) {
      processQueue();
    }
  }
  return function(...args) {
    return new Promise((resolve, reject) => {
      queue.push({ args, resolve, reject, context: this });
      processQueue();
    });
  };
}
var init_sequential = () => {};

// src/utils/model/bedrock.ts
function findFirstMatch(profiles, substring) {
  return profiles.find((p) => p.includes(substring)) ?? null;
}
async function createBedrockClient() {
  const { BedrockClient } = await import("./chunk-r2cphrb1.js");
  const region = getAWSRegion();
  const skipAuth = isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH);
  const clientConfig = {
    region,
    ...process.env.ANTHROPIC_BEDROCK_BASE_URL && {
      endpoint: process.env.ANTHROPIC_BEDROCK_BASE_URL
    },
    ...await getAWSClientProxyConfig(),
    ...skipAuth && {
      requestHandler: new (await import("./chunk-vy0c1bwp.js")).NodeHttpHandler,
      httpAuthSchemes: [
        {
          schemeId: "smithy.api#noAuth",
          identityProvider: () => async () => ({}),
          signer: new (await import("./chunk-mnm5wfcr.js")).NoAuthSigner
        }
      ],
      httpAuthSchemeProvider: () => [{ schemeId: "smithy.api#noAuth" }]
    }
  };
  if (!skipAuth && !process.env.AWS_BEARER_TOKEN_BEDROCK) {
    const cachedCredentials = await refreshAndGetAwsCredentials();
    if (cachedCredentials) {
      clientConfig.credentials = {
        accessKeyId: cachedCredentials.accessKeyId,
        secretAccessKey: cachedCredentials.secretAccessKey,
        sessionToken: cachedCredentials.sessionToken
      };
    }
  }
  return new BedrockClient(clientConfig);
}
async function createBedrockRuntimeClient() {
  const { BedrockRuntimeClient } = await import("./chunk-pek0ef22.js");
  const region = getAWSRegion();
  const skipAuth = isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH);
  const clientConfig = {
    region,
    ...process.env.ANTHROPIC_BEDROCK_BASE_URL && {
      endpoint: process.env.ANTHROPIC_BEDROCK_BASE_URL
    },
    ...await getAWSClientProxyConfig(),
    ...skipAuth && {
      requestHandler: new (await import("./chunk-vy0c1bwp.js")).NodeHttpHandler,
      httpAuthSchemes: [
        {
          schemeId: "smithy.api#noAuth",
          identityProvider: () => async () => ({}),
          signer: new (await import("./chunk-mnm5wfcr.js")).NoAuthSigner
        }
      ],
      httpAuthSchemeProvider: () => [{ schemeId: "smithy.api#noAuth" }]
    }
  };
  if (!skipAuth && !process.env.AWS_BEARER_TOKEN_BEDROCK) {
    const cachedCredentials = await refreshAndGetAwsCredentials();
    if (cachedCredentials) {
      clientConfig.credentials = {
        accessKeyId: cachedCredentials.accessKeyId,
        secretAccessKey: cachedCredentials.secretAccessKey,
        sessionToken: cachedCredentials.sessionToken
      };
    }
  }
  return new BedrockRuntimeClient(clientConfig);
}
function isFoundationModel(modelId) {
  return modelId.startsWith("anthropic.");
}
function extractModelIdFromArn(modelId) {
  if (!modelId.startsWith("arn:")) {
    return modelId;
  }
  const lastSlashIndex = modelId.lastIndexOf("/");
  if (lastSlashIndex === -1) {
    return modelId;
  }
  return modelId.substring(lastSlashIndex + 1);
}
function getBedrockRegionPrefix(modelId) {
  const effectiveModelId = extractModelIdFromArn(modelId);
  for (const prefix of BEDROCK_REGION_PREFIXES) {
    if (effectiveModelId.startsWith(`${prefix}.anthropic.`)) {
      return prefix;
    }
  }
  return;
}
function applyBedrockRegionPrefix(modelId, prefix) {
  const existingPrefix = getBedrockRegionPrefix(modelId);
  if (existingPrefix) {
    return modelId.replace(`${existingPrefix}.`, `${prefix}.`);
  }
  if (isFoundationModel(modelId)) {
    return `${prefix}.${modelId}`;
  }
  return modelId;
}
var getBedrockInferenceProfiles, getInferenceProfileBackingModel, BEDROCK_REGION_PREFIXES;
var init_bedrock = __esm(() => {
  init_memoize();
  init_auth();
  init_envUtils();
  init_log();
  init_proxy();
  getBedrockInferenceProfiles = memoize_default(async function() {
    const [client, { ListInferenceProfilesCommand }] = await Promise.all([
      createBedrockClient(),
      import("./chunk-r2cphrb1.js")
    ]);
    const allProfiles = [];
    let nextToken;
    try {
      do {
        const command = new ListInferenceProfilesCommand({
          ...nextToken && { nextToken },
          typeEquals: "SYSTEM_DEFINED"
        });
        const response = await client.send(command);
        if (response.inferenceProfileSummaries) {
          allProfiles.push(...response.inferenceProfileSummaries);
        }
        nextToken = response.nextToken;
      } while (nextToken);
      return allProfiles.filter((profile) => profile.inferenceProfileId?.includes("anthropic")).map((profile) => profile.inferenceProfileId).filter(Boolean);
    } catch (error) {
      logError(error);
      throw error;
    }
  });
  getInferenceProfileBackingModel = memoize_default(async function(profileId) {
    try {
      const [client, { GetInferenceProfileCommand }] = await Promise.all([
        createBedrockClient(),
        import("./chunk-r2cphrb1.js")
      ]);
      const command = new GetInferenceProfileCommand({
        inferenceProfileIdentifier: profileId
      });
      const response = await client.send(command);
      if (!response.models || response.models.length === 0) {
        return null;
      }
      const primaryModel = response.models[0];
      if (!primaryModel?.modelArn) {
        return null;
      }
      const lastSlashIndex = primaryModel.modelArn.lastIndexOf("/");
      return lastSlashIndex >= 0 ? primaryModel.modelArn.substring(lastSlashIndex + 1) : primaryModel.modelArn;
    } catch (error) {
      logError(error);
      return null;
    }
  });
  BEDROCK_REGION_PREFIXES = ["us", "eu", "apac", "global"];
});

// src/utils/model/configs.ts
var CLAUDE_3_7_SONNET_CONFIG, CLAUDE_3_5_V2_SONNET_CONFIG, CLAUDE_3_5_HAIKU_CONFIG, CLAUDE_HAIKU_4_5_CONFIG, CLAUDE_SONNET_4_CONFIG, CLAUDE_SONNET_4_5_CONFIG, CLAUDE_OPUS_4_CONFIG, CLAUDE_OPUS_4_1_CONFIG, CLAUDE_OPUS_4_5_CONFIG, CLAUDE_OPUS_4_6_CONFIG, CLAUDE_OPUS_4_7_CONFIG, CLAUDE_SONNET_4_6_CONFIG, ALL_MODEL_CONFIGS, CANONICAL_MODEL_IDS, CANONICAL_ID_TO_KEY;
var init_configs = __esm(() => {
  CLAUDE_3_7_SONNET_CONFIG = {
    firstParty: "claude-3-7-sonnet-20250219",
    bedrock: "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    vertex: "claude-3-7-sonnet@20250219",
    foundry: "claude-3-7-sonnet",
    openai: "claude-3-7-sonnet-20250219",
    gemini: "claude-3-7-sonnet-20250219",
    grok: "claude-3-7-sonnet-20250219"
  };
  CLAUDE_3_5_V2_SONNET_CONFIG = {
    firstParty: "claude-3-5-sonnet-20241022",
    bedrock: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    vertex: "claude-3-5-sonnet-v2@20241022",
    foundry: "claude-3-5-sonnet",
    openai: "claude-3-5-sonnet-20241022",
    gemini: "claude-3-5-sonnet-20241022",
    grok: "claude-3-5-sonnet-20241022"
  };
  CLAUDE_3_5_HAIKU_CONFIG = {
    firstParty: "claude-3-5-haiku-20241022",
    bedrock: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
    vertex: "claude-3-5-haiku@20241022",
    foundry: "claude-3-5-haiku",
    openai: "claude-3-5-haiku-20241022",
    gemini: "claude-3-5-haiku-20241022",
    grok: "claude-3-5-haiku-20241022"
  };
  CLAUDE_HAIKU_4_5_CONFIG = {
    firstParty: "claude-haiku-4-5-20251001",
    bedrock: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
    vertex: "claude-haiku-4-5@20251001",
    foundry: "claude-haiku-4-5",
    openai: "claude-haiku-4-5-20251001",
    gemini: "claude-haiku-4-5-20251001",
    grok: "claude-haiku-4-5-20251001"
  };
  CLAUDE_SONNET_4_CONFIG = {
    firstParty: "claude-sonnet-4-20250514",
    bedrock: "us.anthropic.claude-sonnet-4-20250514-v1:0",
    vertex: "claude-sonnet-4@20250514",
    foundry: "claude-sonnet-4",
    openai: "claude-sonnet-4-20250514",
    gemini: "claude-sonnet-4-20250514",
    grok: "claude-sonnet-4-20250514"
  };
  CLAUDE_SONNET_4_5_CONFIG = {
    firstParty: "claude-sonnet-4-5-20250929",
    bedrock: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
    vertex: "claude-sonnet-4-5@20250929",
    foundry: "claude-sonnet-4-5",
    openai: "claude-sonnet-4-5-20250929",
    gemini: "claude-sonnet-4-5-20250929",
    grok: "claude-sonnet-4-5-20250929"
  };
  CLAUDE_OPUS_4_CONFIG = {
    firstParty: "claude-opus-4-20250514",
    bedrock: "us.anthropic.claude-opus-4-20250514-v1:0",
    vertex: "claude-opus-4@20250514",
    foundry: "claude-opus-4",
    openai: "claude-opus-4-20250514",
    gemini: "claude-opus-4-20250514",
    grok: "claude-opus-4-20250514"
  };
  CLAUDE_OPUS_4_1_CONFIG = {
    firstParty: "claude-opus-4-1-20250805",
    bedrock: "us.anthropic.claude-opus-4-1-20250805-v1:0",
    vertex: "claude-opus-4-1@20250805",
    foundry: "claude-opus-4-1",
    openai: "claude-opus-4-1-20250805",
    gemini: "claude-opus-4-1-20250805",
    grok: "claude-opus-4-1-20250805"
  };
  CLAUDE_OPUS_4_5_CONFIG = {
    firstParty: "claude-opus-4-5-20251101",
    bedrock: "us.anthropic.claude-opus-4-5-20251101-v1:0",
    vertex: "claude-opus-4-5@20251101",
    foundry: "claude-opus-4-5",
    openai: "claude-opus-4-5-20251101",
    gemini: "claude-opus-4-5-20251101",
    grok: "claude-opus-4-5-20251101"
  };
  CLAUDE_OPUS_4_6_CONFIG = {
    firstParty: "claude-opus-4-6",
    bedrock: "us.anthropic.claude-opus-4-6-v1",
    vertex: "claude-opus-4-6",
    foundry: "claude-opus-4-6",
    openai: "claude-opus-4-6",
    gemini: "claude-opus-4-6",
    grok: "claude-opus-4-6"
  };
  CLAUDE_OPUS_4_7_CONFIG = {
    firstParty: "claude-opus-4-7",
    bedrock: "us.anthropic.claude-opus-4-7-v1",
    vertex: "claude-opus-4-7",
    foundry: "claude-opus-4-7",
    openai: "claude-opus-4-7",
    gemini: "claude-opus-4-7",
    grok: "claude-opus-4-7"
  };
  CLAUDE_SONNET_4_6_CONFIG = {
    firstParty: "claude-sonnet-4-6",
    bedrock: "us.anthropic.claude-sonnet-4-6",
    vertex: "claude-sonnet-4-6",
    foundry: "claude-sonnet-4-6",
    openai: "claude-sonnet-4-6",
    gemini: "claude-sonnet-4-6",
    grok: "claude-sonnet-4-6"
  };
  ALL_MODEL_CONFIGS = {
    haiku35: CLAUDE_3_5_HAIKU_CONFIG,
    haiku45: CLAUDE_HAIKU_4_5_CONFIG,
    sonnet35: CLAUDE_3_5_V2_SONNET_CONFIG,
    sonnet37: CLAUDE_3_7_SONNET_CONFIG,
    sonnet40: CLAUDE_SONNET_4_CONFIG,
    sonnet45: CLAUDE_SONNET_4_5_CONFIG,
    sonnet46: CLAUDE_SONNET_4_6_CONFIG,
    opus40: CLAUDE_OPUS_4_CONFIG,
    opus41: CLAUDE_OPUS_4_1_CONFIG,
    opus45: CLAUDE_OPUS_4_5_CONFIG,
    opus46: CLAUDE_OPUS_4_6_CONFIG,
    opus47: CLAUDE_OPUS_4_7_CONFIG
  };
  CANONICAL_MODEL_IDS = Object.values(ALL_MODEL_CONFIGS).map((c) => c.firstParty);
  CANONICAL_ID_TO_KEY = Object.fromEntries(Object.entries(ALL_MODEL_CONFIGS).map(([key, cfg]) => [cfg.firstParty, key]));
});

// src/utils/model/modelStrings.ts
function getBuiltinModelStrings(provider) {
  const out = {};
  for (const key of MODEL_KEYS) {
    out[key] = ALL_MODEL_CONFIGS[key][provider];
  }
  return out;
}
async function getBedrockModelStrings() {
  const fallback = getBuiltinModelStrings("bedrock");
  let profiles;
  try {
    profiles = await getBedrockInferenceProfiles();
  } catch (error) {
    logError(error);
    return fallback;
  }
  if (!profiles?.length) {
    return fallback;
  }
  const out = {};
  for (const key of MODEL_KEYS) {
    const needle = ALL_MODEL_CONFIGS[key].firstParty;
    out[key] = findFirstMatch(profiles, needle) || fallback[key];
  }
  return out;
}
function applyModelOverrides(ms) {
  const overrides = getInitialSettings().modelOverrides;
  if (!overrides) {
    return ms;
  }
  const out = { ...ms };
  for (const [canonicalId, override] of Object.entries(overrides)) {
    const key = CANONICAL_ID_TO_KEY[canonicalId];
    if (key && override) {
      out[key] = override;
    }
  }
  return out;
}
function resolveOverriddenModel(modelId) {
  let overrides;
  try {
    overrides = getInitialSettings().modelOverrides;
  } catch {
    return modelId;
  }
  if (!overrides) {
    return modelId;
  }
  for (const [canonicalId, override] of Object.entries(overrides)) {
    if (override === modelId) {
      return canonicalId;
    }
  }
  return modelId;
}
function initModelStrings() {
  const ms = getModelStrings();
  if (ms !== null) {
    return;
  }
  if (getAPIProvider() !== "bedrock") {
    setModelStrings(getBuiltinModelStrings(getAPIProvider()));
    return;
  }
  updateBedrockModelStrings();
}
function getModelStrings2() {
  const ms = getModelStrings();
  if (ms === null) {
    initModelStrings();
    return applyModelOverrides(getBuiltinModelStrings(getAPIProvider()));
  }
  return applyModelOverrides(ms);
}
async function ensureModelStringsInitialized() {
  const ms = getModelStrings();
  if (ms !== null) {
    return;
  }
  if (getAPIProvider() !== "bedrock") {
    setModelStrings(getBuiltinModelStrings(getAPIProvider()));
    return;
  }
  await updateBedrockModelStrings();
}
var MODEL_KEYS, updateBedrockModelStrings;
var init_modelStrings = __esm(() => {
  init_state();
  init_log();
  init_sequential();
  init_settings();
  init_bedrock();
  init_configs();
  init_providers();
  MODEL_KEYS = Object.keys(ALL_MODEL_CONFIGS);
  updateBedrockModelStrings = sequential(async () => {
    if (getModelStrings() !== null) {
      return;
    }
    try {
      const ms = await getBedrockModelStrings();
      setModelStrings(ms);
    } catch (error) {
      logError(error);
    }
  });
});

// src/utils/fastMode.ts
function isFastModeEnabled() {
  return !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FAST_MODE);
}
function isFastModeAvailable() {
  if (!isFastModeEnabled()) {
    return false;
  }
  return getFastModeUnavailableReason() === null;
}
function getDisabledReasonMessage(disabledReason, authType) {
  switch (disabledReason) {
    case "free":
      return authType === "oauth" ? "Fast mode requires a paid subscription" : "Fast mode unavailable during evaluation. Please purchase credits.";
    case "preference":
      return "Fast mode has been disabled by your organization";
    case "extra_usage_disabled":
      return "Fast mode requires extra usage billing \xB7 /extra-usage to enable";
    case "network_error":
      return "Fast mode unavailable due to network connectivity issues";
    case "unknown":
      return "Fast mode is currently unavailable";
  }
}
function getFastModeUnavailableReason() {
  if (!isFastModeEnabled()) {
    return "Fast mode is not available";
  }
  const statigReason = getFeatureValue_CACHED_MAY_BE_STALE("tengu_penguins_off", null);
  if (statigReason !== null) {
    logForDebugging(`Fast mode unavailable: ${statigReason}`);
    return statigReason;
  }
  if (!isInBundledMode() && getFeatureValue_CACHED_MAY_BE_STALE("tengu_marble_sandcastle", false)) {
    return "Fast mode requires the native binary \xB7 Install from: https://claude.com/product/claude-code";
  }
  if (getIsNonInteractiveSession() && preferThirdPartyAuthentication() && !getKairosActive()) {
    const flagFastMode = getSettingsForSource("flagSettings")?.fastMode;
    if (!flagFastMode) {
      const reason = "Fast mode is not available in the Agent SDK";
      logForDebugging(`Fast mode unavailable: ${reason}`);
      return reason;
    }
  }
  if (getAPIProvider() !== "firstParty") {
    const reason = "Fast mode is not available on Bedrock, Vertex, or Foundry";
    logForDebugging(`Fast mode unavailable: ${reason}`);
    return reason;
  }
  if (orgStatus.status === "disabled") {
    if (orgStatus.reason === "network_error" || orgStatus.reason === "unknown") {
      if (isEnvTruthy(process.env.CLAUDE_CODE_SKIP_FAST_MODE_NETWORK_ERRORS)) {
        return null;
      }
    }
    const authType = getClaudeAIOAuthTokens() !== null ? "oauth" : "api-key";
    const reason = getDisabledReasonMessage(orgStatus.reason, authType);
    logForDebugging(`Fast mode unavailable: ${reason}`);
    return reason;
  }
  return null;
}
function getFastModeModel() {
  return "opus" + (isOpus1mMergeEnabled() ? "[1m]" : "");
}
function getInitialFastModeSetting(model) {
  if (!isFastModeEnabled()) {
    return false;
  }
  if (!isFastModeAvailable()) {
    return false;
  }
  if (!isFastModeSupportedByModel(model)) {
    return false;
  }
  const settings = getInitialSettings();
  if (settings.fastModePerSessionOptIn) {
    return false;
  }
  return settings.fastMode === true;
}
function isFastModeSupportedByModel(modelSetting) {
  if (!isFastModeEnabled()) {
    return false;
  }
  const model = modelSetting ?? getDefaultMainLoopModelSetting();
  const parsedModel = parseUserSpecifiedModel(model);
  return parsedModel.toLowerCase().includes("opus-4-7") || parsedModel.toLowerCase().includes("opus-4-6");
}
function getFastModeRuntimeState() {
  if (runtimeState.status === "cooldown" && Date.now() >= runtimeState.resetAt) {
    if (isFastModeEnabled() && !hasLoggedCooldownExpiry) {
      logForDebugging("Fast mode cooldown expired, re-enabling fast mode");
      hasLoggedCooldownExpiry = true;
      cooldownExpired.emit();
    }
    runtimeState = { status: "active" };
  }
  return runtimeState;
}
function triggerFastModeCooldown(resetTimestamp, reason) {
  if (!isFastModeEnabled()) {
    return;
  }
  runtimeState = { status: "cooldown", resetAt: resetTimestamp, reason };
  hasLoggedCooldownExpiry = false;
  const cooldownDurationMs = resetTimestamp - Date.now();
  logForDebugging(`Fast mode cooldown triggered (${reason}), duration ${Math.round(cooldownDurationMs / 1000)}s`);
  logEvent("tengu_fast_mode_fallback_triggered", {
    cooldown_duration_ms: cooldownDurationMs,
    cooldown_reason: reason
  });
  cooldownTriggered.emit(resetTimestamp, reason);
}
function clearFastModeCooldown() {
  runtimeState = { status: "active" };
}
function handleFastModeRejectedByAPI() {
  if (orgStatus.status === "disabled") {
    return;
  }
  orgStatus = { status: "disabled", reason: "preference" };
  updateSettingsForSource("userSettings", { fastMode: undefined });
  saveGlobalConfig((current) => ({
    ...current,
    penguinModeOrgEnabled: false
  }));
  orgFastModeChange.emit(false);
}
function getOverageDisabledMessage(reason) {
  switch (reason) {
    case "out_of_credits":
      return "Fast mode disabled \xB7 extra usage credits exhausted";
    case "org_level_disabled":
    case "org_service_level_disabled":
      return "Fast mode disabled \xB7 extra usage disabled by your organization";
    case "org_level_disabled_until":
      return "Fast mode disabled \xB7 extra usage spending cap reached";
    case "member_level_disabled":
      return "Fast mode disabled \xB7 extra usage disabled for your account";
    case "seat_tier_level_disabled":
    case "seat_tier_zero_credit_limit":
    case "member_zero_credit_limit":
      return "Fast mode disabled \xB7 extra usage not available for your plan";
    case "overage_not_provisioned":
    case "no_limits_configured":
      return "Fast mode requires extra usage billing \xB7 /extra-usage to enable";
    default:
      return "Fast mode disabled \xB7 extra usage not available";
  }
}
function isOutOfCreditsReason(reason) {
  return reason === "org_level_disabled_until" || reason === "out_of_credits";
}
function handleFastModeOverageRejection(reason) {
  const message = getOverageDisabledMessage(reason);
  logForDebugging(`Fast mode overage rejection: ${reason ?? "unknown"} \u2014 ${message}`);
  logEvent("tengu_fast_mode_overage_rejected", {
    overage_disabled_reason: reason ?? "unknown"
  });
  if (!isOutOfCreditsReason(reason)) {
    updateSettingsForSource("userSettings", { fastMode: undefined });
    saveGlobalConfig((current) => ({
      ...current,
      penguinModeOrgEnabled: false
    }));
  }
  overageRejection.emit(message);
}
function isFastModeCooldown() {
  return getFastModeRuntimeState().status === "cooldown";
}
function getFastModeState(model, fastModeUserEnabled) {
  const enabled = isFastModeEnabled() && isFastModeAvailable() && !!fastModeUserEnabled && isFastModeSupportedByModel(model);
  if (enabled && isFastModeCooldown()) {
    return "cooldown";
  }
  if (enabled) {
    return "on";
  }
  return "off";
}
async function fetchFastModeStatus(auth) {
  const endpoint = `${getOauthConfig().BASE_API_URL}/api/claude_code_penguin_mode`;
  const headers = "accessToken" in auth ? {
    Authorization: `Bearer ${auth.accessToken}`,
    "anthropic-beta": OAUTH_BETA_HEADER
  } : { "x-api-key": auth.apiKey };
  const response = await axios_default.get(endpoint, { headers });
  return response.data;
}
function resolveFastModeStatusFromCache() {
  if (!isFastModeEnabled()) {
    return;
  }
  if (orgStatus.status !== "pending") {
    return;
  }
  const isAnt = process.env.USER_TYPE === "ant";
  const cachedEnabled = getGlobalConfig().penguinModeOrgEnabled === true;
  orgStatus = isAnt || cachedEnabled ? { status: "enabled" } : { status: "disabled", reason: "unknown" };
}
async function prefetchFastModeStatus() {
  if (isEssentialTrafficOnly()) {
    return;
  }
  if (!isFastModeEnabled()) {
    return;
  }
  if (inflightPrefetch) {
    logForDebugging("Fast mode prefetch in progress, returning in-flight promise");
    return inflightPrefetch;
  }
  const apiKey = getAnthropicApiKey();
  const hasUsableOAuth = getClaudeAIOAuthTokens()?.accessToken && hasProfileScope();
  if (!hasUsableOAuth && !apiKey) {
    const isAnt = process.env.USER_TYPE === "ant";
    const cachedEnabled = getGlobalConfig().penguinModeOrgEnabled === true;
    orgStatus = isAnt || cachedEnabled ? { status: "enabled" } : { status: "disabled", reason: "preference" };
    return;
  }
  const now = Date.now();
  if (now - lastPrefetchAt < PREFETCH_MIN_INTERVAL_MS) {
    logForDebugging("Skipping fast mode prefetch, fetched recently");
    return;
  }
  lastPrefetchAt = now;
  const fetchWithCurrentAuth = async () => {
    const currentTokens = getClaudeAIOAuthTokens();
    const auth = currentTokens?.accessToken && hasProfileScope() ? { accessToken: currentTokens.accessToken } : apiKey ? { apiKey } : null;
    if (!auth) {
      throw new Error("No auth available");
    }
    return fetchFastModeStatus(auth);
  };
  async function doFetch() {
    try {
      let status;
      try {
        status = await fetchWithCurrentAuth();
      } catch (err) {
        const isAuthError = axios_default.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403 && typeof err.response?.data === "string" && err.response.data.includes("OAuth token has been revoked"));
        if (isAuthError) {
          const failedAccessToken = getClaudeAIOAuthTokens()?.accessToken;
          if (failedAccessToken) {
            await handleOAuth401Error(failedAccessToken);
            status = await fetchWithCurrentAuth();
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
      const previousEnabled = orgStatus.status !== "pending" ? orgStatus.status === "enabled" : getGlobalConfig().penguinModeOrgEnabled;
      orgStatus = status.enabled ? { status: "enabled" } : {
        status: "disabled",
        reason: status.disabled_reason ?? "preference"
      };
      if (previousEnabled !== status.enabled) {
        if (!status.enabled) {
          updateSettingsForSource("userSettings", { fastMode: undefined });
        }
        saveGlobalConfig((current) => ({
          ...current,
          penguinModeOrgEnabled: status.enabled
        }));
        orgFastModeChange.emit(status.enabled);
      }
      logForDebugging(`Org fast mode: ${status.enabled ? "enabled" : `disabled (${status.disabled_reason ?? "preference"})`}`);
    } catch (err) {
      const isAnt = process.env.USER_TYPE === "ant";
      const cachedEnabled = getGlobalConfig().penguinModeOrgEnabled === true;
      orgStatus = isAnt || cachedEnabled ? { status: "enabled" } : { status: "disabled", reason: "network_error" };
      logForDebugging(`Failed to fetch org fast mode status, defaulting to ${orgStatus.status === "enabled" ? "enabled (cached)" : "disabled (network_error)"}: ${err}`, { level: "error" });
      logEvent("tengu_org_penguin_mode_fetch_failed", {});
    } finally {
      inflightPrefetch = null;
    }
  }
  inflightPrefetch = doFetch();
  return inflightPrefetch;
}
var FAST_MODE_MODEL_DISPLAY = "Opus 4.7", runtimeState, hasLoggedCooldownExpiry = false, cooldownTriggered, cooldownExpired, onCooldownTriggered, onCooldownExpired, overageRejection, onFastModeOverageRejection, orgStatus, orgFastModeChange, onOrgFastModeChanged, PREFETCH_MIN_INTERVAL_MS = 30000, lastPrefetchAt = 0, inflightPrefetch = null;
var init_fastMode = __esm(() => {
  init_axios();
  init_oauth();
  init_growthbook();
  init_state();
  init_analytics();
  init_auth();
  init_bundledMode();
  init_config();
  init_debug();
  init_envUtils();
  init_model();
  init_providers();
  init_privacyLevel();
  init_settings();
  init_signal();
  runtimeState = { status: "active" };
  cooldownTriggered = createSignal();
  cooldownExpired = createSignal();
  onCooldownTriggered = cooldownTriggered.subscribe;
  onCooldownExpired = cooldownExpired.subscribe;
  overageRejection = createSignal();
  onFastModeOverageRejection = overageRejection.subscribe;
  orgStatus = { status: "pending" };
  orgFastModeChange = createSignal();
  onOrgFastModeChanged = orgFastModeChange.subscribe;
});

// src/utils/modelCost.ts
function getOpus46CostTier(fastMode) {
  if (isFastModeEnabled() && fastMode) {
    return COST_TIER_30_150;
  }
  return COST_TIER_5_25;
}
function tokensToUSDCost(modelCosts, usage) {
  return usage.input_tokens / 1e6 * modelCosts.inputTokens + usage.output_tokens / 1e6 * modelCosts.outputTokens + (usage.cache_read_input_tokens ?? 0) / 1e6 * modelCosts.promptCacheReadTokens + (usage.cache_creation_input_tokens ?? 0) / 1e6 * modelCosts.promptCacheWriteTokens + (usage.server_tool_use?.web_search_requests ?? 0) * modelCosts.webSearchRequests;
}
function getModelCosts(model, usage) {
  const shortName = getCanonicalName(model);
  if (shortName === firstPartyNameToCanonical(CLAUDE_OPUS_4_6_CONFIG.firstParty)) {
    const isFastMode = usage.speed === "fast";
    return getOpus46CostTier(isFastMode);
  }
  const costs = MODEL_COSTS[shortName];
  if (!costs) {
    trackUnknownModelCost(model, shortName);
    return MODEL_COSTS[getCanonicalName(getDefaultMainLoopModelSetting())] ?? DEFAULT_UNKNOWN_MODEL_COST;
  }
  return costs;
}
function trackUnknownModelCost(model, shortName) {
  logEvent("tengu_unknown_model_cost", {
    model,
    shortName
  });
  setHasUnknownModelCost();
}
function calculateUSDCost(resolvedModel, usage) {
  const modelCosts = getModelCosts(resolvedModel, usage);
  return tokensToUSDCost(modelCosts, usage);
}
function calculateCostFromTokens(model, tokens) {
  const usage = {
    input_tokens: tokens.inputTokens,
    output_tokens: tokens.outputTokens,
    cache_read_input_tokens: tokens.cacheReadInputTokens,
    cache_creation_input_tokens: tokens.cacheCreationInputTokens
  };
  return calculateUSDCost(model, usage);
}
function formatPrice(price) {
  if (Number.isInteger(price)) {
    return `$${price}`;
  }
  return `$${price.toFixed(2)}`;
}
function formatModelPricing(costs) {
  return `${formatPrice(costs.inputTokens)}/${formatPrice(costs.outputTokens)} per Mtok`;
}
var COST_TIER_3_15, COST_TIER_15_75, COST_TIER_5_25, COST_TIER_30_150, COST_HAIKU_35, COST_HAIKU_45, DEFAULT_UNKNOWN_MODEL_COST, MODEL_COSTS;
var init_modelCost = __esm(() => {
  init_analytics();
  init_state();
  init_fastMode();
  init_configs();
  init_model();
  COST_TIER_3_15 = {
    inputTokens: 3,
    outputTokens: 15,
    promptCacheWriteTokens: 3.75,
    promptCacheReadTokens: 0.3,
    webSearchRequests: 0.01
  };
  COST_TIER_15_75 = {
    inputTokens: 15,
    outputTokens: 75,
    promptCacheWriteTokens: 18.75,
    promptCacheReadTokens: 1.5,
    webSearchRequests: 0.01
  };
  COST_TIER_5_25 = {
    inputTokens: 5,
    outputTokens: 25,
    promptCacheWriteTokens: 6.25,
    promptCacheReadTokens: 0.5,
    webSearchRequests: 0.01
  };
  COST_TIER_30_150 = {
    inputTokens: 30,
    outputTokens: 150,
    promptCacheWriteTokens: 37.5,
    promptCacheReadTokens: 3,
    webSearchRequests: 0.01
  };
  COST_HAIKU_35 = {
    inputTokens: 0.8,
    outputTokens: 4,
    promptCacheWriteTokens: 1,
    promptCacheReadTokens: 0.08,
    webSearchRequests: 0.01
  };
  COST_HAIKU_45 = {
    inputTokens: 1,
    outputTokens: 5,
    promptCacheWriteTokens: 1.25,
    promptCacheReadTokens: 0.1,
    webSearchRequests: 0.01
  };
  DEFAULT_UNKNOWN_MODEL_COST = COST_TIER_5_25;
  MODEL_COSTS = {
    [firstPartyNameToCanonical(CLAUDE_3_5_HAIKU_CONFIG.firstParty)]: COST_HAIKU_35,
    [firstPartyNameToCanonical(CLAUDE_HAIKU_4_5_CONFIG.firstParty)]: COST_HAIKU_45,
    [firstPartyNameToCanonical(CLAUDE_3_5_V2_SONNET_CONFIG.firstParty)]: COST_TIER_3_15,
    [firstPartyNameToCanonical(CLAUDE_3_7_SONNET_CONFIG.firstParty)]: COST_TIER_3_15,
    [firstPartyNameToCanonical(CLAUDE_SONNET_4_CONFIG.firstParty)]: COST_TIER_3_15,
    [firstPartyNameToCanonical(CLAUDE_SONNET_4_5_CONFIG.firstParty)]: COST_TIER_3_15,
    [firstPartyNameToCanonical(CLAUDE_SONNET_4_6_CONFIG.firstParty)]: COST_TIER_3_15,
    [firstPartyNameToCanonical(CLAUDE_OPUS_4_CONFIG.firstParty)]: COST_TIER_15_75,
    [firstPartyNameToCanonical(CLAUDE_OPUS_4_1_CONFIG.firstParty)]: COST_TIER_15_75,
    [firstPartyNameToCanonical(CLAUDE_OPUS_4_5_CONFIG.firstParty)]: COST_TIER_5_25,
    [firstPartyNameToCanonical(CLAUDE_OPUS_4_6_CONFIG.firstParty)]: COST_TIER_5_25
  };
});

// src/utils/model/aliases.ts
function isModelAlias(modelInput) {
  return MODEL_ALIASES.includes(modelInput);
}
function isModelFamilyAlias(model) {
  return MODEL_FAMILY_ALIASES.includes(model);
}
var MODEL_ALIASES, MODEL_FAMILY_ALIASES;
var init_aliases = __esm(() => {
  MODEL_ALIASES = [
    "sonnet",
    "opus",
    "haiku",
    "best",
    "sonnet[1m]",
    "opus[1m]",
    "opusplan"
  ];
  MODEL_FAMILY_ALIASES = ["sonnet", "opus", "haiku"];
});

// src/utils/model/modelAllowlist.ts
function modelBelongsToFamily(model, family) {
  if (model.includes(family)) {
    return true;
  }
  if (isModelAlias(model)) {
    const resolved = parseUserSpecifiedModel(model).toLowerCase();
    return resolved.includes(family);
  }
  return false;
}
function prefixMatchesModel(modelName, prefix) {
  if (!modelName.startsWith(prefix)) {
    return false;
  }
  return modelName.length === prefix.length || modelName[prefix.length] === "-";
}
function modelMatchesVersionPrefix(model, entry) {
  const resolvedModel = isModelAlias(model) ? parseUserSpecifiedModel(model).toLowerCase() : model;
  if (prefixMatchesModel(resolvedModel, entry)) {
    return true;
  }
  if (!entry.startsWith("claude-") && prefixMatchesModel(resolvedModel, `claude-${entry}`)) {
    return true;
  }
  return false;
}
function familyHasSpecificEntries(family, allowlist) {
  for (const entry of allowlist) {
    if (isModelFamilyAlias(entry)) {
      continue;
    }
    const idx = entry.indexOf(family);
    if (idx === -1) {
      continue;
    }
    const afterFamily = idx + family.length;
    if (afterFamily === entry.length || entry[afterFamily] === "-") {
      return true;
    }
  }
  return false;
}
function isModelAllowed(model) {
  const settings = getSettings_DEPRECATED() || {};
  const { availableModels } = settings;
  if (!availableModels) {
    return true;
  }
  if (availableModels.length === 0) {
    return false;
  }
  const resolvedModel = resolveOverriddenModel(model);
  const normalizedModel = resolvedModel.trim().toLowerCase();
  const normalizedAllowlist = availableModels.map((m) => m.trim().toLowerCase());
  if (normalizedAllowlist.includes(normalizedModel)) {
    if (!isModelFamilyAlias(normalizedModel) || !familyHasSpecificEntries(normalizedModel, normalizedAllowlist)) {
      return true;
    }
  }
  for (const entry of normalizedAllowlist) {
    if (isModelFamilyAlias(entry) && !familyHasSpecificEntries(entry, normalizedAllowlist) && modelBelongsToFamily(normalizedModel, entry)) {
      return true;
    }
  }
  if (isModelAlias(normalizedModel)) {
    const resolved = parseUserSpecifiedModel(normalizedModel).toLowerCase();
    if (normalizedAllowlist.includes(resolved)) {
      return true;
    }
  }
  for (const entry of normalizedAllowlist) {
    if (!isModelFamilyAlias(entry) && isModelAlias(entry)) {
      const resolved = parseUserSpecifiedModel(entry).toLowerCase();
      if (resolved === normalizedModel) {
        return true;
      }
    }
  }
  for (const entry of normalizedAllowlist) {
    if (!isModelFamilyAlias(entry) && !isModelAlias(entry)) {
      if (modelMatchesVersionPrefix(normalizedModel, entry)) {
        return true;
      }
    }
  }
  return false;
}
var init_modelAllowlist = __esm(() => {
  init_settings();
  init_aliases();
  init_model();
  init_modelStrings();
});

// src/utils/model/chatgptModels.ts
function isChatGPTAuthMode() {
  return process.env.OPENAI_AUTH_MODE === "chatgpt";
}
function isChatGPTCodexReasoningModel(model) {
  const normalized = model.toLowerCase().replace(/\[1m\]$/, "");
  return CHATGPT_CODEX_MODEL_OPTIONS.some((option) => option.value.toLowerCase() === normalized);
}
var CHATGPT_CODEX_DEFAULT_MODEL = "gpt-5.5", CHATGPT_CODEX_FAST_MODEL = "gpt-5.4-mini", CHATGPT_CODEX_MODEL_OPTIONS;
var init_chatgptModels = __esm(() => {
  CHATGPT_CODEX_MODEL_OPTIONS = [
    {
      value: "gpt-5.5",
      label: "GPT-5.5",
      description: "Frontier model for complex coding, research, and real-world work"
    },
    {
      value: "gpt-5.4",
      label: "GPT-5.4",
      description: "Strong model for everyday coding"
    },
    {
      value: "gpt-5.4-mini",
      label: "GPT-5.4-Mini",
      description: "Small, fast, and cost-efficient model for simpler coding tasks"
    },
    {
      value: "gpt-5.3-codex",
      label: "GPT-5.3-Codex",
      description: "Coding-optimized model"
    },
    {
      value: "gpt-5.3-codex-spark",
      label: "GPT-5.3-Codex-Spark",
      description: "Ultra-fast coding model"
    },
    {
      value: "gpt-5.2",
      label: "GPT-5.2",
      description: "Optimized for professional work and long-running agents"
    }
  ];
});

// src/utils/model/model.ts
function getSmallFastModel() {
  const provider = getAPIProvider();
  if (provider === "openai" && isChatGPTAuthMode()) {
    return process.env.OPENAI_SMALL_FAST_MODEL ?? CHATGPT_CODEX_FAST_MODEL;
  }
  if (provider === "openai" && process.env.OPENAI_SMALL_FAST_MODEL) {
    return process.env.OPENAI_SMALL_FAST_MODEL;
  }
  if (provider === "gemini" && process.env.GEMINI_SMALL_FAST_MODEL) {
    return process.env.GEMINI_SMALL_FAST_MODEL;
  }
  return process.env.ANTHROPIC_SMALL_FAST_MODEL || getDefaultHaikuModel();
}
function isNonCustomOpusModel(model) {
  return model === getModelStrings2().opus40 || model === getModelStrings2().opus41 || model === getModelStrings2().opus45 || model === getModelStrings2().opus46 || model === getModelStrings2().opus47;
}
function getUserSpecifiedModelSetting() {
  let specifiedModel;
  const modelOverride = getMainLoopModelOverride();
  if (modelOverride !== undefined) {
    specifiedModel = modelOverride;
  } else {
    const settings = getSettings_DEPRECATED() || {};
    specifiedModel = process.env.ANTHROPIC_MODEL || settings.model || undefined;
  }
  if (specifiedModel && !isModelAllowed(specifiedModel)) {
    return;
  }
  return specifiedModel;
}
function getMainLoopModel() {
  const model = getUserSpecifiedModelSetting();
  if (model !== undefined && model !== null) {
    return parseUserSpecifiedModel(model);
  }
  return getDefaultMainLoopModel();
}
function getBestModel() {
  return getDefaultOpusModel();
}
function getProviderPrimaryModel() {
  const provider = getAPIProvider();
  if (provider === "openai")
    return process.env.OPENAI_MODEL;
  if (provider === "gemini")
    return process.env.GEMINI_MODEL;
  if (provider === "grok")
    return process.env.GROK_MODEL;
  return;
}
function getDefaultOpusModel() {
  const provider = getAPIProvider();
  if (provider === "openai" && isChatGPTAuthMode()) {
    return CHATGPT_CODEX_DEFAULT_MODEL;
  }
  if (provider === "openai" && process.env.OPENAI_DEFAULT_OPUS_MODEL) {
    return process.env.OPENAI_DEFAULT_OPUS_MODEL;
  }
  if (provider === "gemini" && process.env.GEMINI_DEFAULT_OPUS_MODEL) {
    return process.env.GEMINI_DEFAULT_OPUS_MODEL;
  }
  if (process.env.ANTHROPIC_DEFAULT_OPUS_MODEL) {
    return process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;
  }
  const primaryModel = getProviderPrimaryModel();
  if (primaryModel)
    return primaryModel;
  if (provider !== "firstParty") {
    return getModelStrings2().opus47;
  }
  return getModelStrings2().opus47;
}
function getDefaultSonnetModel() {
  const provider = getAPIProvider();
  if (provider === "openai" && isChatGPTAuthMode()) {
    return CHATGPT_CODEX_DEFAULT_MODEL;
  }
  if (provider === "openai" && process.env.OPENAI_DEFAULT_SONNET_MODEL) {
    return process.env.OPENAI_DEFAULT_SONNET_MODEL;
  }
  if (provider === "gemini" && process.env.GEMINI_DEFAULT_SONNET_MODEL) {
    return process.env.GEMINI_DEFAULT_SONNET_MODEL;
  }
  if (process.env.ANTHROPIC_DEFAULT_SONNET_MODEL) {
    return process.env.ANTHROPIC_DEFAULT_SONNET_MODEL;
  }
  const primaryModel = getProviderPrimaryModel();
  if (primaryModel)
    return primaryModel;
  if (provider !== "firstParty") {
    return getModelStrings2().sonnet45;
  }
  return getModelStrings2().sonnet46;
}
function getDefaultHaikuModel() {
  const provider = getAPIProvider();
  if (provider === "openai" && isChatGPTAuthMode()) {
    return CHATGPT_CODEX_FAST_MODEL;
  }
  if (provider === "openai" && process.env.OPENAI_DEFAULT_HAIKU_MODEL) {
    return process.env.OPENAI_DEFAULT_HAIKU_MODEL;
  }
  if (provider === "gemini" && process.env.GEMINI_DEFAULT_HAIKU_MODEL) {
    return process.env.GEMINI_DEFAULT_HAIKU_MODEL;
  }
  if (process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL) {
    return process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL;
  }
  const primaryModel = getProviderPrimaryModel();
  if (primaryModel)
    return primaryModel;
  return getModelStrings2().haiku45;
}
function getRuntimeMainLoopModel(params) {
  const { permissionMode, mainLoopModel, exceeds200kTokens = false } = params;
  if (getUserSpecifiedModelSetting() === "opusplan" && permissionMode === "plan" && !exceeds200kTokens) {
    return getDefaultOpusModel();
  }
  if (getUserSpecifiedModelSetting() === "haiku" && permissionMode === "plan") {
    return getDefaultSonnetModel();
  }
  return mainLoopModel;
}
function getDefaultMainLoopModelSetting() {
  if (process.env.USER_TYPE === "ant") {
    return getAntModelOverrideConfig()?.defaultModel ?? getDefaultOpusModel() + "[1m]";
  }
  if (isMaxSubscriber()) {
    return getDefaultOpusModel() + (isOpus1mMergeEnabled() ? "[1m]" : "");
  }
  if (isTeamPremiumSubscriber()) {
    return getDefaultOpusModel() + (isOpus1mMergeEnabled() ? "[1m]" : "");
  }
  return getDefaultSonnetModel();
}
function getDefaultMainLoopModel() {
  return parseUserSpecifiedModel(getDefaultMainLoopModelSetting());
}
function firstPartyNameToCanonical(name) {
  name = name.toLowerCase();
  if (name.includes("claude-opus-4-7")) {
    return "claude-opus-4-7";
  }
  if (name.includes("claude-opus-4-6")) {
    return "claude-opus-4-6";
  }
  if (name.includes("claude-opus-4-5")) {
    return "claude-opus-4-5";
  }
  if (name.includes("claude-opus-4-1")) {
    return "claude-opus-4-1";
  }
  if (name.includes("claude-opus-4")) {
    return "claude-opus-4";
  }
  if (name.includes("claude-sonnet-4-6")) {
    return "claude-sonnet-4-6";
  }
  if (name.includes("claude-sonnet-4-5")) {
    return "claude-sonnet-4-5";
  }
  if (name.includes("claude-sonnet-4")) {
    return "claude-sonnet-4";
  }
  if (name.includes("claude-haiku-4-5")) {
    return "claude-haiku-4-5";
  }
  if (name.includes("claude-3-7-sonnet")) {
    return "claude-3-7-sonnet";
  }
  if (name.includes("claude-3-5-sonnet")) {
    return "claude-3-5-sonnet";
  }
  if (name.includes("claude-3-5-haiku")) {
    return "claude-3-5-haiku";
  }
  if (name.includes("claude-3-opus")) {
    return "claude-3-opus";
  }
  if (name.includes("claude-3-sonnet")) {
    return "claude-3-sonnet";
  }
  if (name.includes("claude-3-haiku")) {
    return "claude-3-haiku";
  }
  const match = name.match(/(claude-(\d+-\d+-)?\w+)/);
  if (match && match[1]) {
    return match[1];
  }
  return name;
}
function getCanonicalName(fullModelName) {
  return firstPartyNameToCanonical(resolveOverriddenModel(fullModelName));
}
function getClaudeAiUserDefaultModelDescription(fastMode = false) {
  if (isMaxSubscriber() || isTeamPremiumSubscriber()) {
    if (isOpus1mMergeEnabled()) {
      return `Opus 4.7 with 1M context \xB7 Most capable for complex work${fastMode ? getOpusPricingSuffix(true) : ""}`;
    }
    return `Opus 4.7 \xB7 Most capable for complex work${fastMode ? getOpusPricingSuffix(true) : ""}`;
  }
  return "Sonnet 4.6 \xB7 Best for everyday tasks";
}
function renderDefaultModelSetting(setting) {
  if (setting === "opusplan") {
    return "Opus 4.7 in plan mode, else Sonnet 4.6";
  }
  return renderModelName(parseUserSpecifiedModel(setting));
}
function getOpusPricingSuffix(fastMode) {
  if (getAPIProvider() !== "firstParty")
    return "";
  const pricing = formatModelPricing(getOpus46CostTier(fastMode));
  const fastModeIndicator = fastMode ? ` (${LIGHTNING_BOLT})` : "";
  return ` \xB7${fastModeIndicator} ${pricing}`;
}
function isOpus1mMergeEnabled() {
  if (is1mContextDisabled() || isProSubscriber() || getAPIProvider() !== "firstParty" || !isFirstPartyAnthropicBaseUrl()) {
    return false;
  }
  if (isClaudeAISubscriber() && getSubscriptionType() === null) {
    return false;
  }
  return true;
}
function renderModelSetting(setting) {
  if (setting === "opusplan") {
    return "Opus Plan";
  }
  if (isModelAlias(setting)) {
    return capitalize(setting);
  }
  return renderModelName(setting);
}
function getPublicModelDisplayName(model) {
  switch (model) {
    case getModelStrings2().opus47:
      return "Opus 4.7";
    case getModelStrings2().opus47 + "[1m]":
      return "Opus 4.7 (1M context)";
    case getModelStrings2().opus46:
      return "Opus 4.6";
    case getModelStrings2().opus46 + "[1m]":
      return "Opus 4.6 (1M context)";
    case getModelStrings2().opus45:
      return "Opus 4.5";
    case getModelStrings2().opus41:
      return "Opus 4.1";
    case getModelStrings2().opus40:
      return "Opus 4";
    case getModelStrings2().sonnet46 + "[1m]":
      return "Sonnet 4.6 (1M context)";
    case getModelStrings2().sonnet46:
      return "Sonnet 4.6";
    case getModelStrings2().sonnet45 + "[1m]":
      return "Sonnet 4.5 (1M context)";
    case getModelStrings2().sonnet45:
      return "Sonnet 4.5";
    case getModelStrings2().sonnet40:
      return "Sonnet 4";
    case getModelStrings2().sonnet40 + "[1m]":
      return "Sonnet 4 (1M context)";
    case getModelStrings2().sonnet37:
      return "Sonnet 3.7";
    case getModelStrings2().sonnet35:
      return "Sonnet 3.5";
    case getModelStrings2().haiku45:
      return "Haiku 4.5";
    case getModelStrings2().haiku35:
      return "Haiku 3.5";
    default:
      return null;
  }
}
function maskModelCodename(baseName) {
  const [codename = "", ...rest] = baseName.split("-");
  const masked = codename.slice(0, 3) + "*".repeat(Math.max(0, codename.length - 3));
  return [masked, ...rest].join("-");
}
function renderModelName(model) {
  const publicName = getPublicModelDisplayName(model);
  if (publicName) {
    return publicName;
  }
  if (process.env.USER_TYPE === "ant") {
    const resolved = parseUserSpecifiedModel(model);
    const antModel = resolveAntModel(model);
    if (antModel) {
      const baseName = antModel.model.replace(/\[1m\]$/i, "");
      const masked = maskModelCodename(baseName);
      const suffix = has1mContext(resolved) ? "[1m]" : "";
      return masked + suffix;
    }
    if (resolved !== model) {
      return `${model} (${resolved})`;
    }
    return resolved;
  }
  return model;
}
function parseUserSpecifiedModel(modelInput) {
  const modelInputTrimmed = modelInput.trim();
  const normalizedModel = modelInputTrimmed.toLowerCase();
  const has1mTag = has1mContext(normalizedModel);
  const modelString = has1mTag ? normalizedModel.replace(/\[1m]$/i, "").trim() : normalizedModel;
  if (isModelAlias(modelString)) {
    switch (modelString) {
      case "opusplan":
        return getDefaultSonnetModel() + (has1mTag ? "[1m]" : "");
      case "sonnet":
        return getDefaultSonnetModel() + (has1mTag ? "[1m]" : "");
      case "haiku":
        return getDefaultHaikuModel() + (has1mTag ? "[1m]" : "");
      case "opus":
        return getDefaultOpusModel() + (has1mTag ? "[1m]" : "");
      case "best":
        return getBestModel();
      default:
    }
  }
  if (getAPIProvider() === "firstParty" && isLegacyOpusFirstParty(modelString) && isLegacyModelRemapEnabled()) {
    return getDefaultOpusModel() + (has1mTag ? "[1m]" : "");
  }
  if (process.env.USER_TYPE === "ant") {
    const has1mAntTag = has1mContext(normalizedModel);
    const baseAntModel = normalizedModel.replace(/\[1m]$/i, "").trim();
    const antModel = resolveAntModel(baseAntModel);
    if (antModel) {
      const suffix = has1mAntTag ? "[1m]" : "";
      return antModel.model + suffix;
    }
  }
  if (has1mTag) {
    return modelInputTrimmed.replace(/\[1m\]$/i, "").trim() + "[1m]";
  }
  return modelInputTrimmed;
}
function resolveSkillModelOverride(skillModel, currentModel) {
  if (has1mContext(skillModel) || !has1mContext(currentModel)) {
    return skillModel;
  }
  if (modelSupports1M(parseUserSpecifiedModel(skillModel))) {
    return skillModel + "[1m]";
  }
  return skillModel;
}
function isLegacyOpusFirstParty(model) {
  return LEGACY_OPUS_FIRSTPARTY.includes(model);
}
function isLegacyModelRemapEnabled() {
  return !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_LEGACY_MODEL_REMAP);
}
function modelDisplayString(model) {
  if (model === null) {
    if (process.env.USER_TYPE === "ant") {
      return `Default for Ants (${renderDefaultModelSetting(getDefaultMainLoopModelSetting())})`;
    } else if (isClaudeAISubscriber()) {
      return `Default (${getClaudeAiUserDefaultModelDescription()})`;
    }
    return `Default (${getDefaultMainLoopModel()})`;
  }
  const resolvedModel = parseUserSpecifiedModel(model);
  return model === resolvedModel ? resolvedModel : `${model} (${resolvedModel})`;
}
function getMarketingNameForModel(modelId) {
  if (getAPIProvider() === "foundry") {
    return;
  }
  const has1m = modelId.toLowerCase().includes("[1m]");
  const canonical = getCanonicalName(modelId);
  if (canonical.includes("claude-opus-4-7")) {
    return has1m ? "Opus 4.7 (with 1M context)" : "Opus 4.7";
  }
  if (canonical.includes("claude-opus-4-6")) {
    return has1m ? "Opus 4.6 (with 1M context)" : "Opus 4.6";
  }
  if (canonical.includes("claude-opus-4-5")) {
    return "Opus 4.5";
  }
  if (canonical.includes("claude-opus-4-1")) {
    return "Opus 4.1";
  }
  if (canonical.includes("claude-opus-4")) {
    return "Opus 4";
  }
  if (canonical.includes("claude-sonnet-4-6")) {
    return has1m ? "Sonnet 4.6 (with 1M context)" : "Sonnet 4.6";
  }
  if (canonical.includes("claude-sonnet-4-5")) {
    return has1m ? "Sonnet 4.5 (with 1M context)" : "Sonnet 4.5";
  }
  if (canonical.includes("claude-sonnet-4")) {
    return has1m ? "Sonnet 4 (with 1M context)" : "Sonnet 4";
  }
  if (canonical.includes("claude-3-7-sonnet")) {
    return "Claude 3.7 Sonnet";
  }
  if (canonical.includes("claude-3-5-sonnet")) {
    return "Claude 3.5 Sonnet";
  }
  if (canonical.includes("claude-haiku-4-5")) {
    return "Haiku 4.5";
  }
  if (canonical.includes("claude-3-5-haiku")) {
    return "Claude 3.5 Haiku";
  }
  return;
}
function normalizeModelStringForAPI(model) {
  return model.replace(/\[(1|2)m\]/gi, "");
}
var LEGACY_OPUS_FIRSTPARTY;
var init_model = __esm(() => {
  init_state();
  init_antModels();
  init_auth();
  init_context();
  init_envUtils();
  init_modelStrings();
  init_modelCost();
  init_settings();
  init_providers();
  init_figures();
  init_modelAllowlist();
  init_aliases();
  init_stringUtils();
  init_chatgptModels();
  LEGACY_OPUS_FIRSTPARTY = [
    "claude-opus-4-20250514",
    "claude-opus-4-1-20250805",
    "claude-opus-4-0",
    "claude-opus-4-1"
  ];
});

// src/services/api/client.ts
import { randomUUID } from "crypto";
function createStderrLogger() {
  return {
    error: (msg, ...args) => console.error("[AgentFlow SDK ERROR]", msg, ...args),
    warn: (msg, ...args) => console.error("[AgentFlow SDK WARN]", msg, ...args),
    info: (msg, ...args) => console.error("[AgentFlow SDK INFO]", msg, ...args),
    debug: (msg, ...args) => console.error("[AgentFlow SDK DEBUG]", msg, ...args)
  };
}
async function getAnthropicClient({
  apiKey,
  maxRetries,
  model,
  fetchOverride,
  source
}) {
  const containerId = process.env.CLAUDE_CODE_CONTAINER_ID;
  const remoteSessionId = process.env.CLAUDE_CODE_REMOTE_SESSION_ID;
  const clientApp = process.env.CLAUDE_AGENT_SDK_CLIENT_APP;
  const customHeaders = getCustomHeaders();
  const defaultHeaders = {
    "x-app": "cli",
    "User-Agent": getUserAgent(),
    "X-Claude-Code-Session-Id": getSessionId(),
    ...customHeaders,
    ...containerId ? { "x-claude-remote-container-id": containerId } : {},
    ...remoteSessionId ? { "x-claude-remote-session-id": remoteSessionId } : {},
    ...clientApp ? { "x-client-app": clientApp } : {},
    ...process.env.ANTHROPIC_AUTH_NONCE ? { "x-auth-nonce": process.env.ANTHROPIC_AUTH_NONCE } : {}
  };
  logForDebugging(`[API:request] Creating client, ANTHROPIC_CUSTOM_HEADERS present: ${!!process.env.ANTHROPIC_CUSTOM_HEADERS}, has Authorization header: ${!!customHeaders["Authorization"]}`);
  const additionalProtectionEnabled = isEnvTruthy(process.env.CLAUDE_CODE_ADDITIONAL_PROTECTION);
  if (additionalProtectionEnabled) {
    defaultHeaders["x-anthropic-additional-protection"] = "true";
  }
  logForDebugging("[API:auth] OAuth token check starting");
  await checkAndRefreshOAuthTokenIfNeeded();
  logForDebugging("[API:auth] OAuth token check complete");
  if (!isClaudeAISubscriber()) {
    await configureApiKeyHeaders(defaultHeaders, getIsNonInteractiveSession());
  }
  const resolvedFetch = buildFetch(fetchOverride, source);
  const ARGS = {
    defaultHeaders,
    maxRetries,
    timeout: parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10),
    dangerouslyAllowBrowser: true,
    fetchOptions: getProxyFetchOptions({
      forAnthropicAPI: true
    }),
    ...resolvedFetch && {
      fetch: resolvedFetch
    }
  };
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)) {
    const { BedrockClient } = await import("./chunk-9nzdcsbv.js");
    const awsRegion = model === getSmallFastModel() && process.env.ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION ? process.env.ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION : getAWSRegion();
    const bedrockArgs = {
      ...ARGS,
      awsRegion,
      ...isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH) && {
        skipAuth: true
      },
      ...isDebugToStdErr() && { logger: createStderrLogger() }
    };
    if (process.env.AWS_BEARER_TOKEN_BEDROCK) {
      bedrockArgs.skipAuth = true;
      bedrockArgs.defaultHeaders = {
        ...bedrockArgs.defaultHeaders,
        Authorization: `Bearer ${process.env.AWS_BEARER_TOKEN_BEDROCK}`
      };
    } else if (!isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH)) {
      const cachedCredentials = await refreshAndGetAwsCredentials();
      if (cachedCredentials) {
        bedrockArgs.awsAccessKey = cachedCredentials.accessKeyId;
        bedrockArgs.awsSecretKey = cachedCredentials.secretAccessKey;
        bedrockArgs.awsSessionToken = cachedCredentials.sessionToken;
      }
    }
    return new BedrockClient(bedrockArgs);
  }
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)) {
    const { AnthropicFoundry } = await import("./chunk-pd374yx0.js");
    let azureADTokenProvider;
    if (!process.env.ANTHROPIC_FOUNDRY_API_KEY) {
      if (isEnvTruthy(process.env.CLAUDE_CODE_SKIP_FOUNDRY_AUTH)) {
        azureADTokenProvider = () => Promise.resolve("");
      } else {
        const {
          DefaultAzureCredential: AzureCredential,
          getBearerTokenProvider
        } = await import("./chunk-8375zk8t.js");
        azureADTokenProvider = getBearerTokenProvider(new AzureCredential, "https://cognitiveservices.azure.com/.default");
      }
    }
    const foundryArgs = {
      ...ARGS,
      ...azureADTokenProvider && { azureADTokenProvider },
      ...isDebugToStdErr() && { logger: createStderrLogger() }
    };
    return new AnthropicFoundry(foundryArgs);
  }
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX)) {
    if (!isEnvTruthy(process.env.CLAUDE_CODE_SKIP_VERTEX_AUTH)) {
      await refreshGcpCredentialsIfNeeded();
    }
    const [{ AnthropicVertex }, { GoogleAuth }] = await Promise.all([
      import("./chunk-k7tvbwzd.js"),
      import("./chunk-jdqp0r4h.js").then((m)=>__toESM(m.default,1))
    ]);
    const hasProjectEnvVar = process.env["GCLOUD_PROJECT"] || process.env["GOOGLE_CLOUD_PROJECT"] || process.env["gcloud_project"] || process.env["google_cloud_project"];
    const hasKeyFile = process.env["GOOGLE_APPLICATION_CREDENTIALS"] || process.env["google_application_credentials"];
    const googleAuth = isEnvTruthy(process.env.CLAUDE_CODE_SKIP_VERTEX_AUTH) ? {
      getClient: () => ({
        getRequestHeaders: () => ({})
      })
    } : new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      ...hasProjectEnvVar || hasKeyFile ? {} : {
        projectId: process.env.ANTHROPIC_VERTEX_PROJECT_ID
      }
    });
    const vertexArgs = {
      ...ARGS,
      region: getVertexRegionForModel(model),
      googleAuth,
      ...isDebugToStdErr() && { logger: createStderrLogger() }
    };
    return new AnthropicVertex(vertexArgs);
  }
  const clientConfig = {
    apiKey: isClaudeAISubscriber() ? null : apiKey || getAnthropicApiKey(),
    authToken: isClaudeAISubscriber() ? getClaudeAIOAuthTokens()?.accessToken : undefined,
    ...process.env.USER_TYPE === "ant" && isEnvTruthy(process.env.USE_STAGING_OAUTH) ? { baseURL: getOauthConfig().BASE_API_URL } : {},
    ...ARGS,
    ...isDebugToStdErr() && { logger: createStderrLogger() }
  };
  return new Anthropic(clientConfig);
}
async function configureApiKeyHeaders(headers, isNonInteractiveSession) {
  const token = process.env.ANTHROPIC_AUTH_TOKEN || await getApiKeyFromApiKeyHelper(isNonInteractiveSession);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
}
function getCustomHeaders() {
  const customHeaders = {};
  const customHeadersEnv = process.env.ANTHROPIC_CUSTOM_HEADERS;
  if (!customHeadersEnv)
    return customHeaders;
  const headerStrings = customHeadersEnv.split(/\n|\r\n/);
  for (const headerString of headerStrings) {
    if (!headerString.trim())
      continue;
    const colonIdx = headerString.indexOf(":");
    if (colonIdx === -1)
      continue;
    const name = headerString.slice(0, colonIdx).trim();
    const value = headerString.slice(colonIdx + 1).trim();
    if (name) {
      customHeaders[name] = value;
    }
  }
  return customHeaders;
}
function buildFetch(fetchOverride, source) {
  const inner = fetchOverride ?? globalThis.fetch;
  const injectClientRequestId = getAPIProvider() === "firstParty" && isFirstPartyAnthropicBaseUrl();
  return (input, init) => {
    const headers = new Headers(init?.headers);
    if (injectClientRequestId && !headers.has(CLIENT_REQUEST_ID_HEADER)) {
      headers.set(CLIENT_REQUEST_ID_HEADER, randomUUID());
    }
    try {
      const url = input instanceof Request ? input.url : String(input);
      const id = headers.get(CLIENT_REQUEST_ID_HEADER);
      logForDebugging(`[API REQUEST] ${new URL(url).pathname}${id ? ` ${CLIENT_REQUEST_ID_HEADER}=${id}` : ""} source=${source ?? "unknown"}`);
    } catch {}
    return inner(input, { ...init, headers });
  };
}
var CLIENT_REQUEST_ID_HEADER = "x-client-request-id";
var init_client = __esm(() => {
  init_sdk();
  init_auth();
  init_http();
  init_model();
  init_providers();
  init_proxy();
  init_state();
  init_oauth();
  init_debug();
  init_envUtils();
});

// src/utils/model/modelCapabilities.ts
import { readFileSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
function getCacheDir() {
  return join(getClaudeConfigHomeDir(), "cache");
}
function getCachePath() {
  return join(getCacheDir(), "model-capabilities.json");
}
function isModelCapabilitiesEligible() {
  if (getAPIProvider() !== "firstParty")
    return false;
  if (!isFirstPartyAnthropicBaseUrl())
    return false;
  return true;
}
function sortForMatching(models) {
  return [...models].sort((a, b) => b.id.length - a.id.length || a.id.localeCompare(b.id));
}
function getModelCapability(model) {
  if (!isModelCapabilitiesEligible())
    return;
  const cached = loadCache(getCachePath());
  if (!cached || cached.length === 0)
    return;
  const m = model.toLowerCase();
  const exact = cached.find((c) => c.id.toLowerCase() === m);
  if (exact)
    return exact;
  return cached.find((c) => m.includes(c.id.toLowerCase()));
}
async function refreshModelCapabilities() {
  if (!isModelCapabilitiesEligible())
    return;
  if (isEssentialTrafficOnly())
    return;
  try {
    const anthropic = await getAnthropicClient({ maxRetries: 1 });
    const betas = isClaudeAISubscriber() ? [OAUTH_BETA_HEADER] : undefined;
    const parsed = [];
    for await (const entry of anthropic.models.list({ betas })) {
      const result = ModelCapabilitySchema().safeParse(entry);
      if (result.success)
        parsed.push(result.data);
    }
    if (parsed.length === 0)
      return;
    const path = getCachePath();
    const models = sortForMatching(parsed);
    if (isEqual_default(loadCache(path), models)) {
      logForDebugging("[modelCapabilities] cache unchanged, skipping write");
      return;
    }
    await mkdir(getCacheDir(), { recursive: true });
    await writeFile(path, jsonStringify({ models, timestamp: Date.now() }), {
      encoding: "utf-8",
      mode: 384
    });
    loadCache.cache.delete(path);
    logForDebugging(`[modelCapabilities] cached ${models.length} models`);
  } catch (error) {
    logForDebugging(`[modelCapabilities] fetch failed: ${error instanceof Error ? error.message : "unknown"}`);
  }
}
var ModelCapabilitySchema, CacheFileSchema, loadCache;
var init_modelCapabilities = __esm(() => {
  init_isEqual();
  init_memoize();
  init_v4();
  init_oauth();
  init_client();
  init_auth();
  init_debug();
  init_envUtils();
  init_json();
  init_lazySchema();
  init_privacyLevel();
  init_slowOperations();
  init_providers();
  ModelCapabilitySchema = lazySchema(() => exports_external.object({
    id: exports_external.string(),
    max_input_tokens: exports_external.number().optional(),
    max_tokens: exports_external.number().optional()
  }).strip());
  CacheFileSchema = lazySchema(() => exports_external.object({
    models: exports_external.array(ModelCapabilitySchema()),
    timestamp: exports_external.number()
  }));
  loadCache = memoize_default((path) => {
    try {
      const raw = readFileSync(path, "utf-8");
      const parsed = CacheFileSchema().safeParse(safeParseJSON(raw, false));
      return parsed.success ? parsed.data.models : null;
    } catch {
      return null;
    }
  }, (path) => path);
});

export { CLAUDE_CODE_20250219_BETA_HEADER, INTERLEAVED_THINKING_BETA_HEADER, CONTEXT_1M_BETA_HEADER, CONTEXT_MANAGEMENT_BETA_HEADER, STRUCTURED_OUTPUTS_BETA_HEADER, WEB_SEARCH_BETA_HEADER, EFFORT_BETA_HEADER, TASK_BUDGETS_BETA_HEADER, PROMPT_CACHING_SCOPE_BETA_HEADER, FAST_MODE_BETA_HEADER, REDACT_THINKING_BETA_HEADER, TOKEN_EFFICIENT_TOOLS_BETA_HEADER, AFK_MODE_BETA_HEADER, CLI_INTERNAL_BETA_HEADER, ADVISOR_BETA_HEADER, BEDROCK_EXTRA_PARAMS_HEADERS, VERTEX_COUNT_TOKENS_ALLOWED_BETAS, init_betas, getAPIProvider, getAPIProviderForStatsig, isFirstPartyAnthropicBaseUrl, init_providers, getAntModelOverrideConfig, getAntModels, resolveAntModel, init_antModels, isEqual_default, init_isEqual, getAnthropicClient, CLIENT_REQUEST_ID_HEADER, init_client, refreshModelCapabilities, init_modelCapabilities, COMPACT_MAX_OUTPUT_TOKENS, CAPPED_DEFAULT_MAX_TOKENS, ESCALATED_MAX_TOKENS, is1mContextDisabled, has1mContext, getContextWindowForModel, getSonnet1mExpTreatmentEnabled, calculateContextPercentages, getModelMaxOutputTokens, getMaxThinkingTokensForModel, init_context, sequential, init_sequential, createBedrockRuntimeClient, getInferenceProfileBackingModel, isFoundationModel, getBedrockRegionPrefix, applyBedrockRegionPrefix, init_bedrock, CLAUDE_OPUS_4_6_CONFIG, init_configs, getModelStrings2 as getModelStrings, ensureModelStringsInitialized, init_modelStrings, isFastModeEnabled, isFastModeAvailable, getFastModeUnavailableReason, FAST_MODE_MODEL_DISPLAY, getFastModeModel, getInitialFastModeSetting, isFastModeSupportedByModel, onCooldownTriggered, onCooldownExpired, getFastModeRuntimeState, triggerFastModeCooldown, clearFastModeCooldown, handleFastModeRejectedByAPI, onFastModeOverageRejection, handleFastModeOverageRejection, isFastModeCooldown, getFastModeState, onOrgFastModeChanged, resolveFastModeStatusFromCache, prefetchFastModeStatus, init_fastMode, COST_TIER_3_15, COST_HAIKU_35, COST_HAIKU_45, getOpus46CostTier, calculateUSDCost, calculateCostFromTokens, formatModelPricing, init_modelCost, MODEL_ALIASES, init_aliases, isModelAllowed, init_modelAllowlist, CHATGPT_CODEX_DEFAULT_MODEL, CHATGPT_CODEX_MODEL_OPTIONS, isChatGPTAuthMode, isChatGPTCodexReasoningModel, init_chatgptModels, getSmallFastModel, isNonCustomOpusModel, getUserSpecifiedModelSetting, getMainLoopModel, getDefaultOpusModel, getDefaultSonnetModel, getDefaultHaikuModel, getRuntimeMainLoopModel, getDefaultMainLoopModelSetting, getDefaultMainLoopModel, getCanonicalName, getClaudeAiUserDefaultModelDescription, renderDefaultModelSetting, getOpusPricingSuffix, isOpus1mMergeEnabled, renderModelSetting, renderModelName, parseUserSpecifiedModel, resolveSkillModelOverride, isLegacyModelRemapEnabled, modelDisplayString, getMarketingNameForModel, normalizeModelStringForAPI, init_model };

//# debugId=7CECC7AC8C34222364756E2164756E21
//# sourceMappingURL=chunk-srbv7hh4.js.map
