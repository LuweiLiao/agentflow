// @bun
import {
  init_slashCommandParsing,
  parseSlashCommand
} from "./chunk-3abaq08g.js";
import {
  NO_CONTENT_MESSAGE,
  addSessionHook,
  buildPluginCommandTelemetryFields,
  buildPostCompactMessages,
  builtInCommandNames,
  createAbortController,
  createAgentId,
  createAttachmentMessage,
  createCommandInputMessage,
  createSyntheticUserCaveatMessage,
  createSystemMessage,
  createUserInterruptionMessage,
  createUserMessage,
  enqueue,
  enqueuePendingNotification,
  extractResultText,
  finalizeAutonomyRunCompleted,
  finalizeAutonomyRunFailed,
  findCommand,
  formatCommandInputTags,
  getAgentContext,
  getAssistantMessageContentLength,
  getAttachmentMessages,
  getCommand,
  getCommandName,
  getDumpPromptsPath,
  hasCommand,
  hasPermissionsToUseTool,
  init_UI,
  init_abortController,
  init_agentContext,
  init_attachments,
  init_autonomyRuns,
  init_commands1 as init_commands,
  init_compact,
  init_dumpPrompts,
  init_forkedAgent,
  init_fullscreen,
  init_generators,
  init_messageQueueManager,
  init_messages,
  init_messages1 as init_messages2,
  init_microCompact,
  init_permissionSetup,
  init_permissions,
  init_pluginOnlyPolicy,
  init_pluginTelemetry,
  init_runAgent,
  init_sessionHooks,
  init_skillUsageTracking,
  init_tokens,
  init_uuid,
  isCompactBoundaryMessage,
  isFullscreenEnvEnabled,
  isRestrictedToPluginOnly,
  isSourceAdminTrusted,
  isSystemLocalCommandMessage,
  normalizeMessages,
  parseToolListFromCLI,
  prepareForkedCommandContext,
  prepareUserContent,
  recordSkillUsage,
  removeSessionHook,
  renderToolUseProgressMessage,
  resetMicrocompactState,
  runAgent,
  toArray
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
import {
  init_pluginIdentifier,
  isOfficialMarketplaceName,
  parsePluginIdentifier
} from "./chunk-2fww5648.js";
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
import {
  init_events,
  logOTelEvent,
  redactIfDisabled
} from "./chunk-bvcfzg7t.js";
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
import {
  HOOK_EVENTS,
  init_agentSdkTypes
} from "./chunk-h2edgmqn.js";
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
import {
  getWorkload,
  init_workloadContext
} from "./chunk-35jsjk7z.js";
import"./chunk-e45319yt.js";
import"./chunk-jyqypr4z.js";
import"./chunk-m18nccbn.js";
import"./chunk-e2jvken3.js";
import"./chunk-5zhv4jyp.js";
import {
  getDisplayPath,
  init_file
} from "./chunk-jwyj6t5m.js";
import"./chunk-87f9np2y.js";
import"./chunk-zq3spn7d.js";
import {
  init_sleep,
  sleep
} from "./chunk-jmv7k0jn.js";
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
import {
  init_analytics,
  logEvent
} from "./chunk-4hpfxga2.js";
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
import {
  COMMAND_MESSAGE_TAG,
  COMMAND_NAME_TAG,
  init_log,
  init_xml,
  logError
} from "./chunk-kc49dhz0.js";
import"./chunk-k51zdj4e.js";
import"./chunk-mtgfbnth.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import {
  AbortError,
  MalformedCommandError,
  getFsImplementation,
  init_debug,
  init_errors,
  init_fsOperations,
  logForDebugging
} from "./chunk-pyv3zrjt.js";
import"./chunk-kb3758f7.js";
import {
  addInvokedSkill,
  getSessionId,
  init_state,
  setPromptId
} from "./chunk-232p95fy.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import {
  init_envUtils,
  isEnvTruthy
} from "./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/hooks/registerSkillHooks.ts
function registerSkillHooks(setAppState, sessionId, hooks, skillName, skillRoot) {
  let registeredCount = 0;
  for (const eventName of HOOK_EVENTS) {
    const matchers = hooks[eventName];
    if (!matchers)
      continue;
    for (const matcher of matchers) {
      for (const hook of matcher.hooks) {
        const onHookSuccess = hook.once ? () => {
          logForDebugging(`Removing one-shot hook for event ${eventName} in skill '${skillName}'`);
          removeSessionHook(setAppState, sessionId, eventName, hook);
        } : undefined;
        addSessionHook(setAppState, sessionId, eventName, matcher.matcher || "", hook, onHookSuccess, skillRoot);
        registeredCount++;
      }
    }
  }
  if (registeredCount > 0) {
    logForDebugging(`Registered ${registeredCount} hooks from skill '${skillName}'`);
  }
}
var init_registerSkillHooks = __esm(() => {
  init_agentSdkTypes();
  init_debug();
  init_sessionHooks();
});

