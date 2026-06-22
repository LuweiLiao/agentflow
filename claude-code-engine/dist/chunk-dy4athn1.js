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

// src/commands/memory-stores/memoryStoresApi.ts
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
    throw new MemoryStoresApiError(msg, 501);
  }
  assertWorkspaceHost(memoryStoresBaseUrl());
  return {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-beta": MEMORY_STORES_BETA_HEADER,
    "content-type": "application/json"
  };
}
function memoryStoresBaseUrl() {
  return `${getOauthConfig().BASE_API_URL}/v1/memory_stores`;
}
function classifyError(err) {
  if (axios_default.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    if (status === 401) {
      return new MemoryStoresApiError("Authentication failed. Please run /login to re-authenticate.", 401);
    }
    if (status === 403) {
      return new MemoryStoresApiError("Subscription required. Memory stores require a Claude Pro/Max/Team subscription.", 403);
    }
    if (status === 404) {
      return new MemoryStoresApiError("Memory store or memory not found.", 404);
    }
    if (status === 429) {
      const retryAfter = err.response?.headers?.["retry-after"] ?? "";
      const detail = retryAfter ? ` Retry after ${retryAfter}s.` : "";
      return new MemoryStoresApiError(`Rate limit exceeded.${detail}`, 429);
    }
    const msg = err.response?.data?.error?.message ?? err.message;
    return new MemoryStoresApiError(msg, status);
  }
  if (err instanceof MemoryStoresApiError)
    return err;
  return new MemoryStoresApiError(err instanceof Error ? err.message : String(err), 0);
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
  throw lastErr ?? new MemoryStoresApiError("Request failed after retries", 0);
}
async function listStores() {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(memoryStoresBaseUrl(), {
      headers
    });
    return response.data.data ?? [];
  });
}
async function createStore(name, namespace) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const body = { name };
    if (namespace)
      body.namespace = namespace;
    const response = await axios_default.post(memoryStoresBaseUrl(), body, {
      headers
    });
    return response.data;
  });
}
async function getStore(id) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(`${memoryStoresBaseUrl()}/${id}`, { headers });
    return response.data;
  });
}
async function archiveStore(id) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.post(`${memoryStoresBaseUrl()}/${id}/archive`, {}, { headers });
    return response.data;
  });
}
async function listMemories(storeId) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(`${memoryStoresBaseUrl()}/${storeId}/memories`, { headers });
    return response.data.data ?? [];
  });
}
async function createMemory(storeId, content) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const body = { content };
    const response = await axios_default.post(`${memoryStoresBaseUrl()}/${storeId}/memories`, body, { headers });
    return response.data;
  });
}
async function getMemory(storeId, memoryId) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(`${memoryStoresBaseUrl()}/${storeId}/memories/${memoryId}`, { headers });
    return response.data;
  });
}
async function updateMemory(storeId, memoryId, content) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const body = { content };
    const response = await axios_default.patch(`${memoryStoresBaseUrl()}/${storeId}/memories/${memoryId}`, body, { headers });
    return response.data;
  });
}
async function deleteMemory(storeId, memoryId) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    await axios_default.delete(`${memoryStoresBaseUrl()}/${storeId}/memories/${memoryId}`, { headers });
  });
}
async function listVersions(storeId) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(`${memoryStoresBaseUrl()}/${storeId}/memory_versions`, { headers });
    return response.data.data ?? [];
  });
}
async function redactVersion(storeId, versionId) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.post(`${memoryStoresBaseUrl()}/${storeId}/memory_versions/${versionId}/redact`, {}, { headers });
    return response.data;
  });
}
var MEMORY_STORES_BETA_HEADER = "managed-agents-2026-04-01", MAX_RETRIES = 3, MemoryStoresApiError;
var init_memoryStoresApi = __esm(() => {
  init_axios();
  init_oauth();
  init_hostGuard();
  init_api();
  MemoryStoresApiError = class MemoryStoresApiError extends Error {
    statusCode;
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.name = "MemoryStoresApiError";
    }
  };
});

