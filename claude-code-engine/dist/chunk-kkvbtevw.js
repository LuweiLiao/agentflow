// @bun
import {
  init_setup,
  isChromeExtensionInstalled
} from "./chunk-wa5eccv2.js";
import"./chunk-rmn1bnbd.js";
import"./chunk-28jd8qjx.js";
import"./chunk-djt39ze3.js";
import"./chunk-eemmwhkd.js";
import"./chunk-vwenx8ke.js";
import"./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import {
  init_config,
  saveGlobalConfig
} from "./chunk-jyqypr4z.js";
import"./chunk-m18nccbn.js";
import"./chunk-e2jvken3.js";
import"./chunk-5zhv4jyp.js";
import"./chunk-jwyj6t5m.js";
import"./chunk-87f9np2y.js";
import"./chunk-zq3spn7d.js";
import"./chunk-7fbjbgr5.js";
import"./chunk-x5wzz44g.js";
import"./chunk-r87btn9p.js";
import"./chunk-v4ypszbb.js";
import"./chunk-dw66fdss.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-fejeqe61.js";
import {
  Dialog,
  Link,
  Newline,
  ThemedBox_default,
  ThemedText,
  init_src,
  use_input_default
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
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-3nk9q8dr.js";
import"./chunk-bt5n9f4r.js";
import"./chunk-qkkkfh9a.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-w7s0zvjq.js";
import"./chunk-w95hkggk.js";
import"./chunk-kc49dhz0.js";
import"./chunk-k51zdj4e.js";
import"./chunk-mtgfbnth.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import"./chunk-pyv3zrjt.js";
import"./chunk-kb3758f7.js";
import"./chunk-232p95fy.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/ClaudeInChromeOnboarding.tsx
init_analytics();
init_src();
init_setup();
init_config();
var import_react = __toESM(require_react(), 1);
var jsx_runtime = __toESM(require_jsx_runtime(), 1);
var CHROME_EXTENSION_URL = "https://claude.ai/chrome";
var CHROME_PERMISSIONS_URL = "https://clau.de/chrome/permissions";
function ClaudeInChromeOnboarding({ onDone }) {
  const [isExtensionInstalled, setIsExtensionInstalled] = import_react.default.useState(false);
  import_react.default.useEffect(() => {
    logEvent("tengu_claude_in_chrome_onboarding_shown", {});
    isChromeExtensionInstalled().then(setIsExtensionInstalled);
    saveGlobalConfig((current) => {
      return { ...current, hasCompletedClaudeInChromeOnboarding: true };
    });
  }, []);
  use_input_default((_input, key) => {
    if (key.return) {
      onDone();
    }
  });
  return /* @__PURE__ */ jsx_runtime.jsx(Dialog, {
    title: "Claude in Chrome (Beta)",
    onCancel: onDone,
    color: "chromeYellow",
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Claude in Chrome works with the Chrome extension to let you control your browser directly from AgentFlow-Code. You can navigate websites, fill forms, capture screenshots, record GIFs, and debug with console logs and network requests.",
            !isExtensionInstalled && /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
              children: [
                /* @__PURE__ */ jsx_runtime.jsx(Newline, {}),
                /* @__PURE__ */ jsx_runtime.jsx(Newline, {}),
                "Requires the Chrome extension. Get started at ",
                /* @__PURE__ */ jsx_runtime.jsx(Link, {
                  url: CHROME_EXTENSION_URL
                })
              ]
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Site-level permissions are inherited from the Chrome extension. Manage permissions in the Chrome extension settings to control which sites Claude can browse, click, and type on",
            isExtensionInstalled && /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
              children: [
                " ",
                "(",
                /* @__PURE__ */ jsx_runtime.jsx(Link, {
                  url: CHROME_PERMISSIONS_URL
                }),
                ")"
              ]
            }),
            "."
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "For more info, use",
            " ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              bold: true,
              color: "chromeYellow",
              children: "/chrome"
            }),
            " ",
            "or visit ",
            /* @__PURE__ */ jsx_runtime.jsx(Link, {
              url: "https://code.claude.com/docs/en/chrome"
            })
          ]
        })
      ]
    })
  });
}
export {
  ClaudeInChromeOnboarding
};

//# debugId=D2B83A1E50FE106964756E2164756E21
//# sourceMappingURL=chunk-kkvbtevw.js.map
