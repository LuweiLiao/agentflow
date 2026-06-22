// @bun
import {
  getBridgeAccessToken,
  getBridgeBaseUrlOverride,
  init_bridgeConfig
} from "./chunk-q1j913pw.js";
import"./chunk-w55zdf7f.js";
import"./chunk-ajbvxecm.js";
import"./chunk-03nkrzmd.js";
import"./chunk-mmae2pva.js";
import"./chunk-epvbnq43.js";
import"./chunk-nk9870yk.js";
import"./chunk-6tzyv21c.js";
import"./chunk-8kf8h7xf.js";
import {
  init_lazySchema,
  lazySchema
} from "./chunk-bgan4cpf.js";
import"./chunk-jmv7k0jn.js";
import"./chunk-hvc6rn64.js";
import"./chunk-4dzwj3zm.js";
import"./chunk-xsj5g58g.js";
import"./chunk-vwenx8ke.js";
import"./chunk-gr6n87et.js";
import"./chunk-v4ypszbb.js";
import {
  getOauthConfig,
  init_oauth
} from "./chunk-bk6ck5c2.js";
import {
  init_v4
} from "./chunk-6mdh70q0.js";
import {
  exports_external
} from "./chunk-ch92ycde.js";
import"./chunk-326zehp8.js";
import"./chunk-40t1d75v.js";
import"./chunk-e3abfxpy.js";
import"./chunk-fejeqe61.js";
import"./chunk-d6c3tr39.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-93gg03n2.js";
import"./chunk-x9xf2qa8.js";
import"./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-23170t3x.js";
import"./chunk-h3vy1y4t.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-09kej9nc.js";
import"./chunk-c4dyxsat.js";
import"./chunk-jsbc7abp.js";
import"./chunk-m28vg9w4.js";
import"./chunk-01w7y5nh.js";
import"./chunk-rhhvp5gh.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import {
  init_debug,
  init_slowOperations,
  jsonStringify,
  logForDebugging
} from "./chunk-1tytvdt1.js";
import"./chunk-kb3758f7.js";
import"./chunk-xqs9r7pg.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  axios_default,
  init_axios
} from "./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
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

//# debugId=61A61A604C5509F264756E2164756E21
//# sourceMappingURL=chunk-zspj63mk.js.map