// src/commands/memory-stores/MemoryStoresView.tsx
function StoreRow({ store }) {
  const isArchived = !!store.archived_at;
  const createdAt = store.created_at ? new Date(store.created_at).toLocaleString() : "\u2014";
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            children: store.memory_store_id
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: " \xB7 "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            color: isArchived ? "warning" : "success",
            children: isArchived ? "archived" : "active"
          }),
          store.namespace ? /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                dimColor: true,
                children: " \xB7 ns: "
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                children: store.namespace
              })
            ]
          }) : null
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          "Name: ",
          store.name
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        dimColor: true,
        children: [
          "Created: ",
          createdAt
        ]
      })
    ]
  });
}
function MemoryStoresView(props) {
  if (props.mode === "list") {
    if (props.stores.length === 0) {
      return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "No memory stores found. Use /memory-stores create <name> to create one."
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
              "Memory Stores (",
              props.stores.length,
              ")"
            ]
          })
        }),
        props.stores.map((store) => /* @__PURE__ */ jsx_runtime.jsx(StoreRow, {
          store
        }, store.memory_store_id))
      ]
    });
  }
  if (props.mode === "detail") {
    const { store } = props;
    const isArchived = !!store.archived_at;
    const createdAt = store.created_at ? new Date(store.created_at).toLocaleString() : "\u2014";
    const archivedAt = store.archived_at ? new Date(store.archived_at).toLocaleString() : null;
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            bold: true,
            children: [
              "Memory Store: ",
              store.memory_store_id
            ]
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Name: ",
            store.name
          ]
        }),
        store.namespace ? /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Namespace: ",
            store.namespace
          ]
        }) : null,
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Status:",
            " ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: isArchived ? "warning" : "success",
              children: isArchived ? "archived" : "active"
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Created: ",
            createdAt
          ]
        }),
        archivedAt ? /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Archived: ",
            archivedAt
          ]
        }) : null
      ]
    });
  }
  if (props.mode === "created") {
    const { store } = props;
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "success",
            children: "Memory store created"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "ID: ",
            store.memory_store_id
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Name: ",
            store.name
          ]
        }),
        store.namespace ? /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Namespace: ",
            store.namespace
          ]
        }) : null
      ]
    });
  }
  if (props.mode === "archived") {
    const { store } = props;
    const archivedAt = store.archived_at ? new Date(store.archived_at).toLocaleString() : "\u2014";
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "warning",
            children: "Memory store archived"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "ID: ",
            store.memory_store_id
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Archived at: ",
            archivedAt
          ]
        })
      ]
    });
  }
  if (props.mode === "memory-list") {
    const { storeId, memories } = props;
    if (memories.length === 0) {
      return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "No memories in store ",
            storeId,
            ". Use /memory-stores create-memory ",
            storeId,
            " <content> to add one."
          ]
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
              "Memories in ",
              storeId,
              " (",
              memories.length,
              ")"
            ]
          })
        }),
        memories.map((mem) => /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
          flexDirection: "column",
          marginBottom: 1,
          children: [
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              bold: true,
              children: mem.memory_id
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor: true,
              children: mem.content.length > 80 ? `${mem.content.slice(0, 80)}\u2026` : mem.content
            })
          ]
        }, mem.memory_id))
      ]
    });
  }
  if (props.mode === "memory-detail") {
    const { memory } = props;
    const createdAt = memory.created_at ? new Date(memory.created_at).toLocaleString() : "\u2014";
    const updatedAt = memory.updated_at ? new Date(memory.updated_at).toLocaleString() : "\u2014";
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            bold: true,
            children: [
              "Memory: ",
              memory.memory_id
            ]
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Store: ",
            memory.memory_store_id
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Content: ",
            memory.content
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Created: ",
            createdAt
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Updated: ",
            updatedAt
          ]
        })
      ]
    });
  }
  if (props.mode === "memory-created") {
    const { memory } = props;
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "success",
            children: "Memory created"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "ID: ",
            memory.memory_id
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Store: ",
            memory.memory_store_id
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Content: ",
            memory.content
          ]
        })
      ]
    });
  }
  if (props.mode === "memory-updated") {
    const { memory } = props;
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "success",
            children: "Memory updated"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "ID: ",
            memory.memory_id
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Content: ",
            memory.content
          ]
        })
      ]
    });
  }
  if (props.mode === "memory-deleted") {
    return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        color: "success",
        children: [
          "Memory ",
          props.memoryId,
          " deleted from store ",
          props.storeId,
          "."
        ]
      })
    });
  }
  if (props.mode === "versions") {
    const { storeId, versions } = props;
    if (versions.length === 0) {
      return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "No memory versions found for store ",
            storeId,
            "."
          ]
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
              "Memory Versions in ",
              storeId,
              " (",
              versions.length,
              ")"
            ]
          })
        }),
        versions.map((ver) => {
          const createdAt = ver.created_at ? new Date(ver.created_at).toLocaleString() : "\u2014";
          const isRedacted = !!ver.redacted_at;
          return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            flexDirection: "column",
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                    bold: true,
                    children: ver.version_id
                  }),
                  isRedacted ? /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
                    children: [
                      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                        dimColor: true,
                        children: " \xB7 "
                      }),
                      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                        color: "warning",
                        children: "redacted"
                      })
                    ]
                  }) : null
                ]
              }),
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                dimColor: true,
                children: [
                  "Created: ",
                  createdAt
                ]
              })
            ]
          }, ver.version_id);
        })
      ]
    });
  }
  if (props.mode === "redacted") {
    const { version } = props;
    const redactedAt = version.redacted_at ? new Date(version.redacted_at).toLocaleString() : "\u2014";
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "warning",
            children: "Version redacted"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "ID: ",
            version.version_id
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Redacted at: ",
            redactedAt
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
var init_MemoryStoresView = __esm(() => {
  init_src();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/commands/memory-stores/parseArgs.ts
function parseMemoryStoresArgs(args) {
  const trimmed = args.trim();
  if (trimmed === "" || trimmed === "list") {
    return { action: "list" };
  }
  const spaceIdx = trimmed.indexOf(" ");
  const subCmd = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();
  if (subCmd === "get") {
    if (!rest) {
      return { action: "invalid", reason: "get requires a store id" };
    }
    const id = rest.split(/\s+/)[0];
    if (!id) {
      return { action: "invalid", reason: "get requires a store id" };
    }
    return { action: "get", id };
  }
  if (subCmd === "create") {
    if (!rest) {
      return {
        action: "invalid",
        reason: 'create requires a store name, e.g. create "My Work Store"'
      };
    }
    return { action: "create", name: rest };
  }
  if (subCmd === "archive") {
    if (!rest) {
      return { action: "invalid", reason: "archive requires a store id" };
    }
    const id = rest.split(/\s+/)[0];
    if (!id) {
      return { action: "invalid", reason: "archive requires a store id" };
    }
    return { action: "archive", id };
  }
  if (subCmd === "memories") {
    if (!rest) {
      return { action: "invalid", reason: "memories requires a store id" };
    }
    const storeId = rest.split(/\s+/)[0];
    if (!storeId) {
      return { action: "invalid", reason: "memories requires a store id" };
    }
    return { action: "memories", storeId };
  }
  if (subCmd === "create-memory") {
    const parts = rest.split(/\s+/);
    if (parts.length < 2 || !parts[0]) {
      return {
        action: "invalid",
        reason: 'create-memory requires a store id and content, e.g. create-memory ms_123 "The content"'
      };
    }
    const storeId = parts[0];
    const content = parts.slice(1).join(" ");
    if (!content.trim()) {
      return {
        action: "invalid",
        reason: "create-memory requires non-empty content"
      };
    }
    return { action: "create-memory", storeId, content: content.trim() };
  }
  if (subCmd === "get-memory") {
    const parts = rest.split(/\s+/);
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      return {
        action: "invalid",
        reason: "get-memory requires a store id and memory id, e.g. get-memory ms_123 mem_456"
      };
    }
    return { action: "get-memory", storeId: parts[0], memoryId: parts[1] };
  }
  if (subCmd === "update-memory") {
    const parts = rest.split(/\s+/);
    if (parts.length < 3 || !parts[0] || !parts[1]) {
      return {
        action: "invalid",
        reason: 'update-memory requires store id, memory id, and content, e.g. update-memory ms_123 mem_456 "New content"'
      };
    }
    const storeId = parts[0];
    const memoryId = parts[1];
    const content = parts.slice(2).join(" ");
    if (!content.trim()) {
      return {
        action: "invalid",
        reason: "update-memory requires non-empty content"
      };
    }
    return {
      action: "update-memory",
      storeId,
      memoryId,
      content: content.trim()
    };
  }
  if (subCmd === "delete-memory") {
    const parts = rest.split(/\s+/);
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      return {
        action: "invalid",
        reason: "delete-memory requires a store id and memory id, e.g. delete-memory ms_123 mem_456"
      };
    }
    return { action: "delete-memory", storeId: parts[0], memoryId: parts[1] };
  }
  if (subCmd === "versions") {
    if (!rest) {
      return { action: "invalid", reason: "versions requires a store id" };
    }
    const storeId = rest.split(/\s+/)[0];
    if (!storeId) {
      return { action: "invalid", reason: "versions requires a store id" };
    }
    return { action: "versions", storeId };
  }
  if (subCmd === "redact") {
    const parts = rest.split(/\s+/);
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      return {
        action: "invalid",
        reason: "redact requires a store id and version id, e.g. redact ms_123 ver_456"
      };
    }
    return { action: "redact", storeId: parts[0], versionId: parts[1] };
  }
  return {
    action: "invalid",
    reason: `Unknown sub-command "${subCmd}". ${USAGE}`
  };
}
var USAGE = "Usage: /memory-stores list | get ID | create NAME | archive ID | memories STORE_ID | create-memory STORE_ID CONTENT | get-memory STORE_ID MEMORY_ID | update-memory STORE_ID MEMORY_ID CONTENT | delete-memory STORE_ID MEMORY_ID | versions STORE_ID | redact STORE_ID VERSION_ID";
var init_parseArgs = () => {};

