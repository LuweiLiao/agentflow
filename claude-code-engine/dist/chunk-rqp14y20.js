// @bun
import {
  ThemePicker,
  init_ThemePicker
} from "./chunk-z81mx75q.js";
import"./chunk-85672e5z.js";
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
import {
  getGlobalConfig,
  init_config1 as init_config,
  saveCurrentProjectConfig,
  saveGlobalConfig
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
import {
  Pane,
  ThemedBox_default,
  ThemedText,
  init_src,
  useTheme
} from "./chunk-93gg03n2.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
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
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/onboarding/launchOnboarding.tsx
function meta(s) {
  return s;
}
function parseSubcommand(args) {
  const trimmed = args.trim().toLowerCase();
  if (trimmed === "" || trimmed === "reset") {
    return { sub: "full" };
  }
  if (SUBCOMMANDS.has(trimmed)) {
    return { sub: trimmed };
  }
  return { sub: "full", unknownArg: trimmed };
}
function ThemeSubcommand({ onDone }) {
  const [, setTheme] = useTheme();
  return /* @__PURE__ */ jsx_runtime.jsx(Pane, {
    color: "permission",
    children: /* @__PURE__ */ jsx_runtime.jsx(ThemePicker, {
      onThemeSelect: (setting) => {
        setTheme(setting);
        logEvent("tengu_onboarding_step", { stepId: meta("theme") });
        onDone(`Theme set to ${setting}.`);
      },
      onCancel: () => onDone("Theme picker dismissed."),
      skipExitHandling: true
    })
  });
}
function StatusView({
  theme,
  hasCompletedOnboarding,
  lastOnboardingVersion
}) {
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    paddingLeft: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        bold: true,
        children: "Onboarding status"
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          "- Theme: ",
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            children: theme
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          "- Onboarding completed:",
          " ",
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: hasCompletedOnboarding ? "success" : "warning",
            children: hasCompletedOnboarding ? "yes" : "no"
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          "- Last onboarding version: ",
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            children: lastOnboardingVersion
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        dimColor: true,
        children: "Run /onboarding (no args) to re-run the full flow, or /onboarding theme | trust | model | mcp for a specific step."
      })
    ]
  });
}
var jsx_runtime, SUBCOMMANDS, callOnboarding = async (onDone, _context, args) => {
  const { sub, unknownArg } = parseSubcommand(args);
  logEvent("tengu_onboarding_step", { stepId: meta(`slash_${sub}`) });
  if (unknownArg !== undefined) {
    onDone(`Unknown /onboarding subcommand: \`${unknownArg}\`.
` + `Valid: full | theme | trust | model | mcp | status`, { display: "system" });
    return null;
  }
  if (sub === "theme") {
    return /* @__PURE__ */ jsx_runtime.jsx(ThemeSubcommand, {
      onDone: (msg) => onDone(msg)
    });
  }
  if (sub === "trust") {
    saveCurrentProjectConfig((current) => ({
      ...current,
      hasTrustDialogAccepted: false
    }));
    onDone("Workspace trust cleared for the current project. " + "The trust dialog will appear on the next `claude` launch.", { display: "system" });
    return null;
  }
  if (sub === "model") {
    onDone("Run `/model` to pick the AI model. " + "Onboarding does not own the model picker; this entry exists for " + "discoverability only.", { display: "system" });
    return null;
  }
  if (sub === "mcp") {
    onDone(`MCP server setup:
` + "  - `/mcp` \u2014 list configured MCP servers\n" + "  - `claude mcp add <name> <command>` \u2014 add a server (in your shell)\n" + "  - `claude mcp remove <name>` \u2014 remove a server\n" + "Servers also load from `.mcp.json` in the workspace and from " + "`~/.claude.json` globally.", { display: "system" });
    return null;
  }
  if (sub === "status") {
    const cfg = getGlobalConfig();
    return /* @__PURE__ */ jsx_runtime.jsx(StatusView, {
      theme: cfg.theme ?? "(unset)",
      hasCompletedOnboarding: cfg.hasCompletedOnboarding === true,
      lastOnboardingVersion: cfg.lastOnboardingVersion ?? "(unset)"
    });
  }
  saveGlobalConfig((current) => ({
    ...current,
    hasCompletedOnboarding: false
  }));
  onDone("Onboarding flag cleared. The full first-run setup " + "(theme, OAuth/API key, security notes, terminal-setup) " + "will run on the next `claude` launch.\n\n" + `For individual steps in this session, use:
` + `  /onboarding theme   \u2014 re-pick theme inline
` + `  /onboarding trust   \u2014 re-confirm workspace trust on next launch
` + `  /onboarding model   \u2014 open /model picker
` + `  /onboarding mcp     \u2014 show MCP setup hints
` + "  /onboarding status  \u2014 show current onboarding state", { display: "system" });
  return null;
};
var init_launchOnboarding = __esm(() => {
  init_src();
  init_analytics();
  init_ThemePicker();
  init_config();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
  SUBCOMMANDS = new Set(["full", "theme", "trust", "model", "mcp", "status"]);
});
init_launchOnboarding();

export {
  parseSubcommand,
  callOnboarding
};

//# debugId=C11EFC6BE2C3852564756E2164756E21
//# sourceMappingURL=chunk-rqp14y20.js.map
