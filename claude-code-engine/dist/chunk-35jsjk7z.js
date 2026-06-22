// @bun
import {
  getAnthropicApiKey,
  getClaudeAIOAuthTokens,
  handleOAuth401Error,
  init_auth,
  isClaudeAISubscriber
} from "./chunk-e45319yt.js";
import {
  OAUTH_BETA_HEADER,
  init_oauth
} from "./chunk-dw66fdss.js";
import {
  axios_default,
  init_axios
} from "./chunk-pecy49yr.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/workloadContext.ts
import { AsyncLocalStorage } from "async_hooks";
function getWorkload() {
  return workloadStorage.getStore()?.workload;
}
function runWithWorkload(workload, fn) {
  return workloadStorage.run({ workload }, fn);
}
var WORKLOAD_CRON = "cron", workloadStorage;
var init_workloadContext = __esm(() => {
  workloadStorage = new AsyncLocalStorage;
});

// src/utils/userAgent.ts
function getClaudeCodeUserAgent() {
  return `claude-code/${"5.0.0"}`;
}
var init_userAgent = () => {};

// src/utils/http.ts
function getUserAgent() {
  const agentSdkVersion = process.env.CLAUDE_AGENT_SDK_VERSION ? `, agent-sdk/${process.env.CLAUDE_AGENT_SDK_VERSION}` : "";
  const clientApp = process.env.CLAUDE_AGENT_SDK_CLIENT_APP ? `, client-app/${process.env.CLAUDE_AGENT_SDK_CLIENT_APP}` : "";
  const workload = getWorkload();
  const workloadSuffix = workload ? `, workload/${workload}` : "";
  return `claude-cli/${"5.0.0"} (${process.env.USER_TYPE}, ${process.env.CLAUDE_CODE_ENTRYPOINT ?? "cli"}${agentSdkVersion}${clientApp}${workloadSuffix})`;
}
function getMCPUserAgent() {
  const parts = [];
  if (process.env.CLAUDE_CODE_ENTRYPOINT) {
    parts.push(process.env.CLAUDE_CODE_ENTRYPOINT);
  }
  if (process.env.CLAUDE_AGENT_SDK_VERSION) {
    parts.push(`agent-sdk/${process.env.CLAUDE_AGENT_SDK_VERSION}`);
  }
  if (process.env.CLAUDE_AGENT_SDK_CLIENT_APP) {
    parts.push(`client-app/${process.env.CLAUDE_AGENT_SDK_CLIENT_APP}`);
  }
  const suffix = parts.length > 0 ? ` (${parts.join(", ")})` : "";
  return `claude-code/${"5.0.0"}${suffix}`;
}
function getWebFetchUserAgent() {
  return `Claude-User (${getClaudeCodeUserAgent()}; +https://support.anthropic.com/)`;
}
function getAuthHeaders() {
  if (isClaudeAISubscriber()) {
    const oauthTokens = getClaudeAIOAuthTokens();
    if (!oauthTokens?.accessToken) {
      return {
        headers: {},
        error: "No OAuth token available"
      };
    }
    return {
      headers: {
        Authorization: `Bearer ${oauthTokens.accessToken}`,
        "anthropic-beta": OAUTH_BETA_HEADER
      }
    };
  }
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return {
      headers: {},
      error: "No API key available"
    };
  }
  return {
    headers: {
      "x-api-key": apiKey
    }
  };
}
async function withOAuth401Retry(request, opts) {
  try {
    return await request();
  } catch (err) {
    if (!axios_default.isAxiosError(err))
      throw err;
    const status = err.response?.status;
    const isAuthError = status === 401 || opts?.also403Revoked && status === 403 && typeof err.response?.data === "string" && err.response.data.includes("OAuth token has been revoked");
    if (!isAuthError)
      throw err;
    const failedAccessToken = getClaudeAIOAuthTokens()?.accessToken;
    if (!failedAccessToken)
      throw err;
    await handleOAuth401Error(failedAccessToken);
    return await request();
  }
}
var init_http = __esm(() => {
  init_axios();
  init_oauth();
  init_auth();
  init_userAgent();
  init_workloadContext();
});

export { WORKLOAD_CRON, getWorkload, runWithWorkload, init_workloadContext, getClaudeCodeUserAgent, init_userAgent, getUserAgent, getMCPUserAgent, getWebFetchUserAgent, getAuthHeaders, withOAuth401Retry, init_http };

//# debugId=1916E5D0FE20298964756E2164756E21
//# sourceMappingURL=chunk-35jsjk7z.js.map
