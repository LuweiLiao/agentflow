// @bun
import {
  init_lazySchema,
  lazySchema
} from "./chunk-bgan4cpf.js";
import {
  init_v4
} from "./chunk-6mdh70q0.js";
import {
  exports_external
} from "./chunk-ch92ycde.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/mcp/types.ts
var ConfigScopeSchema, TransportSchema, McpStdioServerConfigSchema, McpXaaConfigSchema, McpOAuthConfigSchema, McpSSEServerConfigSchema, McpSSEIDEServerConfigSchema, McpWebSocketIDEServerConfigSchema, McpHTTPServerConfigSchema, McpWebSocketServerConfigSchema, McpSdkServerConfigSchema, McpClaudeAIProxyServerConfigSchema, McpServerConfigSchema, McpJsonConfigSchema;
var init_types = __esm(() => {
  init_v4();
  init_lazySchema();
  ConfigScopeSchema = lazySchema(() => exports_external.enum([
    "local",
    "user",
    "project",
    "dynamic",
    "enterprise",
    "claudeai",
    "managed"
  ]));
  TransportSchema = lazySchema(() => exports_external.enum(["stdio", "sse", "sse-ide", "http", "ws", "sdk", "claudeai-proxy"]));
  McpStdioServerConfigSchema = lazySchema(() => exports_external.object({
    type: exports_external.literal("stdio").optional(),
    command: exports_external.string().min(1, "Command cannot be empty"),
    args: exports_external.array(exports_external.string()).default([]),
    env: exports_external.record(exports_external.string(), exports_external.string()).optional()
  }));
  McpXaaConfigSchema = lazySchema(() => exports_external.boolean());
  McpOAuthConfigSchema = lazySchema(() => exports_external.object({
    clientId: exports_external.string().optional(),
    callbackPort: exports_external.number().int().positive().optional(),
    authServerMetadataUrl: exports_external.string().url().startsWith("https://", {
      message: "authServerMetadataUrl must use https://"
    }).optional(),
    xaa: McpXaaConfigSchema().optional()
  }));
  McpSSEServerConfigSchema = lazySchema(() => exports_external.object({
    type: exports_external.literal("sse"),
    url: exports_external.string(),
    headers: exports_external.record(exports_external.string(), exports_external.string()).optional(),
    headersHelper: exports_external.string().optional(),
    oauth: McpOAuthConfigSchema().optional()
  }));
  McpSSEIDEServerConfigSchema = lazySchema(() => exports_external.object({
    type: exports_external.literal("sse-ide"),
    url: exports_external.string(),
    ideName: exports_external.string(),
    ideRunningInWindows: exports_external.boolean().optional()
  }));
  McpWebSocketIDEServerConfigSchema = lazySchema(() => exports_external.object({
    type: exports_external.literal("ws-ide"),
    url: exports_external.string(),
    ideName: exports_external.string(),
    authToken: exports_external.string().optional(),
    ideRunningInWindows: exports_external.boolean().optional()
  }));
  McpHTTPServerConfigSchema = lazySchema(() => exports_external.object({
    type: exports_external.literal("http"),
    url: exports_external.string(),
    headers: exports_external.record(exports_external.string(), exports_external.string()).optional(),
    headersHelper: exports_external.string().optional(),
    oauth: McpOAuthConfigSchema().optional()
  }));
  McpWebSocketServerConfigSchema = lazySchema(() => exports_external.object({
    type: exports_external.literal("ws"),
    url: exports_external.string(),
    headers: exports_external.record(exports_external.string(), exports_external.string()).optional(),
    headersHelper: exports_external.string().optional()
  }));
  McpSdkServerConfigSchema = lazySchema(() => exports_external.object({
    type: exports_external.literal("sdk"),
    name: exports_external.string()
  }));
  McpClaudeAIProxyServerConfigSchema = lazySchema(() => exports_external.object({
    type: exports_external.literal("claudeai-proxy"),
    url: exports_external.string(),
    id: exports_external.string()
  }));
  McpServerConfigSchema = lazySchema(() => exports_external.union([
    McpStdioServerConfigSchema(),
    McpSSEServerConfigSchema(),
    McpSSEIDEServerConfigSchema(),
    McpWebSocketIDEServerConfigSchema(),
    McpHTTPServerConfigSchema(),
    McpWebSocketServerConfigSchema(),
    McpSdkServerConfigSchema(),
    McpClaudeAIProxyServerConfigSchema()
  ]));
  McpJsonConfigSchema = lazySchema(() => exports_external.object({
    mcpServers: exports_external.record(exports_external.string(), McpServerConfigSchema())
  }));
});

export { ConfigScopeSchema, McpStdioServerConfigSchema, McpServerConfigSchema, McpJsonConfigSchema, init_types };

//# debugId=66F6446393BC349C64756E2164756E21
//# sourceMappingURL=chunk-d1ka4b7m.js.map
