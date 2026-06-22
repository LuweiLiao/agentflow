// @bun
import {
  getAnthropicApiKey,
  getAuthTokenSource,
  getSubscriptionType,
  init_auth,
  isClaudeAISubscriber
} from "./chunk-e45319yt.js";
import {
  getGlobalConfig,
  init_config
} from "./chunk-jyqypr4z.js";
import {
  init_envUtils,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/billing.ts
function hasConsoleBillingAccess() {
  if (isEnvTruthy(process.env.DISABLE_COST_WARNINGS)) {
    return false;
  }
  const isSubscriber = isClaudeAISubscriber();
  if (isSubscriber)
    return false;
  const authSource = getAuthTokenSource();
  const hasApiKey = getAnthropicApiKey() !== null;
  if (!authSource.hasToken && !hasApiKey) {
    return false;
  }
  const config = getGlobalConfig();
  const orgRole = config.oauthAccount?.organizationRole;
  const workspaceRole = config.oauthAccount?.workspaceRole;
  if (!orgRole || !workspaceRole) {
    return false;
  }
  return ["admin", "billing"].includes(orgRole) || ["workspace_admin", "workspace_billing"].includes(workspaceRole);
}
function setMockBillingAccessOverride(value) {
  mockBillingAccessOverride = value;
}
function hasClaudeAiBillingAccess() {
  if (mockBillingAccessOverride !== null) {
    return mockBillingAccessOverride;
  }
  if (!isClaudeAISubscriber()) {
    return false;
  }
  const subscriptionType = getSubscriptionType();
  if (subscriptionType === "max" || subscriptionType === "pro") {
    return true;
  }
  const config = getGlobalConfig();
  const orgRole = config.oauthAccount?.organizationRole;
  return !!orgRole && ["admin", "billing", "owner", "primary_owner"].includes(orgRole);
}
var mockBillingAccessOverride = null;
var init_billing = __esm(() => {
  init_auth();
  init_config();
  init_envUtils();
});

export { hasConsoleBillingAccess, setMockBillingAccessOverride, hasClaudeAiBillingAccess, init_billing };

//# debugId=AE886C3B07FA867264756E2164756E21
//# sourceMappingURL=chunk-28rzgcvw.js.map
