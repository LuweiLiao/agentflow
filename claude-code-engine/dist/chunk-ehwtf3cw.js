// @bun
import {
  init_featureCheck,
  init_overlayContext,
  isSkillSearchEnabled,
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

// src/commands/skill-search/skillSearchPanel.tsx
function getStatusText() {
  return [
    "Skill Search (\u81EA\u52A8\u6280\u80FD\u5339\u914D)",
    `Status: ${isSkillSearchEnabled() ? "enabled" : "disabled"}`,
    "",
    "When enabled, relevant skills are automatically matched and",
    "injected into conversation context each turn."
  ].join(`
`);
}
async function startSkillSearch() {
  if (isSkillSearchEnabled() && process.env.SKILL_SEARCH_ENABLED !== "0") {
    return "Skill Search: already enabled";
  }
  process.env.SKILL_SEARCH_ENABLED = "1";
  const lines = ["Skill Search: enabled (SKILL_SEARCH_ENABLED=1)"];
  try {
    const { clearSkillIndexCache } = await import("./chunk-k2ayjwj4.js");
    clearSkillIndexCache();
    lines.push("Skill index cache: cleared (will rebuild on next search)");
  } catch {
    lines.push("Skill index cache: clear skipped");
  }
  return lines.join(`
`);
}
async function stopSkillSearch() {
  if (!isSkillSearchEnabled()) {
    return "Skill Search: already disabled";
  }
  process.env.SKILL_SEARCH_ENABLED = "0";
  return "Skill Search: disabled (SKILL_SEARCH_ENABLED=0)";
}
function SkillSearchPanel({ onDone }) {
  useRegisterOverlay("skill-search-panel");
  const [selectedIndex, setSelectedIndex] = import_react.useState(0);
  const actions = import_react.useMemo(() => [
    {
      label: "Status",
      description: "Show whether automatic skill matching is active",
      run: () => Promise.resolve(getStatusText())
    },
    {
      label: "Start",
      description: "Enable automatic skill matching for this session",
      run: startSkillSearch
    },
    {
      label: "Stop",
      description: "Disable automatic skill matching for this session",
      run: stopSkillSearch
    },
    {
      label: "About",
      description: "How automatic skill matching works",
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
    title: "Skill Search",
    subtitle: `${actions.length} actions`,
    onCancel: () => onDone("Skill search panel dismissed", { display: "system" }),
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
    onDone(await startSkillSearch(), { display: "system" });
    return null;
  }
  if (trimmed === "stop") {
    onDone(await stopSkillSearch(), { display: "system" });
    return null;
  }
  if (trimmed === "about") {
    onDone(ABOUT_TEXT, { display: "system" });
    return null;
  }
  if (trimmed === "status") {
    onDone(getStatusText(), { display: "system" });
    return null;
  }
  return /* @__PURE__ */ jsx_runtime.jsx(SkillSearchPanel, {
    onDone
  });
}
var import_react, jsx_runtime, ACTION_LABEL_COLUMN_WIDTH = 28, ABOUT_TEXT;
var init_skillSearchPanel = __esm(() => {
  init_src();
  init_src();
  init_overlayContext();
  init_featureCheck();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
  ABOUT_TEXT = `# Skill Search (\u81EA\u52A8\u6280\u80FD\u5339\u914D)

Skill Search \u63A7\u5236\u5BF9\u8BDD\u4E2D\u7684\u81EA\u52A8\u6280\u80FD\u5339\u914D\u529F\u80FD\u3002

\u542F\u7528\u540E\uFF0CClaude Code \u4F1A\u5728\u6BCF\u8F6E\u5BF9\u8BDD\u4E2D\u81EA\u52A8\u641C\u7D22\u5E76\u52A0\u8F7D\u4E0E\u5F53\u524D\u4EFB\u52A1\u6700\u76F8\u5173\u7684 skill \u6587\u4EF6\uFF0C
\u65E0\u9700\u624B\u52A8\u6307\u5B9A\u3002\u641C\u7D22\u57FA\u4E8E TF-IDF \u5411\u91CF\u4F59\u5F26\u76F8\u4F3C\u5EA6\uFF0C\u652F\u6301\u82F1\u6587\u8BCD\u5E72\u5316\u548C CJK bi-gram \u5206\u8BCD\u3002

## \u5DE5\u4F5C\u539F\u7406
1. \u5BF9\u8BDD\u5F00\u59CB\u65F6\uFF0C\u81EA\u52A8\u7D22\u5F15 .claude/skills/ \u548C ~/.claude/skills/ \u4E0B\u7684 Markdown \u6587\u4EF6
2. \u6BCF\u8F6E\u5BF9\u8BDD\u6839\u636E\u4E0A\u4E0B\u6587\u81EA\u52A8\u5339\u914D\u6700\u76F8\u5173\u7684 skill
3. \u5339\u914D\u5230\u7684 skill \u5185\u5BB9\u4F1A\u4F5C\u4E3A\u4E0A\u4E0B\u6587\u6CE8\u5165\uFF0C\u6307\u5BFC Claude Code \u7684\u884C\u4E3A

## \u63A7\u5236\u65B9\u5F0F
- /skill-search start  \u2014 \u542F\u7528\u81EA\u52A8\u5339\u914D
- /skill-search stop   \u2014 \u7981\u7528\u81EA\u52A8\u5339\u914D
- /skill-search status \u2014 \u67E5\u770B\u5F53\u524D\u72B6\u6001

\u5F53\u524D\u72B6\u6001: ${isSkillSearchEnabled() ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"}
`;
});
init_skillSearchPanel();

export {
  call
};

//# debugId=8266659BD5E5EA4F64756E2164756E21
//# sourceMappingURL=chunk-ehwtf3cw.js.map
