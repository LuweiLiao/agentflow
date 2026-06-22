// @bun
import {
  gracefulShutdown,
  init_gracefulShutdown
} from "./chunk-xzgt0njb.js";
import {
  getAuthHeaders,
  getClaudeCodeUserAgent,
  getUserAgent,
  init_http,
  init_userAgent,
  withOAuth401Retry
} from "./chunk-35jsjk7z.js";
import {
  getOauthAccountInfo,
  init_auth,
  isConsumerSubscriber
} from "./chunk-e45319yt.js";
import {
  getGlobalConfig,
  init_config,
  saveGlobalConfig
} from "./chunk-jyqypr4z.js";
import {
  getOauthConfig,
  init_oauth
} from "./chunk-dw66fdss.js";
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
  logForDebugging
} from "./chunk-pyv3zrjt.js";
import {
  init_process,
  writeToStderr
} from "./chunk-kb3758f7.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-nxzx0ey9.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/api/grove.ts
async function markGroveNoticeViewed() {
  try {
    await withOAuth401Retry(() => {
      const authHeaders = getAuthHeaders();
      if (authHeaders.error) {
        throw new Error(`Failed to get auth headers: ${authHeaders.error}`);
      }
      return axios_default.post(`${getOauthConfig().BASE_API_URL}/api/oauth/account/grove_notice_viewed`, {}, {
        headers: {
          ...authHeaders.headers,
          "User-Agent": getClaudeCodeUserAgent()
        }
      });
    });
    getGroveSettings.cache.clear?.();
  } catch (err) {
    logError(err);
  }
}
async function updateGroveSettings(groveEnabled) {
  try {
    await withOAuth401Retry(() => {
      const authHeaders = getAuthHeaders();
      if (authHeaders.error) {
        throw new Error(`Failed to get auth headers: ${authHeaders.error}`);
      }
      return axios_default.patch(`${getOauthConfig().BASE_API_URL}/api/oauth/account/settings`, {
        grove_enabled: groveEnabled
      }, {
        headers: {
          ...authHeaders.headers,
          "User-Agent": getClaudeCodeUserAgent()
        }
      });
    });
    getGroveSettings.cache.clear?.();
  } catch (err) {
    logError(err);
  }
}
async function isQualifiedForGrove() {
  if (!isConsumerSubscriber()) {
    return false;
  }
  const accountId = getOauthAccountInfo()?.accountUuid;
  if (!accountId) {
    return false;
  }
  const globalConfig = getGlobalConfig();
  const cachedEntry = globalConfig.groveConfigCache?.[accountId];
  const now = Date.now();
  if (!cachedEntry) {
    logForDebugging("Grove: No cache, fetching config in background (dialog skipped this session)");
    fetchAndStoreGroveConfig(accountId);
    return false;
  }
  if (now - cachedEntry.timestamp > GROVE_CACHE_EXPIRATION_MS) {
    logForDebugging("Grove: Cache stale, returning cached data and refreshing in background");
    fetchAndStoreGroveConfig(accountId);
    return cachedEntry.grove_enabled;
  }
  logForDebugging("Grove: Using fresh cached config");
  return cachedEntry.grove_enabled;
}
async function fetchAndStoreGroveConfig(accountId) {
  try {
    const result = await getGroveNoticeConfig();
    if (!result.success) {
      return;
    }
    const groveEnabled = result.data.grove_enabled;
    const cachedEntry = getGlobalConfig().groveConfigCache?.[accountId];
    if (cachedEntry?.grove_enabled === groveEnabled && Date.now() - cachedEntry.timestamp <= GROVE_CACHE_EXPIRATION_MS) {
      return;
    }
    saveGlobalConfig((current) => ({
      ...current,
      groveConfigCache: {
        ...current.groveConfigCache,
        [accountId]: {
          grove_enabled: groveEnabled,
          timestamp: Date.now()
        }
      }
    }));
  } catch (err) {
    logForDebugging(`Grove: Failed to fetch and store config: ${err}`);
  }
}
function calculateShouldShowGrove(settingsResult, configResult, showIfAlreadyViewed) {
  if (!settingsResult.success || !configResult.success) {
    return false;
  }
  const settings = settingsResult.data;
  const config = configResult.data;
  const hasChosen = settings.grove_enabled !== null;
  if (hasChosen) {
    return false;
  }
  if (showIfAlreadyViewed) {
    return true;
  }
  if (!config.notice_is_grace_period) {
    return true;
  }
  const reminderFrequency = config.notice_reminder_frequency;
  if (reminderFrequency !== null && settings.grove_notice_viewed_at) {
    const daysSinceViewed = Math.floor((Date.now() - new Date(settings.grove_notice_viewed_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceViewed >= reminderFrequency;
  } else {
    const viewedAt = settings.grove_notice_viewed_at;
    return viewedAt === null || viewedAt === undefined;
  }
}
async function checkGroveForNonInteractive() {
  const [settingsResult, configResult] = await Promise.all([
    getGroveSettings(),
    getGroveNoticeConfig()
  ]);
  const shouldShowGrove = calculateShouldShowGrove(settingsResult, configResult, false);
  if (shouldShowGrove) {
    const config = configResult.success ? configResult.data : null;
    logEvent("tengu_grove_print_viewed", {
      dismissable: config?.notice_is_grace_period
    });
    if (config === null || config.notice_is_grace_period) {
      writeToStderr(`
An update to our Consumer Terms and Privacy Policy will take effect on October 8, 2025. Run \`claude\` to review the updated terms.

`);
      await markGroveNoticeViewed();
    } else {
      writeToStderr(`
[ACTION REQUIRED] An update to our Consumer Terms and Privacy Policy has taken effect on October 8, 2025. You must run \`claude\` to review the updated terms.

`);
      await gracefulShutdown(1);
    }
  }
}
var GROVE_CACHE_EXPIRATION_MS, getGroveSettings, getGroveNoticeConfig;
var init_grove = __esm(() => {
  init_axios();
  init_memoize();
  init_analytics();
  init_auth();
  init_debug();
  init_gracefulShutdown();
  init_privacyLevel();
  init_process();
  init_oauth();
  init_config();
  init_http();
  init_log();
  init_userAgent();
  GROVE_CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;
  getGroveSettings = memoize_default(async () => {
    if (isEssentialTrafficOnly()) {
      return { success: false };
    }
    try {
      const response = await withOAuth401Retry(() => {
        const authHeaders = getAuthHeaders();
        if (authHeaders.error) {
          throw new Error(`Failed to get auth headers: ${authHeaders.error}`);
        }
        return axios_default.get(`${getOauthConfig().BASE_API_URL}/api/oauth/account/settings`, {
          headers: {
            ...authHeaders.headers,
            "User-Agent": getClaudeCodeUserAgent()
          }
        });
      });
      return { success: true, data: response.data };
    } catch (err) {
      logError(err);
      getGroveSettings.cache.clear?.();
      return { success: false };
    }
  });
  getGroveNoticeConfig = memoize_default(async () => {
    if (isEssentialTrafficOnly()) {
      return { success: false };
    }
    try {
      const response = await withOAuth401Retry(() => {
        const authHeaders = getAuthHeaders();
        if (authHeaders.error) {
          throw new Error(`Failed to get auth headers: ${authHeaders.error}`);
        }
        return axios_default.get(`${getOauthConfig().BASE_API_URL}/api/claude_code_grove`, {
          headers: {
            ...authHeaders.headers,
            "User-Agent": getUserAgent()
          },
          timeout: 3000
        });
      });
      const {
        grove_enabled,
        domain_excluded,
        notice_is_grace_period,
        notice_reminder_frequency
      } = response.data;
      return {
        success: true,
        data: {
          grove_enabled,
          domain_excluded: domain_excluded ?? false,
          notice_is_grace_period: notice_is_grace_period ?? true,
          notice_reminder_frequency
        }
      };
    } catch (err) {
      logForDebugging(`Failed to fetch Grove notice config: ${err}`);
      return { success: false };
    }
  });
});

export { getGroveSettings, markGroveNoticeViewed, updateGroveSettings, isQualifiedForGrove, getGroveNoticeConfig, calculateShouldShowGrove, checkGroveForNonInteractive, init_grove };

//# debugId=74A6CFE74E979F2564756E2164756E21
//# sourceMappingURL=chunk-jjfxy9t2.js.map
