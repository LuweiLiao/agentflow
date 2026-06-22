// @bun
import {
  AwsAuthStatusManager,
  StructuredIO,
  exports_cronJitterConfig,
  exports_cronScheduler,
  extractInboundMessageFields,
  init_cronJitterConfig,
  init_cronScheduler,
  ndjsonSafeStringify,
  outputSchema,
  permissionPromptToolResultToPermissionDecision,
  reconcileMarketplaces
} from "./chunk-za0ar7f2.js";
import {
  restoreAgentFromSession,
  restoreSessionStateFromLog,
  skillChangeDetector
} from "./chunk-5hwyh4jq.js";
import {
  detectAndUninstallDelistedPlugins
} from "./chunk-7zg1xv76.js";
import"./chunk-awgrxt8a.js";
import {
  externalMetadataToAppState
} from "./chunk-29nfr06a.js";
import {
  resolveAndPrepend
} from "./chunk-3rkv8asz.js";
import {
  SSETransport,
  init_SSETransport,
  init_rcDebugLog,
  rcLog
} from "./chunk-nwh7s0hx.js";
import {
  ask,
  buildSideQuestionFallbackParams
} from "./chunk-h54rqhkr.js";
import"./chunk-qt8grzzk.js";
import {
  init_settingsSync
} from "./chunk-8gy6yfg2.js";
import {
  init_refresh,
  refreshActivePlugins
} from "./chunk-v8knb1n3.js";
import {
  init_toolPool,
  mergeAndFilterTools
} from "./chunk-q992s9e2.js";
import"./chunk-v7s3bqyb.js";
import {
  init_mappers,
  toInternalMessages,
  toSDKRateLimitInfo
} from "./chunk-yqyxfzke.js";
import {
  generateSessionTitle,
  init_sessionTitle
} from "./chunk-v8bp6mgc.js";
import"./chunk-d2an0138.js";
import {
  init_remoteManagedSettings,
  waitForRemoteManagedSettingsToLoad
} from "./chunk-w131chaf.js";
import {
  checkGroveForNonInteractive,
  init_grove,
  isQualifiedForGrove
} from "./chunk-jjfxy9t2.js";
import {
  init_omit,
  omit_default
} from "./chunk-dn2sbnae.js";
import {
  ChannelMessageNotificationSchema,
  findChannelEntry,
  gateChannelServer,
  init_channelAllowlist,
  init_channelNotification,
  isChannelAllowlisted,
  isChannelsEnabled,
  wrapChannelMessage
} from "./chunk-jfn771zv.js";
import"./chunk-1s4dkace.js";
import"./chunk-y6y7ytg8.js";
import {
  collectContextData,
  init_context_noninteractive
} from "./chunk-4kdsd2f4.js";
import {
  init_sideQuestion,
  runSideQuestion
} from "./chunk-3nnkjzrp.js";
import"./chunk-3abaq08g.js";
import {
  CircularBuffer,
  DEFAULT_OUTPUT_STYLE_NAME,
  EFFORT_LEVELS,
  EMPTY_USAGE,
  OAuthService,
  SandboxManager,
  applySettingsChange,
  areMcpConfigsEqual,
  asSessionId,
  assembleToolPool,
  atomicWriteToZipCache,
  buildBridgeConnectUrl,
  cancelQueuedAutonomyCommands,
  claimConsumableQueuedAutonomyCommands,
  cleanupSessionPluginCache,
  clearCommandsCache,
  clearMarketplacesCache,
  clearPluginCache,
  clearServerCache,
  commandBelongsToServer,
  connectToServer,
  createAbortController,
  createAutonomyQueuedPromptIfNoActiveSource,
  createCombinedAbortSignal,
  createModelSwitchBreadcrumbs,
  createProactiveAutonomyCommands,
  dequeue,
  dequeueAllMatching,
  doesMessageExistInSession,
  drainSdkEvents,
  enqueue,
  executeNotificationHooks,
  exports_coordinatorMode,
  exports_loadAgentsDir,
  exports_proactive,
  extractReadFilesFromMessages,
  fetchToolsForClient,
  fileHistoryCanRestore,
  fileHistoryEnabled,
  fileHistoryGetDiffStats,
  fileHistoryRewind,
  filterMcpServersByPolicy,
  filterToolsByDenyRules,
  filterToolsByServer,
  finalizeAutonomyCommandsForTurn,
  finalizePendingAsyncHooks,
  findUnresolvedToolUse,
  formatDescriptionWithSource,
  fromArray,
  getAllMcpConfigs,
  getAllOutputStyles,
  getAutoModeUnavailableNotification,
  getAutoModeUnavailableReason,
  getCommandName,
  getCommands,
  getCommandsByMaxPriority,
  getDeclaredMarketplaces,
  getLastCacheSafeParams,
  getMarketplaceJsonRelativePath,
  getMcpConfigByName,
  getModelOptions,
  getPluginZipCachePath,
  getRemoteSessionUrl,
  getRunningTasks,
  getSessionIngressAuthHeaders,
  getSessionIngressAuthToken,
  getSessionState,
  getZipCacheKnownMarketplacesPath,
  getZipCacheMarketplacesDir,
  getZipCachePluginsDir,
  gracefulShutdown,
  gracefulShutdownSync,
  hasCommandsInQueue,
  hasPermissionsToUseTool,
  headlessProfilerCheckpoint,
  headlessProfilerStartTurn,
  hydrateFromCCRv2InternalEvents,
  hydrateRemoteSession,
  init_AsyncHookRegistry,
  init_CircularBuffer,
  init_abortController,
  init_applySettingsChange,
  init_auth as init_auth3,
  init_autonomyQueueLifecycle,
  init_autonomyRuns,
  init_betas,
  init_bridgeStatusUtil,
  init_changeDetector,
  init_claudeAiLimits,
  init_client,
  init_combinedAbortSignal,
  init_commandLifecycle,
  init_commands1 as init_commands,
  init_config,
  init_conversationRecovery,
  init_coordinatorMode,
  init_effort,
  init_elicitationHandler,
  init_fileHistory,
  init_filesApi,
  init_forkedAgent,
  init_framework,
  init_generators,
  init_gracefulShutdown,
  init_headlessProfiler,
  init_hookEvents,
  init_hooks1 as init_hooks,
  init_ids,
  init_loadAgentsDir,
  init_marketplaceManager,
  init_messageQueueManager,
  init_messages1 as init_messages,
  init_modelOptions,
  init_oauth,
  init_outputStyles,
  init_outputsScanner,
  init_permissionSetup,
  init_permissions,
  init_pluginLoader,
  init_policyLimits,
  init_proactive,
  init_product,
  init_prompt1 as init_prompt9,
  init_promptSuggestion,
  init_queryHelpers,
  init_queryProfiler,
  init_reject,
  init_sandbox_adapter,
  init_sdkEventQueue,
  init_sessionActivity,
  init_sessionIngressAuth,
  init_sessionStart,
  init_sessionState,
  init_sessionStorage,
  init_src,
  init_stopTask,
  init_teammateMailbox,
  init_thinking,
  init_tools,
  init_types2,
  init_uniqBy,
  init_utils1 as init_utils,
  init_uuid,
  init_vscodeSdkMcp,
  init_zipCache,
  isAutoModeGateEnabled,
  isBackgroundTask,
  isBuiltInAgent,
  isBypassPermissionsModeDisabled,
  isMarketplaceSourceSupportedByZipCache,
  isMcpServerDisabled,
  isPluginZipCacheEnabled,
  isPolicyAllowed,
  isShutdownApproved,
  isShuttingDown,
  loadAllPluginsCacheOnly,
  loadConversationForResume,
  loadKnownMarketplacesConfigSafe,
  logHeadlessProfilerTurn,
  logQueryProfileReport,
  logSuggestionOutcome,
  logSuggestionSuppressed,
  markAutonomyRunFailed,
  markMessagesAsRead,
  modelSupportsAdaptiveThinking,
  modelSupportsAutoMode,
  modelSupportsEffort,
  modelSupportsMaxEffort,
  notifyCommandLifecycle,
  notifySessionMetadataChanged,
  notifySessionStateChanged,
  parseAgentsFromJson,
  peek,
  performMCPOAuthFlow,
  processSessionStartHooks,
  processSetupHooks,
  readUnreadMessages,
  reconnectMcpServerImpl,
  recordAttributionSnapshot,
  registerHookEventHandler,
  registerSeedMarketplaces,
  registerSessionActivityCallback,
  reject_default,
  resetSessionFilePointer,
  resolveAppliedEffort,
  restoreSessionMetadata,
  revokeServerTokens,
  runElicitationHooks,
  runElicitationResultHooks,
  saveAgentSetting,
  saveAiGeneratedTitle,
  saveMode,
  setCommandLifecycleListener,
  setInternalEventReader,
  setInternalEventWriter,
  setMcpServerEnabled,
  setPermissionModeChangedListener,
  setSessionMetadataChangedListener,
  setSessionStateChangedListener,
  settingsChangeDetector,
  setupSdkMcpClients,
  setupVscodeSdkMcp,
  startQueryProfile,
  statusListeners,
  stopTask,
  subscribeToCommandQueue,
  takeInitialUserMessage,
  transitionPermissionMode,
  tryGenerateSuggestion,
  uniqBy_default,
  unregisterSessionActivityCallback,
  validateUuid
} from "./chunk-xzgt0njb.js";
import {
  init_auth as init_auth2,
  installOAuthTokens
} from "./chunk-vzhwvpbr.js";
import"./chunk-861tjjzp.js";
import"./chunk-z2ajd3fw.js";
import"./chunk-28jd8qjx.js";
import"./chunk-djt39ze3.js";
import"./chunk-9a9g5hbj.js";
import"./chunk-ptxteaeh.js";
import"./chunk-hvh0cdgd.js";
import {
  incrementPromptCount,
  init_commitAttribution
} from "./chunk-wnhdazsj.js";
import"./chunk-rgyzsbs3.js";
import"./chunk-qn6me9n1.js";
import {
  init_tasks,
  init_teamHelpers,
  removeTeammateFromTeamFile,
  unassignTeammateTasks
} from "./chunk-xef7acwt.js";
import"./chunk-5enwkkas.js";
import"./chunk-jkzgg117.js";
import"./chunk-9hn8e6h1.js";
import {
  init_pluginIdentifier,
  parsePluginIdentifier
} from "./chunk-2fww5648.js";
import"./chunk-e81mm4jp.js";
import"./chunk-754gszm4.js";
import"./chunk-eemmwhkd.js";
import"./chunk-bcywwfqv.js";
import"./chunk-4k180xch.js";
import"./chunk-prv12vph.js";
import {
  READ_FILE_STATE_CACHE_SIZE,
  createFileStateCacheWithSizeLimit,
  init_fileStateCache,
  mergeFileStateCaches
} from "./chunk-24kv69g3.js";
import"./chunk-meyb0stq.js";
import"./chunk-rknftgwg.js";
import"./chunk-4spgkgr3.js";
import"./chunk-bvcfzg7t.js";
import {
  hasActiveInProcessTeammates,
  hasWorkingInProcessTeammates,
  init_teammate,
  isTeamLead,
  waitForTeammatesToBecomeIdle
} from "./chunk-c79fzdwz.js";
import"./chunk-hqxp6b72.js";
import"./chunk-a2cbjpab.js";
import"./chunk-qbsm2t49.js";
import"./chunk-8zz4z1q3.js";
import"./chunk-e4dsy4g1.js";
import"./chunk-326zehp8.js";
import"./chunk-kc67kt75.js";
import"./chunk-40t1d75v.js";
import"./chunk-60fkafk2.js";
import {
  SHELL_TOOL_NAMES,
  createSyntheticOutputTool,
  exports_prompt,
  init_SyntheticOutputTool,
  init_Tool,
  init_constants,
  init_constants3 as init_constants2,
  init_prompt as init_prompt2,
  init_prompt2 as init_prompt3,
  init_prompt3 as init_prompt4,
  init_prompt4 as init_prompt5,
  init_prompt5 as init_prompt6,
  init_prompt8 as init_prompt7,
  init_prompt9 as init_prompt8,
  init_shellToolUtils,
  toolMatchesName
} from "./chunk-kvjvqgcx.js";
import {
  ensureModelStringsInitialized,
  getAPIProvider,
  getDefaultMainLoopModel,
  getFastModeState,
  getMainLoopModel,
  init_fastMode,
  init_model,
  init_modelStrings,
  init_providers,
  isFastModeAvailable,
  isFastModeEnabled,
  isFastModeSupportedByModel,
  modelDisplayString,
  parseUserSpecifiedModel
} from "./chunk-srbv7hh4.js";
import"./chunk-093ej2sf.js";
import"./chunk-7tfdhkpy.js";
import"./chunk-snchk5qv.js";
import {
  KnownMarketplacesFileSchema,
  TASK_STOP_TOOL_NAME,
  getSettingsWithSources,
  getSettings_DEPRECATED,
  init_prompt,
  init_schemas,
  init_settings1 as init_settings,
  init_stringUtils
} from "./chunk-h2edgmqn.js";
import"./chunk-d1ka4b7m.js";
import {
  getMcpPrefix,
  init_mcpStringUtils
} from "./chunk-tavc33hf.js";
import"./chunk-80p148mw.js";
import {
  init_array,
  uniq
} from "./chunk-49v9e09z.js";
import"./chunk-ayjng5py.js";
import"./chunk-m3c1nydt.js";
import"./chunk-nde5ym6a.js";
import"./chunk-0hvg7s1m.js";
import {
  createAxiosInstance,
  getWebSocketProxyAgent,
  getWebSocketProxyUrl,
  getWebSocketTLSOptions,
  init_mtls,
  init_proxy
} from "./chunk-hdhvk68c.js";
import"./chunk-6tebjnq9.js";
import"./chunk-935nrvdb.js";
import"./chunk-k2hff9tm.js";
import"./chunk-t867bdcq.js";
import"./chunk-dypm8ssd.js";
import"./chunk-459fm40c.js";
import"./chunk-1r8z8ez7.js";
import"./chunk-w5hnghah.js";
import"./chunk-ywnfc8g5.js";
import"./chunk-s76nvx50.js";
import"./chunk-y5f62n0j.js";
import"./chunk-k92qk5av.js";
import"./chunk-vwenx8ke.js";
import {
  ElicitRequestSchema,
  ElicitationCompleteNotificationSchema,
  init_types
} from "./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import"./chunk-28rzgcvw.js";
import"./chunk-g5vjgacw.js";
import"./chunk-eavq5vsk.js";
import"./chunk-bgan4cpf.js";
import {
  WORKLOAD_CRON,
  getClaudeCodeUserAgent,
  init_userAgent,
  init_workloadContext,
  runWithWorkload
} from "./chunk-35jsjk7z.js";
import {
  getAccountInformation,
  init_auth
} from "./chunk-e45319yt.js";
import {
  init_paths,
  isExtractModeActive
} from "./chunk-jyqypr4z.js";
import"./chunk-m18nccbn.js";
import"./chunk-e2jvken3.js";
import {
  init_json,
  safeParseJSON
} from "./chunk-5zhv4jyp.js";
import"./chunk-jwyj6t5m.js";
import {
  expandPath,
  init_path
} from "./chunk-87f9np2y.js";
import"./chunk-zq3spn7d.js";
import {
  init_sleep,
  sleep
} from "./chunk-jmv7k0jn.js";
import"./chunk-7fbjbgr5.js";
import {
  getFeatureValue_CACHED_MAY_BE_STALE,
  init_growthbook,
  initializeGrowthBook
} from "./chunk-x5wzz44g.js";
import"./chunk-r87btn9p.js";
import"./chunk-v4ypszbb.js";
import"./chunk-dw66fdss.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-qmk4ebrf.js";
import"./chunk-e3abfxpy.js";
import"./chunk-q44zc68f.js";
import"./chunk-fejeqe61.js";
import"./chunk-bj6zyntv.js";
import"./chunk-49x6szsr.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-0k4kr3h5.js";
import"./chunk-x9xf2qa8.js";
import {
  init_analytics,
  logEvent
} from "./chunk-4hpfxga2.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import {
  axios_default,
  init_axios
} from "./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import"./chunk-rm37ayrm.js";
import {
  init_diagLogs,
  logForDiagnosticsNoPII,
  withDiagnosticsTiming
} from "./chunk-bt5n9f4r.js";
import"./chunk-qkkkfh9a.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-w7s0zvjq.js";
import {
  getCwd,
  init_cwd
} from "./chunk-w95hkggk.js";
import {
  LOCAL_COMMAND_STDOUT_TAG,
  TEAMMATE_MESSAGE_TAG,
  TICK_TAG,
  getInMemoryErrors,
  init_log,
  init_xml,
  logError,
  logMCPDebug
} from "./chunk-kc49dhz0.js";
import"./chunk-k51zdj4e.js";
import"./chunk-mtgfbnth.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import {
  errorMessage,
  getErrnoCode,
  getFsImplementation,
  init_cleanupRegistry,
  init_debug,
  init_errors,
  init_fsOperations,
  init_slowOperations,
  isDebugMode,
  jsonParse,
  jsonStringify,
  logForDebugging,
  registerCleanup,
  toError
} from "./chunk-pyv3zrjt.js";
import {
  init_process,
  registerProcessOutputErrorHandlers,
  writeToStdout
} from "./chunk-kb3758f7.js";
import {
  getAllowedChannels,
  getFlagSettingsInline,
  getInitJsonSchema,
  getMainThreadAgentType,
  getSessionId,
  init_state,
  isSessionPersistenceDisabled,
  registerHookCallbacks,
  setAllowedChannels,
  setFlagSettingsInline,
  setInitJsonSchema,
  setMainLoopModelOverride,
  setMainThreadAgentType,
  setSdkAgentProgressSummariesEnabled,
  switchSession
} from "./chunk-232p95fy.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import {
  init_envUtils,
  isBareMode,
  isEnvDefinedFalsy,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __require,
  __toCommonJS
} from "./chunk-hhsxm2yr.js";

// src/cli/print.ts
init_settingsSync();
init_remoteManagedSettings();
import { readFile as readFile2, stat } from "fs/promises";
import { dirname } from "path";

// src/cli/remoteIO.ts
init_state();
import { PassThrough } from "stream";
import { URL as URL3 } from "url";

// src/bridge/pollConfig.ts
function getPollIntervalConfig(..._args) {
  return;
}

// src/cli/remoteIO.ts
init_cleanupRegistry();
init_commandLifecycle();
init_debug();
init_diagLogs();
init_envUtils();
init_errors();
init_gracefulShutdown();
init_log();
init_process();
init_sessionIngressAuth();
init_sessionState();
init_sessionStorage();

// src/cli/transports/ccrClient.ts
import { randomUUID } from "crypto";

// src/bridge/jwtUtils.ts
function decodeJwtExpiry(..._args) {
  return;
}

// src/cli/transports/ccrClient.ts
init_debug();
init_diagLogs();
init_errors();
init_proxy();
init_sessionActivity();
init_sessionIngressAuth();
init_sleep();
init_userAgent();

// src/cli/transports/SerialBatchEventUploader.ts
init_slowOperations();

class RetryableError extends Error {
  retryAfterMs;
  constructor(message, retryAfterMs) {
    super(message);
    this.retryAfterMs = retryAfterMs;
  }
}

class SerialBatchEventUploader {
  pending = [];
  pendingAtClose = 0;
  draining = false;
  closed = false;
  backpressureResolvers = [];
  sleepResolve = null;
  flushResolvers = [];
  droppedBatches = 0;
  config;
  constructor(config) {
    this.config = config;
  }
  get droppedBatchCount() {
    return this.droppedBatches;
  }
  get pendingCount() {
    return this.closed ? this.pendingAtClose : this.pending.length;
  }
  async enqueue(events) {
    if (this.closed)
      return;
    const items = Array.isArray(events) ? events : [events];
    if (items.length === 0)
      return;
    while (this.pending.length + items.length > this.config.maxQueueSize && !this.closed) {
      await new Promise((resolve) => {
        this.backpressureResolvers.push(resolve);
      });
    }
    if (this.closed)
      return;
    this.pending.push(...items);
    this.drain();
  }
  flush() {
    if (this.pending.length === 0 && !this.draining) {
      return Promise.resolve();
    }
    this.drain();
    return new Promise((resolve) => {
      this.flushResolvers.push(resolve);
    });
  }
  close() {
    if (this.closed)
      return;
    this.closed = true;
    this.pendingAtClose = this.pending.length;
    this.pending = [];
    this.sleepResolve?.();
    this.sleepResolve = null;
    for (const resolve of this.backpressureResolvers)
      resolve();
    this.backpressureResolvers = [];
    for (const resolve of this.flushResolvers)
      resolve();
    this.flushResolvers = [];
  }
  async drain() {
    if (this.draining || this.closed)
      return;
    this.draining = true;
    let failures = 0;
    try {
      while (this.pending.length > 0 && !this.closed) {
        const batch = this.takeBatch();
        if (batch.length === 0)
          continue;
        try {
          await this.config.send(batch);
          failures = 0;
        } catch (err) {
          failures++;
          if (this.config.maxConsecutiveFailures !== undefined && failures >= this.config.maxConsecutiveFailures) {
            this.droppedBatches++;
            this.config.onBatchDropped?.(batch.length, failures);
            failures = 0;
            this.releaseBackpressure();
            continue;
          }
          this.pending = batch.concat(this.pending);
          const retryAfterMs = err instanceof RetryableError ? err.retryAfterMs : undefined;
          await this.sleep(this.retryDelay(failures, retryAfterMs));
          continue;
        }
        this.releaseBackpressure();
      }
    } finally {
      this.draining = false;
      if (this.pending.length === 0) {
        for (const resolve of this.flushResolvers)
          resolve();
        this.flushResolvers = [];
      }
    }
  }
  takeBatch() {
    const { maxBatchSize, maxBatchBytes } = this.config;
    if (maxBatchBytes === undefined) {
      return this.pending.splice(0, maxBatchSize);
    }
    let bytes = 0;
    let count = 0;
    while (count < this.pending.length && count < maxBatchSize) {
      let itemBytes;
      try {
        itemBytes = Buffer.byteLength(jsonStringify(this.pending[count]));
      } catch {
        this.pending.splice(count, 1);
        continue;
      }
      if (count > 0 && bytes + itemBytes > maxBatchBytes)
        break;
      bytes += itemBytes;
      count++;
    }
    return this.pending.splice(0, count);
  }
  retryDelay(failures, retryAfterMs) {
    const jitter = Math.random() * this.config.jitterMs;
    if (retryAfterMs !== undefined) {
      const clamped = Math.max(this.config.baseDelayMs, Math.min(retryAfterMs, this.config.maxDelayMs));
      return clamped + jitter;
    }
    const exponential = Math.min(this.config.baseDelayMs * 2 ** (failures - 1), this.config.maxDelayMs);
    return exponential + jitter;
  }
  releaseBackpressure() {
    const resolvers = this.backpressureResolvers;
    this.backpressureResolvers = [];
    for (const resolve of resolvers)
      resolve();
  }
  sleep(ms) {
    return new Promise((resolve) => {
      this.sleepResolve = resolve;
      setTimeout((self, resolve2) => {
        self.sleepResolve = null;
        resolve2();
      }, ms, this, resolve);
    });
  }
}

// src/cli/transports/WorkerStateUploader.ts
init_sleep();

