// @bun
import {
  StdioServerTransport,
  init_stdio
} from "./chunk-k3q6hzy6.js";
import {
  createAbortController,
  createAssistantMessage,
  getDefaultAppState,
  getErrorParts,
  getTools,
  hasPermissionsToUseTool,
  init_AppStateStore,
  init_Shell,
  init_abortController,
  init_messages1 as init_messages,
  init_permissions,
  init_review,
  init_toolErrors,
  init_tools,
  init_zodToJsonSchema,
  review_default,
  setCwd,
  zodToJsonSchema
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
import {
  createFileStateCacheWithSizeLimit,
  init_fileStateCache
} from "./chunk-24kv69g3.js";
import"./chunk-brn3ak48.js";
import"./chunk-apms8t8n.js";
import"./chunk-4spgkgr3.js";
import"./chunk-r807k1we.js";
import"./chunk-bxyw0w0f.js";
import"./chunk-qnqdg4g2.js";
import"./chunk-60fkafk2.js";
import"./chunk-znh8j5rf.js";
import {
  findToolByName,
  getEmptyToolPermissionContext,
  init_Tool
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
  getMainLoopModel,
  init_model
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
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Server,
  init_server,
  init_types
} from "./chunk-ym6j0wv1.js";
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
import {
  init_log,
  logError
} from "./chunk-jsbc7abp.js";
import"./chunk-m28vg9w4.js";
import"./chunk-01w7y5nh.js";
import"./chunk-rhhvp5gh.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import {
  init_slowOperations,
  jsonStringify
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

// src/entrypoints/mcp.ts
init_server();
init_stdio();
init_types();
init_AppStateStore();
init_review();
init_Tool();
init_tools();
init_abortController();
init_fileStateCache();
init_log();
init_messages();
init_model();
init_permissions();
init_Shell();
init_slowOperations();
init_toolErrors();
init_zodToJsonSchema();
var MCP_COMMANDS = [review_default];
async function startMCPServer(cwd, debug, verbose) {
  const READ_FILE_STATE_CACHE_SIZE = 100;
  const readFileStateCache = createFileStateCacheWithSizeLimit(READ_FILE_STATE_CACHE_SIZE);
  setCwd(cwd);
  const server = new Server({
    name: "claude/tengu",
    version: "2.7.0"
  }, {
    capabilities: {
      tools: {}
    }
  });
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const toolPermissionContext = getEmptyToolPermissionContext();
    const tools = getTools(toolPermissionContext);
    return {
      tools: await Promise.all(tools.map(async (tool) => {
        let outputSchema;
        if (tool.outputSchema) {
          const convertedSchema = zodToJsonSchema(tool.outputSchema);
          if (typeof convertedSchema === "object" && convertedSchema !== null && "type" in convertedSchema && convertedSchema.type === "object") {
            outputSchema = convertedSchema;
          }
        }
        return {
          ...tool,
          description: await tool.prompt({
            getToolPermissionContext: async () => toolPermissionContext,
            tools,
            agents: []
          }),
          inputSchema: zodToJsonSchema(tool.inputSchema),
          outputSchema
        };
      }))
    };
  });
  server.setRequestHandler(CallToolRequestSchema, async ({ params: { name, arguments: args } }) => {
    const toolPermissionContext = getEmptyToolPermissionContext();
    const tools = getTools(toolPermissionContext);
    const tool = findToolByName(tools, name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    const toolUseContext = {
      abortController: createAbortController(),
      options: {
        commands: MCP_COMMANDS,
        tools,
        mainLoopModel: getMainLoopModel(),
        thinkingConfig: { type: "disabled" },
        mcpClients: [],
        mcpResources: {},
        isNonInteractiveSession: true,
        debug,
        verbose,
        agentDefinitions: { activeAgents: [], allAgents: [] }
      },
      getAppState: () => getDefaultAppState(),
      setAppState: () => {},
      messages: [],
      readFileState: readFileStateCache,
      setInProgressToolUseIDs: () => {},
      setResponseLength: () => {},
      updateFileHistoryState: () => {},
      updateAttributionState: () => {}
    };
    try {
      if (!tool.isEnabled()) {
        throw new Error(`Tool ${name} is not enabled`);
      }
      const validationResult = await tool.validateInput?.(args ?? {}, toolUseContext);
      if (validationResult && !validationResult.result) {
        throw new Error(`Tool ${name} input is invalid: ${"message" in validationResult ? validationResult.message : String(validationResult)}`);
      }
      const finalResult = await tool.call(args ?? {}, toolUseContext, hasPermissionsToUseTool, createAssistantMessage({
        content: []
      }));
      return {
        content: [
          {
            type: "text",
            text: typeof finalResult === "string" ? finalResult : jsonStringify(finalResult.data)
          }
        ]
      };
    } catch (error) {
      logError(error);
      const parts = error instanceof Error ? getErrorParts(error) : [String(error)];
      const errorText = parts.filter(Boolean).join(`
`).trim() || "Error";
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: errorText
          }
        ]
      };
    }
  });
  async function runServer() {
    const transport = new StdioServerTransport;
    await server.connect(transport);
  }
  return await runServer();
}
export {
  startMCPServer
};

//# debugId=59F84F4278EAC14D64756E2164756E21
//# sourceMappingURL=chunk-m9fcjwfv.js.map
