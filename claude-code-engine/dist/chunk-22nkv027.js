// @bun
import {
  init_SSETransport,
  parseSSEFrames
} from "./chunk-nwh7s0hx.js";
import {
  GEMINI_THOUGHT_SIGNATURE_FIELD,
  adaptGeminiStreamToAnthropic,
  anthropicMessagesToGemini,
  anthropicToolChoiceToGemini,
  anthropicToolsToGemini,
  convertMessagesToLangfuse,
  convertOutputToLangfuse,
  convertToolsToLangfuse,
  createAssistantAPIErrorMessage,
  init_api,
  init_convert,
  init_messages1 as init_messages,
  init_src,
  init_tracing,
  normalizeContentFromAPI,
  normalizeMessagesForAPI,
  recordLLMObservation,
  resolveGeminiModel,
  toolToAPISchema
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
import {
  getProxyFetchOptions,
  init_proxy
} from "./chunk-hdhvk68c.js";
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
  errorMessage,
  init_debug,
  init_errors,
  logForDebugging
} from "./chunk-pyv3zrjt.js";
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
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/api/gemini/client.ts
function getGeminiBaseUrl() {
  return (process.env.GEMINI_BASE_URL || DEFAULT_GEMINI_BASE_URL).replace(/\/+$/, "");
}
function getGeminiModelPath(model) {
  const normalized = model.replace(/^\/+/, "");
  return normalized.startsWith("models/") ? normalized : `models/${normalized}`;
}
async function* streamGeminiGenerateContent(params) {
  const fetchImpl = params.fetchOverride ?? fetch;
  const url = `${getGeminiBaseUrl()}/${getGeminiModelPath(params.model)}:streamGenerateContent?alt=sse`;
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY || ""
    },
    body: JSON.stringify(params.body),
    signal: params.signal,
    ...getProxyFetchOptions({ forAnthropicAPI: false })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API request failed (${response.status} ${response.statusText}): ${body || "empty response body"}`);
  }
  if (!response.body) {
    throw new Error("Gemini API returned no response body");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder;
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      buffer += decoder.decode(value, STREAM_DECODE_OPTS);
      const { frames: frames2, remaining } = parseSSEFrames(buffer);
      buffer = remaining;
      for (const frame of frames2) {
        if (!frame.data || frame.data === "[DONE]")
          continue;
        try {
          yield JSON.parse(frame.data);
        } catch (error) {
          throw new Error(`Failed to parse Gemini SSE payload: ${errorMessage(error)}`);
        }
      }
    }
    buffer += decoder.decode();
    const { frames } = parseSSEFrames(buffer);
    for (const frame of frames) {
      if (!frame.data || frame.data === "[DONE]")
        continue;
      try {
        yield JSON.parse(frame.data);
      } catch (error) {
        throw new Error(`Failed to parse trailing Gemini SSE payload: ${errorMessage(error)}`);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
var DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta", STREAM_DECODE_OPTS;
var init_client = __esm(() => {
  init_SSETransport();
  init_errors();
  init_proxy();
  STREAM_DECODE_OPTS = { stream: true };
});

// src/services/api/gemini/index.ts
import { randomUUID } from "crypto";
async function* queryModelGemini(messages, systemPrompt, tools, signal, options, thinkingConfig) {
  try {
    const geminiModel = resolveGeminiModel(options.model);
    const messagesForAPI = normalizeMessagesForAPI(messages, tools);
    const toolSchemas = await Promise.all(tools.map((tool) => toolToAPISchema(tool, {
      getToolPermissionContext: options.getToolPermissionContext,
      tools,
      agents: options.agents,
      allowedAgentTypes: options.allowedAgentTypes,
      model: options.model
    })));
    const standardTools = toolSchemas.filter((t) => {
      const anyTool = t;
      return anyTool.type !== "advisor_20260301" && anyTool.type !== "computer_20250124";
    });
    const { contents, systemInstruction } = anthropicMessagesToGemini(messagesForAPI, systemPrompt);
    const geminiTools = anthropicToolsToGemini(standardTools);
    const toolChoice = anthropicToolChoiceToGemini(options.toolChoice);
    const stream = streamGeminiGenerateContent({
      model: geminiModel,
      signal,
      fetchOverride: options.fetchOverride,
      body: {
        contents,
        ...systemInstruction && { systemInstruction },
        ...geminiTools.length > 0 && { tools: geminiTools },
        ...toolChoice && {
          toolConfig: {
            functionCallingConfig: toolChoice
          }
        },
        generationConfig: {
          ...options.temperatureOverride !== undefined && {
            temperature: options.temperatureOverride
          },
          ...thinkingConfig.type !== "disabled" && {
            thinkingConfig: {
              includeThoughts: true,
              ...thinkingConfig.type === "enabled" && {
                thinkingBudget: thinkingConfig.budgetTokens
              }
            }
          }
        }
      }
    });
    logForDebugging(`[Gemini] Calling model=${geminiModel}, messages=${contents.length}, tools=${geminiTools.length}`);
    const adaptedStream = adaptGeminiStreamToAnthropic(stream, geminiModel);
    const contentBlocks = {};
    const collectedMessages = [];
    let partialMessage = null;
    let ttftMs = 0;
    const start = Date.now();
    for await (const event of adaptedStream) {
      switch (event.type) {
        case "message_start":
          partialMessage = event.message;
          ttftMs = Date.now() - start;
          break;
        case "content_block_start": {
          const idx = event.index;
          const cb = event.content_block;
          if (cb.type === "tool_use") {
            contentBlocks[idx] = { ...cb, input: "" };
          } else if (cb.type === "text") {
            contentBlocks[idx] = { ...cb, text: "" };
          } else if (cb.type === "thinking") {
            contentBlocks[idx] = { ...cb, thinking: "", signature: "" };
          } else {
            contentBlocks[idx] = { ...cb };
          }
          break;
        }
        case "content_block_delta": {
          const idx = event.index;
          const delta = event.delta;
          const block = contentBlocks[idx];
          if (!block)
            break;
          if (delta.type === "text_delta") {
            block.text = (block.text || "") + delta.text;
          } else if (delta.type === "input_json_delta") {
            block.input = (block.input || "") + delta.partial_json;
          } else if (delta.type === "thinking_delta") {
            block.thinking = (block.thinking || "") + delta.thinking;
          } else if (delta.type === "signature_delta") {
            if (block.type === "thinking") {
              block.signature = delta.signature;
            } else {
              block[GEMINI_THOUGHT_SIGNATURE_FIELD] = delta.signature;
            }
          }
          break;
        }
        case "content_block_stop": {
          const idx = event.index;
          const block = contentBlocks[idx];
          if (!block || !partialMessage)
            break;
          const message = {
            message: {
              ...partialMessage,
              content: normalizeContentFromAPI([block], tools, options.agentId)
            },
            requestId: undefined,
            type: "assistant",
            uuid: randomUUID(),
            timestamp: new Date().toISOString()
          };
          collectedMessages.push(message);
          yield message;
          break;
        }
        case "message_delta":
        case "message_stop":
          break;
      }
      yield {
        type: "stream_event",
        event,
        ...event.type === "message_start" ? { ttftMs } : undefined
      };
    }
    recordLLMObservation(options.langfuseTrace ?? null, {
      model: geminiModel,
      provider: "gemini",
      input: convertMessagesToLangfuse(messagesForAPI, systemPrompt),
      output: convertOutputToLangfuse(collectedMessages),
      usage: {
        input_tokens: 0,
        output_tokens: 0
      },
      startTime: new Date(start),
      endTime: new Date,
      completionStartTime: ttftMs > 0 ? new Date(start + ttftMs) : undefined,
      tools: convertToolsToLangfuse(toolSchemas),
      thinking: thinkingConfig.type !== "disabled" ? {
        type: thinkingConfig.type,
        ...thinkingConfig.type === "enabled" && {
          budgetTokens: thinkingConfig.budgetTokens
        }
      } : undefined
    });
  } catch (error) {
    const errorMessage2 = error instanceof Error ? error.message : String(error);
    logForDebugging(`[Gemini] Error: ${errorMessage2}`, { level: "error" });
    yield createAssistantAPIErrorMessage({
      content: `API Error: ${errorMessage2}`,
      apiError: "api_error",
      error: error instanceof Error ? error : new Error(String(error))
    });
  }
}
var init_gemini = __esm(() => {
  init_api();
  init_debug();
  init_messages();
  init_tracing();
  init_convert();
  init_client();
  init_src();
});
init_gemini();

export {
  queryModelGemini
};

//# debugId=84653BC55262E65764756E2164756E21
//# sourceMappingURL=chunk-22nkv027.js.map