class WorkerStateUploader {
  inflight = null;
  pending = null;
  closed = false;
  config;
  constructor(config) {
    this.config = config;
  }
  enqueue(patch) {
    if (this.closed)
      return;
    this.pending = this.pending ? coalescePatches(this.pending, patch) : patch;
    this.drain();
  }
  close() {
    this.closed = true;
    this.pending = null;
  }
  async drain() {
    if (this.inflight || this.closed)
      return;
    if (!this.pending)
      return;
    const payload = this.pending;
    this.pending = null;
    this.inflight = this.sendWithRetry(payload).then(() => {
      this.inflight = null;
      if (this.pending && !this.closed) {
        this.drain();
      }
    });
  }
  async sendWithRetry(payload) {
    let current = payload;
    let failures = 0;
    while (!this.closed) {
      const ok = await this.config.send(current);
      if (ok)
        return;
      failures++;
      await sleep(this.retryDelay(failures));
      if (this.pending && !this.closed) {
        current = coalescePatches(current, this.pending);
        this.pending = null;
      }
    }
  }
  retryDelay(failures) {
    const exponential = Math.min(this.config.baseDelayMs * 2 ** (failures - 1), this.config.maxDelayMs);
    const jitter = Math.random() * this.config.jitterMs;
    return exponential + jitter;
  }
}
function coalescePatches(base, overlay) {
  const merged = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if ((key === "external_metadata" || key === "internal_metadata") && merged[key] && typeof merged[key] === "object" && typeof value === "object" && value !== null) {
      merged[key] = {
        ...merged[key],
        ...value
      };
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

// src/cli/transports/ccrClient.ts
var DEFAULT_HEARTBEAT_INTERVAL_MS = 20000;
var STREAM_EVENT_FLUSH_INTERVAL_MS = 100;
function alwaysValidStatus() {
  return true;
}

class CCRInitError extends Error {
  reason;
  constructor(reason) {
    super(`CCRClient init failed: ${reason}`);
    this.reason = reason;
  }
}
var MAX_CONSECUTIVE_AUTH_FAILURES = 10;
function createStreamAccumulator() {
  return { byMessage: new Map, scopeToMessage: new Map };
}
function scopeKey(m) {
  return `${m.session_id}:${m.parent_tool_use_id ?? ""}`;
}
function accumulateStreamEvents(buffer, state) {
  const out = [];
  const touched = new Map;
  for (const msg of buffer) {
    const evt = msg.event;
    switch (evt.type) {
      case "message_start": {
        const id = evt.message.id;
        const prevId = state.scopeToMessage.get(scopeKey(msg));
        if (prevId)
          state.byMessage.delete(prevId);
        state.scopeToMessage.set(scopeKey(msg), id);
        state.byMessage.set(id, []);
        out.push(msg);
        break;
      }
      case "content_block_delta": {
        const delta = evt.delta;
        if (delta.type !== "text_delta") {
          out.push(msg);
          break;
        }
        const messageId = state.scopeToMessage.get(scopeKey(msg));
        const blocks = messageId ? state.byMessage.get(messageId) : undefined;
        if (!blocks) {
          out.push(msg);
          break;
        }
        const idx = evt.index;
        const chunks = blocks[idx] ??= [];
        chunks.push(delta.text);
        const existing = touched.get(chunks);
        if (existing) {
          existing.event.delta = {
            type: "text_delta",
            text: chunks.join("")
          };
          break;
        }
        const snapshot = {
          type: "stream_event",
          uuid: msg.uuid,
          session_id: msg.session_id,
          parent_tool_use_id: msg.parent_tool_use_id,
          event: {
            type: "content_block_delta",
            index: idx,
            delta: { type: "text_delta", text: chunks.join("") }
          }
        };
        touched.set(chunks, snapshot);
        out.push(snapshot);
        break;
      }
      default:
        out.push(msg);
    }
  }
  return out;
}
function clearStreamAccumulatorForMessage(state, assistant) {
  state.byMessage.delete(assistant.message.id);
  const scope = scopeKey(assistant);
  if (state.scopeToMessage.get(scope) === assistant.message.id) {
    state.scopeToMessage.delete(scope);
  }
}

class CCRClient {
  workerEpoch = 0;
  heartbeatIntervalMs;
  heartbeatJitterFraction;
  heartbeatTimer = null;
  heartbeatInFlight = false;
  closed = false;
  consecutiveAuthFailures = 0;
  currentState = null;
  sessionBaseUrl;
  sessionId;
  http = createAxiosInstance({ keepAlive: true });
  streamEventBuffer = [];
  streamEventTimer = null;
  streamTextAccumulator = createStreamAccumulator();
  workerState;
  eventUploader;
  internalEventUploader;
  deliveryUploader;
  onEpochMismatch;
  getAuthHeaders;
  constructor(transport, sessionUrl, opts) {
    this.onEpochMismatch = opts?.onEpochMismatch ?? (() => {
      process.exit(1);
    });
    this.heartbeatIntervalMs = opts?.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
    this.heartbeatJitterFraction = opts?.heartbeatJitterFraction ?? 0;
    this.getAuthHeaders = opts?.getAuthHeaders ?? getSessionIngressAuthHeaders;
    if (sessionUrl.protocol !== "http:" && sessionUrl.protocol !== "https:") {
      throw new Error(`CCRClient: Expected http(s) URL, got ${sessionUrl.protocol}`);
    }
    const pathname = sessionUrl.pathname.replace(/\/$/, "");
    this.sessionBaseUrl = `${sessionUrl.protocol}//${sessionUrl.host}${pathname}`;
    this.sessionId = pathname.split("/").pop() || "";
    this.workerState = new WorkerStateUploader({
      send: (body) => this.request("put", "/worker", { worker_epoch: this.workerEpoch, ...body }, "PUT worker").then((r) => r.ok),
      baseDelayMs: 500,
      maxDelayMs: 30000,
      jitterMs: 500
    });
    this.eventUploader = new SerialBatchEventUploader({
      maxBatchSize: 100,
      maxBatchBytes: 10 * 1024 * 1024,
      maxQueueSize: 1e5,
      send: async (batch) => {
        const result = await this.request("post", "/worker/events", { worker_epoch: this.workerEpoch, events: batch }, "client events");
        if (!result.ok) {
          throw new RetryableError("client event POST failed", result.retryAfterMs);
        }
      },
      baseDelayMs: 500,
      maxDelayMs: 30000,
      jitterMs: 500
    });
    this.internalEventUploader = new SerialBatchEventUploader({
      maxBatchSize: 100,
      maxBatchBytes: 10 * 1024 * 1024,
      maxQueueSize: 200,
      send: async (batch) => {
        const result = await this.request("post", "/worker/internal-events", { worker_epoch: this.workerEpoch, events: batch }, "internal events");
        if (!result.ok) {
          throw new RetryableError("internal event POST failed", result.retryAfterMs);
        }
      },
      baseDelayMs: 500,
      maxDelayMs: 30000,
      jitterMs: 500
    });
    this.deliveryUploader = new SerialBatchEventUploader({
      maxBatchSize: 64,
      maxQueueSize: 64,
      send: async (batch) => {
        const result = await this.request("post", "/worker/events/delivery", {
          worker_epoch: this.workerEpoch,
          updates: batch.map((d) => ({
            event_id: d.eventId,
            status: d.status
          }))
        }, "delivery batch");
        if (!result.ok) {
          throw new RetryableError("delivery POST failed", result.retryAfterMs);
        }
      },
      baseDelayMs: 500,
      maxDelayMs: 30000,
      jitterMs: 500
    });
    transport.setOnEvent((event) => {
      this.reportDelivery(event.event_id, "received");
    });
  }
  async initialize(epoch) {
    const startMs = Date.now();
    if (Object.keys(this.getAuthHeaders()).length === 0) {
      throw new CCRInitError("no_auth_headers");
    }
    if (epoch === undefined) {
      const rawEpoch = process.env.CLAUDE_CODE_WORKER_EPOCH;
      epoch = rawEpoch ? parseInt(rawEpoch, 10) : NaN;
    }
    if (isNaN(epoch)) {
      throw new CCRInitError("missing_epoch");
    }
    this.workerEpoch = epoch;
    const restoredPromise = this.getWorkerState();
    const result = await this.request("put", "/worker", {
      worker_status: "idle",
      worker_epoch: this.workerEpoch,
      external_metadata: {
        pending_action: null,
        task_summary: null,
        automation_state: null
      }
    }, "PUT worker (init)");
    if (!result.ok) {
      throw new CCRInitError("worker_register_failed");
    }
    this.currentState = "idle";
    this.startHeartbeat();
    registerSessionActivityCallback(() => {
      this.writeEvent({ type: "keep_alive" });
    });
    logForDebugging(`CCRClient: initialized, epoch=${this.workerEpoch}`);
    logForDiagnosticsNoPII("info", "cli_worker_lifecycle_initialized", {
      epoch: this.workerEpoch,
      duration_ms: Date.now() - startMs
    });
    const { metadata, durationMs } = await restoredPromise;
    if (!this.closed) {
      logForDiagnosticsNoPII("info", "cli_worker_state_restored", {
        duration_ms: durationMs,
        had_state: metadata !== null
      });
    }
    return metadata;
  }
  async getWorkerState() {
    const startMs = Date.now();
    const authHeaders = this.getAuthHeaders();
    if (Object.keys(authHeaders).length === 0) {
      return { metadata: null, durationMs: 0 };
    }
    const data = await this.getWithRetry(`${this.sessionBaseUrl}/worker`, authHeaders, "worker_state");
    return {
      metadata: data?.worker?.external_metadata ?? null,
      durationMs: Date.now() - startMs
    };
  }
  async request(method, path, body, label, { timeout = 1e4 } = {}) {
    const authHeaders = this.getAuthHeaders();
    if (Object.keys(authHeaders).length === 0)
      return { ok: false };
    try {
      const response = await this.http[method](`${this.sessionBaseUrl}${path}`, body, {
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "User-Agent": getClaudeCodeUserAgent()
        },
        validateStatus: alwaysValidStatus,
        timeout
      });
      if (response.status >= 200 && response.status < 300) {
        this.consecutiveAuthFailures = 0;
        return { ok: true };
      }
      if (response.status === 409) {
        this.handleEpochMismatch();
      }
      if (response.status === 401 || response.status === 403) {
        const tok = getSessionIngressAuthToken();
        const exp = tok ? decodeJwtExpiry(tok) : null;
        if (exp !== null && exp * 1000 < Date.now()) {
          logForDebugging(`CCRClient: session_token expired (exp=${new Date(exp * 1000).toISOString()}) \u2014 no refresh was delivered, exiting`, { level: "error" });
          logForDiagnosticsNoPII("error", "cli_worker_token_expired_no_refresh");
          this.onEpochMismatch();
        }
        this.consecutiveAuthFailures++;
        if (this.consecutiveAuthFailures >= MAX_CONSECUTIVE_AUTH_FAILURES) {
          logForDebugging(`CCRClient: ${this.consecutiveAuthFailures} consecutive auth failures with a valid-looking token \u2014 server-side auth unrecoverable, exiting`, { level: "error" });
          logForDiagnosticsNoPII("error", "cli_worker_auth_failures_exhausted");
          this.onEpochMismatch();
        }
      }
      logForDebugging(`CCRClient: ${label} returned ${response.status}`, {
        level: "warn"
      });
      logForDiagnosticsNoPII("warn", "cli_worker_request_failed", {
        method,
        path,
        status: response.status
      });
      if (response.status === 429) {
        const raw = response.headers?.["retry-after"];
        const seconds = typeof raw === "string" ? parseInt(raw, 10) : NaN;
        if (!isNaN(seconds) && seconds >= 0) {
          return { ok: false, retryAfterMs: seconds * 1000 };
        }
      }
      return { ok: false };
    } catch (error) {
      logForDebugging(`CCRClient: ${label} failed: ${errorMessage(error)}`, {
        level: "warn"
      });
      logForDiagnosticsNoPII("warn", "cli_worker_request_error", {
        method,
        path,
        error_code: getErrnoCode(error)
      });
      return { ok: false };
    }
  }
  reportState(state, details) {
    if (state === this.currentState && !details)
      return;
    this.currentState = state;
    this.workerState.enqueue({
      worker_status: state,
      requires_action_details: details ? {
        tool_name: details.tool_name,
        action_description: details.action_description,
        request_id: details.request_id
      } : null
    });
  }
  reportMetadata(metadata) {
    this.workerState.enqueue({ external_metadata: metadata });
  }
  handleEpochMismatch() {
    logForDebugging("CCRClient: Epoch mismatch (409), shutting down", {
      level: "error"
    });
    logForDiagnosticsNoPII("error", "cli_worker_epoch_mismatch");
    this.onEpochMismatch();
  }
  startHeartbeat() {
    this.stopHeartbeat();
    const schedule = () => {
      const jitter = this.heartbeatIntervalMs * this.heartbeatJitterFraction * (2 * Math.random() - 1);
      this.heartbeatTimer = setTimeout(tick, this.heartbeatIntervalMs + jitter);
    };
    const tick = () => {
      this.sendHeartbeat();
      if (this.heartbeatTimer === null)
        return;
      schedule();
    };
    schedule();
  }
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  async sendHeartbeat() {
    if (this.heartbeatInFlight)
      return;
    this.heartbeatInFlight = true;
    try {
      const result = await this.request("post", "/worker/heartbeat", { session_id: this.sessionId, worker_epoch: this.workerEpoch }, "Heartbeat", { timeout: 5000 });
      if (result.ok) {
        logForDebugging("CCRClient: Heartbeat sent");
      }
    } finally {
      this.heartbeatInFlight = false;
    }
  }
  async writeEvent(message) {
    if (message.type === "stream_event") {
      this.streamEventBuffer.push(message);
      if (!this.streamEventTimer) {
        this.streamEventTimer = setTimeout(() => void this.flushStreamEventBuffer(), STREAM_EVENT_FLUSH_INTERVAL_MS);
      }
      return;
    }
    await this.flushStreamEventBuffer();
    if (message.type === "assistant") {
      clearStreamAccumulatorForMessage(this.streamTextAccumulator, message);
    }
    await this.eventUploader.enqueue(this.toClientEvent(message));
  }
  toClientEvent(message) {
    const msg = message;
    return {
      payload: {
        ...msg,
        uuid: typeof msg.uuid === "string" ? msg.uuid : randomUUID()
      }
    };
  }
  async flushStreamEventBuffer() {
    if (this.streamEventTimer) {
      clearTimeout(this.streamEventTimer);
      this.streamEventTimer = null;
    }
    if (this.streamEventBuffer.length === 0)
      return;
    const buffered = this.streamEventBuffer;
    this.streamEventBuffer = [];
    const payloads = accumulateStreamEvents(buffered, this.streamTextAccumulator);
    await this.eventUploader.enqueue(payloads.map((payload) => ({ payload, ephemeral: true })));
  }
  async writeInternalEvent(eventType, payload, {
    isCompaction = false,
    agentId
  } = {}) {
    const event = {
      payload: {
        type: eventType,
        ...payload,
        uuid: typeof payload.uuid === "string" ? payload.uuid : randomUUID()
      },
      ...isCompaction && { is_compaction: true },
      ...agentId && { agent_id: agentId }
    };
    await this.internalEventUploader.enqueue(event);
  }
  flushInternalEvents() {
    return this.internalEventUploader.flush();
  }
  async flush() {
    await this.flushStreamEventBuffer();
    return this.eventUploader.flush();
  }
  async readInternalEvents() {
    return this.paginatedGet("/worker/internal-events", {}, "internal_events");
  }
  async readSubagentInternalEvents() {
    return this.paginatedGet("/worker/internal-events", { subagents: "true" }, "subagent_events");
  }
  async paginatedGet(path, params, context) {
    const authHeaders = this.getAuthHeaders();
    if (Object.keys(authHeaders).length === 0)
      return null;
    const allEvents = [];
    let cursor;
    do {
      const url = new URL(`${this.sessionBaseUrl}${path}`);
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
      if (cursor) {
        url.searchParams.set("cursor", cursor);
      }
      const page = await this.getWithRetry(url.toString(), authHeaders, context);
      if (!page)
        return null;
      allEvents.push(...page.data ?? []);
      cursor = page.next_cursor;
    } while (cursor);
    logForDebugging(`CCRClient: Read ${allEvents.length} internal events from ${path}${params.subagents ? " (subagents)" : ""}`);
    return allEvents;
  }
  async getWithRetry(url, authHeaders, context) {
    for (let attempt = 1;attempt <= 10; attempt++) {
      let response;
      try {
        response = await this.http.get(url, {
          headers: {
            ...authHeaders,
            "anthropic-version": "2023-06-01",
            "User-Agent": getClaudeCodeUserAgent()
          },
          validateStatus: alwaysValidStatus,
          timeout: 30000
        });
      } catch (error) {
        logForDebugging(`CCRClient: GET ${url} failed (attempt ${attempt}/10): ${errorMessage(error)}`, { level: "warn" });
        if (attempt < 10) {
          const delay = Math.min(500 * 2 ** (attempt - 1), 30000) + Math.random() * 500;
          await sleep(delay);
        }
        continue;
      }
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      }
      if (response.status === 409) {
        this.handleEpochMismatch();
      }
      logForDebugging(`CCRClient: GET ${url} returned ${response.status} (attempt ${attempt}/10)`, { level: "warn" });
      if (attempt < 10) {
        const delay = Math.min(500 * 2 ** (attempt - 1), 30000) + Math.random() * 500;
        await sleep(delay);
      }
    }
    logForDebugging("CCRClient: GET retries exhausted", { level: "error" });
    logForDiagnosticsNoPII("error", "cli_worker_get_retries_exhausted", {
      context
    });
    return null;
  }
  reportDelivery(eventId, status) {
    this.deliveryUploader.enqueue({ eventId, status });
  }
  getWorkerEpoch() {
    return this.workerEpoch;
  }
  get internalEventsPending() {
    return this.internalEventUploader.pendingCount;
  }
  close() {
    this.closed = true;
    this.stopHeartbeat();
    unregisterSessionActivityCallback();
    if (this.streamEventTimer) {
      clearTimeout(this.streamEventTimer);
      this.streamEventTimer = null;
    }
    this.streamEventBuffer = [];
    this.streamTextAccumulator.byMessage.clear();
    this.streamTextAccumulator.scopeToMessage.clear();
    this.workerState.close();
    this.eventUploader.close();
    this.internalEventUploader.close();
    this.deliveryUploader.close();
  }
}

// src/cli/remoteIO.ts
init_SSETransport();

// src/cli/transports/transportUtils.ts
init_envUtils();
import { URL as URL2 } from "url";

// src/cli/transports/HybridTransport.ts
init_axios();
init_debug();
init_rcDebugLog();
init_diagLogs();
init_sessionIngressAuth();

// src/cli/transports/WebSocketTransport.ts
init_analytics();
init_CircularBuffer();
init_debug();
init_rcDebugLog();
init_diagLogs();
init_envUtils();
init_mtls();
init_proxy();
init_sessionActivity();
init_slowOperations();
var KEEP_ALIVE_FRAME = `{"type":"keep_alive"}
`;
var DEFAULT_MAX_BUFFER_SIZE = 1000;
var DEFAULT_BASE_RECONNECT_DELAY = 1000;
var DEFAULT_MAX_RECONNECT_DELAY = 30000;
var DEFAULT_RECONNECT_GIVE_UP_MS = 600000;
var DEFAULT_PING_INTERVAL = 1e4;
var DEFAULT_KEEPALIVE_INTERVAL = 120000;
var SLEEP_DETECTION_THRESHOLD_MS = DEFAULT_MAX_RECONNECT_DELAY * 2;
var PERMANENT_CLOSE_CODES = new Set([
  1002,
  4001,
  4003
]);

