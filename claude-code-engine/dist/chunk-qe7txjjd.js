// @bun
import {
  createUserMessage,
  getAssistantMessageText,
  getLastCacheSafeParams,
  init_forkedAgent,
  init_messages1 as init_messages,
  runForkedAgent
} from "./chunk-xzgt0njb.js";
import"./chunk-vzhwvpbr.js";
import"./chunk-861tjjzp.js";
import"./chunk-z2ajd3fw.js";
import"./chunk-28jd8qjx.js";
import"./chunk-djt39ze3.js";
import"./chunk-9a9g5hbj.js";
import"./chunk-ptxteaeh.js";
import"./chunk-hvh0cdgd.js";
import"./chunk-wnhdazsj.js";
import"./chunk-rgyzsbs3.js";
import"./chunk-qn6me9n1.js";
import"./chunk-xef7acwt.js";
import"./chunk-5enwkkas.js";
import"./chunk-jkzgg117.js";
import"./chunk-9hn8e6h1.js";
import"./chunk-2fww5648.js";
import"./chunk-e81mm4jp.js";
import"./chunk-754gszm4.js";
import"./chunk-eemmwhkd.js";
import"./chunk-bcywwfqv.js";
import"./chunk-4k180xch.js";
import"./chunk-prv12vph.js";
import"./chunk-24kv69g3.js";
import"./chunk-meyb0stq.js";
import"./chunk-rknftgwg.js";
import"./chunk-4spgkgr3.js";
import"./chunk-bvcfzg7t.js";
import"./chunk-c79fzdwz.js";
import"./chunk-hqxp6b72.js";
import"./chunk-a2cbjpab.js";
import"./chunk-qbsm2t49.js";
import"./chunk-8zz4z1q3.js";
import"./chunk-e4dsy4g1.js";
import"./chunk-326zehp8.js";
import"./chunk-kc67kt75.js";
import"./chunk-40t1d75v.js";
import"./chunk-60fkafk2.js";
import"./chunk-kvjvqgcx.js";
import"./chunk-srbv7hh4.js";
import"./chunk-093ej2sf.js";
import"./chunk-7tfdhkpy.js";
import"./chunk-snchk5qv.js";
import"./chunk-h2edgmqn.js";
import"./chunk-d1ka4b7m.js";
import"./chunk-tavc33hf.js";
import"./chunk-80p148mw.js";
import"./chunk-49v9e09z.js";
import"./chunk-ayjng5py.js";
import"./chunk-m3c1nydt.js";
import"./chunk-nde5ym6a.js";
import"./chunk-0hvg7s1m.js";
import"./chunk-hdhvk68c.js";
import"./chunk-6tebjnq9.js";
import"./chunk-935nrvdb.js";
import"./chunk-k2hff9tm.js";
import"./chunk-t867bdcq.js";
import"./chunk-dypm8ssd.js";
import"./chunk-459fm40c.js";
import"./chunk-1r8z8ez7.js";
import"./chunk-w5hnghah.js";
import"./chunk-ywnfc8g5.js";
import"./chunk-s76nvx50.js";
import"./chunk-y5f62n0j.js";
import"./chunk-k92qk5av.js";
import"./chunk-vwenx8ke.js";
import"./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import"./chunk-28rzgcvw.js";
import"./chunk-g5vjgacw.js";
import"./chunk-eavq5vsk.js";
import"./chunk-bgan4cpf.js";
import"./chunk-35jsjk7z.js";
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
import"./chunk-dw66fdss.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-qmk4ebrf.js";
import"./chunk-e3abfxpy.js";
import"./chunk-q44zc68f.js";
import"./chunk-fejeqe61.js";
import"./chunk-bj6zyntv.js";
import"./chunk-49x6szsr.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-0k4kr3h5.js";
import"./chunk-x9xf2qa8.js";
import"./chunk-4hpfxga2.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-pecy49yr.js";
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
import {
  init_debug,
  logForDebugging
} from "./chunk-pyv3zrjt.js";
import"./chunk-kb3758f7.js";
import"./chunk-232p95fy.js";
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
import {
  __esm,
  __require
} from "./chunk-hhsxm2yr.js";

// src/commands/recap/generateRecap.ts
async function getRecapPrompt() {
  try {
    const { getResolvedLanguage } = await import("./chunk-9m5f2nh9.js");
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

//# debugId=17B3B65E5A95CEF964756E2164756E21
//# sourceMappingURL=chunk-qe7txjjd.js.map
