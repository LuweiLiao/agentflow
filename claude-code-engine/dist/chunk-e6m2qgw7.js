// @bun
import {
  Select,
  init_CustomSelect
} from "./chunk-xzgt0njb.js";
import {
  init_config,
  saveCurrentProjectConfig
} from "./chunk-jyqypr4z.js";
import {
  Dialog,
  Link,
  ThemedBox_default,
  ThemedText,
  init_src
} from "./chunk-49x6szsr.js";
import {
  require_react
} from "./chunk-0k4kr3h5.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  init_analytics,
  logEvent
} from "./chunk-4hpfxga2.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/ClaudeMdExternalIncludesDialog.tsx
function ClaudeMdExternalIncludesDialog({
  onDone,
  isStandaloneDialog,
  externalIncludes
}) {
  import_react.default.useEffect(() => {
    logEvent("tengu_claude_md_includes_dialog_shown", {});
  }, []);
  const handleSelection = import_react.useCallback((value) => {
    if (value === "no") {
      logEvent("tengu_claude_md_external_includes_dialog_declined", {});
      saveCurrentProjectConfig((current) => ({
        ...current,
        hasClaudeMdExternalIncludesApproved: false,
        hasClaudeMdExternalIncludesWarningShown: true
      }));
    } else {
      logEvent("tengu_claude_md_external_includes_dialog_accepted", {});
      saveCurrentProjectConfig((current) => ({
        ...current,
        hasClaudeMdExternalIncludesApproved: true,
        hasClaudeMdExternalIncludesWarningShown: true
      }));
    }
    onDone();
  }, [onDone]);
  const handleEscape = import_react.useCallback(() => {
    handleSelection("no");
  }, [handleSelection]);
  return /* @__PURE__ */ jsx_runtime.jsxs(Dialog, {
    title: "Allow external CLAUDE.md file imports?",
    color: "warning",
    onCancel: handleEscape,
    hideBorder: !isStandaloneDialog,
    hideInputGuide: !isStandaloneDialog,
    children: [
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        children: "This project's CLAUDE.md imports files outside the current working directory. Never allow this for third-party repositories."
      }),
      externalIncludes && externalIncludes.length > 0 && /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: "External imports:"
          }),
          externalIncludes.map((include, i) => /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            dimColor: true,
            children: [
              "  ",
              include.path
            ]
          }, i))
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        dimColor: true,
        children: [
          "Important: Only use AgentFlow-Code with files you trust. Accessing untrusted files may pose security risks",
          " ",
          /* @__PURE__ */ jsx_runtime.jsx(Link, {
            url: "https://code.claude.com/docs/en/security"
          }),
          " "
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsx(Select, {
        options: [
          { label: "Yes, allow external imports", value: "yes" },
          { label: "No, disable external imports", value: "no" }
        ],
        onChange: (value) => handleSelection(value)
      })
    ]
  });
}
var import_react, jsx_runtime;
var init_ClaudeMdExternalIncludesDialog = __esm(() => {
  init_analytics();
  init_src();
  init_config();
  init_CustomSelect();
  import_react = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

export { ClaudeMdExternalIncludesDialog, init_ClaudeMdExternalIncludesDialog };

//# debugId=5722DFE98D79015C64756E2164756E21
//# sourceMappingURL=chunk-e6m2qgw7.js.map