class WebSocketTransport {
  ws = null;
  lastSentId = null;
  url;
  state = "idle";
  onData;
  onCloseCallback;
  onConnectCallback;
  headers;
  sessionId;
  autoReconnect;
  isBridge;
  reconnectAttempts = 0;
  reconnectStartTime = null;
  reconnectTimer = null;
  lastReconnectAttemptTime = null;
  lastActivityTime = 0;
  pingInterval = null;
  pongReceived = true;
  keepAliveInterval = null;
  messageBuffer;
  isBunWs = false;
  connectStartTime = 0;
  refreshHeaders;
  constructor(url, headers = {}, sessionId, refreshHeaders, options) {
    this.url = url;
    this.headers = headers;
    this.sessionId = sessionId;
    this.refreshHeaders = refreshHeaders;
    this.autoReconnect = options?.autoReconnect ?? true;
    this.isBridge = options?.isBridge ?? false;
    this.messageBuffer = new CircularBuffer(DEFAULT_MAX_BUFFER_SIZE);
  }
  async connect() {
    if (this.state !== "idle" && this.state !== "reconnecting") {
      logForDebugging(`WebSocketTransport: Cannot connect, current state is ${this.state}`, { level: "error" });
      logForDiagnosticsNoPII("error", "cli_websocket_connect_failed");
      return;
    }
    this.state = "reconnecting";
    this.connectStartTime = Date.now();
    logForDebugging(`WebSocketTransport: Opening ${this.url.href}`);
    logForDiagnosticsNoPII("info", "cli_websocket_connect_opening");
    const headers = { ...this.headers };
    if (this.lastSentId) {
      headers["X-Last-Request-Id"] = this.lastSentId;
      logForDebugging(`WebSocketTransport: Adding X-Last-Request-Id header: ${this.lastSentId}`);
    }
    if (typeof Bun !== "undefined") {
      const ws = new globalThis.WebSocket(this.url.href, {
        headers,
        proxy: getWebSocketProxyUrl(this.url.href),
        tls: getWebSocketTLSOptions() || undefined
      });
      this.ws = ws;
      this.isBunWs = true;
      ws.addEventListener("open", this.onBunOpen);
      ws.addEventListener("message", this.onBunMessage);
      ws.addEventListener("error", this.onBunError);
      ws.addEventListener("close", this.onBunClose);
      ws.addEventListener("pong", this.onPong);
    } else {
      const { default: WS } = await import("ws");
      const ws = new WS(this.url.href, {
        headers,
        agent: getWebSocketProxyAgent(this.url.href),
        ...getWebSocketTLSOptions()
      });
      this.ws = ws;
      this.isBunWs = false;
      ws.on("open", this.onNodeOpen);
      ws.on("message", this.onNodeMessage);
      ws.on("error", this.onNodeError);
      ws.on("close", this.onNodeClose);
      ws.on("pong", this.onPong);
    }
  }
  onBunOpen = () => {
    this.handleOpenEvent();
    if (this.lastSentId) {
      this.replayBufferedMessages("");
    }
  };
  onBunMessage = (event) => {
    const message = typeof event.data === "string" ? event.data : String(event.data);
    this.lastActivityTime = Date.now();
    logForDiagnosticsNoPII("info", "cli_websocket_message_received", {
      length: message.length
    });
    if (this.onData) {
      this.onData(message);
    }
  };
  onBunError = () => {
    logForDebugging("WebSocketTransport: Error", {
      level: "error"
    });
    logForDiagnosticsNoPII("error", "cli_websocket_connect_error");
  };
  onBunClose = (event) => {
    const isClean = event.code === 1000 || event.code === 1001;
    logForDebugging(`WebSocketTransport: Closed: ${event.code}`, isClean ? undefined : { level: "error" });
    logForDiagnosticsNoPII("error", "cli_websocket_connect_closed");
    this.handleConnectionError(event.code);
  };
  onNodeOpen = () => {
    const ws = this.ws;
    this.handleOpenEvent();
    if (!ws)
      return;
    const nws = ws;
    const upgradeResponse = nws.upgradeReq;
    if (upgradeResponse?.headers?.["x-last-request-id"]) {
      const serverLastId = upgradeResponse.headers["x-last-request-id"];
      this.replayBufferedMessages(serverLastId);
    }
  };
  onNodeMessage = (data) => {
    const message = data.toString();
    this.lastActivityTime = Date.now();
    logForDiagnosticsNoPII("info", "cli_websocket_message_received", {
      length: message.length
    });
    if (this.onData) {
      this.onData(message);
    }
  };
  onNodeError = (err) => {
    logForDebugging(`WebSocketTransport: Error: ${err.message}`, {
      level: "error"
    });
    logForDiagnosticsNoPII("error", "cli_websocket_connect_error");
  };
  onNodeClose = (code, _reason) => {
    const isClean = code === 1000 || code === 1001;
    logForDebugging(`WebSocketTransport: Closed: ${code}`, isClean ? undefined : { level: "error" });
    logForDiagnosticsNoPII("error", "cli_websocket_connect_closed");
    this.handleConnectionError(code);
  };
  onPong = () => {
    this.pongReceived = true;
  };
  handleOpenEvent() {
    const connectDuration = Date.now() - this.connectStartTime;
    logForDebugging("WebSocketTransport: Connected");
    logForDiagnosticsNoPII("info", "cli_websocket_connect_connected", {
      duration_ms: connectDuration
    });
    if (this.isBridge && this.reconnectStartTime !== null) {
      logEvent("tengu_ws_transport_reconnected", {
        attempts: this.reconnectAttempts,
        downtimeMs: Date.now() - this.reconnectStartTime
      });
    }
    this.reconnectAttempts = 0;
    this.reconnectStartTime = null;
    this.lastReconnectAttemptTime = null;
    this.lastActivityTime = Date.now();
    this.state = "connected";
    this.onConnectCallback?.();
    this.startPingInterval();
    this.startKeepaliveInterval();
    registerSessionActivityCallback(() => {
      this.write({ type: "keep_alive" });
    });
  }
  sendLine(line) {
    if (!this.ws || this.state !== "connected") {
      logForDebugging("WebSocketTransport: Not connected");
      logForDiagnosticsNoPII("info", "cli_websocket_send_not_connected");
      return false;
    }
    try {
      this.ws.send(line);
      this.lastActivityTime = Date.now();
      return true;
    } catch (error) {
      logForDebugging(`WebSocketTransport: Failed to send: ${error}`, {
        level: "error"
      });
      logForDiagnosticsNoPII("error", "cli_websocket_send_error");
      this.handleConnectionError();
      return false;
    }
  }
  removeWsListeners(ws) {
    if (this.isBunWs) {
      const nws = ws;
      nws.removeEventListener("open", this.onBunOpen);
      nws.removeEventListener("message", this.onBunMessage);
      nws.removeEventListener("error", this.onBunError);
      nws.removeEventListener("close", this.onBunClose);
      nws.removeEventListener("pong", this.onPong);
    } else {
      const nws = ws;
      nws.off("open", this.onNodeOpen);
      nws.off("message", this.onNodeMessage);
      nws.off("error", this.onNodeError);
      nws.off("close", this.onNodeClose);
      nws.off("pong", this.onPong);
    }
  }
  doDisconnect() {
    this.stopPingInterval();
    this.stopKeepaliveInterval();
    unregisterSessionActivityCallback();
    if (this.ws) {
      this.removeWsListeners(this.ws);
      this.ws.close();
      this.ws = null;
    }
  }
  handleConnectionError(closeCode) {
    rcLog(`WS handleConnectionError: code=${closeCode} state=${this.state} url=${this.url.href.replace(/token=[^&]+/, "token=***")} msSinceLastActivity=${this.lastActivityTime > 0 ? Date.now() - this.lastActivityTime : -1} reconnectAttempts=${this.reconnectAttempts}`);
    logForDebugging(`WebSocketTransport: Disconnected from ${this.url.href}` + (closeCode != null ? ` (code ${closeCode})` : ""));
    logForDiagnosticsNoPII("info", "cli_websocket_disconnected");
    if (this.isBridge) {
      logEvent("tengu_ws_transport_closed", {
        closeCode,
        msSinceLastActivity: this.lastActivityTime > 0 ? Date.now() - this.lastActivityTime : -1,
        wasConnected: this.state === "connected",
        reconnectAttempts: this.reconnectAttempts
      });
    }
    this.doDisconnect();
    if (this.state === "closing" || this.state === "closed")
      return;
    let headersRefreshed = false;
    if (closeCode === 4003 && this.refreshHeaders) {
      const freshHeaders = this.refreshHeaders();
      if (freshHeaders.Authorization !== this.headers.Authorization) {
        Object.assign(this.headers, freshHeaders);
        headersRefreshed = true;
        logForDebugging("WebSocketTransport: 4003 received but headers refreshed, scheduling reconnect");
        logForDiagnosticsNoPII("info", "cli_websocket_4003_token_refreshed");
      }
    }
    if (closeCode != null && PERMANENT_CLOSE_CODES.has(closeCode) && !headersRefreshed) {
      logForDebugging(`WebSocketTransport: Permanent close code ${closeCode}, not reconnecting`, { level: "error" });
      logForDiagnosticsNoPII("error", "cli_websocket_permanent_close", {
        closeCode
      });
      this.state = "closed";
      this.onCloseCallback?.(closeCode);
      return;
    }
    if (!this.autoReconnect) {
      this.state = "closed";
      this.onCloseCallback?.(closeCode);
      return;
    }
    const now = Date.now();
    if (!this.reconnectStartTime) {
      this.reconnectStartTime = now;
    }
    if (this.lastReconnectAttemptTime !== null && now - this.lastReconnectAttemptTime > SLEEP_DETECTION_THRESHOLD_MS) {
      logForDebugging(`WebSocketTransport: Detected system sleep (${Math.round((now - this.lastReconnectAttemptTime) / 1000)}s gap), resetting reconnection budget`);
      logForDiagnosticsNoPII("info", "cli_websocket_sleep_detected", {
        gapMs: now - this.lastReconnectAttemptTime
      });
      this.reconnectStartTime = now;
      this.reconnectAttempts = 0;
    }
    this.lastReconnectAttemptTime = now;
    const elapsed = now - this.reconnectStartTime;
    if (elapsed < DEFAULT_RECONNECT_GIVE_UP_MS) {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (!headersRefreshed && this.refreshHeaders) {
        const freshHeaders = this.refreshHeaders();
        Object.assign(this.headers, freshHeaders);
        logForDebugging("WebSocketTransport: Refreshed headers for reconnect");
      }
      this.state = "reconnecting";
      this.reconnectAttempts++;
      const baseDelay = Math.min(DEFAULT_BASE_RECONNECT_DELAY * 2 ** (this.reconnectAttempts - 1), DEFAULT_MAX_RECONNECT_DELAY);
      const delay = Math.max(0, baseDelay + baseDelay * 0.25 * (2 * Math.random() - 1));
      logForDebugging(`WebSocketTransport: Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}, ${Math.round(elapsed / 1000)}s elapsed)`);
      logForDiagnosticsNoPII("error", "cli_websocket_reconnect_attempt", {
        reconnectAttempts: this.reconnectAttempts
      });
      if (this.isBridge) {
        logEvent("tengu_ws_transport_reconnecting", {
          attempt: this.reconnectAttempts,
          elapsedMs: elapsed,
          delayMs: Math.round(delay)
        });
      }
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, delay);
    } else {
      logForDebugging(`WebSocketTransport: Reconnection time budget exhausted after ${Math.round(elapsed / 1000)}s for ${this.url.href}`, { level: "error" });
      logForDiagnosticsNoPII("error", "cli_websocket_reconnect_exhausted", {
        reconnectAttempts: this.reconnectAttempts,
        elapsedMs: elapsed
      });
      this.state = "closed";
      if (this.onCloseCallback) {
        this.onCloseCallback(closeCode);
      }
    }
  }
  close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPingInterval();
    this.stopKeepaliveInterval();
    unregisterSessionActivityCallback();
    this.state = "closing";
    this.doDisconnect();
  }
  replayBufferedMessages(lastId) {
    const messages = this.messageBuffer.toArray();
    if (messages.length === 0)
      return;
    let startIndex = 0;
    if (lastId) {
      const lastConfirmedIndex = messages.findIndex((message) => ("uuid" in message) && message.uuid === lastId);
      if (lastConfirmedIndex >= 0) {
        startIndex = lastConfirmedIndex + 1;
        const remaining = messages.slice(startIndex);
        this.messageBuffer.clear();
        this.messageBuffer.addAll(remaining);
        if (remaining.length === 0) {
          this.lastSentId = null;
        }
        logForDebugging(`WebSocketTransport: Evicted ${startIndex} confirmed messages, ${remaining.length} remaining`);
        logForDiagnosticsNoPII("info", "cli_websocket_evicted_confirmed_messages", {
          evicted: startIndex,
          remaining: remaining.length
        });
      }
    }
    const messagesToReplay = messages.slice(startIndex);
    if (messagesToReplay.length === 0) {
      logForDebugging("WebSocketTransport: No new messages to replay");
      logForDiagnosticsNoPII("info", "cli_websocket_no_messages_to_replay");
      return;
    }
    logForDebugging(`WebSocketTransport: Replaying ${messagesToReplay.length} buffered messages`);
    logForDiagnosticsNoPII("info", "cli_websocket_messages_to_replay", {
      count: messagesToReplay.length
    });
    for (const message of messagesToReplay) {
      const line = jsonStringify(message) + `
`;
      const success = this.sendLine(line);
      if (!success) {
        this.handleConnectionError();
        break;
      }
    }
  }
  isConnectedStatus() {
    return this.state === "connected";
  }
  isClosedStatus() {
    return this.state === "closed";
  }
  setOnData(callback) {
    this.onData = callback;
  }
  setOnConnect(callback) {
    this.onConnectCallback = callback;
  }
  setOnClose(callback) {
    this.onCloseCallback = callback;
  }
  getStateLabel() {
    return this.state;
  }
  async write(message) {
    if ("uuid" in message && typeof message.uuid === "string") {
      this.messageBuffer.add(message);
      this.lastSentId = message.uuid;
    }
    const line = jsonStringify(message) + `
`;
    if (this.state !== "connected") {
      return;
    }
    const sessionLabel = this.sessionId ? ` session=${this.sessionId}` : "";
    const detailLabel = this.getControlMessageDetailLabel(message);
    logForDebugging(`WebSocketTransport: Sending message type=${message.type}${sessionLabel}${detailLabel}`);
    this.sendLine(line);
  }
  getControlMessageDetailLabel(message) {
    if (message.type === "control_request") {
      const { request_id, request } = message;
      const toolName = request.subtype === "can_use_tool" ? request.tool_name : "";
      return ` subtype=${request.subtype} request_id=${request_id}${toolName ? ` tool=${toolName}` : ""}`;
    }
    if (message.type === "control_response") {
      const { subtype, request_id } = message.response;
      return ` subtype=${subtype} request_id=${request_id}`;
    }
    return "";
  }
  startPingInterval() {
    this.stopPingInterval();
    this.pongReceived = true;
    let lastTickTime = Date.now();
    this.pingInterval = setInterval(() => {
      if (this.state === "connected" && this.ws) {
        const now = Date.now();
        const gap = now - lastTickTime;
        lastTickTime = now;
        if (gap > SLEEP_DETECTION_THRESHOLD_MS) {
          logForDebugging(`WebSocketTransport: ${Math.round(gap / 1000)}s tick gap detected \u2014 process was suspended, forcing reconnect`);
          logForDiagnosticsNoPII("info", "cli_websocket_sleep_detected_on_ping", { gapMs: gap });
          this.handleConnectionError();
          return;
        }
        if (!this.pongReceived) {
          logForDebugging("WebSocketTransport: No pong received, connection appears dead", { level: "error" });
          logForDiagnosticsNoPII("error", "cli_websocket_pong_timeout");
          this.handleConnectionError();
          return;
        }
        this.pongReceived = false;
        try {
          this.ws.ping?.();
        } catch (error) {
          logForDebugging(`WebSocketTransport: Ping failed: ${error}`, {
            level: "error"
          });
          logForDiagnosticsNoPII("error", "cli_websocket_ping_failed");
        }
      }
    }, DEFAULT_PING_INTERVAL);
  }
  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  startKeepaliveInterval() {
    this.stopKeepaliveInterval();
    if (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)) {
      return;
    }
    this.keepAliveInterval = setInterval(() => {
      if (this.state === "connected" && this.ws) {
        try {
          this.ws.send(KEEP_ALIVE_FRAME);
          this.lastActivityTime = Date.now();
          logForDebugging("WebSocketTransport: Sent periodic keep_alive data frame");
        } catch (error) {
          logForDebugging(`WebSocketTransport: Periodic keep_alive failed: ${error}`, { level: "error" });
          logForDiagnosticsNoPII("error", "cli_websocket_keepalive_failed");
        }
      }
    }, DEFAULT_KEEPALIVE_INTERVAL);
  }
  stopKeepaliveInterval() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }
}

// src/cli/transports/HybridTransport.ts
var BATCH_FLUSH_INTERVAL_MS = 100;
var POST_TIMEOUT_MS = 15000;
var CLOSE_GRACE_MS = 3000;

class HybridTransport extends WebSocketTransport {
  postUrl;
  uploader;
  streamEventBuffer = [];
  streamEventTimer = null;
  constructor(url, headers = {}, sessionId, refreshHeaders, options) {
    super(url, headers, sessionId, refreshHeaders, options);
    const { maxConsecutiveFailures, onBatchDropped } = options ?? {};
    this.postUrl = convertWsUrlToPostUrl(url);
    this.uploader = new SerialBatchEventUploader({
      maxBatchSize: 500,
      maxQueueSize: 1e4,
      baseDelayMs: 500,
      maxDelayMs: 8000,
      jitterMs: 1000,
      maxConsecutiveFailures,
      onBatchDropped: (batchSize, failures) => {
        logForDiagnosticsNoPII("error", "cli_hybrid_batch_dropped_max_failures", {
          batchSize,
          failures
        });
        onBatchDropped?.(batchSize, failures);
      },
      send: (batch) => this.postOnce(batch)
    });
    logForDebugging(`HybridTransport: POST URL = ${this.postUrl}`);
    logForDiagnosticsNoPII("info", "cli_hybrid_transport_initialized");
  }
  async write(message) {
    if (message.type === "stream_event") {
      this.streamEventBuffer.push(message);
      if (!this.streamEventTimer) {
        this.streamEventTimer = setTimeout(() => this.flushStreamEvents(), BATCH_FLUSH_INTERVAL_MS);
      }
      return;
    }
    await this.uploader.enqueue([...this.takeStreamEvents(), message]);
    return this.uploader.flush();
  }
  async writeBatch(messages) {
    await this.uploader.enqueue([...this.takeStreamEvents(), ...messages]);
    return this.uploader.flush();
  }
  get droppedBatchCount() {
    return this.uploader.droppedBatchCount;
  }
  flush() {
    this.uploader.enqueue(this.takeStreamEvents());
    return this.uploader.flush();
  }
  takeStreamEvents() {
    if (this.streamEventTimer) {
      clearTimeout(this.streamEventTimer);
      this.streamEventTimer = null;
    }
    const buffered = this.streamEventBuffer;
    this.streamEventBuffer = [];
    return buffered;
  }
  flushStreamEvents() {
    this.streamEventTimer = null;
    this.uploader.enqueue(this.takeStreamEvents());
  }
  close() {
    if (this.streamEventTimer) {
      clearTimeout(this.streamEventTimer);
      this.streamEventTimer = null;
    }
    this.streamEventBuffer = [];
    const uploader = this.uploader;
    let graceTimer;
    Promise.race([
      uploader.flush(),
      new Promise((r) => {
        graceTimer = setTimeout(r, CLOSE_GRACE_MS);
      })
    ]).finally(() => {
      clearTimeout(graceTimer);
      uploader.close();
    });
    super.close();
  }
  async postOnce(events) {
    const sessionToken = getSessionIngressAuthToken();
    if (!sessionToken) {
      logForDebugging("HybridTransport: No session token available for POST");
      logForDiagnosticsNoPII("warn", "cli_hybrid_post_no_token");
      return;
    }
    const headers = {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json"
    };
    let response;
    try {
      response = await axios_default.post(this.postUrl, { events }, {
        headers,
        validateStatus: () => true,
        timeout: POST_TIMEOUT_MS
      });
    } catch (error) {
      const axiosError = error;
      logForDebugging(`HybridTransport: POST error: ${axiosError.message}`);
      logForDiagnosticsNoPII("warn", "cli_hybrid_post_network_error");
      throw error;
    }
    if (response.status >= 200 && response.status < 300) {
      logForDebugging(`HybridTransport: POST success count=${events.length}`);
      return;
    }
    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
      rcLog(`Hybrid POST ${response.status}: url=${this.postUrl.replace(/token=[^&]+/, "token=***")}` + ` events=${events.length} body=${JSON.stringify(response.data).slice(0, 200)}`);
      logForDebugging(`HybridTransport: POST returned ${response.status} (permanent), dropping`);
      logForDiagnosticsNoPII("warn", "cli_hybrid_post_client_error", {
        status: response.status
      });
      return;
    }
    logForDebugging(`HybridTransport: POST returned ${response.status} (retryable)`);
    logForDiagnosticsNoPII("warn", "cli_hybrid_post_retryable_error", {
      status: response.status
    });
    throw new Error(`POST failed with ${response.status}`);
  }
}
function convertWsUrlToPostUrl(wsUrl) {
  const protocol = wsUrl.protocol === "wss:" ? "https:" : "http:";
  let pathname = wsUrl.pathname;
  pathname = pathname.replace("/ws/", "/session/");
  if (!pathname.endsWith("/events")) {
    pathname = pathname.endsWith("/") ? pathname + "events" : pathname + "/events";
  }
  return `${protocol}//${wsUrl.host}${pathname}${wsUrl.search}`;
}

// src/cli/transports/transportUtils.ts
init_SSETransport();
function getTransportForUrl(url, headers = {}, sessionId, refreshHeaders) {
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_CCR_V2)) {
    const sseUrl = new URL2(url.href);
    if (sseUrl.protocol === "wss:") {
      sseUrl.protocol = "https:";
    } else if (sseUrl.protocol === "ws:") {
      sseUrl.protocol = "http:";
    }
    sseUrl.pathname = sseUrl.pathname.replace(/\/$/, "") + "/worker/events/stream";
    return new SSETransport(sseUrl, headers, sessionId, refreshHeaders);
  }
  if (url.protocol === "ws:" || url.protocol === "wss:") {
    if (isEnvTruthy(process.env.CLAUDE_CODE_POST_FOR_SESSION_INGRESS_V2)) {
      return new HybridTransport(url, headers, sessionId, refreshHeaders);
    }
    return new WebSocketTransport(url, headers, sessionId, refreshHeaders);
  } else {
    throw new Error(`Unsupported protocol: ${url.protocol}`);
  }
}

// src/cli/remoteIO.ts
class RemoteIO extends StructuredIO {
  url;
  transport;
  inputStream;
  isBridge = false;
  isDebug = false;
  ccrClient = null;
  keepAliveTimer = null;
  constructor(streamUrl, initialPrompt, replayUserMessages) {
    const inputStream = new PassThrough({ encoding: "utf8" });
    super(inputStream, replayUserMessages);
    this.inputStream = inputStream;
    this.url = new URL3(streamUrl);
    const headers = {};
    const sessionToken = getSessionIngressAuthToken();
    if (sessionToken) {
      headers["Authorization"] = `Bearer ${sessionToken}`;
    } else {
      logForDebugging("[remote-io] No session ingress token available", {
        level: "error"
      });
    }
    const erVersion = process.env.CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION;
    if (erVersion) {
      headers["x-environment-runner-version"] = erVersion;
    }
    const refreshHeaders = () => {
      const h = {};
      const freshToken = getSessionIngressAuthToken();
      if (freshToken) {
        h["Authorization"] = `Bearer ${freshToken}`;
      }
      const freshErVersion = process.env.CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION;
      if (freshErVersion) {
        h["x-environment-runner-version"] = freshErVersion;
      }
      return h;
    };
    this.transport = getTransportForUrl(this.url, headers, getSessionId(), refreshHeaders);
    this.isBridge = process.env.CLAUDE_CODE_ENVIRONMENT_KIND === "bridge";
    this.isDebug = isDebugMode();
    this.transport.setOnData((data) => {
      this.inputStream.write(data);
      if (this.isBridge && this.isDebug) {
        writeToStdout(data.endsWith(`
`) ? data : data + `
`);
      }
    });
    this.transport.setOnClose(() => {
      this.inputStream.end();
    });
    if (isEnvTruthy(process.env.CLAUDE_CODE_USE_CCR_V2)) {
      if (!(this.transport instanceof SSETransport)) {
        throw new Error("CCR v2 requires SSETransport; check getTransportForUrl");
      }
      this.ccrClient = new CCRClient(this.transport, this.url);
      const init = this.ccrClient.initialize();
      this.restoredWorkerState = init.catch(() => null);
      init.catch((error) => {
        logForDiagnosticsNoPII("error", "cli_worker_lifecycle_init_failed", {
          reason: error instanceof CCRInitError ? error.reason : "unknown"
        });
        logError(new Error(`CCRClient initialization failed: ${errorMessage(error)}`));
        gracefulShutdown(1, "other");
      });
      registerCleanup(async () => this.ccrClient?.close());
      setInternalEventWriter((eventType, payload, options) => this.ccrClient.writeInternalEvent(eventType, payload, options));
      setInternalEventReader(() => this.ccrClient.readInternalEvents(), () => this.ccrClient.readSubagentInternalEvents());
      const LIFECYCLE_TO_DELIVERY = {
        started: "processing",
        completed: "processed"
      };
      setCommandLifecycleListener((uuid, state) => {
        this.ccrClient?.reportDelivery(uuid, LIFECYCLE_TO_DELIVERY[state]);
      });
      setSessionStateChangedListener((state, details) => {
        this.ccrClient?.reportState(state, details);
      });
      setSessionMetadataChangedListener((metadata) => {
        this.ccrClient?.reportMetadata(metadata);
      }, { replayCurrent: true });
    }
    this.transport.connect();
    const keepAliveIntervalMs = getPollIntervalConfig().session_keepalive_interval_v2_ms;
    if (this.isBridge && keepAliveIntervalMs > 0) {
      this.keepAliveTimer = setInterval(() => {
        logForDebugging("[remote-io] keep_alive sent");
        this.write({ type: "keep_alive" }).catch((err) => {
          logForDebugging(`[remote-io] keep_alive write failed: ${errorMessage(err)}`);
        });
      }, keepAliveIntervalMs);
      this.keepAliveTimer.unref?.();
    }
    registerCleanup(async () => this.close());
    if (initialPrompt) {
      const stream = this.inputStream;
      (async () => {
        for await (const chunk of initialPrompt) {
          stream.write(String(chunk).replace(/\n$/, "") + `
`);
        }
      })();
    }
  }
  flushInternalEvents() {
    return this.ccrClient?.flushInternalEvents() ?? Promise.resolve();
  }
  get internalEventsPending() {
    return this.ccrClient?.internalEventsPending ?? 0;
  }
  async write(message) {
    if (this.ccrClient) {
      await this.ccrClient.writeEvent(message);
    } else {
      await this.transport.write(message);
    }
    if (this.isBridge) {
      if (message.type === "control_request" || this.isDebug) {
        writeToStdout(ndjsonSafeStringify(message) + `
`);
      }
    }
  }
  close() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    this.transport.close();
    this.inputStream.end();
  }
}

// src/cli/print.ts
init_commands();

// src/utils/streamlinedTransform.ts
init_constants();
init_prompt2();
init_prompt3();
init_prompt4();
init_prompt5();
init_prompt9();
init_prompt7();
init_constants2();
init_prompt();
init_prompt6();
init_messages();
init_shellToolUtils();
init_stringUtils();
var COMMAND_TOOLS = [...SHELL_TOOL_NAMES, "Tmux", TASK_STOP_TOOL_NAME];

// src/utils/streamJsonStdoutGuard.ts
init_cleanupRegistry();
init_debug();
var STDOUT_GUARD_MARKER = "[stdout-guard]";
var installed = false;
var buffer = "";
var originalWrite = null;
function isJsonLine(line) {
  if (line.length === 0) {
    return true;
  }
  try {
    JSON.parse(line);
    return true;
  } catch {
    return false;
  }
}
function installStreamJsonStdoutGuard() {
  if (installed) {
    return;
  }
  installed = true;
  originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function(chunk, encodingOrCb, cb) {
    const text = typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf-8");
    buffer += text;
    let newlineIdx;
    let wrote = true;
    while ((newlineIdx = buffer.indexOf(`
`)) !== -1) {
      const line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (isJsonLine(line)) {
        wrote = originalWrite(line + `
`);
      } else {
        process.stderr.write(`${STDOUT_GUARD_MARKER} ${line}
`);
        logForDebugging(`streamJsonStdoutGuard diverted non-JSON stdout line: ${line.slice(0, 200)}`);
      }
    }
    const callback = typeof encodingOrCb === "function" ? encodingOrCb : cb;
    if (callback) {
      queueMicrotask(() => callback());
    }
    return wrote;
  };
  registerCleanup(async () => {
    if (buffer.length > 0) {
      if (originalWrite && isJsonLine(buffer)) {
        originalWrite(buffer + `
`);
      } else {
        process.stderr.write(`${STDOUT_GUARD_MARKER} ${buffer}
`);
      }
      buffer = "";
    }
    if (originalWrite) {
      process.stdout.write = originalWrite;
      originalWrite = null;
    }
    installed = false;
  });
}

// src/cli/print.ts
init_tools();
init_uniqBy();
init_array();
init_toolPool();
init_analytics();
init_growthbook();
init_debug();
init_diagLogs();
init_Tool();
init_loadAgentsDir();
init_messageQueueManager();
init_commandLifecycle();
init_sessionState();
init_log();
init_process();
init_src();
init_conversationRecovery();
init_channelNotification();
init_channelAllowlist();
init_pluginIdentifier();
init_uuid();
init_generators();
init_fileStateCache();
init_path();
init_queryHelpers();
init_hookEvents();

// src/utils/filePersistence/filePersistence.ts
init_analytics();
init_filesApi();
init_cwd();
init_errors();
init_log();
init_sessionIngressAuth();
init_outputsScanner();

// src/cli/print.ts
init_AsyncHookRegistry();
init_gracefulShutdown();
init_cleanupRegistry();

