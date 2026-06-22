// @bun
import {
  buildDefaultExternalSystemPrompt,
  getDefaultExternalAutoModeRules,
  init_sideQuery,
  init_yoloClassifier,
  sideQuery
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
import {
  init_poorMode,
  isPoorModeActive
} from "./chunk-km99syjh.js";
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
  getAutoModeConfig,
  getMainLoopModel,
  getSmallFastModel,
  init_model,
  init_settings1 as init_settings,
  parseUserSpecifiedModel
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
  init_errors,
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

// src/cli/handlers/autoMode.ts
init_errors();
init_model();
init_yoloClassifier();
init_settings();
init_poorMode();
init_sideQuery();
init_slowOperations();
function writeRules(rules) {
  process.stdout.write(jsonStringify(rules, null, 2) + `
`);
}
function autoModeDefaultsHandler() {
  writeRules(getDefaultExternalAutoModeRules());
}
function autoModeConfigHandler() {
  const config = getAutoModeConfig();
  const defaults = getDefaultExternalAutoModeRules();
  writeRules({
    allow: config?.allow?.length ? config.allow : defaults.allow,
    soft_deny: config?.soft_deny?.length ? config.soft_deny : defaults.soft_deny,
    environment: config?.environment?.length ? config.environment : defaults.environment
  });
}
var CRITIQUE_SYSTEM_PROMPT = `You are an expert reviewer of auto mode classifier rules for Claude Code.
` + `
` + 'Claude Code has an "auto mode" that uses an AI classifier to decide whether ' + "tool calls should be auto-approved or require user confirmation. Users can " + `write custom rules in three categories:
` + `
` + `- **allow**: Actions the classifier should auto-approve
` + `- **soft_deny**: Actions the classifier should block (require user confirmation)
` + `- **environment**: Context about the user's setup that helps the classifier make decisions
` + `
` + "Your job is to critique the user's custom rules for clarity, completeness, " + "and potential issues. The classifier is an LLM that reads these rules as " + `part of its system prompt.
` + `
` + `For each rule, evaluate:
` + `1. **Clarity**: Is the rule unambiguous? Could the classifier misinterpret it?
` + `2. **Completeness**: Are there gaps or edge cases the rule doesn't cover?
` + `3. **Conflicts**: Do any of the rules conflict with each other?
` + `4. **Actionability**: Is the rule specific enough for the classifier to act on?
` + `
` + "Be concise and constructive. Only comment on rules that could be improved. " + "If all rules look good, say so.";
async function autoModeCritiqueHandler(options) {
  const config = getAutoModeConfig();
  const hasCustomRules = (config?.allow?.length ?? 0) > 0 || (config?.soft_deny?.length ?? 0) > 0 || (config?.environment?.length ?? 0) > 0;
  if (!hasCustomRules) {
    process.stdout.write(`No custom auto mode rules found.

` + `Add rules to your settings file under autoMode.{allow, soft_deny, environment}.
` + "Run `claude auto-mode defaults` to see the default rules for reference.\n");
    return;
  }
  const model = options.model ? parseUserSpecifiedModel(options.model) : isPoorModeActive() ? getSmallFastModel() : getMainLoopModel();
  const defaults = getDefaultExternalAutoModeRules();
  const classifierPrompt = buildDefaultExternalSystemPrompt();
  const userRulesSummary = formatRulesForCritique("allow", config?.allow ?? [], defaults.allow) + formatRulesForCritique("soft_deny", config?.soft_deny ?? [], defaults.soft_deny) + formatRulesForCritique("environment", config?.environment ?? [], defaults.environment);
  process.stdout.write(`Analyzing your auto mode rules\u2026

`);
  let response;
  try {
    response = await sideQuery({
      querySource: "auto_mode_critique",
      model,
      system: CRITIQUE_SYSTEM_PROMPT,
      skipSystemPromptPrefix: true,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Here is the full classifier system prompt that the auto mode classifier receives:

` + `<classifier_system_prompt>
` + classifierPrompt + `
</classifier_system_prompt>

` + `Here are the user's custom rules that REPLACE the corresponding default sections:

` + userRulesSummary + `
Please critique these custom rules.`
        }
      ]
    });
  } catch (error) {
    process.stderr.write("Failed to analyze rules: " + errorMessage(error) + `
`);
    process.exitCode = 1;
    return;
  }
  const textBlock = response.content.find((block) => block.type === "text");
  if (textBlock?.type === "text") {
    process.stdout.write(textBlock.text + `
`);
  } else {
    process.stdout.write(`No critique was generated. Please try again.
`);
  }
}
function formatRulesForCritique(section, userRules, defaultRules) {
  if (userRules.length === 0)
    return "";
  const customLines = userRules.map((r) => "- " + r).join(`
`);
  const defaultLines = defaultRules.map((r) => "- " + r).join(`
`);
  return "## " + section + ` (custom rules replacing defaults)
` + `Custom:
` + customLines + `

` + `Defaults being replaced:
` + defaultLines + `

`;
}
export {
  autoModeDefaultsHandler,
  autoModeCritiqueHandler,
  autoModeConfigHandler
};

//# debugId=61B47AE99AB825EB64756E2164756E21
//# sourceMappingURL=chunk-7gxbe2pz.js.map
