// @bun
import {
  endInteractionSpan,
  init_betaSessionTracing,
  init_perfettoTracing,
  init_sessionTracing,
  initializePerfettoTracing,
  isBetaTracingEnabled,
  isEnhancedTelemetryEnabled
} from "./chunk-bvcfzg7t.js";
import"./chunk-c79fzdwz.js";
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  init_esm
} from "./chunk-hqxp6b72.js";
import {
  require_src as require_src5
} from "./chunk-326zehp8.js";
import {
  require_src as require_src6
} from "./chunk-kc67kt75.js";
import {
  require_src as require_src2,
  require_src1 as require_src3,
  require_src2 as require_src4
} from "./chunk-40t1d75v.js";
import {
  getSettings_DEPRECATED,
  init_settings1 as init_settings
} from "./chunk-h2edgmqn.js";
import"./chunk-d1ka4b7m.js";
import"./chunk-tavc33hf.js";
import"./chunk-80p148mw.js";
import"./chunk-49v9e09z.js";
import {
  HttpsProxyAgent,
  getCACertificates,
  getMTLSConfig,
  getProxyUrl,
  init_caCerts,
  init_dist,
  init_mtls,
  init_proxy,
  shouldBypassProxy
} from "./chunk-hdhvk68c.js";
import"./chunk-k2hff9tm.js";
import"./chunk-vwenx8ke.js";
import"./chunk-bgan4cpf.js";
import {
  getAuthHeaders,
  getClaudeCodeUserAgent,
  init_http,
  init_userAgent,
  withOAuth401Retry
} from "./chunk-35jsjk7z.js";
import {
  getOtelHeadersFromHelper,
  getSubscriptionType,
  hasProfileScope,
  init_auth,
  is1PApiCustomer,
  isClaudeAISubscriber
} from "./chunk-e45319yt.js";
import {
  checkHasTrustDialogAccepted,
  getGlobalConfig,
  init_config,
  saveGlobalConfig
} from "./chunk-jyqypr4z.js";
import"./chunk-m18nccbn.js";
import"./chunk-e2jvken3.js";
import"./chunk-5zhv4jyp.js";
import"./chunk-jwyj6t5m.js";
import"./chunk-87f9np2y.js";
import"./chunk-zq3spn7d.js";
import {
  getPlatform,
  getWslVersion,
  init_platform
} from "./chunk-7fbjbgr5.js";
import"./chunk-x5wzz44g.js";
import"./chunk-r87btn9p.js";
import"./chunk-v4ypszbb.js";
import"./chunk-dw66fdss.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import {
  require_src
} from "./chunk-e3abfxpy.js";
import"./chunk-fejeqe61.js";
import {
  init_startupProfiler,
  profileCheckpoint
} from "./chunk-bj6zyntv.js";
import"./chunk-49x6szsr.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-0k4kr3h5.js";
import"./chunk-x9xf2qa8.js";
import"./chunk-4hpfxga2.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import {
  axios_default,
  init_axios
} from "./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import"./chunk-bt5n9f4r.js";
import {
  init_memoize,
  memoizeWithTTLAsync
} from "./chunk-qkkkfh9a.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-w7s0zvjq.js";
import"./chunk-w95hkggk.js";
import {
  init_log,
  init_privacyLevel,
  isEssentialTrafficOnly,
  logError
} from "./chunk-kc49dhz0.js";
import"./chunk-k51zdj4e.js";
import"./chunk-mtgfbnth.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import {
  errorMessage,
  getHasFormattedOutput,
  init_cleanupRegistry,
  init_debug,
  init_errors,
  init_slowOperations,
  jsonStringify,
  logForDebugging,
  registerCleanup,
  toError
} from "./chunk-pyv3zrjt.js";
import"./chunk-kb3758f7.js";
import {
  getIsNonInteractiveSession,
  getLoggerProvider,
  getMeterProvider,
  getTracerProvider,
  init_state,
  setEventLogger,
  setLoggerProvider,
  setMeterProvider,
  setTracerProvider
} from "./chunk-232p95fy.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import {
  init_envUtils,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __esm,
  __require,
  __toESM
} from "./chunk-hhsxm2yr.js";

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/utils/validation.js
function isLogAttributeValue(val) {
  return isLogAttributeValueInternal(val, new WeakSet);
}
function isLogAttributeValueInternal(val, visited) {
  if (val == null) {
    return true;
  }
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
    return true;
  }
  if (val instanceof Uint8Array) {
    return true;
  }
  if (typeof val === "object") {
    if (visited.has(val)) {
      return false;
    }
    visited.add(val);
    if (Array.isArray(val)) {
      return val.every((item) => isLogAttributeValueInternal(item, visited));
    }
    const obj = val;
    if (obj.constructor !== Object && obj.constructor !== undefined) {
      return false;
    }
    return Object.values(obj).every((item) => isLogAttributeValueInternal(item, visited));
  }
  return false;
}
var init_validation = () => {};

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/LogRecordImpl.js
class LogRecordImpl {
  hrTime;
  hrTimeObserved;
  spanContext;
  resource;
  instrumentationScope;
  attributes = {};
  _severityText;
  _severityNumber;
  _body;
  _eventName;
  _attributesCount = 0;
  _droppedAttributesCount = 0;
  _isReadonly = false;
  _logRecordLimits;
  set severityText(severityText) {
    if (this._isLogRecordReadonly()) {
      return;
    }
    this._severityText = severityText;
  }
  get severityText() {
    return this._severityText;
  }
  set severityNumber(severityNumber) {
    if (this._isLogRecordReadonly()) {
      return;
    }
    this._severityNumber = severityNumber;
  }
  get severityNumber() {
    return this._severityNumber;
  }
  set body(body) {
    if (this._isLogRecordReadonly()) {
      return;
    }
    this._body = body;
  }
  get body() {
    return this._body;
  }
  get eventName() {
    return this._eventName;
  }
  set eventName(eventName) {
    if (this._isLogRecordReadonly()) {
      return;
    }
    this._eventName = eventName;
  }
  get droppedAttributesCount() {
    return this._droppedAttributesCount;
  }
  constructor(_sharedState, instrumentationScope, logRecord) {
    const { timestamp, observedTimestamp, eventName, severityNumber, severityText, body, attributes = {}, exception, context } = logRecord;
    const now = Date.now();
    this.hrTime = import_core.timeInputToHrTime(timestamp ?? now);
    this.hrTimeObserved = import_core.timeInputToHrTime(observedTimestamp ?? now);
    if (context) {
      const spanContext = api.trace.getSpanContext(context);
      if (spanContext && api.isSpanContextValid(spanContext)) {
        this.spanContext = spanContext;
      }
    }
    this.severityNumber = severityNumber;
    this.severityText = severityText;
    this.body = body;
    this.resource = _sharedState.resource;
    this.instrumentationScope = instrumentationScope;
    this._logRecordLimits = _sharedState.logRecordLimits;
    this._eventName = eventName;
    this.setAttributes(attributes);
    if (exception != null) {
      this._setException(exception);
    }
  }
  setAttribute(key, value) {
    if (this._isLogRecordReadonly()) {
      return this;
    }
    if (key.length === 0) {
      api.diag.warn(`Invalid attribute key: ${key}`);
      return this;
    }
    if (!isLogAttributeValue(value)) {
      api.diag.warn(`Invalid attribute value set for key: ${key}`);
      return this;
    }
    const isNewKey = !Object.prototype.hasOwnProperty.call(this.attributes, key);
    if (isNewKey && this._attributesCount >= this._logRecordLimits.attributeCountLimit) {
      this._droppedAttributesCount++;
      if (this._droppedAttributesCount === 1) {
        api.diag.warn("Dropping extra attributes.");
      }
      return this;
    }
    this.attributes[key] = this._truncateToSize(value);
    if (isNewKey) {
      this._attributesCount++;
    }
    return this;
  }
  setAttributes(attributes) {
    for (const [k, v] of Object.entries(attributes)) {
      this.setAttribute(k, v);
    }
    return this;
  }
  setBody(body) {
    this.body = body;
    return this;
  }
  setEventName(eventName) {
    this.eventName = eventName;
    return this;
  }
  setSeverityNumber(severityNumber) {
    this.severityNumber = severityNumber;
    return this;
  }
  setSeverityText(severityText) {
    this.severityText = severityText;
    return this;
  }
  _makeReadonly() {
    this._isReadonly = true;
  }
  _truncateToSize(value) {
    const limit = this._logRecordLimits.attributeValueLengthLimit;
    if (limit <= 0) {
      api.diag.warn(`Attribute value limit must be positive, got ${limit}`);
      return value;
    }
    if (value == null) {
      return value;
    }
    if (typeof value === "string") {
      return this._truncateToLimitUtil(value, limit);
    }
    if (value instanceof Uint8Array) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((val) => this._truncateToSize(val));
    }
    if (typeof value === "object") {
      const truncatedObj = {};
      for (const [k, v] of Object.entries(value)) {
        truncatedObj[k] = this._truncateToSize(v);
      }
      return truncatedObj;
    }
    return value;
  }
  _setException(exception) {
    let hasMinimumAttributes = false;
    if (typeof exception === "string" || typeof exception === "number") {
      if (!Object.hasOwn(this.attributes, import_semantic_conventions.ATTR_EXCEPTION_MESSAGE)) {
        this.setAttribute(import_semantic_conventions.ATTR_EXCEPTION_MESSAGE, String(exception));
      }
      hasMinimumAttributes = true;
    } else if (exception && typeof exception === "object") {
      const exceptionObj = exception;
      if (exceptionObj.code) {
        if (!Object.hasOwn(this.attributes, import_semantic_conventions.ATTR_EXCEPTION_TYPE)) {
          this.setAttribute(import_semantic_conventions.ATTR_EXCEPTION_TYPE, exceptionObj.code.toString());
        }
        hasMinimumAttributes = true;
      } else if (exceptionObj.name) {
        if (!Object.hasOwn(this.attributes, import_semantic_conventions.ATTR_EXCEPTION_TYPE)) {
          this.setAttribute(import_semantic_conventions.ATTR_EXCEPTION_TYPE, exceptionObj.name);
        }
        hasMinimumAttributes = true;
      }
      if (exceptionObj.message) {
        if (!Object.hasOwn(this.attributes, import_semantic_conventions.ATTR_EXCEPTION_MESSAGE)) {
          this.setAttribute(import_semantic_conventions.ATTR_EXCEPTION_MESSAGE, exceptionObj.message);
        }
        hasMinimumAttributes = true;
      }
      if (exceptionObj.stack) {
        if (!Object.hasOwn(this.attributes, import_semantic_conventions.ATTR_EXCEPTION_STACKTRACE)) {
          this.setAttribute(import_semantic_conventions.ATTR_EXCEPTION_STACKTRACE, exceptionObj.stack);
        }
        hasMinimumAttributes = true;
      }
    }
    if (!hasMinimumAttributes) {
      api.diag.warn(`Failed to record an exception ${exception}`);
    }
  }
  _truncateToLimitUtil(value, limit) {
    if (value.length <= limit) {
      return value;
    }
    return value.substring(0, limit);
  }
  _isLogRecordReadonly() {
    if (this._isReadonly) {
      api.diag.warn("Can not execute the operation on emitted log record");
    }
    return this._isReadonly;
  }
}
var api, import_core, import_semantic_conventions;
var init_LogRecordImpl = __esm(() => {
  init_validation();
  api = __toESM(require_src(), 1);
  import_core = __toESM(require_src3(), 1);
  import_semantic_conventions = __toESM(require_src2(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/Logger.js
class Logger {
  instrumentationScope;
  _sharedState;
  _loggerConfig;
  constructor(instrumentationScope, sharedState) {
    this.instrumentationScope = instrumentationScope;
    this._sharedState = sharedState;
    this._loggerConfig = this._sharedState.getLoggerConfig(this.instrumentationScope);
  }
  emit(logRecord) {
    const loggerConfig = this._loggerConfig;
    const currentContext = logRecord.context || import_api.context.active();
    const recordSeverity = logRecord.severityNumber ?? import_api_logs.SeverityNumber.UNSPECIFIED;
    if (recordSeverity !== import_api_logs.SeverityNumber.UNSPECIFIED && recordSeverity < loggerConfig.minimumSeverity) {
      return;
    }
    if (loggerConfig.traceBased) {
      const spanContext = import_api.trace.getSpanContext(currentContext);
      if (spanContext && import_api.isSpanContextValid(spanContext)) {
        const isSampled = (spanContext.traceFlags & import_api.TraceFlags.SAMPLED) === import_api.TraceFlags.SAMPLED;
        if (!isSampled) {
          return;
        }
      }
    }
    const logRecordInstance = new LogRecordImpl(this._sharedState, this.instrumentationScope, {
      context: currentContext,
      ...logRecord
    });
    this._sharedState.loggerMetrics.emitLog();
    this._sharedState.activeProcessor.onEmit(logRecordInstance, currentContext);
    logRecordInstance._makeReadonly();
  }
  enabled(options) {
    const loggerConfig = this._loggerConfig;
    if (loggerConfig.disabled) {
      return false;
    }
    const severityNumber = options?.severityNumber;
    if (typeof severityNumber === "number" && severityNumber !== import_api_logs.SeverityNumber.UNSPECIFIED && severityNumber < loggerConfig.minimumSeverity) {
      return false;
    }
    const currentContext = options?.context || import_api.context.active();
    if (loggerConfig.traceBased) {
      const spanContext = import_api.trace.getSpanContext(currentContext);
      if (spanContext && import_api.isSpanContextValid(spanContext)) {
        const isSampled = (spanContext.traceFlags & import_api.TraceFlags.SAMPLED) === import_api.TraceFlags.SAMPLED;
        if (!isSampled) {
          return false;
        }
      }
    }
    const enabledOpts = {
      context: currentContext,
      instrumentationScope: this.instrumentationScope,
      severityNumber: options?.severityNumber,
      eventName: options?.eventName
    };
    for (const processor of this._sharedState.processors) {
      if (!processor.enabled || processor.enabled(enabledOpts)) {
        return true;
      }
    }
    return false;
  }
}
var import_api_logs, import_api;
var init_Logger = __esm(() => {
  init_LogRecordImpl();
  import_api_logs = __toESM(require_src5(), 1);
  import_api = __toESM(require_src(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/export/NoopLogRecordProcessor.js
class NoopLogRecordProcessor {
  forceFlush() {
    return Promise.resolve();
  }
  onEmit(_logRecord, _context) {}
  shutdown() {
    return Promise.resolve();
  }
  enabled(_options) {
    return false;
  }
}
var init_NoopLogRecordProcessor = () => {};

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/MultiLogRecordProcessor.js
class MultiLogRecordProcessor {
  processors;
  forceFlushTimeoutMillis;
  constructor(processors, forceFlushTimeoutMillis) {
    this.processors = processors;
    this.forceFlushTimeoutMillis = forceFlushTimeoutMillis;
  }
  async forceFlush() {
    const timeout = this.forceFlushTimeoutMillis;
    await Promise.all(this.processors.map((processor) => import_core2.callWithTimeout(processor.forceFlush(), timeout)));
  }
  onEmit(logRecord, context2) {
    this.processors.forEach((processors) => processors.onEmit(logRecord, context2));
  }
  async shutdown() {
    await Promise.all(this.processors.map((processor) => processor.shutdown()));
  }
  enabled(options) {
    for (const processor of this.processors) {
      if (!processor.enabled || processor.enabled(options)) {
        return true;
      }
    }
    return false;
  }
}
var import_core2;
var init_MultiLogRecordProcessor = __esm(() => {
  import_core2 = __toESM(require_src3(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/internal/utils.js
function getInstrumentationScopeKey(scope) {
  return `${scope.name}@${scope.version || ""}:${scope.schemaUrl || ""}`;
}
var init_utils = () => {};

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/semconv.js
var METRIC_OTEL_SDK_LOG_CREATED = "otel.sdk.log.created";
var init_semconv = () => {};

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/LoggerMetrics.js
class LoggerMetrics {
  createdLogs;
  constructor(meter) {
    this.createdLogs = meter.createCounter(METRIC_OTEL_SDK_LOG_CREATED, {
      unit: "{log_record}",
      description: "The number of logs submitted to enabled SDK Loggers."
    });
  }
  emitLog() {
    this.createdLogs.add(1);
  }
}
var init_LoggerMetrics = __esm(() => {
  init_semconv();
});

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/version.js
var VERSION = "0.215.0";
var init_version = () => {};

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/internal/LoggerProviderSharedState.js
class LoggerProviderSharedState {
  loggers = new Map;
  activeProcessor;
  registeredLogRecordProcessors = [];
  resource;
  forceFlushTimeoutMillis;
  logRecordLimits;
  processors;
  loggerMetrics;
  _loggerConfigurator;
  _loggerConfigs = new Map;
  constructor(resource, forceFlushTimeoutMillis, logRecordLimits, processors, loggerConfigurator, meterProvider) {
    this.resource = resource;
    this.forceFlushTimeoutMillis = forceFlushTimeoutMillis;
    this.logRecordLimits = logRecordLimits;
    this.processors = processors;
    if (processors.length > 0) {
      this.registeredLogRecordProcessors = processors;
      this.activeProcessor = new MultiLogRecordProcessor(this.registeredLogRecordProcessors, this.forceFlushTimeoutMillis);
    } else {
      this.activeProcessor = new NoopLogRecordProcessor;
    }
    this._loggerConfigurator = loggerConfigurator ?? DEFAULT_LOGGER_CONFIGURATOR;
    const meter = meterProvider ? meterProvider.getMeter("@opentelemetry/sdk-logs", VERSION) : import_api2.createNoopMeter();
    this.loggerMetrics = new LoggerMetrics(meter);
  }
  getLoggerConfig(instrumentationScope) {
    const key = getInstrumentationScopeKey(instrumentationScope);
    let config = this._loggerConfigs.get(key);
    if (config) {
      return config;
    }
    config = this._loggerConfigurator(instrumentationScope);
    this._loggerConfigs.set(key, config);
    return config;
  }
}
var import_api2, import_api_logs2, DEFAULT_LOGGER_CONFIG, DEFAULT_LOGGER_CONFIGURATOR = () => ({
  ...DEFAULT_LOGGER_CONFIG
});
var init_LoggerProviderSharedState = __esm(() => {
  init_NoopLogRecordProcessor();
  init_MultiLogRecordProcessor();
  init_utils();
  init_LoggerMetrics();
  init_version();
  import_api2 = __toESM(require_src(), 1);
  import_api_logs2 = __toESM(require_src5(), 1);
  DEFAULT_LOGGER_CONFIG = {
    disabled: false,
    minimumSeverity: import_api_logs2.SeverityNumber.UNSPECIFIED,
    traceBased: false
  };
});

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/LoggerProvider.js
class LoggerProvider {
  _shutdownOnce;
  _sharedState;
  constructor(config = {}) {
    const mergedConfig = {
      resource: config.resource ?? import_resources.defaultResource(),
      forceFlushTimeoutMillis: config.forceFlushTimeoutMillis ?? 30000,
      logRecordLimits: {
        attributeCountLimit: config.logRecordLimits?.attributeCountLimit ?? 128,
        attributeValueLengthLimit: config.logRecordLimits?.attributeValueLengthLimit ?? Infinity
      },
      loggerConfigurator: config.loggerConfigurator ?? DEFAULT_LOGGER_CONFIGURATOR,
      processors: config.processors ?? [],
      meterProvider: config.meterProvider
    };
    this._sharedState = new LoggerProviderSharedState(mergedConfig.resource, mergedConfig.forceFlushTimeoutMillis, mergedConfig.logRecordLimits, mergedConfig.processors, mergedConfig.loggerConfigurator, mergedConfig.meterProvider);
    this._shutdownOnce = new import_core3.BindOnceFuture(this._shutdown, this);
  }
  getLogger(name, version, options) {
    if (this._shutdownOnce.isCalled) {
      import_api3.diag.warn("A shutdown LoggerProvider cannot provide a Logger");
      return import_api_logs3.NOOP_LOGGER;
    }
    if (!name) {
      import_api3.diag.warn("Logger requested without instrumentation scope name.");
    }
    const loggerName = name || DEFAULT_LOGGER_NAME;
    const key = `${loggerName}@${version || ""}:${options?.schemaUrl || ""}`;
    if (!this._sharedState.loggers.has(key)) {
      this._sharedState.loggers.set(key, new Logger({ name: loggerName, version, schemaUrl: options?.schemaUrl }, this._sharedState));
    }
    return this._sharedState.loggers.get(key);
  }
  forceFlush() {
    if (this._shutdownOnce.isCalled) {
      import_api3.diag.warn("invalid attempt to force flush after LoggerProvider shutdown");
      return this._shutdownOnce.promise;
    }
    return this._sharedState.activeProcessor.forceFlush();
  }
  shutdown() {
    if (this._shutdownOnce.isCalled) {
      import_api3.diag.warn("shutdown may only be called once per LoggerProvider");
      return this._shutdownOnce.promise;
    }
    return this._shutdownOnce.call();
  }
  _shutdown() {
    return this._sharedState.activeProcessor.shutdown();
  }
}
var import_api3, import_api_logs3, import_resources, import_core3, DEFAULT_LOGGER_NAME = "unknown";
var init_LoggerProvider = __esm(() => {
  init_Logger();
  init_LoggerProviderSharedState();
  import_api3 = __toESM(require_src(), 1);
  import_api_logs3 = __toESM(require_src5(), 1);
  import_resources = __toESM(require_src4(), 1);
  import_core3 = __toESM(require_src3(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/export/ConsoleLogRecordExporter.js
class ConsoleLogRecordExporter {
  export(logs, resultCallback) {
    this._sendLogRecords(logs, resultCallback);
  }
  async forceFlush() {}
  async shutdown() {}
  _exportInfo(logRecord) {
    return {
      resource: {
        attributes: logRecord.resource.attributes
      },
      instrumentationScope: logRecord.instrumentationScope,
      timestamp: import_core4.hrTimeToMicroseconds(logRecord.hrTime),
      traceId: logRecord.spanContext?.traceId,
      spanId: logRecord.spanContext?.spanId,
      traceFlags: logRecord.spanContext?.traceFlags,
      severityText: logRecord.severityText,
      severityNumber: logRecord.severityNumber,
      eventName: logRecord.eventName,
      body: logRecord.body,
      attributes: logRecord.attributes
    };
  }
  _sendLogRecords(logRecords, done) {
    for (const logRecord of logRecords) {
      console.dir(this._exportInfo(logRecord), { depth: 3 });
    }
    done?.({ code: import_core4.ExportResultCode.SUCCESS });
  }
}
var import_core4;
var init_ConsoleLogRecordExporter = __esm(() => {
  import_core4 = __toESM(require_src3(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/export/BatchLogRecordProcessorBase.js
async function waitForResources(logRecords) {
  const pendingResources = [];
  for (let i = 0, len = logRecords.length;i < len; i++) {
    const logRecord = logRecords[i];
    if (logRecord.resource.asyncAttributesPending && logRecord.resource.waitForAsyncAttributes) {
      pendingResources.push(logRecord.resource.waitForAsyncAttributes());
    }
  }
  if (pendingResources != null && pendingResources.length > 0) {
    await Promise.all(pendingResources);
  }
}

class ExportOperation {
  _exportCompleted;
  _exportScheduledPromise;
  _exportScheduledResolve;
  constructor(exporter, logRecords, exportTimeoutMillis) {
    this._exportScheduledPromise = new Promise((resolve) => {
      this._exportScheduledResolve = resolve;
    });
    this._exportCompleted = this._executeExport(exporter, logRecords, exportTimeoutMillis);
  }
  get exportCompleted() {
    return this._exportCompleted;
  }
  get exportScheduled() {
    return this._exportScheduledPromise;
  }
  async _executeExport(exporter, logRecords, exportTimeoutMillis) {
    try {
      await waitForResources(logRecords);
      await import_api4.context.with(import_core5.suppressTracing(import_api4.context.active()), async () => {
        return this._exportWithTimeout(exporter, logRecords, exportTimeoutMillis);
      });
    } catch (e) {
      import_core5.globalErrorHandler(e);
      this._exportScheduledResolve();
    }
  }
  async _exportWithTimeout(exporter, logRecords, exportTimeoutMillis) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Timeout"));
      }, exportTimeoutMillis);
      exporter.export(logRecords, (result) => {
        clearTimeout(timer);
        if (result.code === import_core5.ExportResultCode.SUCCESS) {
          resolve();
        } else {
          reject(result.error ?? new Error("BatchLogRecordProcessor: log record export failed"));
        }
      });
      this._exportScheduledResolve();
    });
  }
}

class BatchLogRecordProcessorBase {
  _maxExportBatchSize;
  _maxQueueSize;
  _scheduledDelayMillis;
  _exportTimeoutMillis;
  _exporter;
  _currentExport = null;
  _finishedLogRecords = [];
  _timer;
  _shutdownOnce;
  _flushing = false;
  constructor(exporter, config) {
    this._exporter = exporter;
    this._maxExportBatchSize = config?.maxExportBatchSize ?? 512;
    this._maxQueueSize = config?.maxQueueSize ?? 2048;
    this._scheduledDelayMillis = config?.scheduledDelayMillis ?? 5000;
    this._exportTimeoutMillis = config?.exportTimeoutMillis ?? 30000;
    this._shutdownOnce = new import_core5.BindOnceFuture(this._shutdown, this);
    if (this._maxExportBatchSize > this._maxQueueSize) {
      import_api4.diag.warn("BatchLogRecordProcessor: maxExportBatchSize must be smaller or equal to maxQueueSize, setting maxExportBatchSize to match maxQueueSize");
      this._maxExportBatchSize = this._maxQueueSize;
    }
  }
  onEmit(logRecord) {
    if (this._shutdownOnce.isCalled) {
      return;
    }
    this._addToBuffer(logRecord);
  }
  forceFlush() {
    if (this._shutdownOnce.isCalled) {
      return this._shutdownOnce.promise;
    }
    return this._flushAll();
  }
  _addToBuffer(logRecord) {
    if (this._finishedLogRecords.length >= this._maxQueueSize) {
      return;
    }
    this._finishedLogRecords.push(logRecord);
    this._maybeStartTimer();
  }
  shutdown() {
    return this._shutdownOnce.call();
  }
  async _shutdown() {
    this.onShutdown();
    await this._flushAll();
    await this._exporter.shutdown();
  }
  async _flushAll() {
    if (this._flushing) {
      return;
    }
    this._flushing = true;
    let toFlush = this._finishedLogRecords;
    this._finishedLogRecords = [];
    this._clearTimer();
    if (this._currentExport !== null) {
      await this._exporter.forceFlush();
      await this._currentExport.exportCompleted;
      this._currentExport = null;
    }
    while (toFlush.length > 0) {
      let batch;
      if (toFlush.length <= this._maxExportBatchSize) {
        batch = toFlush;
        toFlush = [];
      } else {
        batch = toFlush.splice(0, this._maxExportBatchSize);
      }
      const exportOp = new ExportOperation(this._exporter, batch, this._exportTimeoutMillis);
      this._currentExport = exportOp;
      try {
        await exportOp.exportScheduled;
        await this._exporter.forceFlush();
        await exportOp.exportCompleted;
      } catch (e) {
        import_core5.globalErrorHandler(e);
      } finally {
        this._currentExport = null;
      }
    }
    this._flushing = false;
    this._maybeStartTimer();
  }
  _extractBatch() {
    if (this._finishedLogRecords.length === 0) {
      return null;
    }
    if (this._finishedLogRecords.length <= this._maxExportBatchSize) {
      const batch = this._finishedLogRecords;
      this._finishedLogRecords = [];
      return batch;
    } else {
      return this._finishedLogRecords.splice(0, this._maxExportBatchSize);
    }
  }
  _exportOneBatch() {
    this._clearTimer();
    const logRecords = this._extractBatch();
    if (logRecords === null) {
      return;
    }
    const exportOp = new ExportOperation(this._exporter, logRecords, this._exportTimeoutMillis);
    this._currentExport = exportOp;
    exportOp.exportCompleted.then(() => {
      this._currentExport = null;
      this._maybeStartTimer();
    }).catch((error) => {
      this._currentExport = null;
      import_core5.globalErrorHandler(error);
      this._maybeStartTimer();
    });
  }
  _maybeStartTimer() {
    if (this._shutdownOnce.isCalled) {
      return;
    }
    if (this._flushing) {
      return;
    }
    if (this._finishedLogRecords.length === 0) {
      return;
    }
    if (this._currentExport !== null) {
      return;
    }
    if (this._finishedLogRecords.length >= this._maxExportBatchSize) {
      this._exportOneBatch();
      return;
    }
    if (this._timer !== undefined) {
      return;
    }
    this._timer = setTimeout(() => {
      this._timer = undefined;
      this._exportOneBatch();
    }, this._scheduledDelayMillis);
    if (typeof this._timer !== "number") {
      this._timer.unref();
    }
  }
  _clearTimer() {
    if (this._timer !== undefined) {
      clearTimeout(this._timer);
      this._timer = undefined;
    }
  }
}
var import_api4, import_core5;
var init_BatchLogRecordProcessorBase = __esm(() => {
  import_api4 = __toESM(require_src(), 1);
  import_core5 = __toESM(require_src3(), 1);
});

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/platform/node/export/BatchLogRecordProcessor.js
var BatchLogRecordProcessor;
var init_BatchLogRecordProcessor = __esm(() => {
  init_BatchLogRecordProcessorBase();
  BatchLogRecordProcessor = class BatchLogRecordProcessor extends BatchLogRecordProcessorBase {
    onShutdown() {}
  };
});

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/platform/node/index.js
var init_node = __esm(() => {
  init_BatchLogRecordProcessor();
});

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/platform/index.js
var init_platform2 = __esm(() => {
  init_node();
});

// node_modules/.bun/@opentelemetry+sdk-logs@0.215.0+e40b0dfdd726a224/node_modules/@opentelemetry/sdk-logs/build/esm/index.js
var init_esm2 = __esm(() => {
  init_LoggerProvider();
  init_ConsoleLogRecordExporter();
  init_platform2();
});

// src/services/api/metricsOptOut.ts
async function _fetchMetricsEnabled() {
  const authResult = getAuthHeaders();
  if (authResult.error) {
    throw new Error(`Auth error: ${authResult.error}`);
  }
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": getClaudeCodeUserAgent(),
    ...authResult.headers
  };
  const endpoint = `https://api.anthropic.com/api/claude_code/organizations/metrics_enabled`;
  const response = await axios_default.get(endpoint, {
    headers,
    timeout: 5000
  });
  return response.data;
}
async function _checkMetricsEnabledAPI() {
  if (isEssentialTrafficOnly()) {
    return { enabled: false, hasError: false };
  }
  try {
    const data = await withOAuth401Retry(_fetchMetricsEnabled, {
      also403Revoked: true
    });
    logForDebugging(`Metrics opt-out API response: enabled=${data.metrics_logging_enabled}`);
    return {
      enabled: data.metrics_logging_enabled,
      hasError: false
    };
  } catch (error) {
    logForDebugging(`Failed to check metrics opt-out status: ${errorMessage(error)}`);
    logError(error);
    return { enabled: false, hasError: true };
  }
}
async function refreshMetricsStatus() {
  const result = await memoizedCheckMetrics();
  if (result.hasError) {
    return result;
  }
  const cached = getGlobalConfig().metricsStatusCache;
  const unchanged = cached !== undefined && cached.enabled === result.enabled;
  if (unchanged && Date.now() - cached.timestamp < DISK_CACHE_TTL_MS) {
    return result;
  }
  saveGlobalConfig((current) => ({
    ...current,
    metricsStatusCache: {
      enabled: result.enabled,
      timestamp: Date.now()
    }
  }));
  return result;
}
async function checkMetricsEnabled() {
  if (isClaudeAISubscriber() && !hasProfileScope()) {
    return { enabled: false, hasError: false };
  }
  const cached = getGlobalConfig().metricsStatusCache;
  if (cached) {
    if (Date.now() - cached.timestamp > DISK_CACHE_TTL_MS) {
      refreshMetricsStatus().catch(logError);
    }
    return {
      enabled: cached.enabled,
      hasError: false
    };
  }
  return refreshMetricsStatus();
}
var CACHE_TTL_MS, DISK_CACHE_TTL_MS, memoizedCheckMetrics;
var init_metricsOptOut = __esm(() => {
  init_axios();
  init_auth();
  init_config();
  init_debug();
  init_errors();
  init_http();
  init_log();
  init_memoize();
  init_privacyLevel();
  init_userAgent();
  CACHE_TTL_MS = 60 * 60 * 1000;
  DISK_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  memoizedCheckMetrics = memoizeWithTTLAsync(_checkMetricsEnabledAPI, CACHE_TTL_MS);
});

// src/utils/telemetry/bigqueryExporter.ts
class BigQueryMetricsExporter {
  endpoint;
  timeout;
  pendingExports = [];
  isShutdown = false;
  constructor(options = {}) {
    const defaultEndpoint = "https://api.anthropic.com/api/claude_code/metrics";
    if (process.env.USER_TYPE === "ant" && process.env.ANT_CLAUDE_CODE_METRICS_ENDPOINT) {
      this.endpoint = process.env.ANT_CLAUDE_CODE_METRICS_ENDPOINT + "/api/claude_code/metrics";
    } else {
      this.endpoint = defaultEndpoint;
    }
    this.timeout = options.timeout || 5000;
  }
  async export(metrics, resultCallback) {
    if (this.isShutdown) {
      resultCallback({
        code: import_core6.ExportResultCode.FAILED,
        error: new Error("Exporter has been shutdown")
      });
      return;
    }
    const exportPromise = this.doExport(metrics, resultCallback);
    this.pendingExports.push(exportPromise);
    exportPromise.finally(() => {
      const index = this.pendingExports.indexOf(exportPromise);
      if (index > -1) {
        this.pendingExports.splice(index, 1);
      }
    });
  }
  async doExport(metrics, resultCallback) {
    try {
      const hasTrust = checkHasTrustDialogAccepted() || getIsNonInteractiveSession();
      if (!hasTrust) {
        logForDebugging("BigQuery metrics export: trust not established, skipping");
        resultCallback({ code: import_core6.ExportResultCode.SUCCESS });
        return;
      }
      const metricsStatus = await checkMetricsEnabled();
      if (!metricsStatus.enabled) {
        logForDebugging("Metrics export disabled by organization setting");
        resultCallback({ code: import_core6.ExportResultCode.SUCCESS });
        return;
      }
      const payload = this.transformMetricsForInternal(metrics);
      const authResult = getAuthHeaders();
      if (authResult.error) {
        logForDebugging(`Metrics export failed: ${authResult.error}`);
        resultCallback({
          code: import_core6.ExportResultCode.FAILED,
          error: new Error(authResult.error)
        });
        return;
      }
      const headers = {
        "Content-Type": "application/json",
        "User-Agent": getClaudeCodeUserAgent(),
        ...authResult.headers
      };
      const response = await axios_default.post(this.endpoint, payload, {
        timeout: this.timeout,
        headers
      });
      logForDebugging("BigQuery metrics exported successfully");
      logForDebugging(`BigQuery API Response: ${jsonStringify(response.data, null, 2)}`);
      resultCallback({ code: import_core6.ExportResultCode.SUCCESS });
    } catch (error) {
      logForDebugging(`BigQuery metrics export failed: ${errorMessage(error)}`);
      logError(error);
      resultCallback({
        code: import_core6.ExportResultCode.FAILED,
        error: toError(error)
      });
    }
  }
  transformMetricsForInternal(metrics) {
    const attrs = metrics.resource.attributes;
    const resourceAttributes = {
      "service.name": attrs["service.name"] || "claude-code",
      "service.version": attrs["service.version"] || "unknown",
      "os.type": attrs["os.type"] || "unknown",
      "os.version": attrs["os.version"] || "unknown",
      "host.arch": attrs["host.arch"] || "unknown",
      "aggregation.temporality": this.selectAggregationTemporality() === import_sdk_metrics.AggregationTemporality.DELTA ? "delta" : "cumulative"
    };
    if (attrs["wsl.version"]) {
      resourceAttributes["wsl.version"] = attrs["wsl.version"];
    }
    if (isClaudeAISubscriber()) {
      resourceAttributes["user.customer_type"] = "claude_ai";
      const subscriptionType = getSubscriptionType();
      if (subscriptionType) {
        resourceAttributes["user.subscription_type"] = subscriptionType;
      }
    } else {
      resourceAttributes["user.customer_type"] = "api";
    }
    const transformed = {
      resource_attributes: resourceAttributes,
      metrics: metrics.scopeMetrics.flatMap((scopeMetric) => scopeMetric.metrics.map((metric) => ({
        name: metric.descriptor.name,
        description: metric.descriptor.description,
        unit: metric.descriptor.unit,
        data_points: this.extractDataPoints(metric)
      })))
    };
    return transformed;
  }
  extractDataPoints(metric) {
    const dataPoints = metric.dataPoints || [];
    return dataPoints.filter((point) => typeof point.value === "number").map((point) => ({
      attributes: this.convertAttributes(point.attributes),
      value: point.value,
      timestamp: this.hrTimeToISOString(point.endTime || point.startTime || [Date.now() / 1000, 0])
    }));
  }
  async shutdown() {
    this.isShutdown = true;
    await this.forceFlush();
    logForDebugging("BigQuery metrics exporter shutdown complete");
  }
  async forceFlush() {
    await Promise.all(this.pendingExports);
    logForDebugging("BigQuery metrics exporter flush complete");
  }
  convertAttributes(attributes) {
    const result = {};
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        if (value !== undefined && value !== null) {
          result[key] = String(value);
        }
      }
    }
    return result;
  }
  hrTimeToISOString(hrTime) {
    const [seconds, nanoseconds] = hrTime;
    const date = new Date(seconds * 1000 + nanoseconds / 1e6);
    return date.toISOString();
  }
  selectAggregationTemporality() {
    return import_sdk_metrics.AggregationTemporality.DELTA;
  }
}
var import_core6, import_sdk_metrics;
var init_bigqueryExporter = __esm(() => {
  init_axios();
  init_metricsOptOut();
  init_state();
  init_auth();
  init_config();
  init_debug();
  init_errors();
  init_http();
  init_log();
  init_slowOperations();
  init_userAgent();
  import_core6 = __toESM(require_src3(), 1);
  import_sdk_metrics = __toESM(require_src6(), 1);
});

// src/utils/telemetry/logger.ts
class ClaudeCodeDiagLogger {
  error(message, ..._) {
    logError(new Error(message));
    logForDebugging(`[3P telemetry] OTEL diag error: ${message}`, {
      level: "error"
    });
  }
  warn(message, ..._) {
    logError(new Error(message));
    logForDebugging(`[3P telemetry] OTEL diag warn: ${message}`, {
      level: "warn"
    });
  }
  info(_message, ..._args) {
    return;
  }
  debug(_message, ..._args) {
    return;
  }
  verbose(_message, ..._args) {
    return;
  }
}
var init_logger = __esm(() => {
  init_debug();
  init_log();
});

// src/utils/telemetry/instrumentation.ts
function telemetryTimeout(ms, message) {
  return new Promise((_, reject) => {
    setTimeout((rej, msg) => rej(new TelemetryTimeoutError(msg)), ms, reject, message).unref();
  });
}
function bootstrapTelemetry() {
  if (process.env.USER_TYPE === "ant") {
    if (process.env.ANT_OTEL_METRICS_EXPORTER) {
      process.env.OTEL_METRICS_EXPORTER = process.env.ANT_OTEL_METRICS_EXPORTER;
    }
    if (process.env.ANT_OTEL_LOGS_EXPORTER) {
      process.env.OTEL_LOGS_EXPORTER = process.env.ANT_OTEL_LOGS_EXPORTER;
    }
    if (process.env.ANT_OTEL_TRACES_EXPORTER) {
      process.env.OTEL_TRACES_EXPORTER = process.env.ANT_OTEL_TRACES_EXPORTER;
    }
    if (process.env.ANT_OTEL_EXPORTER_OTLP_PROTOCOL) {
      process.env.OTEL_EXPORTER_OTLP_PROTOCOL = process.env.ANT_OTEL_EXPORTER_OTLP_PROTOCOL;
    }
    if (process.env.ANT_OTEL_EXPORTER_OTLP_ENDPOINT) {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = process.env.ANT_OTEL_EXPORTER_OTLP_ENDPOINT;
    }
    if (process.env.ANT_OTEL_EXPORTER_OTLP_HEADERS) {
      process.env.OTEL_EXPORTER_OTLP_HEADERS = process.env.ANT_OTEL_EXPORTER_OTLP_HEADERS;
    }
  }
  if (!process.env.OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE) {
    process.env.OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE = "delta";
  }
}
function parseExporterTypes(value) {
  return (value || "").trim().split(",").filter(Boolean).map((t) => t.trim()).filter((t) => t !== "none");
}
async function getOtlpReaders() {
  const exporterTypes = parseExporterTypes(process.env.OTEL_METRICS_EXPORTER);
  const exportInterval = parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL || DEFAULT_METRICS_EXPORT_INTERVAL_MS.toString(), 10);
  const exporters = [];
  for (const exporterType of exporterTypes) {
    if (exporterType === "console") {
      const consoleExporter = new import_sdk_metrics2.ConsoleMetricExporter;
      const originalExport = consoleExporter.export.bind(consoleExporter);
      consoleExporter.export = (metrics, callback) => {
        if (metrics.resource && metrics.resource.attributes) {
          logForDebugging(`
=== Resource Attributes ===`);
          logForDebugging(jsonStringify(metrics.resource.attributes));
          logForDebugging(`===========================
`);
        }
        return originalExport(metrics, callback);
      };
      exporters.push(consoleExporter);
    } else if (exporterType === "otlp") {
      const protocol = process.env.OTEL_EXPORTER_OTLP_METRICS_PROTOCOL?.trim() || process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.trim();
      const httpConfig = getOTLPExporterConfig();
      switch (protocol) {
        case "grpc": {
          const { OTLPMetricExporter } = await import("./chunk-knavhbcw.js").then((m)=>__toESM(m.default,1));
          exporters.push(new OTLPMetricExporter);
          break;
        }
        case "http/json": {
          const { OTLPMetricExporter } = await import("./chunk-cdfjb87h.js").then((m)=>__toESM(m.default,1));
          exporters.push(new OTLPMetricExporter(httpConfig));
          break;
        }
        case "http/protobuf": {
          const { OTLPMetricExporter } = await import("./chunk-kejdd6zc.js");
          exporters.push(new OTLPMetricExporter(httpConfig));
          break;
        }
        default:
          throw new Error(`Unknown protocol set in OTEL_EXPORTER_OTLP_METRICS_PROTOCOL or OTEL_EXPORTER_OTLP_PROTOCOL env var: ${protocol}`);
      }
    } else if (exporterType === "prometheus") {
      const { PrometheusExporter } = await import("./chunk-24fyv3jz.js").then((m)=>__toESM(m.default,1));
      exporters.push(new PrometheusExporter);
    } else {
      throw new Error(`Unknown exporter type set in OTEL_EXPORTER_OTLP_METRICS_PROTOCOL or OTEL_EXPORTER_OTLP_PROTOCOL env var: ${exporterType}`);
    }
  }
  return exporters.map((exporter) => {
    if ("export" in exporter) {
      return new import_sdk_metrics2.PeriodicExportingMetricReader({
        exporter,
        exportIntervalMillis: exportInterval
      });
    }
    return exporter;
  });
}
async function getOtlpLogExporters() {
  const exporterTypes = parseExporterTypes(process.env.OTEL_LOGS_EXPORTER);
  const protocol = process.env.OTEL_EXPORTER_OTLP_LOGS_PROTOCOL?.trim() || process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.trim();
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  logForDebugging(`[3P telemetry] getOtlpLogExporters: types=${jsonStringify(exporterTypes)}, protocol=${protocol}, endpoint=${endpoint}`);
  const exporters = [];
  for (const exporterType of exporterTypes) {
    if (exporterType === "console") {
      exporters.push(new ConsoleLogRecordExporter);
    } else if (exporterType === "otlp") {
      const httpConfig = getOTLPExporterConfig();
      switch (protocol) {
        case "grpc": {
          const { OTLPLogExporter } = await import("./chunk-xfwbwp8g.js").then((m)=>__toESM(m.default,1));
          exporters.push(new OTLPLogExporter);
          break;
        }
        case "http/json": {
          const { OTLPLogExporter } = await import("./chunk-jfafmkte.js");
          exporters.push(new OTLPLogExporter(httpConfig));
          break;
        }
        case "http/protobuf": {
          const { OTLPLogExporter } = await import("./chunk-86626jb4.js");
          exporters.push(new OTLPLogExporter(httpConfig));
          break;
        }
        default:
          throw new Error(`Unknown protocol set in OTEL_EXPORTER_OTLP_LOGS_PROTOCOL or OTEL_EXPORTER_OTLP_PROTOCOL env var: ${protocol}`);
      }
    } else {
      throw new Error(`Unknown exporter type set in OTEL_LOGS_EXPORTER env var: ${exporterType}`);
    }
  }
  return exporters;
}
async function getOtlpTraceExporters() {
  const exporterTypes = parseExporterTypes(process.env.OTEL_TRACES_EXPORTER);
  const exporters = [];
  for (const exporterType of exporterTypes) {
    if (exporterType === "console") {
      exporters.push(new ConsoleSpanExporter);
    } else if (exporterType === "otlp") {
      const protocol = process.env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL?.trim() || process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.trim();
      const httpConfig = getOTLPExporterConfig();
      switch (protocol) {
        case "grpc": {
          const { OTLPTraceExporter } = await import("./chunk-ehqbx6fc.js").then((m)=>__toESM(m.default,1));
          exporters.push(new OTLPTraceExporter);
          break;
        }
        case "http/json": {
          const { OTLPTraceExporter } = await import("./chunk-jg3r989b.js");
          exporters.push(new OTLPTraceExporter(httpConfig));
          break;
        }
        case "http/protobuf": {
          const { OTLPTraceExporter } = await import("./chunk-4ct8dsj5.js");
          exporters.push(new OTLPTraceExporter(httpConfig));
          break;
        }
        default:
          throw new Error(`Unknown protocol set in OTEL_EXPORTER_OTLP_TRACES_PROTOCOL or OTEL_EXPORTER_OTLP_PROTOCOL env var: ${protocol}`);
      }
    } else {
      throw new Error(`Unknown exporter type set in OTEL_TRACES_EXPORTER env var: ${exporterType}`);
    }
  }
  return exporters;
}
function isTelemetryEnabled() {
  return isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_TELEMETRY);
}
function getBigQueryExportingReader() {
  const bigqueryExporter = new BigQueryMetricsExporter;
  return new import_sdk_metrics2.PeriodicExportingMetricReader({
    exporter: bigqueryExporter,
    exportIntervalMillis: 300000
  });
}
function isBigQueryMetricsEnabled() {
  const subscriptionType = getSubscriptionType();
  const isC4EOrTeamUser = isClaudeAISubscriber() && (subscriptionType === "enterprise" || subscriptionType === "team");
  return is1PApiCustomer() || isC4EOrTeamUser;
}
async function initializeBetaTracing(resource) {
  const endpoint = process.env.BETA_TRACING_ENDPOINT;
  if (!endpoint) {
    return;
  }
  const [{ OTLPTraceExporter }, { OTLPLogExporter }] = await Promise.all([
    import("./chunk-jg3r989b.js"),
    import("./chunk-jfafmkte.js")
  ]);
  const httpConfig = {
    url: `${endpoint}/v1/traces`
  };
  const logHttpConfig = {
    url: `${endpoint}/v1/logs`
  };
  const traceExporter = new OTLPTraceExporter(httpConfig);
  const spanProcessor = new BatchSpanProcessor(traceExporter, {
    scheduledDelayMillis: DEFAULT_TRACES_EXPORT_INTERVAL_MS
  });
  const tracerProvider = new BasicTracerProvider({
    resource,
    spanProcessors: [spanProcessor]
  });
  import_api5.trace.setGlobalTracerProvider(tracerProvider);
  setTracerProvider(tracerProvider);
  const logExporter = new OTLPLogExporter(logHttpConfig);
  const loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor(logExporter, {
        scheduledDelayMillis: DEFAULT_LOGS_EXPORT_INTERVAL_MS
      })
    ]
  });
  import_api_logs4.logs.setGlobalLoggerProvider(loggerProvider);
  setLoggerProvider(loggerProvider);
  const eventLogger = import_api_logs4.logs.getLogger("com.anthropic.claude_code.events", "5.0.0");
  setEventLogger(eventLogger);
  process.on("beforeExit", async () => {
    await loggerProvider?.forceFlush();
    await tracerProvider?.forceFlush();
  });
  process.on("exit", () => {
    loggerProvider?.forceFlush();
    tracerProvider?.forceFlush();
  });
}
async function initializeTelemetry() {
  profileCheckpoint("telemetry_init_start");
  bootstrapTelemetry();
  if (getHasFormattedOutput()) {
    for (const key of [
      "OTEL_METRICS_EXPORTER",
      "OTEL_LOGS_EXPORTER",
      "OTEL_TRACES_EXPORTER"
    ]) {
      const v = process.env[key];
      if (v?.includes("console")) {
        process.env[key] = v.split(",").map((s) => s.trim()).filter((s) => s !== "console").join(",");
      }
    }
  }
  import_api5.diag.setLogger(new ClaudeCodeDiagLogger, import_api5.DiagLogLevel.ERROR);
  initializePerfettoTracing();
  const readers = [];
  const telemetryEnabled = isTelemetryEnabled();
  logForDebugging(`[3P telemetry] isTelemetryEnabled=${telemetryEnabled} (CLAUDE_CODE_ENABLE_TELEMETRY=${process.env.CLAUDE_CODE_ENABLE_TELEMETRY})`);
  if (telemetryEnabled) {
    readers.push(...await getOtlpReaders());
  }
  if (isBigQueryMetricsEnabled()) {
    readers.push(getBigQueryExportingReader());
  }
  const platform = getPlatform();
  const baseAttributes = {
    [import_semantic_conventions2.ATTR_SERVICE_NAME]: "claude-code",
    [import_semantic_conventions2.ATTR_SERVICE_VERSION]: "5.0.0"
  };
  if (platform === "wsl") {
    const wslVersion = getWslVersion();
    if (wslVersion) {
      baseAttributes["wsl.version"] = wslVersion;
    }
  }
  const baseResource = import_resources2.resourceFromAttributes(baseAttributes);
  const osResource = import_resources2.resourceFromAttributes(import_resources2.osDetector.detect().attributes || {});
  const hostDetected = import_resources2.hostDetector.detect();
  const hostArchAttributes = hostDetected.attributes?.[import_semantic_conventions2.SEMRESATTRS_HOST_ARCH] ? {
    [import_semantic_conventions2.SEMRESATTRS_HOST_ARCH]: hostDetected.attributes[import_semantic_conventions2.SEMRESATTRS_HOST_ARCH]
  } : {};
  const hostArchResource = import_resources2.resourceFromAttributes(hostArchAttributes);
  const envResource = import_resources2.resourceFromAttributes(import_resources2.envDetector.detect().attributes || {});
  const resource = baseResource.merge(osResource).merge(hostArchResource).merge(envResource);
  if (isBetaTracingEnabled()) {
    initializeBetaTracing(resource).catch((e) => logForDebugging(`Beta tracing init failed: ${e}`, { level: "error" }));
    const meterProvider2 = new import_sdk_metrics2.MeterProvider({
      resource,
      views: [],
      readers
    });
    setMeterProvider(meterProvider2);
    const shutdownTelemetry2 = async () => {
      const timeoutMs = parseInt(process.env.CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS || "2000", 10);
      try {
        endInteractionSpan();
        const loggerProvider = getLoggerProvider();
        const tracerProvider = getTracerProvider();
        const chains = [meterProvider2.shutdown()];
        if (loggerProvider) {
          chains.push(loggerProvider.forceFlush().then(() => loggerProvider.shutdown()));
        }
        if (tracerProvider) {
          chains.push(tracerProvider.forceFlush().then(() => tracerProvider.shutdown()));
        }
        await Promise.race([
          Promise.all(chains),
          telemetryTimeout(timeoutMs, "OpenTelemetry shutdown timeout")
        ]);
      } catch {}
    };
    registerCleanup(shutdownTelemetry2);
    return meterProvider2.getMeter("com.anthropic.claude_code", "5.0.0");
  }
  const meterProvider = new import_sdk_metrics2.MeterProvider({
    resource,
    views: [],
    readers
  });
  setMeterProvider(meterProvider);
  if (telemetryEnabled) {
    const logExporters = await getOtlpLogExporters();
    logForDebugging(`[3P telemetry] Created ${logExporters.length} log exporter(s)`);
    if (logExporters.length > 0) {
      const loggerProvider = new LoggerProvider({
        resource,
        processors: logExporters.map((exporter) => new BatchLogRecordProcessor(exporter, {
          scheduledDelayMillis: parseInt(process.env.OTEL_LOGS_EXPORT_INTERVAL || DEFAULT_LOGS_EXPORT_INTERVAL_MS.toString(), 10)
        }))
      });
      import_api_logs4.logs.setGlobalLoggerProvider(loggerProvider);
      setLoggerProvider(loggerProvider);
      const eventLogger = import_api_logs4.logs.getLogger("com.anthropic.claude_code.events", "5.0.0");
      setEventLogger(eventLogger);
      logForDebugging("[3P telemetry] Event logger set successfully");
      process.on("beforeExit", async () => {
        await loggerProvider?.forceFlush();
        const tracerProvider = getTracerProvider();
        await tracerProvider?.forceFlush();
      });
      process.on("exit", () => {
        loggerProvider?.forceFlush();
        getTracerProvider()?.forceFlush();
      });
    }
  }
  if (telemetryEnabled && isEnhancedTelemetryEnabled()) {
    const traceExporters = await getOtlpTraceExporters();
    if (traceExporters.length > 0) {
      const spanProcessors = traceExporters.map((exporter) => new BatchSpanProcessor(exporter, {
        scheduledDelayMillis: parseInt(process.env.OTEL_TRACES_EXPORT_INTERVAL || DEFAULT_TRACES_EXPORT_INTERVAL_MS.toString(), 10)
      }));
      const tracerProvider = new BasicTracerProvider({
        resource,
        spanProcessors
      });
      import_api5.trace.setGlobalTracerProvider(tracerProvider);
      setTracerProvider(tracerProvider);
    }
  }
  const shutdownTelemetry = async () => {
    const timeoutMs = parseInt(process.env.CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS || "2000", 10);
    try {
      endInteractionSpan();
      const shutdownPromises = [meterProvider.shutdown()];
      const loggerProvider = getLoggerProvider();
      if (loggerProvider) {
        shutdownPromises.push(loggerProvider.shutdown());
      }
      const tracerProvider = getTracerProvider();
      if (tracerProvider) {
        shutdownPromises.push(tracerProvider.shutdown());
      }
      await Promise.race([
        Promise.all(shutdownPromises),
        telemetryTimeout(timeoutMs, "OpenTelemetry shutdown timeout")
      ]);
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        logForDebugging(`
OpenTelemetry telemetry flush timed out after ${timeoutMs}ms

To resolve this issue, you can:
1. Increase the timeout by setting CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS env var (e.g., 5000 for 5 seconds)
2. Check if your OpenTelemetry backend is experiencing scalability issues
3. Disable OpenTelemetry by unsetting CLAUDE_CODE_ENABLE_TELEMETRY env var

Current timeout: ${timeoutMs}ms
`, { level: "error" });
      }
      throw error;
    }
  };
  registerCleanup(shutdownTelemetry);
  return meterProvider.getMeter("com.anthropic.claude_code", "5.0.0");
}
async function flushTelemetry() {
  const meterProvider = getMeterProvider();
  if (!meterProvider) {
    return;
  }
  const timeoutMs = parseInt(process.env.CLAUDE_CODE_OTEL_FLUSH_TIMEOUT_MS || "5000", 10);
  try {
    const flushPromises = [meterProvider.forceFlush()];
    const loggerProvider = getLoggerProvider();
    if (loggerProvider) {
      flushPromises.push(loggerProvider.forceFlush());
    }
    const tracerProvider = getTracerProvider();
    if (tracerProvider) {
      flushPromises.push(tracerProvider.forceFlush());
    }
    await Promise.race([
      Promise.all(flushPromises),
      telemetryTimeout(timeoutMs, "OpenTelemetry flush timeout")
    ]);
    logForDebugging("Telemetry flushed successfully");
  } catch (error) {
    if (error instanceof TelemetryTimeoutError) {
      logForDebugging(`Telemetry flush timed out after ${timeoutMs}ms. Some metrics may not be exported.`, { level: "warn" });
    } else {
      logForDebugging(`Telemetry flush failed: ${errorMessage(error)}`, {
        level: "error"
      });
    }
  }
}
function parseOtelHeadersEnvVar() {
  const headers = {};
  const envHeaders = process.env.OTEL_EXPORTER_OTLP_HEADERS;
  if (envHeaders) {
    for (const pair of envHeaders.split(",")) {
      const [key, ...valueParts] = pair.split("=");
      if (key && valueParts.length > 0) {
        headers[key.trim()] = valueParts.join("=").trim();
      }
    }
  }
  return headers;
}
function getOTLPExporterConfig() {
  const proxyUrl = getProxyUrl();
  const mtlsConfig = getMTLSConfig();
  const settings = getSettings_DEPRECATED();
  const config = {};
  const staticHeaders = parseOtelHeadersEnvVar();
  if (settings?.otelHeadersHelper) {
    config.headers = async () => {
      const dynamicHeaders = getOtelHeadersFromHelper();
      return { ...staticHeaders, ...dynamicHeaders };
    };
  } else if (Object.keys(staticHeaders).length > 0) {
    config.headers = async () => staticHeaders;
  }
  const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!proxyUrl || otelEndpoint && shouldBypassProxy(otelEndpoint)) {
    const caCerts2 = getCACertificates();
    if (mtlsConfig || caCerts2) {
      config.httpAgentOptions = {
        ...mtlsConfig,
        ...caCerts2 && { ca: caCerts2 }
      };
    }
    return config;
  }
  const caCerts = getCACertificates();
  const agentFactory = (_protocol) => {
    const proxyAgent = mtlsConfig || caCerts ? new HttpsProxyAgent(proxyUrl, {
      ...mtlsConfig && {
        cert: mtlsConfig.cert,
        key: mtlsConfig.key,
        passphrase: mtlsConfig.passphrase
      },
      ...caCerts && { ca: caCerts }
    }) : new HttpsProxyAgent(proxyUrl);
    return proxyAgent;
  };
  config.httpAgentOptions = agentFactory;
  return config;
}
var import_api5, import_api_logs4, import_resources2, import_sdk_metrics2, import_semantic_conventions2, DEFAULT_METRICS_EXPORT_INTERVAL_MS = 60000, DEFAULT_LOGS_EXPORT_INTERVAL_MS = 5000, DEFAULT_TRACES_EXPORT_INTERVAL_MS = 5000, TelemetryTimeoutError;
var init_instrumentation = __esm(() => {
  init_esm2();
  init_esm();
  init_dist();
  init_state();
  init_auth();
  init_platform();
  init_caCerts();
  init_cleanupRegistry();
  init_debug();
  init_envUtils();
  init_errors();
  init_mtls();
  init_proxy();
  init_settings();
  init_slowOperations();
  init_startupProfiler();
  init_betaSessionTracing();
  init_bigqueryExporter();
  init_logger();
  init_perfettoTracing();
  init_sessionTracing();
  import_api5 = __toESM(require_src(), 1);
  import_api_logs4 = __toESM(require_src5(), 1);
  import_resources2 = __toESM(require_src4(), 1);
  import_sdk_metrics2 = __toESM(require_src6(), 1);
  import_semantic_conventions2 = __toESM(require_src2(), 1);
  TelemetryTimeoutError = class TelemetryTimeoutError extends Error {
  };
});
init_instrumentation();

export {
  parseExporterTypes,
  isTelemetryEnabled,
  initializeTelemetry,
  flushTelemetry,
  bootstrapTelemetry
};

//# debugId=C62599F2B1C987D564756E2164756E21
//# sourceMappingURL=chunk-7mw97s81.js.map
