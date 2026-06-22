// @bun
import {
  assertWorkspaceHost,
  init_hostGuard
} from "./chunk-hy1f10wk.js";
import {
  init_launchCommand,
  launchCommand
} from "./chunk-bsb8gppa.js";
import {
  cronToHuman,
  init_cron,
  parseCronExpression
} from "./chunk-093ej2sf.js";
import {
  init_api,
  prepareWorkspaceApiRequest
} from "./chunk-g5vjgacw.js";
import"./chunk-bgan4cpf.js";
import"./chunk-e45319yt.js";
import"./chunk-jyqypr4z.js";
import"./chunk-m18nccbn.js";
import"./chunk-e2jvken3.js";
import"./chunk-5zhv4jyp.js";
import"./chunk-jwyj6t5m.js";
import"./chunk-87f9np2y.js";
import"./chunk-zq3spn7d.js";
import"./chunk-jmv7k0jn.js";
import"./chunk-7fbjbgr5.js";
import"./chunk-x5wzz44g.js";
import"./chunk-r87btn9p.js";
import"./chunk-v4ypszbb.js";
import {
  getOauthConfig,
  init_oauth
} from "./chunk-dw66fdss.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-fejeqe61.js";
import {
  ThemedBox_default,
  ThemedText,
  init_src
} from "./chunk-49x6szsr.js";
import"./chunk-0k4kr3h5.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
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
import"./chunk-bt5n9f4r.js";
import"./chunk-qkkkfh9a.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-w7s0zvjq.js";
import"./chunk-w95hkggk.js";
import"./chunk-kc49dhz0.js";
import"./chunk-k51zdj4e.js";
import"./chunk-mtgfbnth.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import"./chunk-pyv3zrjt.js";
import"./chunk-kb3758f7.js";
import"./chunk-232p95fy.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/agents-platform/agentsApi.ts
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function buildHeaders() {
  let apiKey;
  try {
    const prepared = await prepareWorkspaceApiRequest();
    apiKey = prepared.apiKey;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new AgentsApiError(msg, 501);
  }
  assertWorkspaceHost(agentsBaseUrl());
  return {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-beta": AGENTS_BETA_HEADER,
    "content-type": "application/json"
  };
}
function agentsBaseUrl() {
  return `${getOauthConfig().BASE_API_URL}/v1/agents`;
}
function classifyError(err) {
  if (axios_default.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    if (status === 401) {
      return new AgentsApiError("Authentication failed. Please run /login to re-authenticate.", 401);
    }
    if (status === 403) {
      return new AgentsApiError("Subscription required. Scheduled agents require a Claude Pro/Max/Team subscription.", 403);
    }
    if (status === 404) {
      return new AgentsApiError("Agent not found.", 404);
    }
    if (status === 429) {
      const retryAfter = err.response?.headers?.["retry-after"] ?? "";
      const detail = retryAfter ? ` Retry after ${retryAfter}s.` : "";
      return new AgentsApiError(`Rate limit exceeded.${detail}`, 429);
    }
    const msg = err.response?.data?.error?.message ?? err.message;
    return new AgentsApiError(msg, status);
  }
  if (err instanceof AgentsApiError)
    return err;
  return new AgentsApiError(err instanceof Error ? err.message : String(err), 0);
}
function parseRetryAfterMs(header) {
  if (!header)
    return null;
  const seconds = Number(header);
  if (!Number.isNaN(seconds) && seconds >= 0)
    return seconds * 1000;
  const date = Date.parse(header);
  if (!Number.isNaN(date))
    return Math.max(0, date - Date.now());
  return null;
}
async function withRetry(fn) {
  let lastErr;
  for (let attempt = 0;attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const classified = classifyError(err);
      if (classified.statusCode >= 500) {
        lastErr = classified;
        if (attempt < MAX_RETRIES - 1) {
          const retryAfterHeader = axios_default.isAxiosError(err) ? err.response?.headers?.["retry-after"] : undefined;
          const waitMs = parseRetryAfterMs(retryAfterHeader) ?? 500 * 2 ** attempt;
          await sleep(waitMs);
        }
        continue;
      }
      throw classified;
    }
  }
  throw lastErr ?? new AgentsApiError("Request failed after retries", 0);
}
async function listAgents() {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(agentsBaseUrl(), {
      headers
    });
    return response.data.data ?? [];
  });
}
async function createAgent(cron, prompt) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.post(agentsBaseUrl(), {
      cron_expr: cron,
      prompt,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC"
    }, { headers });
    return response.data;
  });
}
async function deleteAgent(id) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    await axios_default.delete(`${agentsBaseUrl()}/${id}`, { headers });
  });
}
async function runAgent(id) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.post(`${agentsBaseUrl()}/${id}/run`, {}, { headers });
    return response.data;
  });
}
var AGENTS_BETA_HEADER = "managed-agents-2026-04-01", MAX_RETRIES = 3, AgentsApiError;
var init_agentsApi = __esm(() => {
  init_axios();
  init_oauth();
  init_hostGuard();
  init_api();
  AgentsApiError = class AgentsApiError extends Error {
    statusCode;
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.name = "AgentsApiError";
    }
  };
});

