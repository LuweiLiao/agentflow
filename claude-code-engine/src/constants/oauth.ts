/**
 * AgentFlow-Code — OAuth configuration stub.
 *
 * Anthropic OAuth infrastructure removed. All functions return safe defaults.
 * AgentFlow-Code uses API keys via environment variables (ANTHROPIC_API_KEY,
 * OPENAI_API_KEY, etc.) — OAuth flow is not supported.
 */

export const OAUTH_BETA_HEADER = ''

export type OauthConfig = {
  BASE_API_URL: string
  CONSOLE_AUTHORIZE_URL: string
  CLAUDE_AI_AUTHORIZE_URL: string
  TOKEN_URL: string
  API_KEY_URL: string
  CLIENT_ID: string
  REDIRECT_URI: string
  MCP_PROXY_URL: string
  SCOPES: string[]
}

const STUB_CONFIG: OauthConfig = {
  BASE_API_URL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
  CONSOLE_AUTHORIZE_URL: '',
  CLAUDE_AI_AUTHORIZE_URL: '',
  TOKEN_URL: '',
  API_KEY_URL: '',
  CLIENT_ID: '',
  REDIRECT_URI: '',
  MCP_PROXY_URL: '',
  SCOPES: [],
}

export function getOauthConfig(): OauthConfig {
  return STUB_CONFIG
}

export function getOauthConfigForUrl(_url: string): OauthConfig {
  return STUB_CONFIG
}

export const ALLOWED_OAUTH_BASE_URLS: string[] = []

// ── Additional stubs for backward compatibility ──
export function fileSuffixForOauthConfig(_config?: OauthConfig): string {
  return ''
}
export const MCP_CLIENT_METADATA_URL = ''

/** Auto-generated stub export. */
export function CLAUDE_AI_INFERENCE_SCOPE(..._args: any[]): any { return undefined }
