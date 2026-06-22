// @bun
import {
  init_openaiShared,
  updateOpenAIUsage
} from "./chunk-k9tx7522.js";
import {
  addToTotalSessionCost,
  convertMessagesToLangfuse,
  convertOutputToLangfuse,
  convertToolsToLangfuse,
  createAssistantAPIErrorMessage,
  createUserMessage,
  getOpenAIClient,
  getValidChatGPTAuth,
  init_api,
  init_chatgptAuth,
  init_client1 as init_client,
  init_convert,
  init_cost_tracker,
  init_messages1 as init_messages,
  init_searchExtraTools,
  init_tracing,
  isChatGPTAuthEnabled,
  isDeferredToolsDeltaEnabled,
  isSearchExtraToolsEnabled,
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
  adaptOpenAIStreamToAnthropic,
  anthropicMessagesToOpenAI,
  anthropicToolChoiceToOpenAI,
  anthropicToolsToOpenAI,
  init_src,
  resolveOpenAIModel
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
import {
  SEARCH_EXTRA_TOOLS_TOOL_NAME,
  formatDeferredToolLine,
  getEmptyToolPermissionContext,
  init_Tool,
  init_prompt10 as init_prompt,
  isDeferredTool,
  toolMatchesName
} from "./chunk-s3m717e4.js";
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
  calculateUSDCost,
  getModelMaxOutputTokens,
  init_context,
  init_modelCost
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
  init_debug,
  logForDebugging
} from "./chunk-1tytvdt1.js";
import"./chunk-kb3758f7.js";
import"./chunk-xqs9r7pg.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import {
  init_envUtils,
  isEnvDefinedFalsy,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/api/openai/responsesAdapter.ts
