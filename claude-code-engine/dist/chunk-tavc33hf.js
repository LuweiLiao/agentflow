// @bun
import {
  init_normalization,
  normalizeNameForMCP
} from "./chunk-vwenx8ke.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/mcp/mcpStringUtils.ts
function mcpInfoFromString(toolString) {
  const parts = toolString.split("__");
  const [mcpPart, serverName, ...toolNameParts] = parts;
  if (mcpPart !== "mcp" || !serverName) {
    return null;
  }
  const toolName = toolNameParts.length > 0 ? toolNameParts.join("__") : undefined;
  return { serverName, toolName };
}
function getMcpPrefix(serverName) {
  return `mcp__${normalizeNameForMCP(serverName)}__`;
}
function buildMcpToolName(serverName, toolName) {
  return `${getMcpPrefix(serverName)}${normalizeNameForMCP(toolName)}`;
}
function getToolNameForPermissionCheck(tool) {
  return tool.mcpInfo ? buildMcpToolName(tool.mcpInfo.serverName, tool.mcpInfo.toolName) : tool.name;
}
function getMcpDisplayName(fullName, serverName) {
  const prefix = `mcp__${normalizeNameForMCP(serverName)}__`;
  return fullName.replace(prefix, "");
}
function extractMcpToolDisplayName(userFacingName) {
  let withoutSuffix = userFacingName.replace(/\s*\(MCP\)\s*$/, "");
  withoutSuffix = withoutSuffix.trim();
  const dashIndex = withoutSuffix.indexOf(" - ");
  if (dashIndex !== -1) {
    const displayName = withoutSuffix.substring(dashIndex + 3).trim();
    return displayName;
  }
  return withoutSuffix;
}
var init_mcpStringUtils = __esm(() => {
  init_normalization();
});

export { mcpInfoFromString, getMcpPrefix, buildMcpToolName, getToolNameForPermissionCheck, getMcpDisplayName, extractMcpToolDisplayName, init_mcpStringUtils };

//# debugId=1369627D6B2B8E1064756E2164756E21
//# sourceMappingURL=chunk-tavc33hf.js.map