// src/utils/idleTimeout.ts
init_debug();
init_gracefulShutdown();
function createIdleTimeoutManager(isIdle) {
  const exitAfterStopDelay = process.env.CLAUDE_CODE_EXIT_AFTER_STOP_DELAY;
  const delayMs = exitAfterStopDelay ? parseInt(exitAfterStopDelay, 10) : null;
  const isValidDelay = delayMs && !isNaN(delayMs) && delayMs > 0;
  let timer = null;
  let lastIdleTime = 0;
  return {
    start() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (isValidDelay) {
        lastIdleTime = Date.now();
        timer = setTimeout(() => {
          const idleDuration = Date.now() - lastIdleTime;
          if (isIdle() && idleDuration >= delayMs) {
            logForDebugging(`Exiting after ${delayMs}ms of idle time`);
            gracefulShutdownSync();
          }
        }, delayMs);
      }
    },
    stop() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
  };
}

// src/cli/print.ts
init_cwd();
init_omit();
init_reject();
init_policyLimits();
init_product();
init_bridgeStatusUtil();
import { cwd } from "process";
init_permissions();
init_json();
init_abortController();
init_combinedAbortSignal();
init_sessionTitle();
init_sideQuestion();
init_sessionStart();
init_outputStyles();
init_xml();
init_settings();
init_changeDetector();
init_applySettingsChange();
init_fastMode();
init_permissionSetup();
init_promptSuggestion();
init_forkedAgent();
init_auth();
init_oauth();
init_auth2();
init_providers();
init_state();
init_SyntheticOutputTool();

// src/utils/sessionUrl.ts
init_uuid();
import { randomUUID as randomUUID2 } from "crypto";
function parseSessionIdentifier(resumeIdentifier) {
  if (resumeIdentifier.toLowerCase().endsWith(".jsonl")) {
    return {
      sessionId: randomUUID2(),
      ingressUrl: null,
      isUrl: false,
      jsonlFile: resumeIdentifier,
      isJsonlFile: true
    };
  }
  if (validateUuid(resumeIdentifier)) {
    return {
      sessionId: resumeIdentifier,
      ingressUrl: null,
      isUrl: false,
      jsonlFile: null,
      isJsonlFile: false
    };
  }
  try {
    const url = new URL(resumeIdentifier);
    return {
      sessionId: randomUUID2(),
      ingressUrl: url.href,
      isUrl: true,
      jsonlFile: null,
      isJsonlFile: false
    };
  } catch {}
  return null;
}

// src/cli/print.ts
init_sessionStorage();
init_commitAttribution();
init_client();
init_config();
init_auth3();
init_elicitationHandler();
init_hooks();
init_types();
init_mcpStringUtils();
init_utils();
init_vscodeSdkMcp();
init_config();
init_grove();
init_mappers();
init_messages();
init_context_noninteractive();
init_xml();
init_claudeAiLimits();
init_model();
init_modelOptions();
init_effort();
init_thinking();
init_betas();
init_modelStrings();
init_state();
init_workloadContext();
init_fileHistory();
import { randomUUID as randomUUID3 } from "crypto";
init_sandbox_adapter();
init_headlessProfiler();
init_queryProfiler();
init_ids();
init_autonomyRuns();
init_autonomyQueueLifecycle();
init_slowOperations();
init_commands();
init_envUtils();

// src/utils/plugins/headlessPluginInstall.ts
init_analytics();
init_cleanupRegistry();
init_debug();
init_diagLogs();
init_fsOperations();
init_log();
init_marketplaceManager();
init_pluginLoader();
init_zipCache();

// src/utils/plugins/zipCacheAdapters.ts
init_debug();
init_slowOperations();
init_marketplaceManager();
init_schemas();
init_zipCache();
import { readFile } from "fs/promises";
import { join } from "path";
async function readZipCacheKnownMarketplaces() {
  try {
    const content = await readFile(getZipCacheKnownMarketplacesPath(), "utf-8");
    const parsed = KnownMarketplacesFileSchema().safeParse(jsonParse(content));
    if (!parsed.success) {
      logForDebugging(`Invalid known_marketplaces.json in zip cache: ${parsed.error.message}`, { level: "error" });
      return {};
    }
    return parsed.data;
  } catch {
    return {};
  }
}
async function writeZipCacheKnownMarketplaces(data) {
  await atomicWriteToZipCache(getZipCacheKnownMarketplacesPath(), jsonStringify(data, null, 2));
}
async function saveMarketplaceJsonToZipCache(marketplaceName, installLocation) {
  const zipCachePath = getPluginZipCachePath();
  if (!zipCachePath) {
    return;
  }
  const content = await readMarketplaceJsonContent(installLocation);
  if (content !== null) {
    const relPath = getMarketplaceJsonRelativePath(marketplaceName);
    await atomicWriteToZipCache(join(zipCachePath, relPath), content);
  }
}
async function readMarketplaceJsonContent(dir) {
  const candidates = [
    join(dir, ".claude-plugin", "marketplace.json"),
    join(dir, "marketplace.json"),
    dir
  ];
  for (const candidate of candidates) {
    try {
      return await readFile(candidate, "utf-8");
    } catch {}
  }
  return null;
}
async function syncMarketplacesToZipCache() {
  const knownMarketplaces = await loadKnownMarketplacesConfigSafe();
  for (const [name, entry] of Object.entries(knownMarketplaces)) {
    if (!entry.installLocation)
      continue;
    try {
      await saveMarketplaceJsonToZipCache(name, entry.installLocation);
    } catch (error) {
      logForDebugging(`Failed to save marketplace JSON for ${name}: ${error}`);
    }
  }
  const zipCacheKnownMarketplaces = await readZipCacheKnownMarketplaces();
  const mergedKnownMarketplaces = {
    ...zipCacheKnownMarketplaces,
    ...knownMarketplaces
  };
  await writeZipCacheKnownMarketplaces(mergedKnownMarketplaces);
}

// src/utils/plugins/headlessPluginInstall.ts
async function installPluginsForHeadless() {
  const zipCacheMode = isPluginZipCacheEnabled();
  logForDebugging(`installPluginsForHeadless: starting${zipCacheMode ? " (zip cache mode)" : ""}`);
  const seedChanged = await registerSeedMarketplaces();
  if (seedChanged) {
    clearMarketplacesCache();
    clearPluginCache("headlessPluginInstall: seed marketplaces registered");
  }
  if (zipCacheMode) {
    await getFsImplementation().mkdir(getZipCacheMarketplacesDir());
    await getFsImplementation().mkdir(getZipCachePluginsDir());
  }
  const declaredCount = Object.keys(getDeclaredMarketplaces()).length;
  const metrics = {
    marketplaces_installed: 0,
    delisted_count: 0
  };
  let pluginsChanged = seedChanged;
  try {
    if (declaredCount === 0) {
      logForDebugging("installPluginsForHeadless: no marketplaces declared");
    } else {
      const reconcileResult = await withDiagnosticsTiming("headless_marketplace_reconcile", () => reconcileMarketplaces({
        skip: zipCacheMode ? (_name, source) => !isMarketplaceSourceSupportedByZipCache(source) : undefined,
        onProgress: (event) => {
          if (event.type === "installed") {
            logForDebugging(`installPluginsForHeadless: installed marketplace ${event.name}`);
          } else if (event.type === "failed") {
            logForDebugging(`installPluginsForHeadless: failed to install marketplace ${event.name}: ${event.error}`);
          }
        }
      }), (r) => ({
        installed_count: r.installed.length,
        updated_count: r.updated.length,
        failed_count: r.failed.length,
        skipped_count: r.skipped.length
      }));
      if (reconcileResult.skipped.length > 0) {
        logForDebugging(`installPluginsForHeadless: skipped ${reconcileResult.skipped.length} marketplace(s) unsupported by zip cache: ${reconcileResult.skipped.join(", ")}`);
      }
      const marketplacesChanged = reconcileResult.installed.length + reconcileResult.updated.length;
      if (marketplacesChanged > 0) {
        clearMarketplacesCache();
        clearPluginCache("headlessPluginInstall: marketplaces reconciled");
        pluginsChanged = true;
      }
      metrics.marketplaces_installed = marketplacesChanged;
    }
    if (zipCacheMode) {
      await syncMarketplacesToZipCache();
    }
    const newlyDelisted = await detectAndUninstallDelistedPlugins();
    metrics.delisted_count = newlyDelisted.length;
    if (newlyDelisted.length > 0) {
      pluginsChanged = true;
    }
    if (pluginsChanged) {
      clearPluginCache("headlessPluginInstall: plugins changed");
    }
    if (zipCacheMode) {
      registerCleanup(cleanupSessionPluginCache);
    }
    return pluginsChanged;
  } catch (error) {
    logError(error);
    return false;
  } finally {
    logEvent("tengu_headless_plugin_install", metrics);
  }
}

