// @bun
import {
  init_overlayContext,
  useRegisterOverlay
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
import {
  init_featureCheck,
  isSkillLearningEnabled
} from "./chunk-nde5ym6a.js";
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
import {
  Dialog,
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react,
  use_input_default
} from "./chunk-93gg03n2.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
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
import"./chunk-1tytvdt1.js";
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
  __esm,
  __require,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/skill-learning/skillPanel.tsx
async function getStatusText() {
  const { readObservations, loadInstincts, resolveProjectContext } = await import("./chunk-t7cncmez.js");
  const project = resolveProjectContext(process.cwd());
  const [observations, instincts] = await Promise.all([readObservations({ project }), loadInstincts({ project })]);
  return [
    `Skill Learning status for ${project.projectName} (${project.projectId})`,
    `Observations: ${observations.length}`,
    `Instincts: ${instincts.length}`,
    "",
    `Skill Learning: ${isSkillLearningEnabled() ? "enabled" : "disabled"}`
  ].join(`
`);
}
async function startSkillLearning() {
  const lines = [];
  if (!isSkillLearningEnabled()) {
    process.env.SKILL_LEARNING_ENABLED = "1";
    lines.push("Skill Learning: enabled (SKILL_LEARNING_ENABLED=1)");
  } else {
    lines.push("Skill Learning: already enabled");
  }
  try {
    const { initSkillLearning } = await import("./chunk-fqx4080x.js");
    initSkillLearning();
    lines.push("Runtime observer: initialized");
  } catch {
    lines.push("Runtime observer: init skipped (not available)");
  }
  return lines.join(`
`);
}
async function stopSkillLearning() {
  const lines = [];
  if (isSkillLearningEnabled()) {
    process.env.SKILL_LEARNING_ENABLED = "0";
    process.env.CLAUDE_SKILL_LEARNING_DISABLE = "1";
    lines.push("Skill Learning: disabled (SKILL_LEARNING_ENABLED=0)");
  } else {
    lines.push("Skill Learning: already disabled");
  }
  return lines.join(`
`);
}
function SkillPanel({ onDone }) {
  useRegisterOverlay("skill-panel");
  const [selectedIndex, setSelectedIndex] = import_react.useState(0);
  const actions = import_react.useMemo(() => [
    {
      label: "Status",
      description: "Show skill learning status for current project",
      run: getStatusText
    },
    {
      label: "Start",
      description: "Enable skill learning for this session",
      run: startSkillLearning
    },
    {
      label: "Stop",
      description: "Disable skill learning for this session",
      run: stopSkillLearning
    },
    {
      label: "About",
      description: "Detailed description of skill learning features",
      run: () => Promise.resolve(ABOUT_TEXT)
    }
  ], []);
  const selectCurrent = () => {
    const action = actions[selectedIndex];
    if (!action)
      return;
    action.run().then((result) => {
      onDone(result, { display: "system" });
    });
  };
  use_input_default((_input, key) => {
    if (key.upArrow) {
      setSelectedIndex((index) => Math.max(0, index - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((index) => Math.min(actions.length - 1, index + 1));
      return;
    }
    if (key.return) {
      selectCurrent();
    }
  });
  return /* @__PURE__ */ jsx_runtime.jsx(Dialog, {
    title: "Skill Learning",
    subtitle: `${actions.length} actions`,
    onCancel: () => onDone("Skill panel dismissed", { display: "system" }),
    color: "background",
    hideInputGuide: true,
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        actions.map((action, index) => /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
          flexDirection: "row",
          children: [
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: `${index === selectedIndex ? "\u203A" : " "} ${action.label}`.padEnd(ACTION_LABEL_COLUMN_WIDTH)
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor: true,
              children: action.description
            })
          ]
        }, action.label)),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: "\u2191/\u2193 select \xB7 Enter run \xB7 Esc close"
          })
        })
      ]
    })
  });
}
async function call(onDone, _context, args) {
  const trimmed = args?.trim() ?? "";
  if (trimmed === "start") {
    onDone(await startSkillLearning(), { display: "system" });
    return null;
  }
  if (trimmed === "stop") {
    onDone(await stopSkillLearning(), { display: "system" });
    return null;
  }
  if (trimmed === "about") {
    onDone(ABOUT_TEXT, { display: "system" });
    return null;
  }
  if (trimmed === "status") {
    onDone(await getStatusText(), { display: "system" });
    return null;
  }
  if (trimmed) {
    const { call: textCall } = await import("./chunk-72rcs311.js");
    const result = await textCall(trimmed, {});
    if (result && typeof result === "object" && "value" in result) {
      onDone(result.value, { display: "system" });
    }
    return null;
  }
  return /* @__PURE__ */ jsx_runtime.jsx(SkillPanel, {
    onDone
  });
}
var import_react, jsx_runtime, ACTION_LABEL_COLUMN_WIDTH = 28, ABOUT_TEXT;
var init_skillPanel = __esm(() => {
  init_src();
  init_src();
  init_overlayContext();
  init_featureCheck();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
  ABOUT_TEXT = `# Skill Learning (\u81EA\u52A8\u5B66\u4E60)

Skill Learning \u662F\u4E00\u4E2A\u95ED\u73AF\u5B66\u4E60\u7CFB\u7EDF\uFF0C\u901A\u8FC7\u89C2\u5BDF\u7528\u6237\u7684\u64CD\u4F5C\u6A21\u5F0F\u81EA\u52A8\u63D0\u53D6\u76F4\u89C9(instinct)\uFF0C
\u5E76\u5728\u8FBE\u5230\u9608\u503C\u540E\u751F\u6210\u53EF\u590D\u7528\u7684 skill \u6587\u4EF6\u3001agent \u548C command\u3002

## \u5DE5\u4F5C\u6D41\u7A0B
1. **Observe** \u2014 \u8BB0\u5F55\u6BCF\u8F6E\u5BF9\u8BDD\u4E2D\u7684\u5DE5\u5177\u8C03\u7528\u3001\u7528\u6237\u7EA0\u6B63\u3001\u9519\u8BEF\u89E3\u51B3\u6A21\u5F0F
2. **Analyze** \u2014 \u4F7F\u7528\u542F\u53D1\u5F0F\u6216 LLM \u540E\u7AEF\u5206\u6790\u89C2\u5BDF\u6570\u636E\uFF0C\u63D0\u53D6 instinct candidate
3. **Evolve** \u2014 \u5C06\u9AD8\u7F6E\u4FE1\u5EA6 instinct \u805A\u7C7B\uFF0C\u751F\u6210 skill/agent/command \u5019\u9009
4. **Lifecycle** \u2014 \u5BF9\u751F\u6210\u7684 skill \u8FDB\u884C\u53BB\u91CD\u3001\u7248\u672C\u6BD4\u8F83\u3001\u5F52\u6863\u6216\u66FF\u6362

## \u5B50\u547D\u4EE4
- /skill-learning status       \u2014 \u67E5\u770B\u5F53\u524D\u9879\u76EE\u7684\u89C2\u5BDF\u548C\u76F4\u89C9\u6570\u91CF
- /skill-learning ingest       \u2014 \u4ECE transcript \u5BFC\u5165\u89C2\u5BDF\u6570\u636E
- /skill-learning evolve       \u2014 \u751F\u6210 skill \u5019\u9009 (--generate \u5199\u5165\u78C1\u76D8)
- /skill-learning export       \u2014 \u5BFC\u51FA instinct \u4E3A JSON
- /skill-learning import       \u2014 \u5BFC\u5165 instinct JSON
- /skill-learning prune        \u2014 \u6E05\u7406\u8FC7\u671F\u7684 pending instinct
- /skill-learning promote      \u2014 \u5C06 instinct/gap \u63D0\u5347\u4E3A\u5168\u5C40\u8303\u56F4
- /skill-learning projects     \u2014 \u5217\u51FA\u6240\u6709\u5DF2\u77E5\u7684\u9879\u76EE\u8303\u56F4

## \u542F\u7528\u65B9\u5F0F
- SKILL_LEARNING_ENABLED=1 \u6216 FEATURE_SKILL_LEARNING=1
- \u72B6\u6001: ${isSkillLearningEnabled() ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"}
`;
});
init_skillPanel();

export {
  call
};

//# debugId=BA3B77B3DF50048B64756E2164756E21
//# sourceMappingURL=chunk-0yyjqpeh.js.map