// src/commands/agents-platform/AgentsPlatformView.tsx
function AgentRow({ agent }) {
  const schedule = cronToHuman(agent.cron_expr, { utc: true });
  const nextRun = agent.next_run ? new Date(agent.next_run).toLocaleString() : "\u2014";
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            children: agent.id
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: " \xB7 "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            color: "suggestion",
            children: agent.status
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          "Schedule: ",
          schedule
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        dimColor: true,
        children: [
          "Prompt: ",
          agent.prompt
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        dimColor: true,
        children: [
          "Next run: ",
          nextRun
        ]
      })
    ]
  });
}
function AgentsPlatformView(props) {
  if (props.mode === "list") {
    if (props.agents.length === 0) {
      return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "No scheduled agents. Use /agents-platform create <cron> <prompt> to create one."
        })
      });
    }
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            bold: true,
            children: [
              "Scheduled Agents (",
              props.agents.length,
              ")"
            ]
          })
        }),
        props.agents.map((agent) => /* @__PURE__ */ jsx_runtime.jsx(AgentRow, {
          agent
        }, agent.id))
      ]
    });
  }
  if (props.mode === "created") {
    const schedule = cronToHuman(props.agent.cron_expr, { utc: true });
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "success",
            children: "Agent created"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "ID: ",
            props.agent.id
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Schedule: ",
            schedule
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Prompt: ",
            props.agent.prompt
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Status: ",
            props.agent.status
          ]
        })
      ]
    });
  }
  if (props.mode === "deleted") {
    return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        color: "success",
        children: [
          "Agent ",
          props.id,
          " deleted."
        ]
      })
    });
  }
  if (props.mode === "ran") {
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            color: "success",
            children: [
              "Agent ",
              props.id,
              " triggered."
            ]
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Run ID: ",
            props.runId
          ]
        })
      ]
    });
  }
  return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
    children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
      color: "error",
      children: props.message
    })
  });
}
var jsx_runtime;
var init_AgentsPlatformView = __esm(() => {
  init_src();
  init_cron();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/commands/agents-platform/parseArgs.ts
function splitCronAndPrompt(rest) {
  const tokens = rest.trim().split(/\s+/);
  if (tokens.length < 6)
    return null;
  const cron = tokens.slice(0, 5).join(" ");
  const prompt = tokens.slice(5).join(" ");
  return { cron, prompt };
}
function parseAgentsPlatformArgs(args) {
  const trimmed = args.trim();
  if (trimmed === "" || trimmed === "list") {
    return { action: "list" };
  }
  const spaceIdx = trimmed.indexOf(" ");
  const subCmd = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();
  if (subCmd === "create") {
    if (!rest) {
      return {
        action: "invalid",
        reason: 'create requires a cron expression and prompt, e.g. create "0 9 * * 1" Run daily standup'
      };
    }
    const parsed = splitCronAndPrompt(rest);
    if (!parsed) {
      return {
        action: "invalid",
        reason: 'create requires at least 5 cron fields followed by a prompt, e.g. create "0 9 * * 1" Run daily standup'
      };
    }
    const { cron, prompt } = parsed;
    if (!prompt.trim()) {
      return { action: "invalid", reason: "prompt cannot be empty" };
    }
    return { action: "create", cron, prompt: prompt.trim() };
  }
  if (subCmd === "delete") {
    if (!rest) {
      return { action: "invalid", reason: "delete requires an agent id" };
    }
    const id = rest.split(/\s+/)[0];
    if (!id) {
      return { action: "invalid", reason: "delete requires an agent id" };
    }
    return { action: "delete", id };
  }
  if (subCmd === "run") {
    if (!rest) {
      return { action: "invalid", reason: "run requires an agent id" };
    }
    const id = rest.split(/\s+/)[0];
    if (!id) {
      return { action: "invalid", reason: "run requires an agent id" };
    }
    return { action: "run", id };
  }
  return {
    action: "invalid",
    reason: `Unknown sub-command "${subCmd}". Use: list | create CRON PROMPT | delete ID | run ID`
  };
}
var init_parseArgs = () => {};

// src/commands/agents-platform/launchAgentsPlatform.tsx
async function dispatchAgentsPlatform(parsed, onDone) {
  if (parsed.action === "list") {
    logEvent("tengu_agents_platform_list", {});
    try {
      const agents = await listAgents();
      onDone(agents.length === 0 ? "No scheduled agents found." : `${agents.length} scheduled agent(s).`, {
        display: "system"
      });
      return { mode: "list", agents };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_agents_platform_failed", {
        reason: msg
      });
      onDone(`Failed to list agents: ${msg}`, { display: "system" });
      return { mode: "error", message: msg };
    }
  }
  if (parsed.action === "create") {
    const { cron, prompt } = parsed;
    const cronFields = parseCronExpression(cron);
    if (!cronFields) {
      const reason = `Invalid cron expression: "${cron}". Expected 5 fields (minute hour day month weekday).`;
      logEvent("tengu_agents_platform_failed", {
        reason
      });
      onDone(reason, { display: "system" });
      return null;
    }
    logEvent("tengu_agents_platform_create", {
      cron
    });
    try {
      const agent = await createAgent(cron, prompt);
      onDone(`Agent created: ${agent.id}`, { display: "system" });
      return { mode: "created", agent };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_agents_platform_failed", {
        reason: msg
      });
      onDone(`Failed to create agent: ${msg}`, { display: "system" });
      return { mode: "error", message: msg };
    }
  }
  if (parsed.action === "delete") {
    const { id: id2 } = parsed;
    logEvent("tengu_agents_platform_delete", {
      id: id2
    });
    try {
      await deleteAgent(id2);
      onDone(`Agent ${id2} deleted.`, { display: "system" });
      return { mode: "deleted", id: id2 };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_agents_platform_failed", {
        reason: msg
      });
      onDone(`Failed to delete agent ${id2}: ${msg}`, { display: "system" });
      return { mode: "error", message: msg };
    }
  }
  const runParsed = parsed;
  const { id } = runParsed;
  logEvent("tengu_agents_platform_run", {
    id
  });
  try {
    const result = await runAgent(id);
    onDone(`Agent ${id} triggered. Run ID: ${result.run_id}`, { display: "system" });
    return { mode: "ran", id, runId: result.run_id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent("tengu_agents_platform_failed", {
      reason: msg
    });
    onDone(`Failed to run agent ${id}: ${msg}`, { display: "system" });
    return { mode: "error", message: msg };
  }
}
var callAgentsPlatform;
var init_launchAgentsPlatform = __esm(() => {
  init_analytics();
  init_cron();
  init_agentsApi();
  init_AgentsPlatformView();
  init_parseArgs();
  init_launchCommand();
  callAgentsPlatform = launchCommand({
    commandName: "agents-platform",
    parseArgs: (raw) => {
      logEvent("tengu_agents_platform_started", {
        args: raw
      });
      const result = parseAgentsPlatformArgs(raw);
      if (result.action === "invalid") {
        logEvent("tengu_agents_platform_failed", {
          reason: result.reason
        });
        return {
          action: "invalid",
          reason: `Usage: /agents-platform list | create CRON PROMPT | delete ID | run ID
${result.reason}`
        };
      }
      return result;
    },
    dispatch: dispatchAgentsPlatform,
    View: AgentsPlatformView,
    errorView: (_msg) => null
  });
});
init_launchAgentsPlatform();

export {
  callAgentsPlatform
};

//# debugId=2D8A2BF35A30401264756E2164756E21
//# sourceMappingURL=chunk-yj9mpmwp.js.map
