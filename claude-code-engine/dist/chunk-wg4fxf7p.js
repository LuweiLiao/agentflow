// @bun
import {
  BridgeHeadlessPermanentError,
  runBridgeHeadless
} from "./chunk-4r6w449e.js";
import"./chunk-ae76ded0.js";
import"./chunk-gqmff8af.js";
import"./chunk-dmghfvz8.js";
import"./chunk-weykc009.js";
import"./chunk-6ct0zg54.js";
import"./chunk-xrw80zgd.js";
import"./chunk-85672e5z.js";
import"./chunk-wttb2t11.js";
import"./chunk-k60b56gr.js";
import"./chunk-14p6wvsq.js";
import"./chunk-28jd8qjx.js";
import"./chunk-djt39ze3.js";
import"./chunk-9a9g5hbj.js";
import"./chunk-ptxteaeh.js";
import"./chunk-tpnz03nj.js";
import"./chunk-s8p02480.js";
import"./chunk-rgyzsbs3.js";
import"./chunk-qn6me9n1.js";
import"./chunk-vj6qsm24.js";
import"./chunk-r8jcsn3v.js";
import"./chunk-652r6kww.js";
import"./chunk-6gy3q0wy.js";
import"./chunk-9hn8e6h1.js";
import"./chunk-s3d6366c.js";
import"./chunk-ntvq0jr5.js";
import"./chunk-4vjty2rm.js";
import"./chunk-71sdcaq6.js";
import"./chunk-p5eak500.js";
import"./chunk-tdr1vsx1.js";
import"./chunk-jd7jftpn.js";
import"./chunk-c5tjtkca.js";
import"./chunk-13rzr1dm.js";
import"./chunk-24kv69g3.js";
import"./chunk-brn3ak48.js";
import"./chunk-apms8t8n.js";
import"./chunk-4spgkgr3.js";
import"./chunk-r807k1we.js";
import"./chunk-bxyw0w0f.js";
import"./chunk-qnqdg4g2.js";
import"./chunk-60fkafk2.js";
import"./chunk-znh8j5rf.js";
import"./chunk-s3m717e4.js";
import"./chunk-093ej2sf.js";
import"./chunk-7tfdhkpy.js";
import"./chunk-nde5ym6a.js";
import"./chunk-km99syjh.js";
import"./chunk-fb8vcv23.js";
import"./chunk-q1j913pw.js";
import"./chunk-ekewkevz.js";
import"./chunk-aygjk70q.js";
import"./chunk-kc5qzfjq.js";
import"./chunk-zbwxz8qy.js";
import"./chunk-935nrvdb.js";
import"./chunk-8zz4z1q3.js";
import"./chunk-e0gkkbdv.js";
import"./chunk-hqxp6b72.js";
import"./chunk-87pd0zay.js";
import"./chunk-9wb7xbsz.js";
import"./chunk-w5hnghah.js";
import"./chunk-vjcwx6pg.js";
import"./chunk-bgasjg9s.js";
import"./chunk-s76nvx50.js";
import"./chunk-m3b9aggc.js";
import {
  getClaudeAIOAuthTokens,
  init_auth
} from "./chunk-w55zdf7f.js";
import"./chunk-ajbvxecm.js";
import"./chunk-03nkrzmd.js";
import"./chunk-mmae2pva.js";
import"./chunk-epvbnq43.js";
import"./chunk-nk9870yk.js";
import"./chunk-6tzyv21c.js";
import"./chunk-8kf8h7xf.js";
import"./chunk-bgan4cpf.js";
import"./chunk-jmv7k0jn.js";
import"./chunk-hvc6rn64.js";
import"./chunk-4dzwj3zm.js";
import"./chunk-xsj5g58g.js";
import"./chunk-vwenx8ke.js";
import"./chunk-gr6n87et.js";
import"./chunk-v4ypszbb.js";
import"./chunk-bk6ck5c2.js";
import"./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-e4dsy4g1.js";
import"./chunk-326zehp8.js";
import"./chunk-kc67kt75.js";
import"./chunk-40t1d75v.js";
import"./chunk-7ysfd01z.js";
import"./chunk-e3abfxpy.js";
import"./chunk-q44zc68f.js";
import"./chunk-fejeqe61.js";
import"./chunk-d6c3tr39.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-93gg03n2.js";
import"./chunk-x9xf2qa8.js";
import"./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-3975w415.js";
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
  errorMessage,
  init_errors
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
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import"./chunk-hhsxm2yr.js";

// src/daemon/workerRegistry.ts
import { resolve } from "path";
init_auth();
init_errors();
var EXIT_CODE_PERMANENT = 78;
var EXIT_CODE_TRANSIENT = 1;
async function runDaemonWorker(kind) {
  if (!kind) {
    console.error("Error: --daemon-worker requires a worker kind");
    process.exitCode = EXIT_CODE_PERMANENT;
    return;
  }
  switch (kind) {
    case "remoteControl":
      await runRemoteControlWorker();
      break;
    default:
      console.error(`Error: unknown daemon worker kind '${kind}'`);
      process.exitCode = EXIT_CODE_PERMANENT;
  }
}
async function runRemoteControlWorker() {
  const dir = process.env.DAEMON_WORKER_DIR || resolve(".");
  const name = process.env.DAEMON_WORKER_NAME || undefined;
  const spawnMode = process.env.DAEMON_WORKER_SPAWN_MODE || "same-dir";
  const capacity = parseInt(process.env.DAEMON_WORKER_CAPACITY || "4", 10);
  const permissionMode = process.env.DAEMON_WORKER_PERMISSION || undefined;
  const sandbox = process.env.DAEMON_WORKER_SANDBOX === "1";
  const sessionTimeoutMs = process.env.DAEMON_WORKER_TIMEOUT_MS ? parseInt(process.env.DAEMON_WORKER_TIMEOUT_MS, 10) : undefined;
  const createSessionOnStart = process.env.DAEMON_WORKER_CREATE_SESSION !== "0";
  const controller = new AbortController;
  const onSignal = () => controller.abort();
  process.on("SIGTERM", onSignal);
  process.on("SIGINT", onSignal);
  const opts = {
    dir,
    name,
    spawnMode,
    capacity,
    permissionMode,
    sandbox,
    sessionTimeoutMs,
    createSessionOnStart,
    getAccessToken: () => getClaudeAIOAuthTokens()?.accessToken,
    onAuth401: async (_failedToken) => {
      const tokens = getClaudeAIOAuthTokens();
      return !!tokens?.accessToken;
    },
    log: (s) => {
      console.log(`[remoteControl] ${s}`);
    }
  };
  try {
    await runBridgeHeadless(opts, controller.signal);
  } catch (err) {
    if (err instanceof BridgeHeadlessPermanentError) {
      console.error(`[remoteControl] permanent error: ${err.message}`);
      process.exitCode = EXIT_CODE_PERMANENT;
    } else {
      console.error(`[remoteControl] transient error: ${errorMessage(err)}`);
      process.exitCode = EXIT_CODE_TRANSIENT;
    }
  } finally {
    process.off("SIGTERM", onSignal);
    process.off("SIGINT", onSignal);
  }
}
export {
  runDaemonWorker
};

//# debugId=F6EF78F84DE88A6C64756E2164756E21
//# sourceMappingURL=chunk-wg4fxf7p.js.map
