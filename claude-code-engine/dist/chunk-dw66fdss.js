// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/constants/oauth.ts
function getOauthConfig() {
  return STUB_CONFIG;
}
function fileSuffixForOauthConfig(_config) {
  return "";
}
function CLAUDE_AI_INFERENCE_SCOPE(..._args) {
  return;
}
var OAUTH_BETA_HEADER = "", STUB_CONFIG, MCP_CLIENT_METADATA_URL = "";
var init_oauth = __esm(() => {
  STUB_CONFIG = {
    BASE_API_URL: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
    CONSOLE_AUTHORIZE_URL: "",
    CLAUDE_AI_AUTHORIZE_URL: "",
    TOKEN_URL: "",
    API_KEY_URL: "",
    CLIENT_ID: "",
    REDIRECT_URI: "",
    MCP_PROXY_URL: "",
    SCOPES: []
  };
});

export { OAUTH_BETA_HEADER, getOauthConfig, fileSuffixForOauthConfig, MCP_CLIENT_METADATA_URL, CLAUDE_AI_INFERENCE_SCOPE, init_oauth };

//# debugId=47B3327C50D78BC264756E2164756E21
//# sourceMappingURL=chunk-dw66fdss.js.map
