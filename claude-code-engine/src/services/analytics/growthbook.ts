/** AgentFlow-Code: GrowthBook stub. */
export function getFeatureValue_CACHED_MAY_BE_STALE<T>(_key: string, d: T): T { return d }
export function getFeatureValue_CACHED_WITH_REFRESH<T>(_key: string, d: T): T { return d }
export function checkStatsigFeatureGate_CACHED_MAY_BE_STALE(_key: string): boolean { return false }
export function getDynamicConfig_CACHED_MAY_BE_STALE(_key: string): Record<string, unknown> { return {} }
export function getDynamicConfig_BLOCKS_ON_INIT(_key: string): Record<string, unknown> { return {} }
export function onGrowthBookRefresh(_cb: () => void): void {}
export function initializeGrowthBook(): Promise<void> { return Promise.resolve() }
export function isGrowthBookInitialized(): boolean { return true }

/** Auto-generated stub export. */
export function checkGate_CACHED_OR_BLOCKING(..._args: any[]): any { return undefined }

/** Auto-generated stub export. */
export function checkSecurityRestrictionGate(..._args: any[]): any { return undefined }

/** Auto-generated stub export. */
export function refreshGrowthBookAfterAuthChange(..._args: any[]): any { return undefined }

/** Auto-generated stub export. */
export function resetGrowthBook(..._args: any[]): any { return undefined }

/** Auto-generated stub export. */
export function hasGrowthBookEnvOverride(..._args: any[]): any { return undefined }