import { randomUUID } from "crypto";
function textFromContent(content) {
  if (typeof content === "string")
    return content;
  if (!Array.isArray(content))
    return "";
  return content.map((part) => {
    if (!part || typeof part !== "object")
      return "";
    const record = part;
    if (typeof record.text === "string")
      return record.text;
    return "";
  }).filter(Boolean).join(`
`);
}
function convertUserContent(content) {
  if (typeof content === "string")
    return content;
  if (!Array.isArray(content))
    return textFromContent(content);
  const result = [];
  for (const part of content) {
    if (!part || typeof part !== "object")
      continue;
    const record = part;
    if (record.type === "text" && typeof record.text === "string") {
      result.push({ type: "input_text", text: record.text });
    } else if (record.type === "image_url") {
      const imageUrl = record.image_url;
      if (typeof imageUrl?.url === "string") {
        result.push({ type: "input_image", image_url: imageUrl.url });
      }
    }
  }
  return result.length > 0 ? result : textFromContent(content);
}
function convertMessagesToResponsesInput(messages) {
  const input = [];
  const instructions = [];
  for (const message of messages) {
    if (!message || typeof message !== "object")
      continue;
    const record = message;
    const role = record.role;
    if (role === "system" || role === "developer") {
      const text = textFromContent(record.content);
      if (text)
        instructions.push(text);
      continue;
    }
    if (role === "tool") {
      const callId = record.tool_call_id;
      if (typeof callId === "string") {
        input.push({
          type: "function_call_output",
          call_id: callId,
          output: textFromContent(record.content)
        });
      }
      continue;
    }
    if (role === "assistant") {
      const text = textFromContent(record.content);
      if (text) {
        input.push({ role: "assistant", content: text });
      }
      const toolCalls = record.tool_calls;
      if (Array.isArray(toolCalls)) {
        for (const toolCall of toolCalls) {
          if (!toolCall || typeof toolCall !== "object")
            continue;
          const tc = toolCall;
          const fn = tc.function;
          const id = typeof tc.id === "string" ? tc.id : undefined;
          const name = typeof fn?.name === "string" ? fn.name : undefined;
          if (!id || !name)
            continue;
          input.push({
            type: "function_call",
            call_id: id,
            name,
            arguments: typeof fn?.arguments === "string" ? fn.arguments : "{}"
          });
        }
      }
      continue;
    }
    if (role === "user") {
      input.push({
        role: "user",
        content: convertUserContent(record.content)
      });
    }
  }
  return {
    input,
    instructions: instructions.length > 0 ? instructions.join(`

`) : undefined
  };
}
function convertToolsToResponses(tools) {
  const result = [];
  for (const tool of tools) {
    if (!tool || typeof tool !== "object")
      continue;
    const record = tool;
    const fn = record.function;
    const name = typeof fn?.name === "string" ? fn.name : undefined;
    if (!name)
      continue;
    result.push({
      type: "function",
      name,
      description: typeof fn?.description === "string" ? fn.description : "",
      parameters: fn?.parameters && typeof fn.parameters === "object" ? fn.parameters : { type: "object", properties: {} },
      strict: false
    });
  }
  return result;
}
function convertToolChoiceToResponses(toolChoice) {
  if (toolChoice === "required")
    return "required";
  if (toolChoice === "auto")
    return "auto";
  if (!toolChoice || typeof toolChoice !== "object")
    return toolChoice;
  const record = toolChoice;
  const fn = record.function;
  if (record.type === "function" && typeof fn?.name === "string") {
    return { type: "function", name: fn.name };
  }
  return toolChoice;
}
function buildResponsesRequest(params) {
  const { input, instructions } = convertMessagesToResponsesInput(params.messages);
  const tools = convertToolsToResponses(params.tools);
  return {
    model: params.model,
    stream: true,
    store: false,
    input,
    ...instructions ? { instructions } : {},
    ...tools.length > 0 ? { tools } : {},
    ...params.toolChoice ? { tool_choice: convertToolChoiceToResponses(params.toolChoice) } : {},
    ...params.reasoningEffort ? { reasoning: { effort: params.reasoningEffort } } : {},
    parallel_tool_calls: true
  };
}
async function* parseSSE(response) {
  if (!response.body)
    throw new Error("ChatGPT response did not include a body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder;
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done)
      break;
    buffer += decoder.decode(value, { stream: true });
    let splitAt = buffer.indexOf(`

`);
    while (splitAt >= 0) {
      const frame = buffer.slice(0, splitAt);
      buffer = buffer.slice(splitAt + 2);
      const data = frame.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join(`
`);
      if (data && data !== "[DONE]") {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === "object") {
          yield parsed;
        }
      }
      splitAt = buffer.indexOf(`

`);
    }
  }
}
function extractUsage(response) {
  const usage = response?.usage;
  const inputDetails = usage?.input_tokens_details;
  return {
    input_tokens: typeof usage?.input_tokens === "number" ? usage.input_tokens : 0,
    output_tokens: typeof usage?.output_tokens === "number" ? usage.output_tokens : 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: typeof inputDetails?.cached_tokens === "number" ? inputDetails.cached_tokens : 0
  };
}
function mapStopReason(response) {
  if (response?.status === "incomplete")
    return "max_tokens";
  return "end_turn";
}
async function* adaptResponsesStreamToAnthropic(stream, model) {
  const messageId = `msg_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const toolBlocks = new Map;
  let started = false;
  let currentContentIndex = -1;
  let textBlockOpen = false;
  let thinkingBlockOpen = false;
  const ensureStarted = async function* () {
    if (started)
      return;
    started = true;
    yield {
      type: "message_start",
      message: {
        id: messageId,
        type: "message",
        role: "assistant",
        content: [],
        model,
        stop_reason: null,
        stop_sequence: null,
        usage: {
          input_tokens: 0,
          output_tokens: 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0
        }
      }
    };
  };
  for await (const event of stream) {
    for await (const startedEvent of ensureStarted())
      yield startedEvent;
    const type = event.type;
    if (type === "response.output_text.delta") {
      if (!textBlockOpen) {
        if (thinkingBlockOpen) {
          yield {
            type: "content_block_stop",
            index: currentContentIndex
          };
          thinkingBlockOpen = false;
        }
        currentContentIndex++;
        textBlockOpen = true;
        yield {
          type: "content_block_start",
          index: currentContentIndex,
          content_block: { type: "text", text: "" }
        };
      }
      yield {
        type: "content_block_delta",
        index: currentContentIndex,
        delta: { type: "text_delta", text: String(event.delta ?? "") }
      };
      continue;
    }
    if (type === "response.reasoning_text.delta") {
      if (!thinkingBlockOpen) {
        if (textBlockOpen) {
          yield {
            type: "content_block_stop",
            index: currentContentIndex
          };
          textBlockOpen = false;
        }
        currentContentIndex++;
        thinkingBlockOpen = true;
        yield {
          type: "content_block_start",
          index: currentContentIndex,
          content_block: { type: "thinking", thinking: "", signature: "" }
        };
      }
      yield {
        type: "content_block_delta",
        index: currentContentIndex,
        delta: { type: "thinking_delta", thinking: String(event.delta ?? "") }
      };
      continue;
    }
    if (type === "response.output_item.added") {
      const item = event.item;
      const outputIndex = typeof event.output_index === "number" ? event.output_index : -1;
      if (item?.type === "function_call" && outputIndex >= 0) {
        if (textBlockOpen) {
          yield {
            type: "content_block_stop",
            index: currentContentIndex
          };
          textBlockOpen = false;
        }
        if (thinkingBlockOpen) {
          yield {
            type: "content_block_stop",
            index: currentContentIndex
          };
          thinkingBlockOpen = false;
        }
        currentContentIndex++;
        const id = String(item.call_id ?? item.id ?? `call_${outputIndex}`);
        const name = String(item.name ?? "");
        toolBlocks.set(outputIndex, {
          contentIndex: currentContentIndex,
          open: true,
          name,
          id
        });
        yield {
          type: "content_block_start",
          index: currentContentIndex,
          content_block: { type: "tool_use", id, name, input: {} }
        };
      }
      continue;
    }
    if (type === "response.function_call_arguments.delta") {
      const outputIndex = typeof event.output_index === "number" ? event.output_index : -1;
      const block = toolBlocks.get(outputIndex);
      if (block) {
        yield {
          type: "content_block_delta",
          index: block.contentIndex,
          delta: {
            type: "input_json_delta",
            partial_json: String(event.delta ?? "")
          }
        };
      }
      continue;
    }
    if (type === "response.output_item.done") {
      const outputIndex = typeof event.output_index === "number" ? event.output_index : -1;
      const block = toolBlocks.get(outputIndex);
      if (block?.open) {
        yield {
          type: "content_block_stop",
          index: block.contentIndex
        };
        block.open = false;
      }
      continue;
    }
    if (type === "response.error") {
      const error = event.error;
      throw new Error(String(error?.message ?? "ChatGPT Responses API error"));
    }
    if (type === "response.failed") {
      const response = event.response;
      const error = response?.error;
      throw new Error(String(error?.message ?? "ChatGPT Responses API failed"));
    }
    if (type === "response.completed" || type === "response.incomplete") {
      if (textBlockOpen) {
        yield {
          type: "content_block_stop",
          index: currentContentIndex
        };
        textBlockOpen = false;
      }
      if (thinkingBlockOpen) {
        yield {
          type: "content_block_stop",
          index: currentContentIndex
        };
        thinkingBlockOpen = false;
      }
      const response = event.response;
      yield {
        type: "message_delta",
        delta: { stop_reason: mapStopReason(response), stop_sequence: null },
        usage: extractUsage(response)
      };
      yield { type: "message_stop" };
    }
  }
}
async function createChatGPTResponsesStream(params) {
  const auth = await getValidChatGPTAuth();
  const fetchFn = params.fetchOverride ?? globalThis.fetch;
  const headers = {
    Authorization: `Bearer ${auth.accessToken}`,
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    "OpenAI-Beta": "responses=experimental",
    Origin: "https://chatgpt.com",
    Referer: "https://chatgpt.com/",
    originator: "claude-code-best"
  };
  if (auth.accountId) {
    headers["ChatGPT-Account-Id"] = auth.accountId;
  }
  const response = await fetchFn("https://chatgpt.com/backend-api/codex/responses", {
    method: "POST",
    headers,
    body: JSON.stringify(params.request),
    signal: params.signal
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`ChatGPT Responses API request failed (${response.status})${text ? `: ${text.slice(0, 500)}` : ""}`);
  }
  return parseSSE(response);
}
var init_responsesAdapter = __esm(() => {
  init_chatgptAuth();
});

// src/services/api/openai/requestBody.ts
function isOpenAIThinkingEnabled(model) {
  if (isEnvDefinedFalsy(process.env.OPENAI_ENABLE_THINKING))
    return false;
  if (isEnvTruthy(process.env.OPENAI_ENABLE_THINKING))
    return true;
  const modelLower = model.toLowerCase();
  return modelLower.includes("deepseek") || modelLower.includes("mimo");
}
function resolveOpenAIMaxTokens(upperLimit, maxOutputTokensOverride) {
  return maxOutputTokensOverride ?? (process.env.OPENAI_MAX_TOKENS ? parseInt(process.env.OPENAI_MAX_TOKENS, 10) || undefined : undefined) ?? (process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS ? parseInt(process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS, 10) || undefined : undefined) ?? upperLimit;
}
function buildOpenAIRequestBody(params) {
  const {
    model,
    messages,
    tools,
    toolChoice,
    enableThinking,
    maxTokens,
    temperatureOverride
  } = params;
  return {
    model,
    messages,
    max_tokens: maxTokens,
    ...tools.length > 0 && {
      tools,
      ...toolChoice && { tool_choice: toolChoice }
    },
    stream: true,
    stream_options: { include_usage: true },
    ...enableThinking && {
      thinking: { type: "enabled" },
      enable_thinking: true,
      chat_template_kwargs: { thinking: true, enable_thinking: true }
    },
    ...!enableThinking && temperatureOverride !== undefined && {
      temperature: temperatureOverride
    }
  };
}
var init_requestBody = __esm(() => {
  init_envUtils();
});

// src/services/api/openai/index.ts
import { randomUUID as randomUUID2 } from "crypto";
function convertToResponsesReasoningEffort(effortValue) {
  if (effortValue === "low")
    return "low";
  if (effortValue === "medium")
    return "medium";
  if (effortValue === "high")
    return "high";
  if (effortValue === "xhigh" || effortValue === "max")
    return "xhigh";
  if (typeof effortValue === "number")
    return "high";
  return;
}
function getChatGPTResponsesReasoningEffort(effortValue) {
  const envOverride = process.env.CLAUDE_CODE_EFFORT_LEVEL?.toLowerCase();
  if (envOverride === "auto" || envOverride === "unset")
    return;
  return convertToResponsesReasoningEffort(envOverride) ?? convertToResponsesReasoningEffort(effortValue) ?? "medium";
}
function prependDeferredToolListIfNeeded(messages, tools, deferredToolNames, useSearchExtraTools) {
  if (!useSearchExtraTools || isDeferredToolsDeltaEnabled())
    return messages;
  const deferredToolList = tools.filter((tool) => deferredToolNames.has(tool.name)).map(formatDeferredToolLine).sort().join(`
`);
  if (!deferredToolList)
    return messages;
  return [
    createUserMessage({
      content: `<available-deferred-tools>
${deferredToolList}
</available-deferred-tools>`,
      isMeta: true
    }),
    ...messages
  ];
}
function isOpenAIConvertibleMessage(msg) {
  return msg.type === "assistant" || msg.type === "user";
}
function assembleFinalAssistantOutputs(params) {
  const {
    partialMessage,
    contentBlocks,
    tools,
    agentId,
    usage,
    stopReason,
    maxTokens
  } = params;
  const outputs = [];
  const allBlocks = Object.keys(contentBlocks).sort((a, b) => Number(a) - Number(b)).map((k) => contentBlocks[Number(k)]).filter(Boolean);
  if (allBlocks.length > 0 && partialMessage) {
    outputs.push({
      message: {
        ...partialMessage,
        content: normalizeContentFromAPI(allBlocks, tools, agentId),
        usage,
        stop_reason: stopReason,
        stop_sequence: null
      },
      requestId: undefined,
      type: "assistant",
      uuid: randomUUID2(),
      timestamp: new Date().toISOString()
    });
  }
  if (stopReason === "max_tokens") {
    outputs.push(createAssistantAPIErrorMessage({
      content: `Output truncated: response exceeded the ${maxTokens} token limit. ` + `Set OPENAI_MAX_TOKENS or CLAUDE_CODE_MAX_OUTPUT_TOKENS to override.`,
      apiError: "max_output_tokens",
      error: "max_output_tokens"
    }));
  }
  return outputs;
}
async function* queryModelOpenAI(messages, systemPrompt, tools, signal, options) {
  try {
    const openaiModel = resolveOpenAIModel(options.model);
    const messagesForAPI = normalizeMessagesForAPI(messages, tools);
    const useSearchExtraTools = await isSearchExtraToolsEnabled(options.model, tools, options.getToolPermissionContext || (async () => getEmptyToolPermissionContext()), options.agents || [], options.querySource);
    const deferredToolNames = new Set;
    if (useSearchExtraTools) {
      for (const t of tools) {
        if (isDeferredTool(t))
          deferredToolNames.add(t.name);
      }
    }
    let filteredTools = tools;
    if (useSearchExtraTools && deferredToolNames.size > 0) {
      filteredTools = tools.filter((tool) => {
        if (!deferredToolNames.has(tool.name))
          return true;
        if (toolMatchesName(tool, SEARCH_EXTRA_TOOLS_TOOL_NAME))
          return true;
        return false;
      });
    }
    const toolSchemas = await Promise.all(filteredTools.map((tool) => toolToAPISchema(tool, {
      getToolPermissionContext: options.getToolPermissionContext,
      tools,
      agents: options.agents,
      allowedAgentTypes: options.allowedAgentTypes,
      model: options.model,
      deferLoading: useSearchExtraTools && deferredToolNames.has(tool.name)
    })));
    const standardTools = toolSchemas.filter((t) => {
      const anyT = t;
      return anyT.type !== "advisor_20260301" && anyT.type !== "computer_20250124";
    });
    const enableThinking = isOpenAIThinkingEnabled(openaiModel);
    const openAIConvertibleMessages = messagesForAPI.filter(isOpenAIConvertibleMessage);
    const messagesWithDeferredToolList = prependDeferredToolListIfNeeded(openAIConvertibleMessages, tools, deferredToolNames, useSearchExtraTools);
    const openaiMessages = anthropicMessagesToOpenAI(messagesWithDeferredToolList, systemPrompt, { enableThinking });
    const openaiTools = anthropicToolsToOpenAI(standardTools);
    const openaiToolChoice = anthropicToolChoiceToOpenAI(options.toolChoice);
    const reasoningEffort = getChatGPTResponsesReasoningEffort(options.effortValue);
    if (useSearchExtraTools) {
      const includedDeferredTools = filteredTools.filter((t) => deferredToolNames.has(t.name)).length;
      logForDebugging(`[OpenAI] Tool search enabled: ${includedDeferredTools}/${deferredToolNames.size} deferred tools included, total tools=${openaiTools.length}`);
    } else {
      logForDebugging(`[OpenAI] Tool search disabled, total tools=${openaiTools.length}`);
    }
    const { upperLimit } = getModelMaxOutputTokens(openaiModel);
    const maxTokens = resolveOpenAIMaxTokens(upperLimit, options.maxOutputTokensOverride);
    logForDebugging(`[OpenAI] Calling model=${openaiModel}, messages=${openaiMessages.length}, tools=${openaiTools.length}, thinking=${enableThinking}`);
    const adaptedStream = isChatGPTAuthEnabled() ? adaptResponsesStreamToAnthropic(await createChatGPTResponsesStream({
      request: buildResponsesRequest({
        model: openaiModel,
        messages: openaiMessages,
        tools: openaiTools,
        toolChoice: openaiToolChoice,
        reasoningEffort
      }),
      signal,
      fetchOverride: options.fetchOverride
    }), openaiModel) : adaptOpenAIStreamToAnthropic(await getOpenAIClient({
      maxRetries: 0,
      fetchOverride: options.fetchOverride,
      source: options.querySource
    }).chat.completions.create(buildOpenAIRequestBody({
      model: openaiModel,
      messages: openaiMessages,
      tools: openaiTools,
      toolChoice: openaiToolChoice,
      enableThinking,
      maxTokens,
      temperatureOverride: options.temperatureOverride
    }), { signal }), openaiModel);
    const contentBlocks = {};
    const collectedMessages = [];
    let partialMessage = null;
    let stopReason = null;
    let usage = {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0
    };
    let ttftMs = 0;
    const start = Date.now();
    for await (const event of adaptedStream) {
      switch (event.type) {
        case "message_start": {
          partialMessage = event.message;
          ttftMs = Date.now() - start;
          if (event.message.usage) {
            usage = {
              ...usage,
              ...event.message.usage
            };
          }
          break;
        }
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
            block.signature = delta.signature;
          }
          break;
        }
        case "content_block_stop": {
          break;
        }
        case "message_delta": {
          const deltaUsage = event.usage;
          if (deltaUsage) {
            usage = updateOpenAIUsage(usage, deltaUsage);
          }
          if (event.delta.stop_reason != null) {
            stopReason = event.delta.stop_reason;
          }
          break;
        }
        case "message_stop": {
          if (partialMessage) {
            for (const output of assembleFinalAssistantOutputs({
              partialMessage,
              contentBlocks,
              tools,
              agentId: options.agentId,
              usage,
              stopReason,
              maxTokens
            })) {
              if (output.type === "assistant") {
                collectedMessages.push(output);
              }
              yield output;
            }
            partialMessage = null;
          }
          if (usage.input_tokens + usage.output_tokens > 0) {
            const costUSD = calculateUSDCost(openaiModel, usage);
            addToTotalSessionCost(costUSD, usage, options.model);
          }
          break;
        }
      }
      yield {
        type: "stream_event",
        event,
        ...event.type === "message_start" ? { ttftMs } : undefined
      };
    }
    recordLLMObservation(options.langfuseTrace ?? null, {
      model: openaiModel,
      provider: "openai",
      input: convertMessagesToLangfuse(openaiMessages),
      output: convertOutputToLangfuse(collectedMessages),
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cache_creation_input_tokens: usage.cache_creation_input_tokens,
        cache_read_input_tokens: usage.cache_read_input_tokens
      },
      startTime: new Date(start),
      endTime: new Date,
      completionStartTime: ttftMs > 0 ? new Date(start + ttftMs) : undefined,
      tools: convertToolsToLangfuse(toolSchemas),
      ...enableThinking && { thinking: { type: "enabled" } }
    });
    if (partialMessage) {
      for (const output of assembleFinalAssistantOutputs({
        partialMessage,
        contentBlocks,
        tools,
        agentId: options.agentId,
        usage,
        stopReason,
        maxTokens
      })) {
        yield output;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logForDebugging(`[OpenAI] Error: ${errorMessage}`, { level: "error" });
    yield createAssistantAPIErrorMessage({
      content: `API Error: ${errorMessage}`,
      apiError: "api_error",
      error: error instanceof Error ? error : new Error(String(error))
    });
  }
}
var init_openai = __esm(() => {
  init_client();
  init_openaiShared();
  init_src();
  init_chatgptAuth();
  init_responsesAdapter();
  init_messages();
  init_api();
  init_Tool();
  init_debug();
  init_cost_tracker();
  init_modelCost();
  init_requestBody();
  init_tracing();
  init_convert();
  init_context();
  init_messages();
  init_searchExtraTools();
  init_prompt();
});
init_openai();

export {
  resolveOpenAIMaxTokens,
  queryModelOpenAI,
  isOpenAIThinkingEnabled,
  buildOpenAIRequestBody
};

//# debugId=9328BF1E8474615E64756E2164756E21
//# sourceMappingURL=chunk-afnypnz5.js.map