// src/utils/processUserInput/processSlashCommand.tsx
import { randomUUID } from "crypto";
function isTestRuntime() {
  return false;
}
function assertBackgroundForkedSlashCommandTestOverrideAllowed() {
  if (!isTestRuntime()) {
    throw new Error("ToolUseContext.options.allowBackgroundForkedSlashCommands is test-only and cannot be enabled outside NODE_ENV=test.");
  }
}
async function executeForkedSlashCommand(command, args, context, precedingInputBlocks, setToolJSX, canUseTool, autonomy) {
  const agentId = createAgentId();
  const pluginMarketplace = command.pluginInfo ? parsePluginIdentifier(command.pluginInfo.repository).marketplace : undefined;
  logEvent("tengu_slash_command_forked", {
    command_name: command.name,
    invocation_trigger: "user-slash",
    ...command.pluginInfo && {
      _PROTO_plugin_name: command.pluginInfo.pluginManifest.name,
      ...pluginMarketplace && {
        _PROTO_marketplace_name: pluginMarketplace
      },
      ...buildPluginCommandTelemetryFields(command.pluginInfo)
    }
  });
  const { skillContent, modifiedGetAppState, baseAgent, promptMessages } = await prepareForkedCommandContext(command, args, context);
  const agentDefinition = command.effort !== undefined ? { ...baseAgent, effort: command.effort } : baseAgent;
  logForDebugging(`Executing forked slash command /${command.name} with agent ${agentDefinition.agentType}`);
  const appState = await context.getAppState();
  const allowBackgroundForkedSlashCommands = context.options.allowBackgroundForkedSlashCommands === true;
  if (allowBackgroundForkedSlashCommands) {
    assertBackgroundForkedSlashCommandTestOverrideAllowed();
  }
  let canRunBackgroundForkedSlashCommand = false;
  if (appState.kairosEnabled) {
    if (true) {
      canRunBackgroundForkedSlashCommand = true;
    }
  }
  if (canRunBackgroundForkedSlashCommand) {
    const bgAbortController = createAbortController();
    const commandName = getCommandName(command);
    const spawnTimeWorkload = getWorkload();
    const enqueueResult = (value) => enqueuePendingNotification({
      value,
      mode: "prompt",
      priority: "later",
      isMeta: true,
      skipSlashCommands: true,
      workload: spawnTimeWorkload
    });
    const finalizeDeferredAutonomyRunCompleted = async () => {
      if (!autonomy?.runId) {
        return;
      }
      const nextCommands = await finalizeAutonomyRunCompleted({
        runId: autonomy.runId,
        rootDir: autonomy.rootDir,
        priority: "later",
        workload: spawnTimeWorkload
      });
      for (const nextCommand of nextCommands) {
        enqueue(nextCommand);
      }
    };
    const finalizeDeferredAutonomyRunFailed = async (error) => {
      if (!autonomy?.runId) {
        return;
      }
      await finalizeAutonomyRunFailed({
        runId: autonomy.runId,
        rootDir: autonomy.rootDir,
        error: error instanceof Error ? error.message : String(error)
      });
    };
    (async () => {
      const deadline = Date.now() + MCP_SETTLE_TIMEOUT_MS;
      while (Date.now() < deadline) {
        const s = context.getAppState();
        if (!s.mcp.clients.some((c) => c.type === "pending"))
          break;
        await sleep(MCP_SETTLE_POLL_MS);
      }
      const freshTools = context.options.refreshTools?.() ?? context.options.tools;
      const agentMessages2 = [];
      for await (const message of runAgent({
        agentDefinition,
        promptMessages,
        toolUseContext: {
          ...context,
          getAppState: modifiedGetAppState,
          abortController: bgAbortController
        },
        canUseTool,
        isAsync: true,
        querySource: "agent:custom",
        model: command.model,
        availableTools: freshTools,
        override: { agentId }
      })) {
        agentMessages2.push(message);
      }
      const resultText2 = extractResultText(agentMessages2, "Command completed");
      logForDebugging(`Background forked command /${commandName} completed (agent ${agentId})`);
      enqueueResult(`<scheduled-task-result command="/${commandName}">
${resultText2}
</scheduled-task-result>`);
      try {
        await finalizeDeferredAutonomyRunCompleted();
      } catch (finalizeError) {
        logError(finalizeError);
      }
    })().catch(async (err) => {
      logError(err);
      enqueueResult(`<scheduled-task-result command="/${commandName}" status="failed">
${err instanceof Error ? err.message : String(err)}
</scheduled-task-result>`);
      await finalizeDeferredAutonomyRunFailed(err);
    });
    return {
      messages: [],
      shouldQuery: false,
      command,
      deferAutonomyCompletion: Boolean(autonomy?.runId)
    };
  }
  const agentMessages = [];
  const progressMessages = [];
  const parentToolUseID = `forked-command-${command.name}`;
  let toolUseCounter = 0;
  const createProgressMessage = (message) => {
    toolUseCounter++;
    return {
      type: "progress",
      data: {
        message,
        type: "agent_progress",
        prompt: skillContent,
        agentId
      },
      parentToolUseID,
      toolUseID: `${parentToolUseID}-${toolUseCounter}`,
      timestamp: new Date().toISOString(),
      uuid: randomUUID()
    };
  };
  const updateProgress = () => {
    setToolJSX({
      jsx: renderToolUseProgressMessage(progressMessages, {
        tools: context.options.tools,
        verbose: false
      }),
      shouldHidePromptInput: false,
      shouldContinueAnimation: true,
      showSpinner: true
    });
  };
  updateProgress();
  try {
    for await (const message of runAgent({
      agentDefinition,
      promptMessages,
      toolUseContext: {
        ...context,
        getAppState: modifiedGetAppState
      },
      canUseTool,
      isAsync: false,
      querySource: "agent:custom",
      model: command.model,
      availableTools: context.options.tools
    })) {
      agentMessages.push(message);
      const normalizedNew = normalizeMessages([message]);
      if (message.type === "assistant") {
        const contentLength = getAssistantMessageContentLength(message);
        if (contentLength > 0) {
          context.setResponseLength((len) => len + contentLength);
        }
        const normalizedMsg = normalizedNew[0];
        if (normalizedMsg && normalizedMsg.type === "assistant") {
          progressMessages.push(createProgressMessage(message));
          updateProgress();
        }
      }
      if (message.type === "user") {
        const normalizedMsg = normalizedNew[0];
        if (normalizedMsg && normalizedMsg.type === "user") {
          progressMessages.push(createProgressMessage(normalizedMsg));
          updateProgress();
        }
      }
    }
  } finally {
    setToolJSX(null);
  }
  let resultText = extractResultText(agentMessages, "Command completed");
  logForDebugging(`Forked slash command /${command.name} completed with agent ${agentId}`);
  if (process.env.USER_TYPE === "ant") {
    resultText = `[ANT-ONLY] API calls: ${getDisplayPath(getDumpPromptsPath(agentId))}
${resultText}`;
  }
  const messages = [
    createUserMessage({
      content: prepareUserContent({
        inputString: `/${getCommandName(command)} ${args}`.trim(),
        precedingInputBlocks
      })
    }),
    createUserMessage({
      content: `<local-command-stdout>
${resultText}
</local-command-stdout>`
    })
  ];
  return {
    messages,
    shouldQuery: false,
    command,
    resultText
  };
}
function looksLikeCommand(commandName) {
  return !/[^a-zA-Z0-9:\-_]/.test(commandName);
}
async function processSlashCommand(inputString, precedingInputBlocks, imageContentBlocks, attachmentMessages, context, setToolJSX, uuid, isAlreadyProcessing, canUseTool, autonomy) {
  const parsed = parseSlashCommand(inputString);
  if (!parsed) {
    logEvent("tengu_input_slash_missing", {});
    const errorMessage = "Commands are in the form `/command [args]`";
    return {
      messages: [
        createSyntheticUserCaveatMessage(),
        ...attachmentMessages,
        createUserMessage({
          content: prepareUserContent({
            inputString: errorMessage,
            precedingInputBlocks
          })
        })
      ],
      shouldQuery: false,
      resultText: errorMessage
    };
  }
  const { commandName, args: parsedArgs, isMcp } = parsed;
  const sanitizedCommandName = isMcp ? "mcp" : !builtInCommandNames().has(commandName) ? "custom" : commandName;
  if (!hasCommand(commandName, context.options.commands)) {
    let isFilePath = false;
    try {
      await getFsImplementation().stat(`/${commandName}`);
      isFilePath = true;
    } catch {}
    if (looksLikeCommand(commandName) && !isFilePath) {
      logEvent("tengu_input_slash_invalid", {
        input: commandName
      });
      const unknownMessage = `Unknown skill: ${commandName}`;
      return {
        messages: [
          createSyntheticUserCaveatMessage(),
          ...attachmentMessages,
          createUserMessage({
            content: prepareUserContent({
              inputString: unknownMessage,
              precedingInputBlocks
            })
          }),
          ...parsedArgs ? [createSystemMessage(`Args from unknown skill: ${parsedArgs}`, "warning")] : []
        ],
        shouldQuery: false,
        resultText: unknownMessage
      };
    }
    const promptId = randomUUID();
    setPromptId(promptId);
    logEvent("tengu_input_prompt", {});
    logOTelEvent("user_prompt", {
      prompt_length: String(inputString.length),
      prompt: redactIfDisabled(inputString),
      "prompt.id": promptId
    });
    return {
      messages: [
        createUserMessage({
          content: prepareUserContent({ inputString, precedingInputBlocks }),
          uuid
        }),
        ...attachmentMessages
      ],
      shouldQuery: true
    };
  }
  const {
    messages: newMessages,
    shouldQuery: messageShouldQuery,
    allowedTools,
    model,
    effort,
    command: returnedCommand,
    resultText,
    nextInput,
    submitNextInput,
    deferAutonomyCompletion
  } = await getMessagesForSlashCommand(commandName, parsedArgs, setToolJSX, context, precedingInputBlocks, imageContentBlocks, isAlreadyProcessing, canUseTool, uuid, autonomy);
  if (newMessages.length === 0) {
    const eventData2 = {
      input: sanitizedCommandName
    };
    if (returnedCommand.type === "prompt" && returnedCommand.pluginInfo) {
      const { pluginManifest, repository } = returnedCommand.pluginInfo;
      const { marketplace } = parsePluginIdentifier(repository);
      const isOfficial = isOfficialMarketplaceName(marketplace);
      eventData2._PROTO_plugin_name = pluginManifest.name;
      if (marketplace) {
        eventData2._PROTO_marketplace_name = marketplace;
      }
      eventData2.plugin_repository = isOfficial ? repository : "third-party";
      eventData2.plugin_name = isOfficial ? pluginManifest.name : "third-party";
      if (isOfficial && pluginManifest.version) {
        eventData2.plugin_version = pluginManifest.version;
      }
      Object.assign(eventData2, buildPluginCommandTelemetryFields(returnedCommand.pluginInfo));
    }
    logEvent("tengu_input_command", {
      ...eventData2,
      invocation_trigger: "user-slash",
      ...process.env.USER_TYPE === "ant" && {
        skill_name: commandName,
        ...returnedCommand.type === "prompt" && {
          skill_source: returnedCommand.source
        },
        ...returnedCommand.loadedFrom && {
          skill_loaded_from: returnedCommand.loadedFrom
        },
        ...returnedCommand.kind && {
          skill_kind: returnedCommand.kind
        }
      }
    });
    return {
      messages: [],
      shouldQuery: false,
      model,
      nextInput,
      submitNextInput,
      deferAutonomyCompletion
    };
  }
  if (newMessages.length === 2 && newMessages[1].type === "user" && typeof newMessages[1].message.content === "string" && newMessages[1].message.content.startsWith("Unknown command:")) {
    const looksLikeFilePath = inputString.startsWith("/var") || inputString.startsWith("/tmp") || inputString.startsWith("/private");
    if (!looksLikeFilePath) {
      logEvent("tengu_input_slash_invalid", {
        input: commandName
      });
    }
    return {
      messages: [createSyntheticUserCaveatMessage(), ...newMessages],
      shouldQuery: messageShouldQuery,
      allowedTools,
      model
    };
  }
  const eventData = {
    input: sanitizedCommandName
  };
  if (returnedCommand.type === "prompt" && returnedCommand.pluginInfo) {
    const { pluginManifest, repository } = returnedCommand.pluginInfo;
    const { marketplace } = parsePluginIdentifier(repository);
    const isOfficial = isOfficialMarketplaceName(marketplace);
    eventData._PROTO_plugin_name = pluginManifest.name;
    if (marketplace) {
      eventData._PROTO_marketplace_name = marketplace;
    }
    eventData.plugin_repository = isOfficial ? repository : "third-party";
    eventData.plugin_name = isOfficial ? pluginManifest.name : "third-party";
    if (isOfficial && pluginManifest.version) {
      eventData.plugin_version = pluginManifest.version;
    }
    Object.assign(eventData, buildPluginCommandTelemetryFields(returnedCommand.pluginInfo));
  }
  logEvent("tengu_input_command", {
    ...eventData,
    invocation_trigger: "user-slash",
    ...process.env.USER_TYPE === "ant" && {
      skill_name: commandName,
      ...returnedCommand.type === "prompt" && {
        skill_source: returnedCommand.source
      },
      ...returnedCommand.loadedFrom && {
        skill_loaded_from: returnedCommand.loadedFrom
      },
      ...returnedCommand.kind && {
        skill_kind: returnedCommand.kind
      }
    }
  });
  const isCompactResult = newMessages.length > 0 && newMessages[0] && isCompactBoundaryMessage(newMessages[0]);
  return {
    messages: messageShouldQuery || newMessages.every(isSystemLocalCommandMessage) || isCompactResult ? newMessages : [createSyntheticUserCaveatMessage(), ...newMessages],
    shouldQuery: messageShouldQuery,
    allowedTools,
    model,
    effort,
    resultText,
    nextInput,
    submitNextInput,
    deferAutonomyCompletion
  };
}
async function getMessagesForSlashCommand(commandName, args, setToolJSX, context, precedingInputBlocks, imageContentBlocks, _isAlreadyProcessing, canUseTool, uuid, autonomy) {
  const command = getCommand(commandName, context.options.commands);
  if (command.type === "prompt" && command.userInvocable !== false) {
    recordSkillUsage(commandName);
  }
  if (command.userInvocable === false) {
    return {
      messages: [
        createUserMessage({
          content: prepareUserContent({
            inputString: `/${commandName}`,
            precedingInputBlocks
          })
        }),
        createUserMessage({
          content: `This skill can only be invoked by Claude, not directly by users. Ask Claude to use the "${commandName}" skill for you.`
        })
      ],
      shouldQuery: false,
      command
    };
  }
  try {
    switch (command.type) {
      case "local-jsx": {
        return new Promise((resolve) => {
          let doneWasCalled = false;
          const onDone = (result, options) => {
            doneWasCalled = true;
            if (options?.display === "skip") {
              resolve({
                messages: [],
                shouldQuery: false,
                command,
                nextInput: options?.nextInput,
                submitNextInput: options?.submitNextInput
              });
              return;
            }
            const metaMessages = (options?.metaMessages ?? []).map((content) => createUserMessage({ content, isMeta: true }));
            const skipTranscript = isFullscreenEnvEnabled() && typeof result === "string" && result.endsWith(" dismissed");
            const breadcrumbArgs = options?.displayArgs ?? args;
            resolve({
              messages: options?.display === "system" ? skipTranscript ? metaMessages : [
                createCommandInputMessage(formatCommandInput(command, breadcrumbArgs)),
                createCommandInputMessage(`<local-command-stdout>${result}</local-command-stdout>`),
                ...metaMessages
              ] : [
                createUserMessage({
                  content: prepareUserContent({
                    inputString: formatCommandInput(command, breadcrumbArgs),
                    precedingInputBlocks
                  })
                }),
                result ? createUserMessage({
                  content: `<local-command-stdout>${result}</local-command-stdout>`
                }) : createUserMessage({
                  content: `<local-command-stdout>${NO_CONTENT_MESSAGE}</local-command-stdout>`
                }),
                ...metaMessages
              ],
              shouldQuery: options?.shouldQuery ?? false,
              command,
              nextInput: options?.nextInput,
              submitNextInput: options?.submitNextInput
            });
          };
          command.load().then((mod) => mod.call(onDone, { ...context, canUseTool }, args)).then((jsx) => {
            if (jsx == null)
              return;
            if (context.options.isNonInteractiveSession) {
              resolve({
                messages: [],
                shouldQuery: false,
                command
              });
              return;
            }
            if (doneWasCalled)
              return;
            setToolJSX({
              jsx,
              shouldHidePromptInput: true,
              showSpinner: false,
              isLocalJSXCommand: true,
              isImmediate: command.immediate === true
            });
          }).catch((e) => {
            logError(e);
            if (doneWasCalled)
              return;
            doneWasCalled = true;
            setToolJSX({
              jsx: null,
              shouldHidePromptInput: false,
              clearLocalJSX: true
            });
            resolve({ messages: [], shouldQuery: false, command });
          });
        });
      }
      case "local": {
        const displayArgs = command.isSensitive && args.trim() ? "***" : args;
        const userMessage = createUserMessage({
          content: prepareUserContent({
            inputString: formatCommandInput(command, displayArgs),
            precedingInputBlocks
          })
        });
        try {
          const syntheticCaveatMessage = createSyntheticUserCaveatMessage();
          const mod = await command.load();
          const result = await mod.call(args, context);
          if (result.type === "skip") {
            return {
              messages: [],
              shouldQuery: false,
              command
            };
          }
          if (result.type === "compact") {
            const slashCommandMessages = [
              syntheticCaveatMessage,
              userMessage,
              ...result.displayText ? [
                createUserMessage({
                  content: `<local-command-stdout>${result.displayText}</local-command-stdout>`,
                  timestamp: new Date(Date.now() + 100).toISOString()
                })
              ] : []
            ];
            const compactionResultWithSlashMessages = {
              ...result.compactionResult,
              messagesToKeep: [...result.compactionResult.messagesToKeep ?? [], ...slashCommandMessages]
            };
            resetMicrocompactState();
            return {
              messages: buildPostCompactMessages(compactionResultWithSlashMessages),
              shouldQuery: false,
              command
            };
          }
          return {
            messages: [
              userMessage,
              createCommandInputMessage(`<local-command-stdout>${result.value}</local-command-stdout>`)
            ],
            shouldQuery: false,
            command,
            resultText: result.value
          };
        } catch (e) {
          logError(e);
          return {
            messages: [
              userMessage,
              createCommandInputMessage(`<local-command-stderr>${String(e)}</local-command-stderr>`)
            ],
            shouldQuery: false,
            command
          };
        }
      }
      case "prompt": {
        try {
          if (command.context === "fork") {
            return await executeForkedSlashCommand(command, args, context, precedingInputBlocks, setToolJSX, canUseTool ?? hasPermissionsToUseTool, autonomy);
          }
          return await getMessagesForPromptSlashCommand(command, args, context, precedingInputBlocks, imageContentBlocks, uuid);
        } catch (e) {
          if (e instanceof AbortError) {
            return {
              messages: [
                createUserMessage({
                  content: prepareUserContent({
                    inputString: formatCommandInput(command, args),
                    precedingInputBlocks
                  })
                }),
                createUserInterruptionMessage({ toolUse: false })
              ],
              shouldQuery: false,
              command
            };
          }
          return {
            messages: [
              createUserMessage({
                content: prepareUserContent({
                  inputString: formatCommandInput(command, args),
                  precedingInputBlocks
                })
              }),
              createUserMessage({
                content: `<local-command-stderr>${String(e)}</local-command-stderr>`
              })
            ],
            shouldQuery: false,
            command
          };
        }
      }
    }
  } catch (e) {
    if (e instanceof MalformedCommandError) {
      return {
        messages: [
          createUserMessage({
            content: prepareUserContent({
              inputString: e.message,
              precedingInputBlocks
            })
          })
        ],
        shouldQuery: false,
        command
      };
    }
    throw e;
  }
}
function formatCommandInput(command, args) {
  return formatCommandInputTags(getCommandName(command), args);
}
function formatSkillLoadingMetadata(skillName, _progressMessage = "loading") {
  return [
    `<${COMMAND_MESSAGE_TAG}>${skillName}</${COMMAND_MESSAGE_TAG}>`,
    `<${COMMAND_NAME_TAG}>${skillName}</${COMMAND_NAME_TAG}>`,
    `<skill-format>true</skill-format>`
  ].join(`
`);
}
function formatSlashCommandLoadingMetadata(commandName, args) {
  return [
    `<${COMMAND_MESSAGE_TAG}>${commandName}</${COMMAND_MESSAGE_TAG}>`,
    `<${COMMAND_NAME_TAG}>/${commandName}</${COMMAND_NAME_TAG}>`,
    args ? `<command-args>${args}</command-args>` : null
  ].filter(Boolean).join(`
`);
}
function formatCommandLoadingMetadata(command, args) {
  if (command.userInvocable !== false) {
    return formatSlashCommandLoadingMetadata(command.name, args);
  }
  if (command.loadedFrom === "skills" || command.loadedFrom === "plugin" || command.loadedFrom === "mcp") {
    return formatSkillLoadingMetadata(command.name, command.progressMessage);
  }
  return formatSlashCommandLoadingMetadata(command.name, args);
}
async function processPromptSlashCommand(commandName, args, commands, context, imageContentBlocks = []) {
  const command = findCommand(commandName, commands);
  if (!command) {
    throw new MalformedCommandError(`Unknown command: ${commandName}`);
  }
  if (command.type !== "prompt") {
    throw new Error(`Unexpected ${command.type} command. Expected 'prompt' command. Use /${commandName} directly in the main conversation.`);
  }
  return getMessagesForPromptSlashCommand(command, args, context, [], imageContentBlocks);
}
async function getMessagesForPromptSlashCommand(command, args, context, precedingInputBlocks = [], imageContentBlocks = [], uuid) {
  if (isEnvTruthy(process.env.CLAUDE_CODE_COORDINATOR_MODE) && !context.agentId) {
    const metadata2 = formatCommandLoadingMetadata(command, args);
    const parts = [`Skill "/${command.name}" is available for workers.`];
    if (command.description) {
      parts.push(`Description: ${command.description}`);
    }
    if (command.whenToUse) {
      parts.push(`When to use: ${command.whenToUse}`);
    }
    const skillAllowedTools = command.allowedTools ?? [];
    if (skillAllowedTools.length > 0) {
      parts.push(`This skill grants workers additional tool permissions: ${skillAllowedTools.join(", ")}`);
    }
    parts.push(`
Instruct a worker to use this skill by including "Use the /${command.name} skill" in your Agent prompt. The worker has access to the Skill tool and will receive the skill's content and permissions when it invokes it.`);
    const summaryContent = [{ type: "text", text: parts.join(`
`) }];
    return {
      messages: [
        createUserMessage({ content: metadata2, uuid }),
        createUserMessage({ content: summaryContent, isMeta: true })
      ],
      shouldQuery: true,
      model: command.model,
      effort: command.effort,
      command
    };
  }
  const result = await command.getPromptForCommand(args, context);
  const hooksAllowedForThisSkill = !isRestrictedToPluginOnly("hooks") || isSourceAdminTrusted(command.source);
  if (command.hooks && hooksAllowedForThisSkill) {
    const sessionId = getSessionId();
    registerSkillHooks(context.setAppState, sessionId, command.hooks, command.name, command.type === "prompt" ? command.skillRoot : undefined);
  }
  const skillPath = command.source ? `${command.source}:${command.name}` : command.name;
  const skillContent = result.filter((b) => b.type === "text").map((b) => b.text).join(`

`);
  addInvokedSkill(command.name, skillPath, skillContent, getAgentContext()?.agentId ?? null);
  const metadata = formatCommandLoadingMetadata(command, args);
  const additionalAllowedTools = parseToolListFromCLI(command.allowedTools ?? []);
  const mainMessageContent = imageContentBlocks.length > 0 || precedingInputBlocks.length > 0 ? [...imageContentBlocks, ...precedingInputBlocks, ...result] : result;
  const attachmentMessages = await toArray(getAttachmentMessages(result.filter((block) => block.type === "text").map((block) => block.text).join(" "), context, null, [], context.messages, "repl_main_thread", { skipSkillDiscovery: true }));
  const messages = [
    createUserMessage({
      content: metadata,
      uuid
    }),
    createUserMessage({
      content: mainMessageContent,
      isMeta: true
    }),
    ...attachmentMessages,
    createAttachmentMessage({
      type: "command_permissions",
      allowedTools: additionalAllowedTools,
      model: command.model
    })
  ];
  return {
    messages,
    shouldQuery: true,
    allowedTools: additionalAllowedTools,
    model: command.model,
    effort: command.effort,
    command
  };
}
var MCP_SETTLE_POLL_MS = 200, MCP_SETTLE_TIMEOUT_MS = 1e4;
var init_processSlashCommand = __esm(() => {
  init_state();
  init_commands();
  init_messages();
  init_state();
  init_xml();
  init_analytics();
  init_dumpPrompts();
  init_compact();
  init_microCompact();
  init_runAgent();
  init_UI();
  init_abortController();
  init_agentContext();
  init_attachments();
  init_debug();
  init_envUtils();
  init_errors();
  init_file();
  init_forkedAgent();
  init_fsOperations();
  init_fullscreen();
  init_generators();
  init_registerSkillHooks();
  init_log();
  init_messageQueueManager();
  init_messages2();
  init_permissionSetup();
  init_permissions();
  init_pluginIdentifier();
  init_pluginOnlyPolicy();
  init_slashCommandParsing();
  init_sleep();
  init_skillUsageTracking();
  init_events();
  init_pluginTelemetry();
  init_tokens();
  init_uuid();
  init_autonomyRuns();
  init_workloadContext();
});
init_processSlashCommand();

export {
  processSlashCommand,
  processPromptSlashCommand,
  looksLikeCommand,
  formatSkillLoadingMetadata
};

//# debugId=A1AA27CE568AFF9764756E2164756E21
//# sourceMappingURL=chunk-7hvtrdzz.js.map
