// @bun
import {
  getBridgeAccessToken,
  getBridgeBaseUrlOverride,
  init_bridgeConfig
} from "./chunk-j87twr2p.js";
import {
  init_lazySchema,
  lazySchema
} from "./chunk-bgan4cpf.js";
import {
  getOauthConfig,
  init_oauth
} from "./chunk-dw66fdss.js";
import {
  init_v4
} from "./chunk-6mdh70q0.js";
import {
  exports_external
} from "./chunk-ch92ycde.js";
import {
  axios_default,
  init_axios
} from "./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  init_debug,
  init_slowOperations,
  jsonStringify,
  logForDebugging
} from "./chunk-pyv3zrjt.js";
import"./chunk-kb3758f7.js";
import"./chunk-232p95fy.js";
import"./chunk-tj0dzck2.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// packages/builtin-tools/src/tools/BriefTool/upload.ts
import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { basename, extname } from "path";
function guessMimeType(filename) {
  const ext = extname(filename).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}
function debug(msg) {
  logForDebugging(`[brief:upload] ${msg}`);
}
function getBridgeBaseUrl() {
  return getBridgeBaseUrlOverride() ?? process.env.ANTHROPIC_BASE_URL ?? getOauthConfig().BASE_API_URL;
}
async function uploadBriefAttachment(fullPath, size, ctx) {
  if (true) {
    if (!ctx.replBridgeEnabled)
      return;
    if (size > MAX_UPLOAD_BYTES) {
      debug(`skip ${fullPath}: ${size} bytes exceeds ${MAX_UPLOAD_BYTES} limit`);
      return;
    }
    const token = getBridgeAccessToken();
    if (!token) {
      debug("skip: no oauth token");
      return;
    }
    let content;
    try {
      content = await readFile(fullPath);
    } catch (e) {
      debug(`read failed for ${fullPath}: ${e}`);
      return;
    }
    const baseUrl = getBridgeBaseUrl();
    const url = `${baseUrl}/api/oauth/file_upload`;
    const filename = basename(fullPath);
    const mimeType = guessMimeType(filename);
    const boundary = `----FormBoundary${randomUUID()}`;
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r
` + `Content-Disposition: form-data; name="file"; filename="${filename}"\r
` + `Content-Type: ${mimeType}\r
\r
`),
      content,
      Buffer.from(`\r
--${boundary}--\r
`)
    ]);
    try {
      const response = await axios_default.post(url, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": body.length.toString()
        },
        timeout: UPLOAD_TIMEOUT_MS,
        signal: ctx.signal,
        validateStatus: () => true
      });
      if (response.status !== 201) {
        debug(`upload failed for ${fullPath}: status=${response.status} body=${jsonStringify(response.data).slice(0, 200)}`);
        return;
      }
      const parsed = uploadResponseSchema().safeParse(response.data);
      if (!parsed.success) {
        debug(`unexpected response shape for ${fullPath}: ${parsed.error.message}`);
        return;
      }
      debug(`uploaded ${fullPath} \u2192 ${parsed.data.file_uuid} (${size} bytes)`);
      return parsed.data.file_uuid;
    } catch (e) {
      debug(`upload threw for ${fullPath}: ${e}`);
      return;
    }
  }
  return;
}
var MAX_UPLOAD_BYTES, UPLOAD_TIMEOUT_MS = 30000, MIME_BY_EXT, uploadResponseSchema;
var init_upload = __esm(() => {
  init_axios();
  init_v4();
  init_bridgeConfig();
  init_oauth();
  init_debug();
  init_lazySchema();
  init_slowOperations();
  MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
  MIME_BY_EXT = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp"
  };
  uploadResponseSchema = lazySchema(() => exports_external.object({ file_uuid: exports_external.string() }));
});
init_upload();

export {
  uploadBriefAttachment
};

//# debugId=6A6B88226CE2638664756E2164756E21
//# sourceMappingURL=chunk-945dwpvy.js.map
