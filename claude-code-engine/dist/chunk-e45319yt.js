// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/auth.ts
function isAnthropicAuthEnabled() {
  return !!getAnthropicApiKey();
}
function getAuthTokenSource() {
  return { source: "environment", key: getAnthropicApiKey() };
}
function getAnthropicApiKey() {
  return process.env.ANTHROPIC_API_KEY || null;
}
function hasAnthropicApiKeyAuth() {
  return !!getAnthropicApiKey();
}
function getAnthropicApiKeyWithSource() {
  const key = getAnthropicApiKey();
  return { key, source: key ? "environment" : "environment" };
}
function getConfiguredApiKeyHelper() {
  return;
}
function calculateApiKeyHelperTTL() {
  return 0;
}
function getApiKeyHelperElapsedMs() {
  return 0;
}
async function getApiKeyFromApiKeyHelper() {
  return null;
}
function getApiKeyFromApiKeyHelperCached() {
  return null;
}
function clearApiKeyHelperCache() {}
function prefetchApiKeyFromApiKeyHelperIfSafe() {}
async function saveApiKey(_apiKey) {}
function isCustomApiKeyApproved(_apiKey) {
  return true;
}
async function removeApiKey() {}
function isAwsAuthRefreshFromProjectSettings() {
  return false;
}
function isAwsCredentialExportFromProjectSettings() {
  return false;
}
async function refreshAwsAuth(_awsAuthRefresh) {
  return false;
}
function clearAwsCredentialsCache() {}
function prefetchAwsCredentialsAndBedRockInfoIfSafe() {}
function isGcpAuthRefreshFromProjectSettings() {
  return false;
}
async function checkGcpCredentialsValid() {
  return false;
}
async function refreshGcpAuth(_gcpAuthRefresh) {
  return false;
}
function clearGcpCredentialsCache() {}
function prefetchGcpCredentialsIfSafe() {}
function saveOAuthTokensIfNeeded(_tokens) {
  return { didSave: false };
}
function clearOAuthTokenCache() {}
function handleOAuth401Error() {
  return { shouldRetry: false };
}
async function getClaudeAIOAuthTokensAsync() {
  return null;
}
function checkAndRefreshOAuthTokenIfNeeded() {
  return Promise.resolve();
}
function isClaudeAISubscriber() {
  return false;
}
function hasProfileScope() {
  return false;
}
function is1PApiCustomer() {
  return false;
}
function getOauthAccountInfo() {
  return;
}
function isOverageProvisioningAllowed() {
  return false;
}
function getSubscriptionType() {
  return "api_key";
}
function getRateLimitTier() {
  return "standard";
}
function isTeamSubscriber() {
  return false;
}
function isProSubscriber() {
  return false;
}
function isMaxSubscriber() {
  return false;
}
function isConsumerSubscriber() {
  return false;
}
function getOrganizationUUID() {
  return null;
}
function getAccountInformation() {
  return null;
}
function isTeamPremiumSubscriber(..._args) {
  return;
}
function isUsing3PServices(..._args) {
  return;
}
function isEnterpriseSubscriber(..._args) {
  return;
}
function validateForceLoginOrg(..._args) {
  return;
}
function getOtelHeadersFromHelper(..._args) {
  return;
}
function getSubscriptionName(..._args) {
  return;
}
var getApiKeyFromConfigOrMacOSKeychain = () => getAnthropicApiKey(), refreshAndGetAwsCredentials = async () => null, refreshGcpCredentialsIfNeeded = async () => null, getClaudeAIOAuthTokens = () => null, AuthenticationCancelledError, UnauthorizedError;
var init_auth = __esm(() => {
  AuthenticationCancelledError = class AuthenticationCancelledError extends Error {
    constructor(message) {
      super(message);
      this.name = "AuthenticationCancelledError";
    }
  };
  UnauthorizedError = class UnauthorizedError extends Error {
    constructor(message) {
      super(message);
      this.name = "UnauthorizedError";
    }
  };
});

export { isAnthropicAuthEnabled, getAuthTokenSource, getAnthropicApiKey, hasAnthropicApiKeyAuth, getAnthropicApiKeyWithSource, getConfiguredApiKeyHelper, calculateApiKeyHelperTTL, getApiKeyHelperElapsedMs, getApiKeyFromApiKeyHelper, getApiKeyFromApiKeyHelperCached, clearApiKeyHelperCache, prefetchApiKeyFromApiKeyHelperIfSafe, getApiKeyFromConfigOrMacOSKeychain, saveApiKey, isCustomApiKeyApproved, removeApiKey, isAwsAuthRefreshFromProjectSettings, isAwsCredentialExportFromProjectSettings, refreshAwsAuth, refreshAndGetAwsCredentials, clearAwsCredentialsCache, prefetchAwsCredentialsAndBedRockInfoIfSafe, isGcpAuthRefreshFromProjectSettings, checkGcpCredentialsValid, refreshGcpAuth, refreshGcpCredentialsIfNeeded, clearGcpCredentialsCache, prefetchGcpCredentialsIfSafe, saveOAuthTokensIfNeeded, getClaudeAIOAuthTokens, clearOAuthTokenCache, handleOAuth401Error, getClaudeAIOAuthTokensAsync, checkAndRefreshOAuthTokenIfNeeded, isClaudeAISubscriber, hasProfileScope, is1PApiCustomer, getOauthAccountInfo, isOverageProvisioningAllowed, getSubscriptionType, getRateLimitTier, isTeamSubscriber, isProSubscriber, isMaxSubscriber, isConsumerSubscriber, getOrganizationUUID, getAccountInformation, AuthenticationCancelledError, UnauthorizedError, isTeamPremiumSubscriber, isUsing3PServices, isEnterpriseSubscriber, validateForceLoginOrg, getOtelHeadersFromHelper, getSubscriptionName, init_auth };

//# debugId=31EA426FEE65611364756E2164756E21
//# sourceMappingURL=chunk-e45319yt.js.map
