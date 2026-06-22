/**
 * AgentFlow-Code — Analytics stub.
 *
 * All Anthropic telemetry (GrowthBook/Datadog/Statsig/1P event logging) removed.
 * Functions are no-ops that return safe defaults.
 */

// ── Types ──
export type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS = string

// ── Feature flags (always return defaults) ──
export function getFeatureValue_CACHED_MAY_BE_STALE<T>(_key: string, defaultValue: T): T {
  return defaultValue
}
export function getFeatureValue_CACHED_WITH_REFRESH<T>(_key: string, defaultValue: T): T {
  return defaultValue
}
export function checkStatsigFeatureGate_CACHED_MAY_BE_STALE(_key: string): boolean {
  return false
}
export function getDynamicConfig_CACHED_MAY_BE_STALE(_key: string): Record<string, unknown> {
  return {}
}
export function getDynamicConfig_BLOCKS_ON_INIT(_key: string): Record<string, unknown> {
  return {}
}
export function onGrowthBookRefresh(_cb: () => void): void {}

// ── Event logging (no-op) ──
export function logEvent(
  _name: string,
  _metadata?: Record<string, unknown>,
): void {}

// ── Sanitization ──
export function sanitizeToolNameForAnalytics(name: string): string {
  return name
}

// ── Lifecycle (no-op) ──
export function initializeAnalyticsSink(): void {}
export function initializeGrowthBook(): Promise<void> { return Promise.resolve() }
export function shutdownDatadog(): void {}
export function shutdown1PEventLogging(): void {}
export function isFeedbackSurveyDisabled(): boolean { return true }
export function isAnalyticsDisabled(): boolean { return true }

// ── Metadata helpers ──
export function getAnalyticsMetadata(): Record<string, unknown> {
  return {}
}