// src/cli/print.ts
init_refresh();
init_pluginLoader();
init_teammate();
init_teammateMailbox();
init_teamHelpers();
init_tasks();
init_framework();
init_types2();
init_stopTask();
init_sdkEventQueue();
init_growthbook();
init_errors();
init_sleep();
init_paths();
var coordinatorModeModule = (init_coordinatorMode(), __toCommonJS(exports_coordinatorMode));
var proactiveModule = (init_proactive(), __toCommonJS(exports_proactive));
var cronSchedulerModule = (init_cronScheduler(), __toCommonJS(exports_cronScheduler));
var cronJitterConfigModule = (init_cronJitterConfig(), __toCommonJS(exports_cronJitterConfig));
var cronGate = (init_prompt8(), __toCommonJS(exports_prompt));
var SHUTDOWN_TEAM_PROMPT = `<system-reminder>
You are running in non-interactive mode and cannot return a response to the user until your team is shut down.

You MUST shut down your team before preparing your final response:
1. Use requestShutdown to ask each team member to shut down gracefully
2. Wait for shutdown approvals
3. Use the cleanup operation to clean up the team
4. Only then provide your final response to the user

The user cannot receive your response until the team is completely shut down.
</system-reminder>

Shut down your team and prepare your final response for the user.`;
var MAX_RECEIVED_UUIDS = 1e4;
var receivedMessageUuids = new Set;
var receivedMessageUuidsOrder = [];
function trackReceivedMessageUuid(uuid) {
  if (receivedMessageUuids.has(uuid)) {
    return false;
  }
  receivedMessageUuids.add(uuid);
  receivedMessageUuidsOrder.push(uuid);
  if (receivedMessageUuidsOrder.length > MAX_RECEIVED_UUIDS) {
    const toEvict = receivedMessageUuidsOrder.splice(0, receivedMessageUuidsOrder.length - MAX_RECEIVED_UUIDS);
    for (const old of toEvict) {
      receivedMessageUuids.delete(old);
    }
  }
  return true;
}
function toBlocks(v) {
  return typeof v === "string" ? [{ type: "text", text: v }] : v;
}
function joinPromptValues(values) {
  if (values.length === 1)
    return values[0];
  if (values.every((v) => typeof v === "string")) {
    return values.join(`
`);
  }
  return values.flatMap(toBlocks);
}
function canBatchWith(head, next) {
  return next !== undefined && next.mode === "prompt" && next.workload === head.workload && next.isMeta === head.isMeta;
}
async function runHeadless(inputPrompt, getAppState, setAppState, commands, tools, sdkMcpConfigs, agents, options) {
  if (process.env.USER_TYPE === "ant" && isEnvTruthy(process.env.CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER)) {
    process.stderr.write(`
Startup time: ${Math.round(process.uptime() * 1000)}ms
`);
    process.exit(0);
  }
  if (false) {}
  settingsChangeDetector.subscribe((source) => {
    applySettingsChange(source, setAppState);
    if (isFastModeEnabled()) {
      setAppState((prev) => {
        const s = prev.settings;
        const fastMode = s.fastMode === true && !s.fastModePerSessionOptIn;
        return { ...prev, fastMode };
      });
    }
  });
  if (proactiveModule && !proactiveModule.isProactiveActive() && isEnvTruthy(process.env.CLAUDE_CODE_PROACTIVE)) {
    proactiveModule.activateProactive("command");
  }
  if (typeof Bun !== "undefined") {
    const gcTimer = setInterval(() => {
      const rss = process.memoryUsage.rss();
      if (rss > 350 * 1024 * 1024) {
        Bun.gc(true);
      } else {
        Bun.gc(false);
      }
    }, 1000);
    gcTimer.unref();
  }
  headlessProfilerStartTurn();
  headlessProfilerCheckpoint("runHeadless_entry");
  if (await isQualifiedForGrove()) {
    await checkGroveForNonInteractive();
  }
  headlessProfilerCheckpoint("after_grove_check");
  initializeGrowthBook();
  if (options.resumeSessionAt && !options.resume) {
    process.stderr.write(`Error: --resume-session-at requires --resume
`);
    gracefulShutdownSync(1);
    return;
  }
  if (options.rewindFiles && !options.resume) {
    process.stderr.write(`Error: --rewind-files requires --resume
`);
    gracefulShutdownSync(1);
    return;
  }
  if (options.rewindFiles && inputPrompt) {
    process.stderr.write(`Error: --rewind-files is a standalone operation and cannot be used with a prompt
`);
    gracefulShutdownSync(1);
    return;
  }
  const structuredIO = getStructuredIO(inputPrompt, options);
  if (options.outputFormat === "stream-json") {
    installStreamJsonStdoutGuard();
  }
  const sandboxUnavailableReason = SandboxManager.getSandboxUnavailableReason();
  if (sandboxUnavailableReason) {
    if (SandboxManager.isSandboxRequired()) {
      process.stderr.write(`
Error: sandbox required but unavailable: ${sandboxUnavailableReason}
` + `  sandbox.failIfUnavailable is set \u2014 refusing to start without a working sandbox.

`);
      gracefulShutdownSync(1);
      return;
    }
    process.stderr.write(`
\u26A0 Sandbox disabled: ${sandboxUnavailableReason}
` + `  Commands will run WITHOUT sandboxing. Network and filesystem restrictions will NOT be enforced.

`);
  } else if (SandboxManager.isSandboxingEnabled()) {
    try {
      await SandboxManager.initialize(structuredIO.createSandboxAskCallback());
    } catch (err) {
      process.stderr.write(`
\u274C Sandbox Error: ${errorMessage(err)}
`);
      gracefulShutdownSync(1, "other");
      return;
    }
  }
  if (options.outputFormat === "stream-json" && options.verbose) {
    registerHookEventHandler((event) => {
      const message = (() => {
        switch (event.type) {
          case "started":
            return {
              type: "system",
              subtype: "hook_started",
              hook_id: event.hookId,
              hook_name: event.hookName,
              hook_event: event.hookEvent,
              uuid: randomUUID3(),
              session_id: getSessionId()
            };
          case "progress":
            return {
              type: "system",
              subtype: "hook_progress",
              hook_id: event.hookId,
              hook_name: event.hookName,
              hook_event: event.hookEvent,
              stdout: event.stdout,
              stderr: event.stderr,
              output: event.output,
              uuid: randomUUID3(),
              session_id: getSessionId()
            };
          case "response":
            return {
              type: "system",
              subtype: "hook_response",
              hook_id: event.hookId,
              hook_name: event.hookName,
              hook_event: event.hookEvent,
              output: event.output,
              stdout: event.stdout,
              stderr: event.stderr,
              exit_code: event.exitCode,
              outcome: event.outcome,
              uuid: randomUUID3(),
              session_id: getSessionId()
            };
        }
      })();
      structuredIO.write(message);
    });
  }
  if (options.setupTrigger) {
    await processSetupHooks(options.setupTrigger);
  }
  headlessProfilerCheckpoint("before_loadInitialMessages");
  const appState = getAppState();
  const {
    messages: initialMessages,
    turnInterruptionState,
    agentSetting: resumedAgentSetting
  } = await loadInitialMessages(setAppState, {
    continue: options.continue,
    teleport: options.teleport,
    resume: options.resume,
    resumeSessionAt: options.resumeSessionAt,
    forkSession: options.forkSession,
    outputFormat: options.outputFormat,
    sessionStartHooksPromise: options.sessionStartHooksPromise,
    restoredWorkerState: structuredIO.restoredWorkerState
  });
  const hookInitialUserMessage = takeInitialUserMessage();
  if (hookInitialUserMessage) {
    structuredIO.prependUserMessage(hookInitialUserMessage);
  }
  if (!options.agent && !getMainThreadAgentType() && resumedAgentSetting) {
    const { agentDefinition: restoredAgent } = restoreAgentFromSession(resumedAgentSetting, undefined, { activeAgents: agents, allAgents: agents });
    if (restoredAgent) {
      setAppState((prev) => ({ ...prev, agent: restoredAgent.agentType }));
      if (!options.systemPrompt && !isBuiltInAgent(restoredAgent)) {
        const agentSystemPrompt = restoredAgent.getSystemPrompt();
        if (agentSystemPrompt) {
          options.systemPrompt = agentSystemPrompt;
        }
      }
      saveAgentSetting(restoredAgent.agentType);
    }
  }
  if (initialMessages.length === 0 && process.exitCode !== undefined) {
    return;
  }
  if (options.rewindFiles) {
    const targetMessage = initialMessages.find((m) => m.uuid === options.rewindFiles);
    if (!targetMessage || targetMessage.type !== "user") {
      process.stderr.write(`Error: --rewind-files requires a user message UUID, but ${options.rewindFiles} is not a user message in this session
`);
      gracefulShutdownSync(1);
      return;
    }
    const currentAppState = getAppState();
    const result = await handleRewindFiles(options.rewindFiles, currentAppState, setAppState, false);
    if (!result.canRewind) {
      process.stderr.write(`Error: ${result.error || "Unexpected error"}
`);
      gracefulShutdownSync(1);
      return;
    }
    process.stdout.write(`Files rewound to state at message ${options.rewindFiles}
`);
    gracefulShutdownSync(0);
    return;
  }
  const hasValidResumeSessionId = typeof options.resume === "string" && (Boolean(validateUuid(options.resume)) || options.resume.endsWith(".jsonl"));
  const isUsingSdkUrl = Boolean(options.sdkUrl);
  if (!inputPrompt && !hasValidResumeSessionId && !isUsingSdkUrl) {
    process.stderr.write(`Error: Input must be provided either through stdin or as a prompt argument when using --print
`);
    gracefulShutdownSync(1);
    return;
  }
  if (options.outputFormat === "stream-json" && !options.verbose) {
    process.stderr.write(`Error: When using --print, --output-format=stream-json requires --verbose
`);
    gracefulShutdownSync(1);
    return;
  }
  const allowedMcpTools = filterToolsByDenyRules(appState.mcp.tools, appState.toolPermissionContext);
  let filteredTools = [...tools, ...allowedMcpTools];
  const effectivePermissionPromptToolName = options.sdkUrl ? "stdio" : options.permissionPromptToolName;
  const onPermissionPrompt = (details) => {
    if (true) {
      setAppState((prev) => ({
        ...prev,
        attribution: {
          ...prev.attribution,
          permissionPromptCount: prev.attribution.permissionPromptCount + 1
        }
      }));
    }
    notifySessionStateChanged("requires_action", details);
  };
  const canUseTool = getCanUseToolFn(effectivePermissionPromptToolName, structuredIO, () => getAppState().mcp.tools, onPermissionPrompt);
  if (options.permissionPromptToolName) {
    filteredTools = filteredTools.filter((tool) => !toolMatchesName(tool, options.permissionPromptToolName));
  }
  registerProcessOutputErrorHandlers();
  headlessProfilerCheckpoint("after_loadInitialMessages");
  await ensureModelStringsInitialized();
  headlessProfilerCheckpoint("after_modelStrings");
  const needsFullArray = options.outputFormat === "json" && options.verbose;
  const messages = [];
  let lastMessage;
  const transformToStreamlined = null;
  headlessProfilerCheckpoint("before_runHeadlessStreaming");
  for await (const message of runHeadlessStreaming(structuredIO, appState.mcp.clients, [...commands, ...appState.mcp.commands], filteredTools, initialMessages, canUseTool, sdkMcpConfigs, getAppState, setAppState, agents, options, turnInterruptionState)) {
    if (transformToStreamlined) {
      const transformed = transformToStreamlined(message);
      if (transformed) {
        await structuredIO.write(transformed);
      }
    } else if (options.outputFormat === "stream-json" && options.verbose) {
      await structuredIO.write(message);
    }
    if (message.type !== "control_response" && message.type !== "control_request" && message.type !== "control_cancel_request" && !(message.type === "system" && (message.subtype === "session_state_changed" || message.subtype === "task_notification" || message.subtype === "task_started" || message.subtype === "task_progress" || message.subtype === "post_turn_summary")) && message.type !== "stream_event" && message.type !== "keep_alive" && message.type !== "streamlined_text" && message.type !== "streamlined_tool_use_summary" && message.type !== "prompt_suggestion") {
      if (needsFullArray) {
        messages.push(message);
      }
      lastMessage = message;
    }
  }
  switch (options.outputFormat) {
    case "json":
      if (!lastMessage || lastMessage.type !== "result") {
        throw new Error("No messages returned");
      }
      if (options.verbose) {
        writeToStdout(jsonStringify(messages) + `
`);
        break;
      }
      writeToStdout(jsonStringify(lastMessage) + `
`);
      break;
    case "stream-json":
      break;
    default:
      if (!lastMessage || lastMessage.type !== "result") {
        throw new Error("No messages returned");
      }
      switch (lastMessage.subtype) {
        case "success":
          writeToStdout(lastMessage.result.endsWith(`
`) ? lastMessage.result : lastMessage.result + `
`);
          break;
        case "error_during_execution":
          writeToStdout(`Execution error`);
          break;
        case "error_max_turns":
          writeToStdout(`Error: Reached max turns (${options.maxTurns}).
Tip: Increase the limit with --max-turns or continue in a new session.`);
          break;
        case "error_max_budget_usd":
          writeToStdout(`Error: Exceeded USD budget ($${options.maxBudgetUsd}).
Tip: Increase the limit with --max-budget-usd or start a new session to continue.`);
          break;
        case "error_max_structured_output_retries":
          writeToStdout(`Error: Failed to provide valid structured output after maximum retries.
Tip: Simplify your schema or check if the output format matches the expected structure.`);
      }
  }
  logHeadlessProfilerTurn();
  if (isExtractModeActive()) {
    try {
      const { drainPendingExtraction } = await import("./chunk-pp28g6zk.js");
      await drainPendingExtraction();
    } catch {}
  }
  gracefulShutdownSync(lastMessage?.type === "result" && lastMessage?.is_error ? 1 : 0);
}
function runHeadlessStreaming(structuredIO, mcpClients, commands, tools, initialMessages, canUseTool, sdkMcpConfigs, getAppState, setAppState, agents, options, turnInterruptionState) {
  let running = false;
  let runPhase;
  let inputClosed = false;
  let shutdownPromptInjected = false;
  let heldBackResult = null;
  let abortController;
  const output = structuredIO.outbound;
  const sigintHandler = () => {
    logForDiagnosticsNoPII("info", "shutdown_signal", { signal: "SIGINT" });
    if (abortController && !abortController.signal.aborted) {
      abortController.abort();
    }
    gracefulShutdown(0);
  };
  process.on("SIGINT", sigintHandler);
  registerCleanup(async () => {
    const bg = {};
    for (const t of getRunningTasks(getAppState())) {
      if (isBackgroundTask(t))
        bg[t.type] = (bg[t.type] ?? 0) + 1;
    }
    logForDiagnosticsNoPII("info", "run_state_at_shutdown", {
      run_active: running,
      run_phase: runPhase,
      worker_status: getSessionState(),
      internal_events_pending: structuredIO.internalEventsPending,
      bg_tasks: bg
    });
  });
  setPermissionModeChangedListener((newMode) => {
    if (newMode === "default" || newMode === "acceptEdits" || newMode === "bypassPermissions" || newMode === "plan" || newMode === "auto" || newMode === "dontAsk") {
      output.enqueue({
        type: "system",
        subtype: "status",
        status: null,
        permissionMode: newMode,
        uuid: randomUUID3(),
        session_id: getSessionId()
      });
    }
  });
  const suggestionState = {
    abortController: null,
    inflightPromise: null,
    lastEmitted: null,
    pendingSuggestion: null,
    pendingLastEmittedEntry: null
  };
  let unsubscribeAuthStatus;
  if (options.enableAuthStatus) {
    const authStatusManager = AwsAuthStatusManager.getInstance();
    unsubscribeAuthStatus = authStatusManager.subscribe((status) => {
      output.enqueue({
        type: "auth_status",
        isAuthenticating: status.isAuthenticating,
        output: status.output,
        error: status.error,
        uuid: randomUUID3(),
        session_id: getSessionId()
      });
    });
  }
  const rateLimitListener = (limits) => {
    const rateLimitInfo = toSDKRateLimitInfo(limits);
    if (rateLimitInfo) {
      output.enqueue({
        type: "rate_limit_event",
        rate_limit_info: rateLimitInfo,
        uuid: randomUUID3(),
        session_id: getSessionId()
      });
    }
  };
  statusListeners.add(rateLimitListener);
  const mutableMessages = initialMessages;
  let readFileState = extractReadFilesFromMessages(initialMessages, cwd(), READ_FILE_STATE_CACHE_SIZE);
  const pendingSeeds = createFileStateCacheWithSizeLimit(READ_FILE_STATE_CACHE_SIZE);
  const resumeInterruptedTurnEnv = process.env.CLAUDE_CODE_RESUME_INTERRUPTED_TURN;
  if (turnInterruptionState && turnInterruptionState.kind !== "none" && resumeInterruptedTurnEnv) {
    logForDebugging(`[print.ts] Auto-resuming interrupted turn (kind: ${turnInterruptionState.kind})`);
    removeInterruptedMessage(mutableMessages, turnInterruptionState.message);
    enqueue({
      mode: "prompt",
      value: turnInterruptionState.message.message.content,
      uuid: randomUUID3()
    });
  }
  const modelOptions = getModelOptions();
  const modelInfos = modelOptions.map((option) => {
    const modelId = option.value === null ? "default" : option.value;
    const resolvedModel = modelId === "default" ? getDefaultMainLoopModel() : parseUserSpecifiedModel(modelId);
    const hasEffort = modelSupportsEffort(resolvedModel);
    const hasAdaptiveThinking = modelSupportsAdaptiveThinking(resolvedModel);
    const hasFastMode = isFastModeSupportedByModel(option.value);
    const hasAutoMode = modelSupportsAutoMode(resolvedModel);
    return {
      name: modelId,
      value: modelId,
      displayName: option.label,
      description: option.description,
      ...hasEffort && {
        supportsEffort: true,
        supportedEffortLevels: modelSupportsMaxEffort(resolvedModel) ? [...EFFORT_LEVELS] : EFFORT_LEVELS.filter((l) => l !== "max")
      },
      ...hasAdaptiveThinking && { supportsAdaptiveThinking: true },
      ...hasFastMode && { supportsFastMode: true },
      ...hasAutoMode && { supportsAutoMode: true }
    };
  });
  let activeUserSpecifiedModel = options.userSpecifiedModel;
  function injectModelSwitchBreadcrumbs(modelArg, resolvedModel) {
    const breadcrumbs = createModelSwitchBreadcrumbs(modelArg, modelDisplayString(resolvedModel));
    mutableMessages.push(...breadcrumbs);
    for (const crumb of breadcrumbs) {
      if (typeof crumb.message.content === "string" && crumb.message.content.includes(`<${LOCAL_COMMAND_STDOUT_TAG}>`)) {
        output.enqueue({
          type: "user",
          content: crumb.message.content,
          message: crumb.message,
          session_id: getSessionId(),
          parent_tool_use_id: null,
          uuid: crumb.uuid,
          timestamp: crumb.timestamp,
          isReplay: true
        });
      }
    }
  }
  let sdkClients = [];
  let sdkTools = [];
  const elicitationRegistered = new Set;
  function registerElicitationHandlers(clients) {
    for (const connection of clients) {
      if (connection.type !== "connected" || elicitationRegistered.has(connection.name)) {
        continue;
      }
      if (connection.config.type === "sdk") {
        continue;
      }
      const serverName = connection.name;
      try {
        connection.client.setRequestHandler(ElicitRequestSchema, async (request, extra) => {
          logMCPDebug(serverName, `Elicitation request received in print mode: ${jsonStringify(request)}`);
          const mode = request.params.mode === "url" ? "url" : "form";
          logEvent("tengu_mcp_elicitation_shown", {
            mode
          });
          const hookResponse = await runElicitationHooks(serverName, request.params, extra.signal);
          if (hookResponse) {
            logMCPDebug(serverName, `Elicitation resolved by hook: ${jsonStringify(hookResponse)}`);
            logEvent("tengu_mcp_elicitation_response", {
              mode,
              action: hookResponse.action
            });
            return hookResponse;
          }
          const url = "url" in request.params ? request.params.url : undefined;
          const requestedSchema = "requestedSchema" in request.params ? request.params.requestedSchema : undefined;
          const elicitationId = "elicitationId" in request.params ? request.params.elicitationId : undefined;
          const rawResult = await structuredIO.handleElicitation(serverName, request.params.message, requestedSchema, extra.signal, mode, url, elicitationId);
          const result = await runElicitationResultHooks(serverName, rawResult, extra.signal, mode, elicitationId);
          logEvent("tengu_mcp_elicitation_response", {
            mode,
            action: result.action
          });
          return result;
        });
        connection.client.setNotificationHandler(ElicitationCompleteNotificationSchema, (notification) => {
          const { elicitationId } = notification.params;
          logMCPDebug(serverName, `Elicitation completion notification: ${elicitationId}`);
          executeNotificationHooks({
            message: `MCP server "${serverName}" confirmed elicitation ${elicitationId} complete`,
            notificationType: "elicitation_complete"
          });
          output.enqueue({
            type: "system",
            subtype: "elicitation_complete",
            mcp_server_name: serverName,
            elicitation_id: elicitationId,
            uuid: randomUUID3(),
            session_id: getSessionId()
          });
        });
        elicitationRegistered.add(serverName);
      } catch {}
    }
  }
  async function updateSdkMcp() {
    const currentServerNames = new Set(Object.keys(sdkMcpConfigs));
    const connectedServerNames = new Set(sdkClients.map((c) => c.name));
    const hasNewServers = Array.from(currentServerNames).some((name) => !connectedServerNames.has(name));
    const hasRemovedServers = Array.from(connectedServerNames).some((name) => !currentServerNames.has(name));
    const hasPendingSdkClients = sdkClients.some((c) => c.type === "pending");
    const hasFailedSdkClients = sdkClients.some((c) => c.type === "failed");
    const haveServersChanged = hasNewServers || hasRemovedServers || hasPendingSdkClients || hasFailedSdkClients;
    if (haveServersChanged) {
      for (const client of sdkClients) {
        if (!currentServerNames.has(client.name)) {
          if (client.type === "connected") {
            await client.cleanup();
          }
        }
      }
      const sdkSetup = await setupSdkMcpClients(sdkMcpConfigs, (serverName, message) => structuredIO.sendMcpMessage(serverName, message));
      sdkClients = sdkSetup.clients;
      sdkTools = sdkSetup.tools;
      const allSdkNames = uniq([...connectedServerNames, ...currentServerNames]);
      setAppState((prev) => ({
        ...prev,
        mcp: {
          ...prev.mcp,
          tools: [
            ...prev.mcp.tools.filter((t) => !allSdkNames.some((name) => t.name.startsWith(getMcpPrefix(name)))),
            ...sdkTools
          ]
        }
      }));
      setupVscodeSdkMcp(sdkClients);
    }
  }
  updateSdkMcp();
  let dynamicMcpState = {
    clients: [],
    tools: [],
    configs: {}
  };
  const buildAllTools = (appState) => {
    const assembledTools = assembleToolPool(appState.toolPermissionContext, appState.mcp.tools);
    let allTools = uniqBy_default(mergeAndFilterTools([...tools, ...sdkTools, ...dynamicMcpState.tools], assembledTools, appState.toolPermissionContext.mode), "name");
    if (options.permissionPromptToolName) {
      allTools = allTools.filter((tool) => !toolMatchesName(tool, options.permissionPromptToolName));
    }
    const initJsonSchema = getInitJsonSchema();
    if (initJsonSchema && !options.jsonSchema) {
      const syntheticOutputResult = createSyntheticOutputTool(initJsonSchema);
      if ("tool" in syntheticOutputResult) {
        allTools = [...allTools, syntheticOutputResult.tool];
      }
    }
    return allTools;
  };
  let bridgeHandle = null;
  let bridgeLastForwardedIndex = 0;
  function forwardMessagesToBridge() {
    if (!bridgeHandle)
      return;
    const startIndex = Math.min(bridgeLastForwardedIndex, mutableMessages.length);
    const newMessages = mutableMessages.slice(startIndex).filter((m) => m.type === "user" || m.type === "assistant");
    bridgeLastForwardedIndex = mutableMessages.length;
    if (newMessages.length > 0) {
      bridgeHandle.writeMessages(newMessages);
    }
  }
  let mcpChangesPromise = Promise.resolve({
    response: {
      added: [],
      removed: [],
      errors: {}
    },
    sdkServersChanged: false
  });
  function applyMcpServerChanges(servers) {
    const doWork = async () => {
      const oldSdkClientNames = new Set(sdkClients.map((c) => c.name));
      const result = await handleMcpSetServers(servers, { configs: sdkMcpConfigs, clients: sdkClients, tools: sdkTools }, dynamicMcpState, setAppState);
      for (const key of Object.keys(sdkMcpConfigs)) {
        delete sdkMcpConfigs[key];
      }
      Object.assign(sdkMcpConfigs, result.newSdkState.configs);
      sdkClients = result.newSdkState.clients;
      sdkTools = result.newSdkState.tools;
      dynamicMcpState = result.newDynamicState;
      if (result.sdkServersChanged) {
        const newSdkClientNames = new Set(sdkClients.map((c) => c.name));
        const allSdkNames = uniq([...oldSdkClientNames, ...newSdkClientNames]);
        setAppState((prev) => ({
          ...prev,
          mcp: {
            ...prev.mcp,
            tools: [
              ...prev.mcp.tools.filter((t) => !allSdkNames.some((name) => t.name.startsWith(getMcpPrefix(name)))),
              ...sdkTools
            ]
          }
        }));
      }
      return {
        response: result.response,
        sdkServersChanged: result.sdkServersChanged
      };
    };
    mcpChangesPromise = mcpChangesPromise.then(doWork, doWork);
    return mcpChangesPromise;
  }
  function buildMcpServerStatuses() {
    const currentAppState = getAppState();
    const currentMcpClients = currentAppState.mcp.clients;
    const allMcpTools = uniqBy_default([...currentAppState.mcp.tools, ...dynamicMcpState.tools], "name");
    const existingNames = new Set([
      ...currentMcpClients.map((c) => c.name),
      ...sdkClients.map((c) => c.name)
    ]);
    return [
      ...currentMcpClients,
      ...sdkClients,
      ...dynamicMcpState.clients.filter((c) => !existingNames.has(c.name))
    ].map((connection) => {
      let config;
      if (connection.config.type === "sse" || connection.config.type === "http") {
        config = {
          type: connection.config.type,
          url: connection.config.url,
          headers: connection.config.headers,
          oauth: connection.config.oauth
        };
      } else if (connection.config.type === "claudeai-proxy") {
        config = {
          type: "claudeai-proxy",
          url: connection.config.url,
          id: connection.config.id
        };
      } else if (connection.config.type === "stdio" || connection.config.type === undefined) {
        const stdioConfig = connection.config;
        config = {
          type: "stdio",
          command: stdioConfig.command,
          args: stdioConfig.args
        };
      }
      const serverTools = connection.type === "connected" ? filterToolsByServer(allMcpTools, connection.name).map((tool) => ({
        name: tool.mcpInfo?.toolName ?? tool.name,
        annotations: {
          readOnly: tool.isReadOnly({}) || undefined,
          destructive: tool.isDestructive?.({}) || undefined,
          openWorld: tool.isOpenWorld?.({}) || undefined
        }
      })) : undefined;
      let capabilities;
      if (connection.type === "connected" && connection.capabilities.experimental) {
        const exp = { ...connection.capabilities.experimental };
        if (exp["claude/channel"] && (!isChannelsEnabled() || !isChannelAllowlisted(connection.config.pluginSource))) {
          delete exp["claude/channel"];
        }
        if (Object.keys(exp).length > 0) {
          capabilities = { experimental: exp };
        }
      }
      return {
        name: connection.name,
        status: connection.type,
        serverInfo: connection.type === "connected" ? connection.serverInfo : undefined,
        error: connection.type === "failed" ? connection.error : undefined,
        config,
        scope: connection.config.scope,
        tools: serverTools,
        capabilities
      };
    });
  }
  async function installPluginsAndApplyMcpInBackground() {
    try {
      await Promise.all([
        Promise.resolve(),
        withDiagnosticsTiming("headless_managed_settings_wait", () => waitForRemoteManagedSettingsToLoad())
      ]);
      const pluginsInstalled = await installPluginsForHeadless();
      if (pluginsInstalled) {
        await applyPluginMcpDiff();
      }
    } catch (error) {
      logError(error);
    }
  }
  let pluginInstallPromise = null;
  if (!isBareMode()) {
    if (isEnvTruthy(process.env.CLAUDE_CODE_SYNC_PLUGIN_INSTALL)) {
      pluginInstallPromise = installPluginsAndApplyMcpInBackground();
    } else {
      installPluginsAndApplyMcpInBackground();
    }
  }
  const idleTimeout = createIdleTimeoutManager(() => !running);
  let currentCommands = commands;
  let currentAgents = agents;
  async function refreshPluginState() {
    const { agentDefinitions: freshAgentDefs } = await refreshActivePlugins(setAppState);
    currentCommands = await getCommands(cwd());
    const sdkAgents = currentAgents.filter((a) => a.source === "flagSettings");
    currentAgents = [...freshAgentDefs.allAgents, ...sdkAgents];
  }
  async function applyPluginMcpDiff() {
    const { servers: newConfigs } = await getAllMcpConfigs();
    const supportedConfigs = {};
    for (const [name, config] of Object.entries(newConfigs)) {
      const type = config.type;
      if (type === undefined || type === "stdio" || type === "sse" || type === "http" || type === "sdk") {
        supportedConfigs[name] = config;
      }
    }
    for (const [name, config] of Object.entries(sdkMcpConfigs)) {
      if (config.type === "sdk" && !(name in supportedConfigs)) {
        supportedConfigs[name] = config;
      }
    }
    const { response, sdkServersChanged } = await applyMcpServerChanges(supportedConfigs);
    if (sdkServersChanged) {
      updateSdkMcp();
    }
    logForDebugging(`Headless MCP refresh: added=${response.added.length}, removed=${response.removed.length}`);
  }
  const unsubscribeSkillChanges = skillChangeDetector.subscribe(() => {
    clearCommandsCache();
    getCommands(cwd()).then((newCommands) => {
      currentCommands = newCommands;
    });
  });
  const scheduleProactiveTick = () => {
    setTimeout(() => {
      if (!proactiveModule?.isProactiveActive() || proactiveModule.isProactivePaused() || inputClosed) {
        return;
      }
      (async () => {
        const commands2 = await createProactiveAutonomyCommands({
          basePrompt: `<${TICK_TAG}>${new Date().toLocaleTimeString()}</${TICK_TAG}>`,
          currentDir: cwd(),
          shouldCreate: () => !inputClosed
        });
        if (inputClosed) {
          await cancelQueuedAutonomyCommands({ commands: commands2 });
          return;
        }
        for (const command of commands2) {
          enqueue({
            ...command,
            uuid: randomUUID3()
          });
        }
        run();
      })().catch((error) => {
        logError(error);
        logForDebugging(`[Proactive] failed to create headless tick: ${error}`, {
          level: "error"
        });
      });
    }, 0);
  };
  subscribeToCommandQueue(() => {
    if (abortController && getCommandsByMaxPriority("now").length > 0) {
      abortController.abort("interrupt");
    }
  });
  const run = async () => {
    if (running) {
      return;
    }
    running = true;
    runPhase = undefined;
    notifySessionStateChanged("running");
    idleTimeout.stop();
    headlessProfilerCheckpoint("run_entry");
    await updateSdkMcp();
    headlessProfilerCheckpoint("after_updateSdkMcp");
    if (pluginInstallPromise) {
      const timeoutMs = parseInt(process.env.CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS || "", 10);
      if (timeoutMs > 0) {
        const timeout = sleep(timeoutMs).then(() => "timeout");
        const result = await Promise.race([pluginInstallPromise, timeout]);
        if (result === "timeout") {
          logError(new Error(`CLAUDE_CODE_SYNC_PLUGIN_INSTALL: plugin installation timed out after ${timeoutMs}ms`));
          logEvent("tengu_sync_plugin_install_timeout", {
            timeout_ms: timeoutMs
          });
        }
      } else {
        await pluginInstallPromise;
      }
      pluginInstallPromise = null;
      await refreshPluginState();
      const { setupPluginHookHotReload } = await import("./chunk-s0m7w9af.js");
      setupPluginHookHotReload();
    }
    const isMainThread = (cmd) => cmd.agentId === undefined;
    try {
      let command;
      let waitingForAgents = false;
      const drainCommandQueue = async () => {
        while (command = dequeue(isMainThread)) {
          if (command.mode !== "prompt" && command.mode !== "orphaned-permission" && command.mode !== "task-notification") {
            throw new Error("only prompt commands are supported in streaming mode");
          }
          let batch = [command];
          if (command.mode === "prompt") {
            while (canBatchWith(command, peek(isMainThread))) {
              batch.push(dequeue(isMainThread));
            }
          }
          const queuedAutonomyClaim = await claimConsumableQueuedAutonomyCommands(batch);
          batch = queuedAutonomyClaim.attachmentCommands;
          if (batch.length === 0) {
            continue;
          }
          command = batch[0];
          if (command.mode === "prompt" && batch.length > 1) {
            command = {
              ...command,
              value: joinPromptValues(batch.map((c) => c.value)),
              uuid: batch.findLast((c) => c.uuid)?.uuid ?? command.uuid
            };
          }
          const batchUuids = batch.map((c) => c.uuid).filter((u) => u !== undefined);
          if (options.replayUserMessages && batch.length > 1) {
            for (const c of batch) {
              if (c.uuid && c.uuid !== command.uuid) {
                output.enqueue({
                  type: "user",
                  content: c.value,
                  message: { role: "user", content: c.value },
                  session_id: getSessionId(),
                  parent_tool_use_id: null,
                  uuid: c.uuid,
                  isReplay: true
                });
              }
            }
          }
          const appState = getAppState();
          const allMcpClients = [
            ...appState.mcp.clients,
            ...sdkClients,
            ...dynamicMcpState.clients
          ];
          registerElicitationHandlers(allMcpClients);
          for (const client of allMcpClients) {
            reregisterChannelHandlerAfterReconnect(client);
          }
          const allTools = buildAllTools(appState);
          for (const uuid of batchUuids) {
            notifyCommandLifecycle(uuid, "started");
          }
          if (command.mode === "task-notification") {
            const notificationText = typeof command.value === "string" ? command.value : "";
            const taskIdMatch = notificationText.match(/<task-id>([^<]+)<\/task-id>/);
            const toolUseIdMatch = notificationText.match(/<tool-use-id>([^<]+)<\/tool-use-id>/);
            const outputFileMatch = notificationText.match(/<output-file>([^<]+)<\/output-file>/);
            const statusMatch = notificationText.match(/<status>([^<]+)<\/status>/);
            const summaryMatch = notificationText.match(/<summary>([^<]+)<\/summary>/);
            const isValidStatus = (s) => s === "completed" || s === "failed" || s === "stopped" || s === "killed";
            const rawStatus = statusMatch?.[1];
            const status = isValidStatus(rawStatus) ? rawStatus === "killed" ? "stopped" : rawStatus : "completed";
            const usageMatch = notificationText.match(/<usage>([\s\S]*?)<\/usage>/);
            const usageContent = usageMatch?.[1] ?? "";
            const totalTokensMatch = usageContent.match(/<total_tokens>(\d+)<\/total_tokens>/);
            const toolUsesMatch = usageContent.match(/<tool_uses>(\d+)<\/tool_uses>/);
            const durationMsMatch = usageContent.match(/<duration_ms>(\d+)<\/duration_ms>/);
            if (statusMatch) {
              output.enqueue({
                type: "system",
                subtype: "task_notification",
                task_id: taskIdMatch?.[1] ?? "",
                tool_use_id: toolUseIdMatch?.[1],
                status,
                output_file: outputFileMatch?.[1] ?? "",
                summary: summaryMatch?.[1] ?? "",
                usage: totalTokensMatch && toolUsesMatch ? {
                  total_tokens: parseInt(totalTokensMatch[1], 10),
                  tool_uses: parseInt(toolUsesMatch[1], 10),
                  duration_ms: durationMsMatch ? parseInt(durationMsMatch[1], 10) : 0
                } : undefined,
                session_id: getSessionId(),
                uuid: randomUUID3()
              });
            }
          }
          const input = command.value;
          const claimedAutonomyCommands = queuedAutonomyClaim.claimedCommands;
          if (structuredIO instanceof RemoteIO && command.mode === "prompt") {
            logEvent("tengu_bridge_message_received", {
              is_repl: false
            });
          }
          suggestionState.abortController?.abort();
          suggestionState.abortController = null;
          suggestionState.pendingSuggestion = null;
          suggestionState.pendingLastEmittedEntry = null;
          if (suggestionState.lastEmitted) {
            if (command.mode === "prompt") {
              const inputText = typeof input === "string" ? input : input.find((b) => b.type === "text")?.text;
              if (typeof inputText === "string") {
                logSuggestionOutcome(suggestionState.lastEmitted.text, inputText, suggestionState.lastEmitted.emittedAt, suggestionState.lastEmitted.promptId, suggestionState.lastEmitted.generationRequestId);
              }
              suggestionState.lastEmitted = null;
            }
          }
          abortController = createAbortController();
          const turnStartTime = undefined;
          headlessProfilerCheckpoint("before_ask");
          startQueryProfile();
          const cmd = command;
          let lastResultIsError = false;
          try {
            await runWithWorkload(cmd.workload ?? options.workload, async () => {
              for await (const message of ask({
                commands: uniqBy_default([...currentCommands, ...appState.mcp.commands], "name"),
                prompt: input,
                promptUuid: cmd.uuid,
                isMeta: cmd.isMeta,
                cwd: cwd(),
                tools: allTools,
                verbose: options.verbose,
                mcpClients: allMcpClients,
                thinkingConfig: options.thinkingConfig,
                maxTurns: options.maxTurns,
                maxBudgetUsd: options.maxBudgetUsd,
                taskBudget: options.taskBudget,
                canUseTool,
                userSpecifiedModel: activeUserSpecifiedModel,
                fallbackModel: options.fallbackModel,
                jsonSchema: getInitJsonSchema() ?? options.jsonSchema,
                mutableMessages,
                getReadFileCache: () => pendingSeeds.size === 0 ? readFileState : mergeFileStateCaches(readFileState, pendingSeeds),
                setReadFileCache: (cache) => {
                  readFileState = cache;
                  for (const [path, seed] of pendingSeeds.entries()) {
                    const existing = readFileState.get(path);
                    if (!existing || seed.timestamp > existing.timestamp) {
                      readFileState.set(path, seed);
                    }
                  }
                  pendingSeeds.clear();
                },
                customSystemPrompt: options.systemPrompt,
                appendSystemPrompt: options.appendSystemPrompt,
                getAppState,
                setAppState,
                abortController,
                replayUserMessages: options.replayUserMessages,
                includePartialMessages: options.includePartialMessages,
                handleElicitation: (serverName, params, elicitSignal) => structuredIO.handleElicitation(serverName, params.message, undefined, elicitSignal, params.mode, params.url, "elicitationId" in params ? params.elicitationId : undefined),
                agents: currentAgents,
                orphanedPermission: cmd.orphanedPermission,
                setSDKStatus: (status) => {
                  output.enqueue({
                    type: "system",
                    subtype: "status",
                    status,
                    session_id: getSessionId(),
                    uuid: randomUUID3()
                  });
                }
              })) {
                forwardMessagesToBridge();
                if (message.type === "result") {
                  lastResultIsError = !!message.is_error;
                  for (const event of drainSdkEvents()) {
                    output.enqueue(event);
                  }
                  const currentState = getAppState();
                  if (getRunningTasks(currentState).some((t) => (t.type === "local_agent" || t.type === "local_workflow") && isBackgroundTask(t))) {
                    heldBackResult = message;
                  } else {
                    heldBackResult = null;
                    output.enqueue(message);
                  }
                } else {
                  for (const event of drainSdkEvents()) {
                    output.enqueue(event);
                  }
                  output.enqueue(message);
                }
              }
            });
            if (lastResultIsError) {
              await finalizeAutonomyCommandsForTurn({
                commands: claimedAutonomyCommands,
                outcome: {
                  type: "failed",
                  message: "ask() returned an error result"
                },
                currentDir: cwd(),
                priority: "later",
                workload: cmd.workload ?? options.workload
              });
            } else {
              const nextCommands = await finalizeAutonomyCommandsForTurn({
                commands: claimedAutonomyCommands,
                outcome: { type: "completed" },
                currentDir: cwd(),
                priority: "later",
                workload: cmd.workload ?? options.workload
              });
              for (const nextCommand of nextCommands) {
                enqueue({
                  ...nextCommand,
                  uuid: randomUUID3()
                });
              }
            }
          } catch (error) {
            await finalizeAutonomyCommandsForTurn({
              commands: claimedAutonomyCommands,
              outcome: { type: "failed", error },
              currentDir: cwd(),
              priority: "later",
              workload: cmd.workload ?? options.workload
            });
            throw error;
          }
          for (const uuid of batchUuids) {
            notifyCommandLifecycle(uuid, "completed");
          }
          forwardMessagesToBridge();
          bridgeHandle?.sendResult();
          if (false) {}
          if (options.promptSuggestions && !isEnvDefinedFalsy(process.env.CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION)) {
            const state = suggestionState;
            state.abortController?.abort();
            const localAbort = new AbortController;
            suggestionState.abortController = localAbort;
            const cacheSafeParams = getLastCacheSafeParams();
            if (!cacheSafeParams) {
              logSuggestionSuppressed("sdk_no_params", undefined, undefined, "sdk");
            } else {
              const ref = { promise: null };
              ref.promise = (async () => {
                try {
                  const result = await tryGenerateSuggestion(localAbort, mutableMessages, getAppState, cacheSafeParams, "sdk");
                  if (!result || localAbort.signal.aborted)
                    return;
                  const suggestionMsg = {
                    type: "prompt_suggestion",
                    suggestion: result.suggestion,
                    uuid: randomUUID3(),
                    session_id: getSessionId()
                  };
                  const lastEmittedEntry = {
                    text: result.suggestion,
                    emittedAt: Date.now(),
                    promptId: result.promptId,
                    generationRequestId: result.generationRequestId
                  };
                  if (heldBackResult) {
                    suggestionState.pendingSuggestion = suggestionMsg;
                    suggestionState.pendingLastEmittedEntry = {
                      text: lastEmittedEntry.text,
                      promptId: lastEmittedEntry.promptId,
                      generationRequestId: lastEmittedEntry.generationRequestId
                    };
                  } else {
                    suggestionState.lastEmitted = lastEmittedEntry;
                    output.enqueue(suggestionMsg);
                  }
                } catch (error) {
                  if (error instanceof Error && (error.name === "AbortError" || error.name === "APIUserAbortError")) {
                    logSuggestionSuppressed("aborted", undefined, undefined, "sdk");
                    return;
                  }
                  logError(toError(error));
                } finally {
                  if (suggestionState.inflightPromise === ref.promise) {
                    suggestionState.inflightPromise = null;
                  }
                }
              })();
              suggestionState.inflightPromise = ref.promise;
            }
          }
          logHeadlessProfilerTurn();
          logQueryProfileReport();
          headlessProfilerStartTurn();
        }
      };
      do {
        for (const event of drainSdkEvents()) {
          output.enqueue(event);
        }
        runPhase = "draining_commands";
        await drainCommandQueue();
        waitingForAgents = false;
        {
          const state = getAppState();
          const hasRunningBg = getRunningTasks(state).some((t) => isBackgroundTask(t) && t.type !== "in_process_teammate");
          const hasMainThreadQueued = peek(isMainThread) !== undefined;
          if (hasRunningBg || hasMainThreadQueued) {
            waitingForAgents = true;
            if (!hasMainThreadQueued) {
              runPhase = "waiting_for_agents";
              await sleep(100);
            }
          }
        }
      } while (waitingForAgents);
      if (heldBackResult) {
        output.enqueue(heldBackResult);
        heldBackResult = null;
        if (suggestionState.pendingSuggestion) {
          output.enqueue(suggestionState.pendingSuggestion);
          if (suggestionState.pendingLastEmittedEntry) {
            suggestionState.lastEmitted = {
              ...suggestionState.pendingLastEmittedEntry,
              emittedAt: Date.now()
            };
            suggestionState.pendingLastEmittedEntry = null;
          }
          suggestionState.pendingSuggestion = null;
        }
      }
    } catch (error) {
      try {
        await structuredIO.write({
          type: "result",
          subtype: "error_during_execution",
          duration_ms: 0,
          duration_api_ms: 0,
          is_error: true,
          num_turns: 0,
          stop_reason: null,
          session_id: getSessionId(),
          total_cost_usd: 0,
          usage: EMPTY_USAGE,
          modelUsage: {},
          permission_denials: [],
          uuid: randomUUID3(),
          errors: [
            errorMessage(error),
            ...getInMemoryErrors().map((_) => _.error)
          ]
        });
      } catch {}
      suggestionState.abortController?.abort();
      gracefulShutdownSync(1);
      return;
    } finally {
      runPhase = "finally_flush";
      await structuredIO.flushInternalEvents();
      runPhase = "finally_post_flush";
      if (!isShuttingDown()) {
        notifySessionStateChanged("idle");
        for (const event of drainSdkEvents()) {
          output.enqueue(event);
        }
      }
      running = false;
      idleTimeout.start();
    }
    if (proactiveModule?.isProactiveActive() && !proactiveModule.isProactivePaused()) {
      if (peek(isMainThread) === undefined && !inputClosed) {
        scheduleProactiveTick();
        return;
      }
    }
    if (peek(isMainThread) !== undefined) {
      run();
      return;
    }
    {
      const currentAppState = getAppState();
      const teamContext = currentAppState.teamContext;
      if (teamContext && isTeamLead(teamContext)) {
        const agentName = "team-lead";
        const POLL_INTERVAL_MS = 500;
        while (true) {
          const refreshedState = getAppState();
          const hasActiveTeammates = hasActiveInProcessTeammates(refreshedState) || refreshedState.teamContext && Object.keys(refreshedState.teamContext.teammates).length > 0;
          if (!hasActiveTeammates) {
            logForDebugging("[print.ts] No more active teammates, stopping poll");
            break;
          }
          const unread = await readUnreadMessages(agentName, refreshedState.teamContext?.teamName);
          if (unread.length > 0) {
            logForDebugging(`[print.ts] Team-lead found ${unread.length} unread messages`);
            await markMessagesAsRead(agentName, refreshedState.teamContext?.teamName);
            const teamName = refreshedState.teamContext?.teamName;
            for (const m of unread) {
              const shutdownApproval = isShutdownApproved(m.text);
              if (shutdownApproval && teamName) {
                const teammateToRemove = shutdownApproval.from;
                logForDebugging(`[print.ts] Processing shutdown_approved from ${teammateToRemove}`);
                const teammateId = refreshedState.teamContext?.teammates ? Object.entries(refreshedState.teamContext.teammates).find(([, t]) => t.name === teammateToRemove)?.[0] : undefined;
                if (teammateId) {
                  removeTeammateFromTeamFile(teamName, {
                    agentId: teammateId,
                    name: teammateToRemove
                  });
                  logForDebugging(`[print.ts] Removed ${teammateToRemove} from team file`);
                  await unassignTeammateTasks(teamName, teammateId, teammateToRemove, "shutdown");
                  setAppState((prev) => {
                    if (!prev.teamContext?.teammates)
                      return prev;
                    if (!(teammateId in prev.teamContext.teammates))
                      return prev;
                    const { [teammateId]: _, ...remainingTeammates } = prev.teamContext.teammates;
                    return {
                      ...prev,
                      teamContext: {
                        ...prev.teamContext,
                        teammates: remainingTeammates
                      }
                    };
                  });
                }
              }
            }
            const formatted = unread.map((m) => `<${TEAMMATE_MESSAGE_TAG} teammate_id="${m.from}"${m.color ? ` color="${m.color}"` : ""}>
${m.text}
</${TEAMMATE_MESSAGE_TAG}>`).join(`

`);
            enqueue({
              mode: "prompt",
              value: formatted,
              uuid: randomUUID3()
            });
            run();
            return;
          }
          if (inputClosed && !shutdownPromptInjected) {
            shutdownPromptInjected = true;
            logForDebugging("[print.ts] Input closed with active teammates, injecting shutdown prompt");
            enqueue({
              mode: "prompt",
              value: SHUTDOWN_TEAM_PROMPT,
              uuid: randomUUID3()
            });
            run();
            return;
          }
          await sleep(POLL_INTERVAL_MS);
        }
      }
    }
    if (inputClosed) {
      const hasActiveSwarm = await (async () => {
        const currentAppState = getAppState();
        if (hasWorkingInProcessTeammates(currentAppState)) {
          await waitForTeammatesToBecomeIdle(setAppState, currentAppState);
        }
        const refreshedAppState = getAppState();
        const refreshedTeamContext = refreshedAppState.teamContext;
        const hasTeamMembersNotCleanedUp = refreshedTeamContext && Object.keys(refreshedTeamContext.teammates).length > 0;
        return hasTeamMembersNotCleanedUp || hasActiveInProcessTeammates(refreshedAppState);
      })();
      if (hasActiveSwarm) {
        enqueue({
          mode: "prompt",
          value: SHUTDOWN_TEAM_PROMPT,
          uuid: randomUUID3()
        });
        run();
      } else {
        if (suggestionState.inflightPromise) {
          await Promise.race([suggestionState.inflightPromise, sleep(5000)]);
        }
        suggestionState.abortController?.abort();
        suggestionState.abortController = null;
        await finalizePendingAsyncHooks();
        unsubscribeSkillChanges();
        unsubscribeAuthStatus?.();
        statusListeners.delete(rateLimitListener);
        output.done();
      }
    }
  };
  if (false) {}
  let cronScheduler = null;
  if (cronGate.isKairosCronEnabled()) {
    const dispatchHeadlessCronCommand = (params) => {
      if (inputClosed)
        return;
      (async () => {
        const command = await createAutonomyQueuedPromptIfNoActiveSource({
          basePrompt: params.basePrompt,
          trigger: "scheduled-task",
          currentDir: cwd(),
          sourceId: params.sourceId,
          sourceLabel: params.sourceLabel,
          workload: WORKLOAD_CRON,
          shouldCreate: () => !inputClosed
        });
        if (!command)
          return;
        if (inputClosed) {
          await cancelQueuedAutonomyCommands({ commands: [command] });
          return;
        }
        await params.onSuccess(command);
      })().catch((error) => {
        logError(error);
        logForDebugging(`[ScheduledTasks] failed to enqueue headless task${params.logSuffix}: ${error}`, { level: "error" });
      });
    };
    const enqueueAndRun = (command) => {
      enqueue({
        ...command,
        uuid: randomUUID3()
      });
      run();
    };
    cronScheduler = cronSchedulerModule.createCronScheduler({
      onFire: (prompt) => {
        dispatchHeadlessCronCommand({
          basePrompt: prompt,
          sourceId: prompt,
          sourceLabel: prompt,
          logSuffix: "",
          onSuccess: enqueueAndRun
        });
      },
      onFireTask: (task) => {
        if (task.agentId) {
          dispatchHeadlessCronCommand({
            basePrompt: task.prompt,
            sourceId: task.id,
            sourceLabel: task.prompt,
            logSuffix: ` ${task.id}`,
            onSuccess: async (command) => {
              await markAutonomyRunFailed(command.autonomy.runId, `No teammate runtime available for scheduled task owner ${task.agentId} in headless mode.`, command.autonomy.rootDir);
            }
          });
          return;
        }
        dispatchHeadlessCronCommand({
          basePrompt: task.prompt,
          sourceId: task.id,
          sourceLabel: task.prompt,
          logSuffix: ` ${task.id}`,
          onSuccess: enqueueAndRun
        });
      },
      isLoading: () => running || inputClosed,
      getJitterConfig: cronJitterConfigModule?.getCronJitterConfig,
      isKilled: () => !cronGate?.isKairosCronEnabled()
    });
    cronScheduler.start();
  }
  const sendControlResponseSuccess = function(message, response) {
    output.enqueue({
      type: "control_response",
      response: {
        subtype: "success",
        request_id: message.request_id,
        response
      }
    });
  };
  const sendControlResponseError = function(message, errorMessage2) {
    output.enqueue({
      type: "control_response",
      response: {
        subtype: "error",
        request_id: message.request_id,
        error: errorMessage2
      }
    });
  };
  const handledOrphanedToolUseIds = new Set;
  structuredIO.setUnexpectedResponseCallback(async (message) => {
    await handleOrphanedPermissionResponse({
      message,
      setAppState,
      handledToolUseIds: handledOrphanedToolUseIds,
      onEnqueued: () => {
        run();
      }
    });
  });
  const activeOAuthFlows = new Map;
  const oauthCallbackSubmitters = new Map;
  const oauthManualCallbackUsed = new Set;
  const oauthAuthPromises = new Map;
  let claudeOAuth = null;
  (async () => {
    let initialized = false;
    logForDiagnosticsNoPII("info", "cli_message_loop_started");
    for await (const message of structuredIO.structuredInput) {
      const eventId = "uuid" in message ? message.uuid : undefined;
      if (eventId && message.type !== "user" && message.type !== "control_response") {
        notifyCommandLifecycle(eventId, "completed");
      }
      if (message.type === "control_request") {
        const msg = message;
        const req = msg.request;
        if (msg.request.subtype === "interrupt") {
          if (true) {
            setAppState((prev) => ({
              ...prev,
              attribution: {
                ...prev.attribution,
                escapeCount: prev.attribution.escapeCount + 1
              }
            }));
          }
          if (abortController) {
            abortController.abort();
          }
          suggestionState.abortController?.abort();
          suggestionState.abortController = null;
          suggestionState.lastEmitted = null;
          suggestionState.pendingSuggestion = null;
          sendControlResponseSuccess(msg);
        } else if (req.subtype === "end_session") {
          logForDebugging(`[print.ts] end_session received, reason=${req.reason ?? "unspecified"}`);
          if (abortController) {
            abortController.abort();
          }
          suggestionState.abortController?.abort();
          suggestionState.abortController = null;
          suggestionState.lastEmitted = null;
          suggestionState.pendingSuggestion = null;
          sendControlResponseSuccess(msg);
          break;
        } else if (msg.request.subtype === "initialize") {
          if (msg.request.sdkMcpServers && msg.request.sdkMcpServers.length > 0) {
            for (const serverName of msg.request.sdkMcpServers) {
              sdkMcpConfigs[serverName] = {
                type: "sdk",
                name: serverName
              };
            }
          }
          await handleInitializeRequest(msg.request, msg.request_id, initialized, output, commands, modelInfos, structuredIO, !!options.enableAuthStatus, options, agents, getAppState);
          if (msg.request.promptSuggestions) {
            setAppState((prev) => {
              if (prev.promptSuggestionEnabled)
                return prev;
              return { ...prev, promptSuggestionEnabled: true };
            });
          }
          if (msg.request.agentProgressSummaries && getFeatureValue_CACHED_MAY_BE_STALE("tengu_slate_prism", true)) {
            setSdkAgentProgressSummariesEnabled(true);
          }
          initialized = true;
          if (hasCommandsInQueue()) {
            run();
          }
        } else if (msg.request.subtype === "set_permission_mode") {
          const m = msg.request;
          setAppState((prev) => ({
            ...prev,
            toolPermissionContext: handleSetPermissionMode(m, msg.request_id, prev.toolPermissionContext, output),
            isUltraplanMode: m.ultraplan ?? prev.isUltraplanMode
          }));
        } else if (msg.request.subtype === "set_model") {
          const requestedModel = msg.request.model ?? "default";
          const model = requestedModel === "default" ? getDefaultMainLoopModel() : requestedModel;
          activeUserSpecifiedModel = model;
          setMainLoopModelOverride(model);
          notifySessionMetadataChanged({ model });
          injectModelSwitchBreadcrumbs(requestedModel, model);
          sendControlResponseSuccess(msg);
        } else if (msg.request.subtype === "set_max_thinking_tokens") {
          if (msg.request.max_thinking_tokens === null) {
            options.thinkingConfig = undefined;
          } else if (msg.request.max_thinking_tokens === 0) {
            options.thinkingConfig = { type: "disabled" };
          } else {
            options.thinkingConfig = {
              type: "enabled",
              budgetTokens: msg.request.max_thinking_tokens
            };
          }
          sendControlResponseSuccess(msg);
        } else if (msg.request.subtype === "mcp_status") {
          sendControlResponseSuccess(msg, {
            mcpServers: buildMcpServerStatuses()
          });
        } else if (msg.request.subtype === "get_context_usage") {
          try {
            const appState = getAppState();
            const data = await collectContextData({
              messages: mutableMessages,
              getAppState,
              options: {
                mainLoopModel: getMainLoopModel(),
                tools: buildAllTools(appState),
                agentDefinitions: appState.agentDefinitions,
                customSystemPrompt: options.systemPrompt,
                appendSystemPrompt: options.appendSystemPrompt
              }
            });
            sendControlResponseSuccess(msg, { ...data });
          } catch (error) {
            sendControlResponseError(msg, errorMessage(error));
          }
        } else if (msg.request.subtype === "mcp_message") {
          const mcpRequest = msg.request;
          const sdkClient = sdkClients.find((client) => client.name === mcpRequest.server_name);
          if (sdkClient && sdkClient.type === "connected" && sdkClient.client?.transport?.onmessage) {
            sdkClient.client.transport.onmessage(mcpRequest.message);
          }
          sendControlResponseSuccess(msg);
        } else if (msg.request.subtype === "rewind_files") {
          const appState = getAppState();
          const result = await handleRewindFiles(msg.request.user_message_id, appState, setAppState, msg.request.dry_run ?? false);
          if (result.canRewind || msg.request.dry_run) {
            sendControlResponseSuccess(msg, result);
          } else {
            sendControlResponseError(msg, result.error ?? "Unexpected error");
          }
        } else if (msg.request.subtype === "cancel_async_message") {
          const targetUuid = msg.request.message_uuid;
          const removed = dequeueAllMatching((cmd) => cmd.uuid === targetUuid);
          sendControlResponseSuccess(msg, {
            cancelled: removed.length > 0
          });
        } else if (msg.request.subtype === "seed_read_state") {
          try {
            const normalizedPath = expandPath(msg.request.path);
            const diskMtime = Math.floor((await stat(normalizedPath)).mtimeMs);
            if (diskMtime <= msg.request.mtime) {
              const raw = await readFile2(normalizedPath, "utf-8");
              const content = (raw.charCodeAt(0) === 65279 ? raw.slice(1) : raw).replaceAll(`\r
`, `
`);
              pendingSeeds.set(normalizedPath, {
                content,
                timestamp: diskMtime,
                offset: undefined,
                limit: undefined
              });
            }
          } catch {}
          sendControlResponseSuccess(msg);
        } else if (msg.request.subtype === "mcp_set_servers") {
          const { response, sdkServersChanged } = await applyMcpServerChanges(msg.request.servers);
          sendControlResponseSuccess(msg, response);
          if (sdkServersChanged) {
            updateSdkMcp();
          }
        } else if (msg.request.subtype === "reload_plugins") {
          try {
            if (false) {}
            const r = await refreshActivePlugins(setAppState);
            const sdkAgents = currentAgents.filter((a) => a.source === "flagSettings");
            currentAgents = [...r.agentDefinitions.allAgents, ...sdkAgents];
            let plugins = [];
            const [cmdsR, mcpR, pluginsR] = await Promise.allSettled([
              getCommands(cwd()),
              applyPluginMcpDiff(),
              loadAllPluginsCacheOnly()
            ]);
            if (cmdsR.status === "fulfilled") {
              currentCommands = cmdsR.value;
            } else {
              logError(cmdsR.reason);
            }
            if (mcpR.status === "rejected") {
              logError(mcpR.reason);
            }
            if (pluginsR.status === "fulfilled") {
              plugins = pluginsR.value.enabled.map((p) => ({
                name: p.name,
                path: p.path,
                source: p.source
              }));
            } else {
              logError(pluginsR.reason);
            }
            sendControlResponseSuccess(msg, {
              commands: currentCommands.filter((cmd) => cmd.userInvocable !== false).map((cmd) => ({
                name: getCommandName(cmd),
                description: formatDescriptionWithSource(cmd),
                argumentHint: cmd.argumentHint || ""
              })),
              agents: currentAgents.map((a) => ({
                name: a.agentType,
                description: a.whenToUse,
                model: a.model === "inherit" ? undefined : a.model
              })),
              plugins,
              mcpServers: buildMcpServerStatuses(),
              error_count: r.error_count
            });
          } catch (error) {
            sendControlResponseError(msg, errorMessage(error));
          }
        } else if (msg.request.subtype === "mcp_reconnect") {
          const currentAppState = getAppState();
          const { serverName } = msg.request;
          elicitationRegistered.delete(serverName);
          const config = getMcpConfigByName(serverName) ?? mcpClients.find((c) => c.name === serverName)?.config ?? sdkClients.find((c) => c.name === serverName)?.config ?? dynamicMcpState.clients.find((c) => c.name === serverName)?.config ?? currentAppState.mcp.clients.find((c) => c.name === serverName)?.config ?? null;
          if (!config) {
            sendControlResponseError(msg, `Server not found: ${serverName}`);
          } else {
            const result = await reconnectMcpServerImpl(serverName, config);
            const prefix = getMcpPrefix(serverName);
            setAppState((prev) => ({
              ...prev,
              mcp: {
                ...prev.mcp,
                clients: prev.mcp.clients.map((c) => c.name === serverName ? result.client : c),
                tools: [
                  ...reject_default(prev.mcp.tools, (t) => t.name?.startsWith(prefix)),
                  ...result.tools
                ],
                commands: [
                  ...reject_default(prev.mcp.commands, (c) => commandBelongsToServer(c, serverName)),
                  ...result.commands
                ],
                resources: result.resources && result.resources.length > 0 ? { ...prev.mcp.resources, [serverName]: result.resources } : omit_default(prev.mcp.resources, serverName)
              }
            }));
            dynamicMcpState = {
              ...dynamicMcpState,
              clients: [
                ...dynamicMcpState.clients.filter((c) => c.name !== serverName),
                result.client
              ],
              tools: [
                ...dynamicMcpState.tools.filter((t) => !t.name?.startsWith(prefix)),
                ...result.tools
              ]
            };
            if (result.client.type === "connected") {
              registerElicitationHandlers([result.client]);
              reregisterChannelHandlerAfterReconnect(result.client);
              sendControlResponseSuccess(msg);
            } else {
              const errorMessage2 = result.client.type === "failed" ? result.client.error ?? "Connection failed" : `Server status: ${result.client.type}`;
              sendControlResponseError(msg, errorMessage2);
            }
          }
        } else if (msg.request.subtype === "mcp_toggle") {
          const currentAppState = getAppState();
          const { serverName, enabled } = msg.request;
          elicitationRegistered.delete(serverName);
          const config = getMcpConfigByName(serverName) ?? mcpClients.find((c) => c.name === serverName)?.config ?? sdkClients.find((c) => c.name === serverName)?.config ?? dynamicMcpState.clients.find((c) => c.name === serverName)?.config ?? currentAppState.mcp.clients.find((c) => c.name === serverName)?.config ?? null;
          if (!config) {
            sendControlResponseError(msg, `Server not found: ${serverName}`);
          } else if (!enabled) {
            setMcpServerEnabled(serverName, false);
            const client = [
              ...mcpClients,
              ...sdkClients,
              ...dynamicMcpState.clients,
              ...currentAppState.mcp.clients
            ].find((c) => c.name === serverName);
            if (client && client.type === "connected") {
              await clearServerCache(serverName, config);
            }
            const prefix = getMcpPrefix(serverName);
            setAppState((prev) => ({
              ...prev,
              mcp: {
                ...prev.mcp,
                clients: prev.mcp.clients.map((c) => c.name === serverName ? { name: serverName, type: "disabled", config } : c),
                tools: reject_default(prev.mcp.tools, (t) => t.name?.startsWith(prefix)),
                commands: reject_default(prev.mcp.commands, (c) => commandBelongsToServer(c, serverName)),
                resources: omit_default(prev.mcp.resources, serverName)
              }
            }));
            sendControlResponseSuccess(msg);
          } else {
            setMcpServerEnabled(serverName, true);
            const result = await reconnectMcpServerImpl(serverName, config);
            const prefix = getMcpPrefix(serverName);
            setAppState((prev) => ({
              ...prev,
              mcp: {
                ...prev.mcp,
                clients: prev.mcp.clients.map((c) => c.name === serverName ? result.client : c),
                tools: [
                  ...reject_default(prev.mcp.tools, (t) => t.name?.startsWith(prefix)),
                  ...result.tools
                ],
                commands: [
                  ...reject_default(prev.mcp.commands, (c) => commandBelongsToServer(c, serverName)),
                  ...result.commands
                ],
                resources: result.resources && result.resources.length > 0 ? { ...prev.mcp.resources, [serverName]: result.resources } : omit_default(prev.mcp.resources, serverName)
              }
            }));
            if (result.client.type === "connected") {
              registerElicitationHandlers([result.client]);
              reregisterChannelHandlerAfterReconnect(result.client);
              sendControlResponseSuccess(msg);
            } else {
              const errorMessage2 = result.client.type === "failed" ? result.client.error ?? "Connection failed" : `Server status: ${result.client.type}`;
              sendControlResponseError(msg, errorMessage2);
            }
          }
        } else if (req.subtype === "channel_enable") {
          const currentAppState = getAppState();
          handleChannelEnable(msg.request_id, req.serverName, [
            ...currentAppState.mcp.clients,
            ...sdkClients,
            ...dynamicMcpState.clients
          ], output);
        } else if (req.subtype === "mcp_authenticate") {
          const serverName = req.serverName;
          const currentAppState = getAppState();
          const config = getMcpConfigByName(serverName) ?? mcpClients.find((c) => c.name === serverName)?.config ?? currentAppState.mcp.clients.find((c) => c.name === serverName)?.config ?? null;
          if (!config) {
            sendControlResponseError(msg, `Server not found: ${serverName}`);
          } else if (config.type !== "sse" && config.type !== "http") {
            sendControlResponseError(msg, `Server type "${config.type}" does not support OAuth authentication`);
          } else {
            try {
              activeOAuthFlows.get(serverName)?.abort();
              const controller = new AbortController;
              activeOAuthFlows.set(serverName, controller);
              let resolveAuthUrl;
              const authUrlPromise = new Promise((resolve) => {
                resolveAuthUrl = resolve;
              });
              const oauthPromise = performMCPOAuthFlow(serverName, config, (url) => resolveAuthUrl(url), controller.signal, {
                skipBrowserOpen: true,
                onWaitingForCallback: (submit) => {
                  oauthCallbackSubmitters.set(serverName, submit);
                }
              });
              const authUrl = await Promise.race([
                authUrlPromise,
                oauthPromise.then(() => null)
              ]);
              if (authUrl) {
                sendControlResponseSuccess(msg, {
                  authUrl,
                  requiresUserAction: true
                });
              } else {
                sendControlResponseSuccess(msg, {
                  requiresUserAction: false
                });
              }
              oauthAuthPromises.set(serverName, oauthPromise);
              const fullFlowPromise = oauthPromise.then(async () => {
                if (isMcpServerDisabled(serverName)) {
                  return;
                }
                if (oauthManualCallbackUsed.has(serverName)) {
                  return;
                }
                const result = await reconnectMcpServerImpl(serverName, config);
                const prefix = getMcpPrefix(serverName);
                setAppState((prev) => ({
                  ...prev,
                  mcp: {
                    ...prev.mcp,
                    clients: prev.mcp.clients.map((c) => c.name === serverName ? result.client : c),
                    tools: [
                      ...reject_default(prev.mcp.tools, (t) => t.name?.startsWith(prefix)),
                      ...result.tools
                    ],
                    commands: [
                      ...reject_default(prev.mcp.commands, (c) => commandBelongsToServer(c, serverName)),
                      ...result.commands
                    ],
                    resources: result.resources && result.resources.length > 0 ? {
                      ...prev.mcp.resources,
                      [serverName]: result.resources
                    } : omit_default(prev.mcp.resources, serverName)
                  }
                }));
                dynamicMcpState = {
                  ...dynamicMcpState,
                  clients: [
                    ...dynamicMcpState.clients.filter((c) => c.name !== serverName),
                    result.client
                  ],
                  tools: [
                    ...dynamicMcpState.tools.filter((t) => !t.name?.startsWith(prefix)),
                    ...result.tools
                  ]
                };
              }).catch((error) => {
                logForDebugging(`MCP OAuth failed for ${serverName}: ${error}`, { level: "error" });
              }).finally(() => {
                if (activeOAuthFlows.get(serverName) === controller) {
                  activeOAuthFlows.delete(serverName);
                  oauthCallbackSubmitters.delete(serverName);
                  oauthManualCallbackUsed.delete(serverName);
                  oauthAuthPromises.delete(serverName);
                }
              });
            } catch (error) {
              sendControlResponseError(msg, errorMessage(error));
            }
          }
        } else if (req.subtype === "mcp_oauth_callback_url") {
          const serverName = req.serverName;
          const callbackUrl = req.callbackUrl;
          const submit = oauthCallbackSubmitters.get(serverName);
          if (submit) {
            let hasCodeOrError = false;
            try {
              const parsed = new URL(callbackUrl);
              hasCodeOrError = parsed.searchParams.has("code") || parsed.searchParams.has("error");
            } catch {}
            if (!hasCodeOrError) {
              sendControlResponseError(msg, "Invalid callback URL: missing authorization code. Please paste the full redirect URL including the code parameter.");
            } else {
              oauthManualCallbackUsed.add(serverName);
              submit(callbackUrl);
              const authPromise = oauthAuthPromises.get(serverName);
              if (authPromise) {
                try {
                  await authPromise;
                  sendControlResponseSuccess(msg);
                } catch (error) {
                  sendControlResponseError(msg, error instanceof Error ? error.message : "OAuth authentication failed");
                }
              } else {
                sendControlResponseSuccess(msg);
              }
            }
          } else {
            sendControlResponseError(msg, `No active OAuth flow for server: ${serverName}`);
          }
        } else if (req.subtype === "claude_authenticate") {
          const loginWithClaudeAi = req.loginWithClaudeAi;
          claudeOAuth?.service.cleanup();
          logEvent("tengu_oauth_flow_start", {
            loginWithClaudeAi: loginWithClaudeAi ?? true
          });
          const service = new OAuthService;
          let urlResolver;
          const urlPromise = new Promise((resolve) => {
            urlResolver = resolve;
          });
          const flow = service.startOAuthFlow(async (manualUrl, automaticUrl) => {
            urlResolver({ manualUrl, automaticUrl });
          }, {
            loginWithClaudeAi: loginWithClaudeAi ?? true,
            skipBrowserOpen: true
          }).then(async (tokens) => {
            await installOAuthTokens(tokens);
            logEvent("tengu_oauth_success", {
              loginWithClaudeAi: loginWithClaudeAi ?? true
            });
          }).finally(() => {
            service.cleanup();
            if (claudeOAuth?.service === service) {
              claudeOAuth = null;
            }
          });
          claudeOAuth = { service, flow };
          flow.catch((err) => logForDebugging(`claude_authenticate flow ended: ${err}`, {
            level: "info"
          }));
          try {
            const { manualUrl, automaticUrl } = await Promise.race([
              urlPromise,
              flow.then(() => {
                throw new Error("OAuth flow completed without producing auth URLs");
              })
            ]);
            sendControlResponseSuccess(msg, {
              manualUrl,
              automaticUrl
            });
          } catch (error) {
            sendControlResponseError(msg, errorMessage(error));
          }
        } else if (req.subtype === "claude_oauth_callback" || req.subtype === "claude_oauth_wait_for_completion") {
          if (!claudeOAuth) {
            sendControlResponseError(msg, "No active claude_authenticate flow");
          } else {
            if (req.subtype === "claude_oauth_callback") {
              claudeOAuth.service.handleManualAuthCodeInput({
                authorizationCode: req.authorizationCode,
                state: req.state
              });
            }
            const { flow } = claudeOAuth;
            flow.then(() => {
              const accountInfo = getAccountInformation();
              sendControlResponseSuccess(msg, {
                account: {
                  email: accountInfo?.email,
                  organization: accountInfo?.organization,
                  subscriptionType: accountInfo?.subscription,
                  tokenSource: accountInfo?.tokenSource,
                  apiKeySource: accountInfo?.apiKeySource,
                  apiProvider: getAPIProvider()
                }
              });
            }, (error) => sendControlResponseError(msg, errorMessage(error)));
          }
        } else if (req.subtype === "mcp_clear_auth") {
          const serverName = req.serverName;
          const currentAppState = getAppState();
          const config = getMcpConfigByName(serverName) ?? mcpClients.find((c) => c.name === serverName)?.config ?? currentAppState.mcp.clients.find((c) => c.name === serverName)?.config ?? null;
          if (!config) {
            sendControlResponseError(msg, `Server not found: ${serverName}`);
          } else if (config.type !== "sse" && config.type !== "http") {
            sendControlResponseError(msg, `Cannot clear auth for server type "${config.type}"`);
          } else {
            await revokeServerTokens(serverName, config);
            const result = await reconnectMcpServerImpl(serverName, config);
            const prefix = getMcpPrefix(serverName);
            setAppState((prev) => ({
              ...prev,
              mcp: {
                ...prev.mcp,
                clients: prev.mcp.clients.map((c) => c.name === serverName ? result.client : c),
                tools: [
                  ...reject_default(prev.mcp.tools, (t) => t.name?.startsWith(prefix)),
                  ...result.tools
                ],
                commands: [
                  ...reject_default(prev.mcp.commands, (c) => commandBelongsToServer(c, serverName)),
                  ...result.commands
                ],
                resources: result.resources && result.resources.length > 0 ? {
                  ...prev.mcp.resources,
                  [serverName]: result.resources
                } : omit_default(prev.mcp.resources, serverName)
              }
            }));
            sendControlResponseSuccess(msg, {});
          }
        } else if (msg.request.subtype === "apply_flag_settings") {
          const prevModel = getMainLoopModel();
          const existing = getFlagSettingsInline() ?? {};
          const incoming = msg.request.settings;
          const merged = { ...existing, ...incoming };
          for (const key of Object.keys(merged)) {
            if (merged[key] === null) {
              delete merged[key];
            }
          }
          setFlagSettingsInline(merged);
          settingsChangeDetector.notifyChange("flagSettings");
          if ("model" in incoming) {
            if (incoming.model != null) {
              setMainLoopModelOverride(String(incoming.model));
            } else {
              setMainLoopModelOverride(undefined);
            }
          }
          const newModel = getMainLoopModel();
          if (newModel !== prevModel) {
            activeUserSpecifiedModel = newModel;
            const modelArg = incoming.model ? String(incoming.model) : "default";
            notifySessionMetadataChanged({ model: newModel });
            injectModelSwitchBreadcrumbs(modelArg, newModel);
          }
          sendControlResponseSuccess(msg);
        } else if (msg.request.subtype === "get_settings") {
          const currentAppState = getAppState();
          const model = getMainLoopModel();
          const effort = modelSupportsEffort(model) ? resolveAppliedEffort(model, currentAppState.effortValue) : undefined;
          sendControlResponseSuccess(msg, {
            ...getSettingsWithSources(),
            applied: {
              model,
              effort: typeof effort === "string" ? effort : null
            }
          });
        } else if (msg.request.subtype === "stop_task") {
          const { task_id: taskId } = msg.request;
          try {
            await stopTask(taskId, {
              getAppState,
              setAppState
            });
            sendControlResponseSuccess(msg, {});
          } catch (error) {
            sendControlResponseError(msg, errorMessage(error));
          }
        } else if (req.subtype === "generate_session_title") {
          const description = req.description;
          const persist = req.persist;
          const titleSignal = (abortController && !abortController.signal.aborted ? abortController : createAbortController()).signal;
          (async () => {
            try {
              const title = await generateSessionTitle(description, titleSignal);
              if (title && persist) {
                try {
                  saveAiGeneratedTitle(getSessionId(), title);
                } catch (e) {
                  logError(e);
                }
              }
              sendControlResponseSuccess(msg, { title });
            } catch (e) {
              sendControlResponseError(msg, errorMessage(e));
            }
          })();
        } else if (req.subtype === "side_question") {
          const question = req.question;
          (async () => {
            try {
              const saved = getLastCacheSafeParams();
              const cacheSafeParams = saved ? {
                ...saved,
                toolUseContext: {
                  ...saved.toolUseContext,
                  abortController: createAbortController()
                }
              } : await buildSideQuestionFallbackParams({
                tools: buildAllTools(getAppState()),
                commands: currentCommands,
                mcpClients: [
                  ...getAppState().mcp.clients,
                  ...sdkClients,
                  ...dynamicMcpState.clients
                ],
                messages: mutableMessages,
                readFileState,
                getAppState,
                setAppState,
                customSystemPrompt: options.systemPrompt,
                appendSystemPrompt: options.appendSystemPrompt,
                thinkingConfig: options.thinkingConfig,
                agents: currentAgents
              });
              const result = await runSideQuestion({
                question,
                cacheSafeParams
              });
              sendControlResponseSuccess(msg, { response: result.response });
            } catch (e) {
              sendControlResponseError(msg, errorMessage(e));
            }
          })();
        } else if (msg.request.subtype === "set_proactive") {
          const req2 = msg.request;
          if (req2.enabled) {
            if (!proactiveModule.isProactiveActive()) {
              proactiveModule.activateProactive("command");
              scheduleProactiveTick();
            }
          } else {
            proactiveModule.deactivateProactive();
          }
          sendControlResponseSuccess(msg);
        } else if (req.subtype === "remote_control") {
          if (req.enabled) {
            if (bridgeHandle) {
              sendControlResponseSuccess(msg, {
                session_url: getRemoteSessionUrl(bridgeHandle.bridgeSessionId, bridgeHandle.sessionIngressUrl),
                connect_url: buildBridgeConnectUrl(bridgeHandle.environmentId, bridgeHandle.sessionIngressUrl),
                environment_id: bridgeHandle.environmentId
              });
            } else {
              let bridgeFailureDetail;
              try {
                const { initReplBridge } = await import("src/bridge/initReplBridge.js");
                const handle = await initReplBridge({
                  onInboundMessage(msg2) {
                    const fields = extractInboundMessageFields(msg2);
                    if (!fields)
                      return;
                    const { content, uuid } = fields;
                    enqueue({
                      value: content,
                      mode: "prompt",
                      uuid,
                      skipSlashCommands: true
                    });
                    run();
                  },
                  onPermissionResponse(response) {
                    structuredIO.injectControlResponse(response);
                  },
                  onInterrupt() {
                    abortController?.abort();
                  },
                  onSetModel(model) {
                    const resolved = model === "default" ? getDefaultMainLoopModel() : model;
                    activeUserSpecifiedModel = resolved;
                    setMainLoopModelOverride(resolved);
                  },
                  onSetMaxThinkingTokens(maxTokens) {
                    if (maxTokens === null) {
                      options.thinkingConfig = undefined;
                    } else if (maxTokens === 0) {
                      options.thinkingConfig = { type: "disabled" };
                    } else {
                      options.thinkingConfig = {
                        type: "enabled",
                        budgetTokens: maxTokens
                      };
                    }
                  },
                  onStateChange(state, detail) {
                    if (state === "failed") {
                      bridgeFailureDetail = detail;
                    }
                    logForDebugging(`[bridge:sdk] State change: ${state}${detail ? ` \u2014 ${detail}` : ""}`);
                    output.enqueue({
                      type: "system",
                      subtype: "bridge_state",
                      state,
                      detail,
                      uuid: randomUUID3(),
                      session_id: getSessionId()
                    });
                  },
                  initialMessages: mutableMessages.length > 0 ? mutableMessages : undefined
                });
                if (!handle) {
                  sendControlResponseError(msg, bridgeFailureDetail ?? "Remote Control initialization failed");
                } else {
                  bridgeHandle = handle;
                  bridgeLastForwardedIndex = mutableMessages.length;
                  structuredIO.setOnControlRequestSent((request) => {
                    handle.sendControlRequest(request);
                  });
                  structuredIO.setOnControlRequestResolved((requestId) => {
                    handle.sendControlCancelRequest(requestId);
                  });
                  sendControlResponseSuccess(msg, {
                    session_url: getRemoteSessionUrl(handle.bridgeSessionId, handle.sessionIngressUrl),
                    connect_url: buildBridgeConnectUrl(handle.environmentId, handle.sessionIngressUrl),
                    environment_id: handle.environmentId
                  });
                }
              } catch (err) {
                sendControlResponseError(msg, errorMessage(err));
              }
            }
          } else {
            if (bridgeHandle) {
              structuredIO.setOnControlRequestSent(undefined);
              structuredIO.setOnControlRequestResolved(undefined);
              await bridgeHandle.teardown();
              bridgeHandle = null;
            }
            sendControlResponseSuccess(msg);
          }
        } else {
          sendControlResponseError(msg, `Unsupported control request subtype: ${msg.request.subtype}`);
        }
        continue;
      } else if (message.type === "control_response") {
        if (options.replayUserMessages) {
          output.enqueue(message);
        }
        continue;
      } else if (message.type === "keep_alive") {
        continue;
      } else if (message.type === "update_environment_variables") {
        continue;
      } else if (message.type === "assistant" || message.type === "system") {
        const internalMsgs = toInternalMessages([message]);
        mutableMessages.push(...internalMsgs);
        if (message.type === "assistant" && options.replayUserMessages) {
          output.enqueue(message);
        }
        continue;
      }
      if (message.type !== "user") {
        continue;
      }
      const userMsg = message;
      initialized = true;
      if (userMsg.uuid) {
        const sessionId = getSessionId();
        const existsInSession = await doesMessageExistInSession(sessionId, userMsg.uuid);
        if (existsInSession || receivedMessageUuids.has(userMsg.uuid)) {
          logForDebugging(`Skipping duplicate user message: ${userMsg.uuid}`);
          if (options.replayUserMessages) {
            logForDebugging(`Sending acknowledgment for duplicate user message: ${userMsg.uuid}`);
            output.enqueue({
              type: "user",
              content: userMsg.message?.content ?? "",
              message: userMsg.message,
              session_id: sessionId,
              parent_tool_use_id: null,
              uuid: userMsg.uuid,
              timestamp: userMsg.timestamp,
              isReplay: true
            });
          }
          if (existsInSession) {
            notifyCommandLifecycle(userMsg.uuid, "completed");
          }
          continue;
        }
        trackReceivedMessageUuid(userMsg.uuid);
      }
      enqueue({
        mode: "prompt",
        value: await resolveAndPrepend(userMsg, userMsg.message.content),
        uuid: userMsg.uuid,
        priority: userMsg.priority
      });
      if (true) {
        setAppState((prev) => ({
          ...prev,
          attribution: incrementPromptCount(prev.attribution, (snapshot) => {
            recordAttributionSnapshot(snapshot).catch((error) => {
              logForDebugging(`Attribution: Failed to save snapshot: ${error}`);
            });
          })
        }));
      }
      run();
    }
    inputClosed = true;
    cronScheduler?.stop();
    if (!running) {
      if (suggestionState.inflightPromise) {
        await Promise.race([suggestionState.inflightPromise, sleep(5000)]);
      }
      suggestionState.abortController?.abort();
      suggestionState.abortController = null;
      await finalizePendingAsyncHooks();
      unsubscribeSkillChanges();
      unsubscribeAuthStatus?.();
      statusListeners.delete(rateLimitListener);
      output.done();
    }
  })();
  return output;
}
function createCanUseToolWithPermissionPrompt(permissionPromptTool) {
  const canUseTool = async (tool, input, toolUseContext, assistantMessage, toolUseId, forceDecision) => {
    const mainPermissionResult = forceDecision ?? await hasPermissionsToUseTool(tool, input, toolUseContext, assistantMessage, toolUseId);
    if (mainPermissionResult.behavior === "allow" || mainPermissionResult.behavior === "deny") {
      return mainPermissionResult;
    }
    const { signal: combinedSignal, cleanup: cleanupAbortListener } = createCombinedAbortSignal(toolUseContext.abortController.signal);
    if (combinedSignal.aborted) {
      cleanupAbortListener();
      return {
        behavior: "deny",
        message: "Permission prompt was aborted.",
        decisionReason: {
          type: "permissionPromptTool",
          permissionPromptToolName: tool.name,
          toolResult: undefined
        }
      };
    }
    const abortPromise = new Promise((resolve) => {
      combinedSignal.addEventListener("abort", () => resolve("aborted"), {
        once: true
      });
    });
    const toolCallPromise = permissionPromptTool.call({
      tool_name: tool.name,
      input,
      tool_use_id: toolUseId
    }, toolUseContext, canUseTool, assistantMessage);
    const raceResult = await Promise.race([toolCallPromise, abortPromise]);
    cleanupAbortListener();
    if (raceResult === "aborted" || combinedSignal.aborted) {
      return {
        behavior: "deny",
        message: "Permission prompt was aborted.",
        decisionReason: {
          type: "permissionPromptTool",
          permissionPromptToolName: tool.name,
          toolResult: undefined
        }
      };
    }
    const result = raceResult;
    const permissionToolResultBlockParam = permissionPromptTool.mapToolResultToToolResultBlockParam(result.data, "1");
    if (!permissionToolResultBlockParam.content || !Array.isArray(permissionToolResultBlockParam.content) || !permissionToolResultBlockParam.content[0] || permissionToolResultBlockParam.content[0].type !== "text" || typeof permissionToolResultBlockParam.content[0].text !== "string") {
      throw new Error('Permission prompt tool returned an invalid result. Expected a single text block param with type="text" and a string text value.');
    }
    return permissionPromptToolResultToPermissionDecision(outputSchema().parse(safeParseJSON(permissionToolResultBlockParam.content[0].text)), permissionPromptTool, input, toolUseContext);
  };
  return canUseTool;
}
function getCanUseToolFn(permissionPromptToolName, structuredIO, getMcpTools, onPermissionPrompt) {
  if (permissionPromptToolName === "stdio") {
    return structuredIO.createCanUseTool(onPermissionPrompt);
  }
  if (!permissionPromptToolName) {
    return async (tool, input, toolUseContext, assistantMessage, toolUseId, forceDecision) => forceDecision ?? await hasPermissionsToUseTool(tool, input, toolUseContext, assistantMessage, toolUseId);
  }
  let resolved = null;
  return async (tool, input, toolUseContext, assistantMessage, toolUseId, forceDecision) => {
    if (!resolved) {
      const mcpTools = getMcpTools();
      const permissionPromptTool = mcpTools.find((t) => toolMatchesName(t, permissionPromptToolName));
      if (!permissionPromptTool) {
        const error = `Error: MCP tool ${permissionPromptToolName} (passed via --permission-prompt-tool) not found. Available MCP tools: ${mcpTools.map((t) => t.name).join(", ") || "none"}`;
        process.stderr.write(`${error}
`);
        gracefulShutdownSync(1);
        throw new Error(error);
      }
      if (!permissionPromptTool.inputJSONSchema) {
        const error = `Error: tool ${permissionPromptToolName} (passed via --permission-prompt-tool) must be an MCP tool`;
        process.stderr.write(`${error}
`);
        gracefulShutdownSync(1);
        throw new Error(error);
      }
      resolved = createCanUseToolWithPermissionPrompt(permissionPromptTool);
    }
    return resolved(tool, input, toolUseContext, assistantMessage, toolUseId, forceDecision);
  };
}
async function handleInitializeRequest(request, requestId, initialized, output, commands, modelInfos, structuredIO, enableAuthStatus, options, agents, getAppState) {
  if (initialized) {
    output.enqueue({
      type: "control_response",
      response: {
        subtype: "error",
        error: "Already initialized",
        request_id: requestId,
        pending_permission_requests: structuredIO.getPendingPermissionRequests()
      }
    });
    return;
  }
  if (request.systemPrompt !== undefined) {
    options.systemPrompt = request.systemPrompt;
  }
  if (request.appendSystemPrompt !== undefined) {
    options.appendSystemPrompt = request.appendSystemPrompt;
  }
  if (request.promptSuggestions !== undefined) {
    options.promptSuggestions = request.promptSuggestions;
  }
  if (request.agents) {
    const stdinAgents = parseAgentsFromJson(request.agents, "flagSettings");
    agents.push(...stdinAgents);
  }
  if (options.agent) {
    const alreadyResolved = getMainThreadAgentType() === options.agent;
    const mainThreadAgent = agents.find((a) => a.agentType === options.agent);
    if (mainThreadAgent && !alreadyResolved) {
      setMainThreadAgentType(mainThreadAgent.agentType);
      if (!options.systemPrompt && !isBuiltInAgent(mainThreadAgent)) {
        const agentSystemPrompt = mainThreadAgent.getSystemPrompt();
        if (agentSystemPrompt) {
          options.systemPrompt = agentSystemPrompt;
        }
      }
      if (!options.userSpecifiedModel && mainThreadAgent.model && mainThreadAgent.model !== "inherit") {
        const agentModel = parseUserSpecifiedModel(mainThreadAgent.model);
        setMainLoopModelOverride(agentModel);
      }
      if (mainThreadAgent.initialPrompt) {
        structuredIO.prependUserMessage(mainThreadAgent.initialPrompt);
      }
    } else if (mainThreadAgent?.initialPrompt) {
      structuredIO.prependUserMessage(mainThreadAgent.initialPrompt);
    }
  }
  const settings = getSettings_DEPRECATED();
  const outputStyle = settings?.outputStyle || DEFAULT_OUTPUT_STYLE_NAME;
  const availableOutputStyles = await getAllOutputStyles(getCwd());
  const accountInfo = getAccountInformation();
  if (request.hooks) {
    const hooks = {};
    for (const [event, matchers] of Object.entries(request.hooks)) {
      hooks[event] = matchers.map((matcher) => {
        const callbacks = matcher.hookCallbackIds.map((callbackId) => {
          return structuredIO.createHookCallback(callbackId, matcher.timeout);
        });
        return {
          matcher: matcher.matcher,
          hooks: callbacks
        };
      });
    }
    registerHookCallbacks(hooks);
  }
  if (request.jsonSchema) {
    setInitJsonSchema(request.jsonSchema);
  }
  const initResponse = {
    commands: commands.filter((cmd) => cmd.userInvocable !== false).map((cmd) => ({
      name: getCommandName(cmd),
      description: formatDescriptionWithSource(cmd),
      argumentHint: cmd.argumentHint || ""
    })),
    agents: agents.map((agent) => ({
      name: agent.agentType,
      description: agent.whenToUse,
      model: agent.model === "inherit" ? undefined : agent.model
    })),
    output_style: outputStyle,
    available_output_styles: Object.keys(availableOutputStyles),
    models: modelInfos,
    account: {
      email: accountInfo?.email,
      organization: accountInfo?.organization,
      subscriptionType: accountInfo?.subscription,
      tokenSource: accountInfo?.tokenSource,
      apiKeySource: accountInfo?.apiKeySource,
      apiProvider: getAPIProvider()
    },
    pid: process.pid
  };
  if (isFastModeEnabled() && isFastModeAvailable()) {
    const appState = getAppState();
    initResponse.fast_mode_state = getFastModeState(options.userSpecifiedModel ?? null, appState.fastMode);
  }
  output.enqueue({
    type: "control_response",
    response: {
      subtype: "success",
      request_id: requestId,
      response: initResponse
    }
  });
  if (enableAuthStatus) {
    const authStatusManager = AwsAuthStatusManager.getInstance();
    const status = authStatusManager.getStatus();
    if (status) {
      output.enqueue({
        type: "auth_status",
        isAuthenticating: status.isAuthenticating,
        output: status.output,
        error: status.error,
        uuid: randomUUID3(),
        session_id: getSessionId()
      });
    }
  }
}
async function handleRewindFiles(userMessageId, appState, setAppState, dryRun) {
  if (!fileHistoryEnabled()) {
    return {
      canRewind: false,
      error: "File rewinding is not enabled.",
      filesChanged: []
    };
  }
  if (!fileHistoryCanRestore(appState.fileHistory, userMessageId)) {
    return {
      canRewind: false,
      error: "No file checkpoint found for this message.",
      filesChanged: []
    };
  }
  if (dryRun) {
    const diffStats = await fileHistoryGetDiffStats(appState.fileHistory, userMessageId);
    return {
      canRewind: true,
      filesChanged: diffStats?.filesChanged ?? [],
      insertions: diffStats?.insertions,
      deletions: diffStats?.deletions
    };
  }
  try {
    await fileHistoryRewind((updater) => setAppState((prev) => ({
      ...prev,
      fileHistory: updater(prev.fileHistory)
    })), userMessageId);
  } catch (error) {
    return {
      canRewind: false,
      error: `Failed to rewind: ${errorMessage(error)}`,
      filesChanged: []
    };
  }
  return { canRewind: true, filesChanged: [] };
}
function handleSetPermissionMode(request, requestId, toolPermissionContext, output) {
  if (request.mode === "bypassPermissions") {
    if (isBypassPermissionsModeDisabled()) {
      output.enqueue({
        type: "control_response",
        response: {
          subtype: "error",
          request_id: requestId,
          error: "Cannot set permission mode to bypassPermissions because it is disabled by settings or configuration"
        }
      });
      return toolPermissionContext;
    }
    if (!toolPermissionContext.isBypassPermissionsModeAvailable) {
      output.enqueue({
        type: "control_response",
        response: {
          subtype: "error",
          request_id: requestId,
          error: "Cannot set permission mode to bypassPermissions because the session was not launched with --dangerously-skip-permissions"
        }
      });
      return toolPermissionContext;
    }
  }
  if (request.mode === "auto" && !isAutoModeGateEnabled()) {
    const reason = getAutoModeUnavailableReason();
    output.enqueue({
      type: "control_response",
      response: {
        subtype: "error",
        request_id: requestId,
        error: reason ? `Cannot set permission mode to auto: ${getAutoModeUnavailableNotification(reason)}` : "Cannot set permission mode to auto"
      }
    });
    return toolPermissionContext;
  }
  output.enqueue({
    type: "control_response",
    response: {
      subtype: "success",
      request_id: requestId,
      response: {
        mode: request.mode
      }
    }
  });
  return {
    ...transitionPermissionMode(toolPermissionContext.mode, request.mode, toolPermissionContext),
    mode: request.mode
  };
}
function handleChannelEnable(requestId, serverName, connectionPool, output) {
  const respondError = (error) => output.enqueue({
    type: "control_response",
    response: { subtype: "error", request_id: requestId, error }
  });
  if (false) {}
  const connection = connectionPool.find((c) => c.name === serverName && c.type === "connected");
  if (!connection || connection.type !== "connected") {
    return respondError(`server ${serverName} is not connected`);
  }
  const pluginSource = connection.config.pluginSource;
  const parsed = pluginSource ? parsePluginIdentifier(pluginSource) : undefined;
  if (!parsed?.marketplace) {
    return respondError(`server ${serverName} is not plugin-sourced; channel_enable requires a marketplace plugin`);
  }
  const entry = {
    kind: "plugin",
    name: parsed.name,
    marketplace: parsed.marketplace
  };
  const prior = getAllowedChannels();
  const already = prior.some((e) => e.kind === "plugin" && e.name === entry.name && e.marketplace === entry.marketplace);
  if (!already)
    setAllowedChannels([...prior, entry]);
  const gate = gateChannelServer(serverName, connection.capabilities, pluginSource);
  if (gate.action === "skip") {
    if (!already)
      setAllowedChannels(prior);
    return respondError(gate.reason);
  }
  const pluginId = `${entry.name}@${entry.marketplace}`;
  logMCPDebug(serverName, "Channel notifications registered");
  logEvent("tengu_mcp_channel_enable", { plugin: pluginId });
  connection.client.setNotificationHandler(ChannelMessageNotificationSchema(), async (notification) => {
    const { content, meta } = notification.params;
    logMCPDebug(serverName, `notifications/claude/channel: ${content.slice(0, 80)}`);
    logEvent("tengu_mcp_channel_message", {
      content_length: content.length,
      meta_key_count: Object.keys(meta ?? {}).length,
      entry_kind: "plugin",
      is_dev: false,
      plugin: pluginId
    });
    enqueue({
      mode: "prompt",
      value: wrapChannelMessage(serverName, content, meta),
      priority: "next",
      isMeta: true,
      origin: { kind: "channel", server: serverName },
      skipSlashCommands: true
    });
  });
  output.enqueue({
    type: "control_response",
    response: {
      subtype: "success",
      request_id: requestId,
      response: undefined
    }
  });
}
function reregisterChannelHandlerAfterReconnect(connection) {
  if (connection.type !== "connected")
    return;
  const gate = gateChannelServer(connection.name, connection.capabilities, connection.config.pluginSource);
  if (gate.action !== "register")
    return;
  const entry = findChannelEntry(connection.name, getAllowedChannels());
  const pluginId = entry?.kind === "plugin" ? `${entry.name}@${entry.marketplace}` : undefined;
  logMCPDebug(connection.name, "Channel notifications re-registered after reconnect");
  connection.client.setNotificationHandler(ChannelMessageNotificationSchema(), async (notification) => {
    const { content, meta } = notification.params;
    logMCPDebug(connection.name, `notifications/claude/channel: ${content.slice(0, 80)}`);
    logEvent("tengu_mcp_channel_message", {
      content_length: content.length,
      meta_key_count: Object.keys(meta ?? {}).length,
      entry_kind: entry?.kind,
      is_dev: entry?.dev ?? false,
      plugin: pluginId
    });
    enqueue({
      mode: "prompt",
      value: wrapChannelMessage(connection.name, content, meta),
      priority: "next",
      isMeta: true,
      origin: {
        kind: "channel",
        server: connection.name
      },
      skipSlashCommands: true
    });
  });
}
function emitLoadError(message, outputFormat) {
  if (outputFormat === "stream-json") {
    const errorResult = {
      type: "result",
      subtype: "error_during_execution",
      duration_ms: 0,
      duration_api_ms: 0,
      is_error: true,
      num_turns: 0,
      stop_reason: null,
      session_id: getSessionId(),
      total_cost_usd: 0,
      usage: EMPTY_USAGE,
      modelUsage: {},
      permission_denials: [],
      uuid: randomUUID3(),
      errors: [message]
    };
    process.stdout.write(jsonStringify(errorResult) + `
`);
  } else {
    process.stderr.write(message + `
`);
  }
}
function removeInterruptedMessage(messages, interruptedUserMessage) {
  const idx = messages.findIndex((m) => m.uuid === interruptedUserMessage.uuid);
  if (idx !== -1) {
    messages.splice(idx, 2);
  }
}
async function loadInitialMessages(setAppState, options) {
  const persistSession = !isSessionPersistenceDisabled();
  if (options.continue) {
    try {
      logEvent("tengu_continue_print", {});
      const result = await loadConversationForResume(undefined, undefined);
      if (result) {
        if (coordinatorModeModule) {
          const warning = coordinatorModeModule.matchSessionMode(result.mode);
          if (warning) {
            process.stderr.write(warning + `
`);
            const {
              getAgentDefinitionsWithOverrides,
              getActiveAgentsFromList
            } = (init_loadAgentsDir(), __toCommonJS(exports_loadAgentsDir));
            getAgentDefinitionsWithOverrides.cache.clear?.();
            const freshAgentDefs = await getAgentDefinitionsWithOverrides(getCwd());
            setAppState((prev) => ({
              ...prev,
              agentDefinitions: {
                ...freshAgentDefs,
                allAgents: freshAgentDefs.allAgents,
                activeAgents: getActiveAgentsFromList(freshAgentDefs.allAgents)
              }
            }));
          }
        }
        if (!options.forkSession) {
          if (result.sessionId) {
            switchSession(asSessionId(result.sessionId), result.fullPath ? dirname(result.fullPath) : null);
            if (persistSession) {
              await resetSessionFilePointer();
            }
          }
        }
        restoreSessionStateFromLog(result, setAppState);
        restoreSessionMetadata(options.forkSession ? { ...result, worktreeSession: undefined } : result);
        if (coordinatorModeModule) {
          saveMode(coordinatorModeModule.isCoordinatorMode() ? "coordinator" : "normal");
        }
        return {
          messages: result.messages,
          turnInterruptionState: result.turnInterruptionState,
          agentSetting: result.agentSetting
        };
      }
    } catch (error) {
      logError(error);
      gracefulShutdownSync(1);
      return { messages: [] };
    }
  }
  if (options.teleport) {
    try {
      if (!isPolicyAllowed("allow_remote_sessions")) {
        throw new Error("Remote sessions are disabled by your organization's policy.");
      }
      logEvent("tengu_teleport_print", {});
      if (typeof options.teleport !== "string") {
        throw new Error("No session ID provided for teleport");
      }
      const {
        checkOutTeleportedSessionBranch,
        processMessagesForTeleportResume,
        teleportResumeCodeSession,
        validateGitState
      } = await import("./chunk-c3xq2ba7.js");
      await validateGitState();
      const teleportResult = await teleportResumeCodeSession(options.teleport);
      const { branchError } = await checkOutTeleportedSessionBranch(teleportResult.branch);
      return {
        messages: processMessagesForTeleportResume(teleportResult.log, branchError)
      };
    } catch (error) {
      logError(error);
      gracefulShutdownSync(1);
      return { messages: [] };
    }
  }
  if (options.resume) {
    try {
      logEvent("tengu_resume_print", {});
      const parsedSessionId = parseSessionIdentifier(typeof options.resume === "string" ? options.resume : "");
      if (!parsedSessionId) {
        let errorMessage2 = "Error: --resume requires a valid session ID when used with --print. Usage: claude -p --resume <session-id>";
        if (typeof options.resume === "string") {
          errorMessage2 += `. Session IDs must be in UUID format (e.g., 550e8400-e29b-41d4-a716-446655440000). Provided value "${options.resume}" is not a valid UUID`;
        }
        emitLoadError(errorMessage2, options.outputFormat);
        gracefulShutdownSync(1);
        return { messages: [] };
      }
      if (isEnvTruthy(process.env.CLAUDE_CODE_USE_CCR_V2)) {
        const [, metadata] = await Promise.all([
          hydrateFromCCRv2InternalEvents(parsedSessionId.sessionId),
          options.restoredWorkerState
        ]);
        if (metadata) {
          setAppState(externalMetadataToAppState(metadata));
          if (typeof metadata.model === "string") {
            setMainLoopModelOverride(metadata.model);
          }
        }
      } else if (parsedSessionId.isUrl && parsedSessionId.ingressUrl && isEnvTruthy(process.env.ENABLE_SESSION_PERSISTENCE)) {
        await hydrateRemoteSession(parsedSessionId.sessionId, parsedSessionId.ingressUrl);
      }
      const result = await loadConversationForResume(parsedSessionId.sessionId, parsedSessionId.jsonlFile || undefined);
      if (!result || result.messages.length === 0) {
        if (parsedSessionId.isUrl || isEnvTruthy(process.env.CLAUDE_CODE_USE_CCR_V2)) {
          return {
            messages: await (options.sessionStartHooksPromise ?? processSessionStartHooks("startup"))
          };
        } else {
          emitLoadError(`No conversation found with session ID: ${parsedSessionId.sessionId}`, options.outputFormat);
          gracefulShutdownSync(1);
          return { messages: [] };
        }
      }
      if (options.resumeSessionAt) {
        const index = result.messages.findIndex((m) => m.uuid === options.resumeSessionAt);
        if (index < 0) {
          emitLoadError(`No message found with message.uuid of: ${options.resumeSessionAt}`, options.outputFormat);
          gracefulShutdownSync(1);
          return { messages: [] };
        }
        result.messages = index >= 0 ? result.messages.slice(0, index + 1) : [];
      }
      if (coordinatorModeModule) {
        const warning = coordinatorModeModule.matchSessionMode(result.mode);
        if (warning) {
          process.stderr.write(warning + `
`);
          const { getAgentDefinitionsWithOverrides, getActiveAgentsFromList } = (init_loadAgentsDir(), __toCommonJS(exports_loadAgentsDir));
          getAgentDefinitionsWithOverrides.cache.clear?.();
          const freshAgentDefs = await getAgentDefinitionsWithOverrides(getCwd());
          setAppState((prev) => ({
            ...prev,
            agentDefinitions: {
              ...freshAgentDefs,
              allAgents: freshAgentDefs.allAgents,
              activeAgents: getActiveAgentsFromList(freshAgentDefs.allAgents)
            }
          }));
        }
      }
      if (!options.forkSession && result.sessionId) {
        switchSession(asSessionId(result.sessionId), result.fullPath ? dirname(result.fullPath) : null);
        if (persistSession) {
          await resetSessionFilePointer();
        }
      }
      restoreSessionStateFromLog(result, setAppState);
      restoreSessionMetadata(options.forkSession ? { ...result, worktreeSession: undefined } : result);
      if (coordinatorModeModule) {
        saveMode(coordinatorModeModule.isCoordinatorMode() ? "coordinator" : "normal");
      }
      return {
        messages: result.messages,
        turnInterruptionState: result.turnInterruptionState,
        agentSetting: result.agentSetting
      };
    } catch (error) {
      logError(error);
      const errorMessage2 = error instanceof Error ? `Failed to resume session: ${error.message}` : "Failed to resume session with --print mode";
      emitLoadError(errorMessage2, options.outputFormat);
      gracefulShutdownSync(1);
      return { messages: [] };
    }
  }
  return {
    messages: await (options.sessionStartHooksPromise ?? processSessionStartHooks("startup"))
  };
}
function getStructuredIO(inputPrompt, options) {
  let inputStream;
  if (typeof inputPrompt === "string") {
    if (inputPrompt.trim() !== "") {
      inputStream = fromArray([
        jsonStringify({
          type: "user",
          content: inputPrompt,
          uuid: "",
          session_id: "",
          message: {
            role: "user",
            content: inputPrompt
          },
          parent_tool_use_id: null
        })
      ]);
    } else {
      inputStream = fromArray([]);
    }
  } else {
    inputStream = inputPrompt;
  }
  return options.sdkUrl ? new RemoteIO(options.sdkUrl, inputStream, options.replayUserMessages) : new StructuredIO(inputStream, options.replayUserMessages);
}
async function handleOrphanedPermissionResponse({
  message,
  setAppState: _setAppState,
  onEnqueued,
  handledToolUseIds
}) {
  const responseInner = message.response;
  if (responseInner?.subtype === "success" && responseInner.response?.toolUseID && typeof responseInner.response.toolUseID === "string") {
    const permissionResult = responseInner.response;
    const toolUseID = permissionResult.toolUseID;
    if (!toolUseID) {
      return false;
    }
    logForDebugging(`handleOrphanedPermissionResponse: received orphaned control_response for toolUseID=${toolUseID} request_id=${responseInner.request_id}`);
    if (handledToolUseIds.has(toolUseID)) {
      logForDebugging(`handleOrphanedPermissionResponse: skipping duplicate orphaned permission for toolUseID=${toolUseID} (already handled)`);
      return false;
    }
    const assistantMessage = await findUnresolvedToolUse(toolUseID);
    if (!assistantMessage) {
      logForDebugging(`handleOrphanedPermissionResponse: no unresolved tool_use found for toolUseID=${toolUseID} (already resolved in transcript)`);
      return false;
    }
    handledToolUseIds.add(toolUseID);
    logForDebugging(`handleOrphanedPermissionResponse: enqueuing orphaned permission for toolUseID=${toolUseID} messageID=${assistantMessage.message.id}`);
    enqueue({
      mode: "orphaned-permission",
      value: [],
      orphanedPermission: {
        permissionResult,
        assistantMessage
      }
    });
    onEnqueued?.();
    return true;
  }
  return false;
}
function toScopedConfig(config) {
  return { ...config, scope: "dynamic" };
}
async function handleMcpSetServers(servers, sdkState, dynamicState, setAppState) {
  const { allowed: allowedServers, blocked } = filterMcpServersByPolicy(servers);
  const policyErrors = {};
  for (const name of blocked) {
    policyErrors[name] = "Blocked by enterprise policy (allowedMcpServers/deniedMcpServers)";
  }
  const sdkServers = {};
  const processServers = {};
  for (const [name, config] of Object.entries(allowedServers)) {
    if (config.type === "sdk") {
      sdkServers[name] = config;
    } else {
      processServers[name] = config;
    }
  }
  const currentSdkNames = new Set(Object.keys(sdkState.configs));
  const newSdkNames = new Set(Object.keys(sdkServers));
  const sdkAdded = [];
  const sdkRemoved = [];
  const newSdkConfigs = { ...sdkState.configs };
  let newSdkClients = [...sdkState.clients];
  let newSdkTools = [...sdkState.tools];
  for (const name of currentSdkNames) {
    if (!newSdkNames.has(name)) {
      const client = newSdkClients.find((c) => c.name === name);
      if (client && client.type === "connected") {
        await client.cleanup();
      }
      newSdkClients = newSdkClients.filter((c) => c.name !== name);
      const prefix = `mcp__${name}__`;
      newSdkTools = newSdkTools.filter((t) => !t.name.startsWith(prefix));
      delete newSdkConfigs[name];
      sdkRemoved.push(name);
    }
  }
  for (const [name, config] of Object.entries(sdkServers)) {
    if (!currentSdkNames.has(name)) {
      newSdkConfigs[name] = config;
      const pendingClient = {
        type: "pending",
        name,
        config: { ...config, scope: "dynamic" }
      };
      newSdkClients = [...newSdkClients, pendingClient];
      sdkAdded.push(name);
    }
  }
  const processResult = await reconcileMcpServers(processServers, dynamicState, setAppState);
  return {
    response: {
      added: [...sdkAdded, ...processResult.response.added],
      removed: [...sdkRemoved, ...processResult.response.removed],
      errors: { ...policyErrors, ...processResult.response.errors }
    },
    newSdkState: {
      configs: newSdkConfigs,
      clients: newSdkClients,
      tools: newSdkTools
    },
    newDynamicState: processResult.newState,
    sdkServersChanged: sdkAdded.length > 0 || sdkRemoved.length > 0
  };
}
async function reconcileMcpServers(desiredConfigs, currentState, setAppState) {
  const currentNames = new Set(Object.keys(currentState.configs));
  const desiredNames = new Set(Object.keys(desiredConfigs));
  const toRemove = [...currentNames].filter((n) => !desiredNames.has(n));
  const toAdd = [...desiredNames].filter((n) => !currentNames.has(n));
  const toCheck = [...currentNames].filter((n) => desiredNames.has(n));
  const toReplace = toCheck.filter((name) => {
    const currentConfig = currentState.configs[name];
    const desiredConfigRaw = desiredConfigs[name];
    if (!currentConfig || !desiredConfigRaw)
      return true;
    const desiredConfig = toScopedConfig(desiredConfigRaw);
    return !areMcpConfigsEqual(currentConfig, desiredConfig);
  });
  const removed = [];
  const added = [];
  const errors = {};
  let newClients = [...currentState.clients];
  let newTools = [...currentState.tools];
  for (const name of [...toRemove, ...toReplace]) {
    const client = newClients.find((c) => c.name === name);
    const config = currentState.configs[name];
    if (client && config) {
      if (client.type === "connected") {
        try {
          await client.cleanup();
        } catch (e) {
          logError(e);
        }
      }
      await clearServerCache(name, config);
    }
    const prefix = `mcp__${name}__`;
    newTools = newTools.filter((t) => !t.name.startsWith(prefix));
    newClients = newClients.filter((c) => c.name !== name);
    if (toRemove.includes(name)) {
      removed.push(name);
    }
  }
  for (const name of [...toAdd, ...toReplace]) {
    const config = desiredConfigs[name];
    if (!config)
      continue;
    const scopedConfig = toScopedConfig(config);
    if (config.type === "sdk") {
      added.push(name);
      continue;
    }
    try {
      const client = await connectToServer(name, scopedConfig);
      newClients.push(client);
      if (client.type === "connected") {
        const serverTools = await fetchToolsForClient(client);
        newTools.push(...serverTools);
      } else if (client.type === "failed") {
        errors[name] = client.error || "Connection failed";
      }
      added.push(name);
    } catch (e) {
      const err = toError(e);
      errors[name] = err.message;
      logError(err);
    }
  }
  const newConfigs = {};
  for (const name of desiredNames) {
    const config = desiredConfigs[name];
    if (config) {
      newConfigs[name] = toScopedConfig(config);
    }
  }
  const newState = {
    clients: newClients,
    tools: newTools,
    configs: newConfigs
  };
  setAppState((prev) => {
    const allDynamicServerNames = new Set([
      ...Object.keys(currentState.configs),
      ...Object.keys(newConfigs)
    ]);
    const nonDynamicTools = prev.mcp.tools.filter((t) => {
      for (const serverName of allDynamicServerNames) {
        if (t.name.startsWith(`mcp__${serverName}__`)) {
          return false;
        }
      }
      return true;
    });
    const nonDynamicClients = prev.mcp.clients.filter((c) => {
      return !allDynamicServerNames.has(c.name);
    });
    return {
      ...prev,
      mcp: {
        ...prev.mcp,
        tools: [...nonDynamicTools, ...newTools],
        clients: [...nonDynamicClients, ...newClients]
      }
    };
  });
  return {
    response: { added, removed, errors },
    newState
  };
}
export {
  runHeadless,
  removeInterruptedMessage,
  reconcileMcpServers,
  joinPromptValues,
  handleOrphanedPermissionResponse,
  handleMcpSetServers,
  getCanUseToolFn,
  createCanUseToolWithPermissionPrompt,
  canBatchWith
};

//# debugId=59DDAC65BF69D70364756E2164756E21
//# sourceMappingURL=chunk-dmg3ypsh.js.map
