// @bun
import {
  createUserMessage,
  getAssistantMessageText,
  getLastCacheSafeParams,
  init_forkedAgent,
  init_messages1 as init_messages,
  runForkedAgent
} from "./chunk-85672e5z.js";
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
import"./chunk-w55zdf7f.js";
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
  init_debug,
  logForDebugging
} from "./chunk-1tytvdt1.js";
import"./chunk-kb3758f7.js";
import"./chunk-xqs9r7pg.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import {
  init_sdk
} from "./chunk-ns1htxgd.js";
import {
  APIUserAbortError
} from "./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm,
  __require
} from "./chunk-hhsxm2yr.js";

// src/commands/recap/generateRecap.ts
async function getRecapPrompt() {
  try {
    const { getResolvedLanguage } = await import("./chunk-6yamja4g.js");
    return getResolvedLanguage() === "zh" ? RECAP_PROMPT_ZH : RECAP_PROMPT_EN;
  } catch {
    return RECAP_PROMPT_EN;
  }
}
async function generateRecap(signal) {
  const cacheSafeParams = getLastCacheSafeParams();
  if (!cacheSafeParams) {
    logForDebugging("[recap] no CacheSafeParams saved, skipping");
    return { kind: "no-turn" };
  }
  const inner = new AbortController;
  signal.addEventListener("abort", () => inner.abort(), { once: true });
  try {
    const { messages } = await runForkedAgent({
      promptMessages: [createUserMessage({ content: await getRecapPrompt() })],
      cacheSafeParams,
      canUseTool: async () => ({
        behavior: "deny",
        message: "Recap cannot use tools",
        decisionReason: { type: "other", reason: "away_summary" }
      }),
      overrides: { abortController: inner },
      querySource: "away_summary",
      forkLabel: "away_summary",
      maxTurns: 1,
      skipCacheWrite: true,
      skipTranscript: true
    });
    if (signal.aborted) {
      return { kind: "aborted" };
    }
    const errorMsg = messages.find((m) => m.type === "assistant" && m.isApiErrorMessage);
    if (errorMsg) {
      return {
        kind: "api-error",
        text: getAssistantMessageText(errorMsg) ?? ""
      };
    }
    const assistantMsg = messages.filter((m) => m.type === "assistant" && !m.isApiErrorMessage).pop();
    if (!assistantMsg) {
      return { kind: "failed" };
    }
    const text = getAssistantMessageText(assistantMsg);
    if (!text || text.trim().length === 0) {
      return { kind: "failed" };
    }
    return { kind: "ok", text: text.trim() };
  } catch (err) {
    if (err instanceof APIUserAbortError || signal.aborted || inner.signal.aborted) {
      return { kind: "aborted" };
    }
    logForDebugging(`[recap] generation failed: ${err}`);
    return { kind: "failed" };
  }
}
var RECAP_PROMPT_EN = "The user stepped away and is coming back. Recap in under 40 words, 1-2 plain sentences, no markdown. Lead with the overall goal and current task, then the one next action. Skip root-cause narrative, fix internals, secondary to-dos, and em-dash tangents.", RECAP_PROMPT_ZH = "\u7528\u6237\u79BB\u5F00\u540E\u56DE\u6765\u4E86\u3002\u7528\u4E2D\u6587\u5199 1-2 \u53E5\u8BDD\uFF0C\u4E0D\u8D85\u8FC7 60 \u5B57\uFF0C\u65E0 markdown\u3002\u5148\u8BF4\u660E\u9AD8\u5C42\u76EE\u6807\u548C\u5F53\u524D\u4EFB\u52A1\uFF0C\u518D\u8BF4\u660E\u4E0B\u4E00\u6B65\u64CD\u4F5C\u3002\u8DF3\u8FC7\u6839\u56E0\u5206\u6790\u548C\u6B21\u8981\u5F85\u529E\u3002";
var init_generateRecap = __esm(() => {
  init_sdk();
  init_debug();
  init_forkedAgent();
  init_messages();
});
init_generateRecap();

export {
  generateRecap
};

//# debugId=420C95393919787964756E2164756E21
//# sourceMappingURL=chunk-yd3p5xjq.js.map