// src/commands/memory-stores/launchMemoryStores.tsx
async function dispatchMemoryStores(parsed, onDone) {
  if (parsed.action === "list") {
    logEvent("tengu_memory_stores_list", {});
    try {
      const stores = await listStores();
      onDone(stores.length === 0 ? "No memory stores found." : `${stores.length} memory store(s).`, {
        display: "system"
      });
      return { mode: "list", stores };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_memory_stores_failed", {
        reason: msg
      });
      onDone(`Failed to list memory stores: ${msg}`, { display: "system" });
      return { mode: "error", message: msg };
    }
  }
  if (parsed.action === "get") {
    const { id } = parsed;
    logEvent("tengu_memory_stores_get", {
      id
    });
    try {
      const store = await getStore(id);
      onDone(`Memory store ${id} fetched.`, { display: "system" });
      return { mode: "detail", store };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_memory_stores_failed", {
        reason: msg
      });
      onDone(`Failed to get memory store ${id}: ${msg}`, { display: "system" });
      return { mode: "error", message: msg };
    }
  }
  if (parsed.action === "create") {
    const { name } = parsed;
    logEvent("tengu_memory_stores_create", {
      name
    });
    try {
      const store = await createStore(name);
      onDone(`Memory store created: ${store.memory_store_id}`, { display: "system" });
      return { mode: "created", store };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_memory_stores_failed", {
        reason: msg
      });
      onDone(`Failed to create memory store: ${msg}`, { display: "system" });
      return { mode: "error", message: msg };
    }
  }
  if (parsed.action === "archive") {
    const { id } = parsed;
    logEvent("tengu_memory_stores_archive", {
      id
    });
    try {
      const store = await archiveStore(id);
      onDone(`Memory store ${id} archived.`, { display: "system" });
      return { mode: "archived", store };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_memory_stores_failed", {
        reason: msg
      });
      onDone(`Failed to archive memory store ${id}: ${msg}`, { display: "system" });
      return { mode: "error", message: msg };
    }
  }
  if (parsed.action === "memories") {
    const { storeId: storeId2 } = parsed;
    logEvent("tengu_memory_stores_list_memories", {
      storeId: storeId2
    });
    try {
      const memories = await listMemories(storeId2);
      onDone(memories.length === 0 ? `No memories in store ${storeId2}.` : `${memories.length} memory(ies) in store ${storeId2}.`, { display: "system" });
      return { mode: "memory-list", storeId: storeId2, memories };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_memory_stores_failed", {
        reason: msg
      });
      onDone(`Failed to list memories in store ${storeId2}: ${msg}`, { display: "system" });
      return { mode: "error", message: msg };
    }
  }
  if (parsed.action === "create-memory") {
    const { storeId: storeId2, content } = parsed;
    logEvent("tengu_memory_stores_create_memory", {
      storeId: storeId2
    });
    try {
      const memory = await createMemory(storeId2, content);
      onDone(`Memory created: ${memory.memory_id}`, { display: "system" });
      return { mode: "memory-created", memory };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_memory_stores_failed", {
        reason: msg
      });
      onDone(`Failed to create memory in store ${storeId2}: ${msg}`, { display: "system" });
      return { mode: "error", message: msg };
    }
  }
  if (parsed.action === "get-memory") {
    const { storeId: storeId2, memoryId } = parsed;
    logEvent("tengu_memory_stores_get_memory", {
      storeId: storeId2
    });
    try {
      const memory = await getMemory(storeId2, memoryId);
      onDone(`Memory ${memoryId} fetched.`, { display: "system" });
      return { mode: "memory-detail", memory };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_memory_stores_failed", {
        reason: msg
      });
      onDone(`Failed to get memory ${memoryId}: ${msg}`, { display: "system" });
      return { mode: "error", message: msg };
    }
  }
  if (parsed.action === "update-memory") {
    const { storeId: storeId2, memoryId, content } = parsed;
    logEvent("tengu_memory_stores_update_memory", {
      storeId: storeId2
    });
    try {
      const memory = await updateMemory(storeId2, memoryId, content);
      onDone(`Memory ${memoryId} updated.`, { display: "system" });
      return { mode: "memory-updated", memory };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_memory_stores_failed", {
        reason: msg
      });
      onDone(`Failed to update memory ${memoryId}: ${msg}`, { display: "system" });
      return { mode: "error", message: msg };
    }
  }
  if (parsed.action === "delete-memory") {
    const { storeId: storeId2, memoryId } = parsed;
    logEvent("tengu_memory_stores_delete_memory", {
      storeId: storeId2
    });
    try {
      await deleteMemory(storeId2, memoryId);
      onDone(`Memory ${memoryId} deleted.`, { display: "system" });
      return { mode: "memory-deleted", storeId: storeId2, memoryId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_memory_stores_failed", {
        reason: msg
      });
      onDone(`Failed to delete memory ${memoryId}: ${msg}`, { display: "system" });
      return { mode: "error", message: msg };
    }
  }
  if (parsed.action === "versions") {
    const { storeId: storeId2 } = parsed;
    logEvent("tengu_memory_stores_versions", {
      storeId: storeId2
    });
    try {
      const versions = await listVersions(storeId2);
      onDone(versions.length === 0 ? `No memory versions found for store ${storeId2}.` : `${versions.length} version(s) in store ${storeId2}.`, { display: "system" });
      return { mode: "versions", storeId: storeId2, versions };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("tengu_memory_stores_failed", {
        reason: msg
      });
      onDone(`Failed to list versions for store ${storeId2}: ${msg}`, { display: "system" });
      return { mode: "error", message: msg };
    }
  }
  const redactParsed = parsed;
  const { storeId, versionId } = redactParsed;
  logEvent("tengu_memory_stores_redact", {
    storeId
  });
  try {
    const version = await redactVersion(storeId, versionId);
    onDone(`Version ${versionId} redacted.`, { display: "system" });
    return { mode: "redacted", version };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent("tengu_memory_stores_failed", {
      reason: msg
    });
    onDone(`Failed to redact version ${versionId}: ${msg}`, { display: "system" });
    return { mode: "error", message: msg };
  }
}
var USAGE_MS = "Usage: /memory-stores list | get ID | create NAME | archive ID | memories STORE_ID | create-memory STORE_ID CONTENT | get-memory STORE_ID MEMORY_ID | update-memory STORE_ID MEMORY_ID CONTENT | delete-memory STORE_ID MEMORY_ID | versions STORE_ID | redact STORE_ID VERSION_ID", callMemoryStores;
var init_launchMemoryStores = __esm(() => {
  init_analytics();
  init_memoryStoresApi();
  init_MemoryStoresView();
  init_parseArgs();
  init_launchCommand();
  callMemoryStores = launchCommand({
    commandName: "memory-stores",
    parseArgs: (raw) => {
      logEvent("tengu_memory_stores_started", {
        args: raw
      });
      const result = parseMemoryStoresArgs(raw);
      if (result.action === "invalid") {
        logEvent("tengu_memory_stores_failed", {
          reason: result.reason
        });
        return {
          action: "invalid",
          reason: `${USAGE_MS}
${result.reason}`
        };
      }
      return result;
    },
    dispatch: dispatchMemoryStores,
    View: MemoryStoresView,
    errorView: (_msg) => null
  });
});
init_launchMemoryStores();

export {
  callMemoryStores
};

//# debugId=55BE5A11E288C8B464756E2164756E21
//# sourceMappingURL=chunk-dy4athn1.js.map
