/**
 * AgentFlow-Code — Auth module (simplified).
 *
 * Anthropic OAuth/AWS/GCP/Keychain auth removed.
 * AgentFlow-Code authenticates via environment variables only:
 *   ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.
 */

import { isEnvTruthy } from './envUtils.js'

// ── Types ──
export type ApiKeySource =
  | 'environment'
  | 'apiKeyHelper'
  | 'config'
  | 'oauth'
  | 'keychain'

export type OAuthTokens = {
  access_token: string
  refresh_token: string
  expires_at: number
}

export type AccountInfo = {
  organizationUuid: string
  organizationName: string
  accountEmail: string
}

// ── API Key ──
export function isAnthropicAuthEnabled(): boolean {
  return !!getAnthropicApiKey()
}

export function getAuthTokenSource() {
  return { source: 'environment' as ApiKeySource, key: getAnthropicApiKey() }
}

export function getAnthropicApiKey(): string | null {
  return process.env.ANTHROPIC_API_KEY || null
}

export function hasAnthropicApiKeyAuth(): boolean {
  return !!getAnthropicApiKey()
}

export function getAnthropicApiKeyWithSource(): { key: string | null; source: ApiKeySource } {
  const key = getAnthropicApiKey()
  return { key, source: key ? 'environment' : 'environment' }
}

export function getConfiguredApiKeyHelper(): string | undefined {
  return undefined
}

// ── API Key Helper (disabled) ──
export function calculateApiKeyHelperTTL(): number { return 0 }
export function getApiKeyHelperElapsedMs(): number { return 0 }
export async function getApiKeyFromApiKeyHelper(): Promise<string | null> { return null }
export function getApiKeyFromApiKeyHelperCached(): string | null { return null }
export function clearApiKeyHelperCache(): void {}
export function prefetchApiKeyFromApiKeyHelperIfSafe(): void {}

// ── Config/Keychain (disabled) ──
export const getApiKeyFromConfigOrMacOSKeychain = (): string | null => getAnthropicApiKey()
export async function saveApiKey(_apiKey: string): Promise<void> {}
export function isCustomApiKeyApproved(_apiKey: string): boolean { return true }
export async function removeApiKey(): Promise<void> {}

// ── AWS/Bedrock (disabled) ──
export function isAwsAuthRefreshFromProjectSettings(): boolean { return false }
export function isAwsCredentialExportFromProjectSettings(): boolean { return false }
export async function refreshAwsAuth(_awsAuthRefresh: string): Promise<boolean> { return false }
export const refreshAndGetAwsCredentials = async (): Promise<any> => null
export function clearAwsCredentialsCache(): void {}
export function prefetchAwsCredentialsAndBedRockInfoIfSafe(): void {}

// ── GCP/Vertex (disabled) ──
export function isGcpAuthRefreshFromProjectSettings(): boolean { return false }
export async function checkGcpCredentialsValid(): Promise<boolean> { return false }
export async function refreshGcpAuth(_gcpAuthRefresh: string): Promise<boolean> { return false }
export const refreshGcpCredentialsIfNeeded = async (): Promise<any> => null
export function clearGcpCredentialsCache(): void {}
export function prefetchGcpCredentialsIfSafe(): void {}

// ── OAuth (all disabled — return safe defaults) ──
export function saveOAuthTokensIfNeeded(_tokens: OAuthTokens): { didSave: boolean } {
  return { didSave: false }
}
export const getClaudeAIOAuthTokens = (): OAuthTokens | null => null
export function clearOAuthTokenCache(): void {}
export function handleOAuth401Error(): { shouldRetry: boolean } {
  return { shouldRetry: false }
}
export async function getClaudeAIOAuthTokensAsync(): Promise<OAuthTokens | null> { return null }
export function checkAndRefreshOAuthTokenIfNeeded(): Promise<void> { return Promise.resolve() }
export function isClaudeAISubscriber(): boolean { return false }
export function hasProfileScope(): boolean { return false }
export function is1PApiCustomer(): boolean { return false }
export function getOauthAccountInfo(): AccountInfo | undefined { return undefined }
export function isOverageProvisioningAllowed(): boolean { return false }
export function getSubscriptionType(): string { return 'api_key' }
export function getRateLimitTier(): string { return 'standard' }
export function isTeamSubscriber(): boolean { return false }
export function isProSubscriber(): boolean { return false }
export function isMaxSubscriber(): boolean { return false }
export function isConsumerSubscriber(): boolean { return false }
export function getOrganizationUUID(): string | null { return null }
export function getAccountInformation(): { organizationName: string; accountEmail: string } | null { return null }

// ── Error classes (kept for compatibility) ──
export class AuthenticationCancelledError extends Error {
  constructor(message: string) { super(message); this.name = 'AuthenticationCancelledError' }
}
export class UnauthorizedError extends Error {
  constructor(message: string) { super(message); this.name = 'UnauthorizedError' }
}

/** Auto-generated stub export. */
export function isTeamPremiumSubscriber(..._args: any[]): any { return undefined }

/** Auto-generated stub export. */
export function isUsing3PServices(..._args: any[]): any { return undefined }

/** Auto-generated stub export. */
export function isEnterpriseSubscriber(..._args: any[]): any { return undefined }

/** Auto-generated stub export. */
export function validateForceLoginOrg(..._args: any[]): any { return undefined }

/** Auto-generated stub export. */
export function getOtelHeadersFromHelper(..._args: any[]): any { return undefined }

/** Auto-generated stub export. */
export function getSubscriptionName(..._args: any[]): any { return undefined }
