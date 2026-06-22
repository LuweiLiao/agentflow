// @bun
import {
  init_SSETransport,
  parseSSEFrames
} from "./chunk-8dwfw402.js";
import {
  convertMessagesToLangfuse,
  convertOutputToLangfuse,
  convertToolsToLangfuse,
  createAssistantAPIErrorMessage,
  init_api,
  init_convert,
  init_messages1 as init_messages,
  init_tracing,
  normalizeContentFromAPI,
  normalizeMessagesForAPI,
  recordLLMObservation,
  toolToAPISchema
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
import {
  GEMINI_THOUGHT_SIGNATURE_FIELD,
  adaptGeminiStreamToAnthropic,
  anthropicMessagesToGemini,
  anthropicToolChoiceToGemini,
  anthropicToolsToGemini,
  init_src,
  resolveGeminiModel
} from "./chunk-652r6kww.js";
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
import {
  getProxyFetchOptions,
  init_proxy
} from "./chunk-mmae2pva.js";
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
  init_debug,
  init_errors,
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
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
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

//# debugId=5906A24E556E3D6064756E2164756E21
//# sourceMappingURL=chunk-2egr5cjg.js.map
