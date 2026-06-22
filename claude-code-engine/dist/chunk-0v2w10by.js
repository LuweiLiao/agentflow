// @bun
import {
  ConfigurableShortcutHint,
  estimateSkillFrontmatterTokens,
  getCommandName,
  init_ConfigurableShortcutHint,
  init_commands1 as init_commands,
  init_loadSkillsDir
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
import {
  getSettingSourceName,
  init_constants,
  init_stringUtils,
  plural
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
import {
  formatTokens,
  init_format
} from "./chunk-d6c3tr39.js";
import"./chunk-hn4w9pkj.js";
import {
  Dialog,
  FuzzyPicker,
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react
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
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/skills/filterSkills.ts
function filterSkills(skills, query) {
  const trimmed = query.trim();
  if (trimmed === "") {
    return skills.slice();
  }
  const words = trimmed.toLowerCase().split(/\s+/);
  return skills.filter((skill) => {
    const haystack = `${skill.name} ${skill.description}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
var init_filterSkills = () => {};

// src/components/skills/SkillsMenu.tsx
function getSourceLabel(source) {
  if (source === "plugin")
    return "plugin";
  if (source === "mcp")
    return "mcp";
  return getSettingSourceName(source);
}
function SkillsMenu({ onExit, commands }) {
  const [searchQuery, setSearchQuery] = import_react.useState("");
  const skills = import_react.useMemo(() => {
    return commands.filter((cmd) => cmd.type === "prompt" && (cmd.loadedFrom === "skills" || cmd.loadedFrom === "commands_DEPRECATED" || cmd.loadedFrom === "plugin" || cmd.loadedFrom === "mcp"));
  }, [commands]);
  const filteredSkills = import_react.useMemo(() => {
    return filterSkills(skills.map((s) => ({
      ...s,
      name: getCommandName(s),
      description: s.description ?? ""
    })), searchQuery);
  }, [skills, searchQuery]);
  const skillsBySource = import_react.useMemo(() => {
    const groups = {
      policySettings: [],
      userSettings: [],
      projectSettings: [],
      localSettings: [],
      flagSettings: [],
      plugin: [],
      mcp: []
    };
    for (const skill of filteredSkills) {
      const source = skill.source;
      if (source in groups) {
        groups[source].push(skill);
      }
    }
    for (const group of Object.values(groups)) {
      group.sort((a, b) => getCommandName(a).localeCompare(getCommandName(b)));
    }
    return groups;
  }, [filteredSkills]);
  const handleCancel = () => {
    onExit("Skills dialog dismissed", { display: "system" });
  };
  if (skills.length === 0) {
    return /* @__PURE__ */ jsx_runtime.jsxs(Dialog, {
      title: "Skills",
      subtitle: "No skills found",
      onCancel: handleCancel,
      hideInputGuide: true,
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "Create skills in .claude/skills/ or ~/.claude/skills/"
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          italic: true,
          children: /* @__PURE__ */ jsx_runtime.jsx(ConfigurableShortcutHint, {
            action: "confirm:no",
            context: "Confirmation",
            fallback: "Esc",
            description: "close"
          })
        })
      ]
    });
  }
  const getScopeTag = (source) => {
    switch (source) {
      case "projectSettings":
      case "localSettings":
        return { label: "local", color: "yellow" };
      case "userSettings":
        return { label: "global", color: "cyan" };
      case "policySettings":
        return { label: "managed", color: "magenta" };
      default:
        return;
    }
  };
  const renderSkillItem = (skill, isFocused) => {
    const estimatedTokens = estimateSkillFrontmatterTokens(skill);
    const tokenDisplay = `~${formatTokens(estimatedTokens)}`;
    const pluginName = skill.source === "plugin" ? skill.pluginInfo?.pluginManifest.name : undefined;
    const scopeTag = getScopeTag(skill.source);
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          color: isFocused ? "suggestion" : undefined,
          children: getCommandName(skill)
        }),
        scopeTag && /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          color: scopeTag.color,
          children: [
            " [",
            scopeTag.label,
            "]"
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            pluginName ? ` \xB7 ${pluginName}` : "",
            " \xB7 ",
            getSourceLabel(skill.source),
            " \xB7 ",
            tokenDisplay,
            " tokens"
          ]
        })
      ]
    });
  };
  const orderedFilteredSkills = import_react.useMemo(() => {
    return ORDERED_SOURCES.flatMap((source) => skillsBySource[source]);
  }, [skillsBySource]);
  const subtitle = searchQuery.trim() === "" ? `${skills.length} ${plural(skills.length, "skill")}` : `${filteredSkills.length}/${skills.length} ${plural(skills.length, "skill")}`;
  return /* @__PURE__ */ jsx_runtime.jsx(FuzzyPicker, {
    title: "Skills",
    placeholder: "Type to filter skills\u2026",
    items: orderedFilteredSkills,
    getKey: (s) => `${s.name}-${s.source}`,
    visibleCount: 12,
    direction: "down",
    onQueryChange: setSearchQuery,
    onSelect: (skill) => {
      onExit(`/${getCommandName(skill)}`, { display: "user" });
    },
    onCancel: handleCancel,
    emptyMessage: (q) => q.trim() ? `No skills matching "${q.trim()}"` : "No skills found",
    matchLabel: subtitle,
    selectAction: "invoke skill",
    renderItem: (skill, isFocused) => renderSkillItem(skill, isFocused)
  });
}
var import_react, jsx_runtime, ORDERED_SOURCES;
var init_SkillsMenu = __esm(() => {
  init_commands();
  init_src();
  init_loadSkillsDir();
  init_format();
  init_constants();
  init_stringUtils();
  init_ConfigurableShortcutHint();
  init_src();
  init_filterSkills();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
  ORDERED_SOURCES = [
    "projectSettings",
    "localSettings",
    "userSettings",
    "flagSettings",
    "policySettings",
    "plugin",
    "mcp"
  ];
});

// src/commands/skills/skills.tsx
async function call(onDone, context) {
  return /* @__PURE__ */ jsx_runtime2.jsx(SkillsMenu, {
    onExit: onDone,
    commands: context.options.commands
  });
}
var jsx_runtime2;
var init_skills = __esm(() => {
  init_SkillsMenu();
  jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
});
init_skills();

export {
  call
};

//# debugId=C3F355BADA6EFD4664756E2164756E21
//# sourceMappingURL=chunk-0v2w10by.js.map
