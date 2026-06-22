// @bun
import {
  getBaseRenderOptions
} from "./chunk-7scmf370.js";
import {
  AppStateProvider,
  KeybindingSetup,
  Select,
  init_AppState,
  init_CustomSelect,
  init_KeybindingProviderSetup
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
  root_default
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
import {
  init_slowOperations,
  jsonStringify,
  writeFileSync_DEPRECATED
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
import {
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/InvalidConfigDialog.tsx
init_src();
init_KeybindingProviderSetup();
init_AppState();
init_slowOperations();
init_CustomSelect();
var jsx_runtime = __toESM(require_jsx_runtime(), 1);
function InvalidConfigDialog({
  filePath,
  errorDescription,
  onExit,
  onReset
}) {
  const handleSelect = (value) => {
    if (value === "exit") {
      onExit();
    } else {
      onReset();
    }
  };
  return /* @__PURE__ */ jsx_runtime.jsxs(Dialog, {
    title: "Configuration Error",
    color: "error",
    onCancel: onExit,
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        children: [
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              "The configuration file at ",
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                bold: true,
                children: filePath
              }),
              " contains invalid JSON."
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: errorDescription
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            children: "Choose an option:"
          }),
          /* @__PURE__ */ jsx_runtime.jsx(Select, {
            options: [
              { label: "Exit and fix manually", value: "exit" },
              { label: "Reset with default configuration", value: "reset" }
            ],
            onChange: handleSelect,
            onCancel: onExit
          })
        ]
      })
    ]
  });
}
var SAFE_ERROR_THEME_NAME = "dark";
async function showInvalidConfigDialog({ error }) {
  const renderOptions = {
    ...getBaseRenderOptions(false),
    theme: SAFE_ERROR_THEME_NAME
  };
  await new Promise(async (resolve) => {
    const { unmount } = await root_default(/* @__PURE__ */ jsx_runtime.jsx(AppStateProvider, {
      children: /* @__PURE__ */ jsx_runtime.jsx(KeybindingSetup, {
        children: /* @__PURE__ */ jsx_runtime.jsx(InvalidConfigDialog, {
          filePath: error.filePath,
          errorDescription: error.message,
          onExit: () => {
            unmount();
            resolve();
            process.exit(1);
          },
          onReset: () => {
            writeFileSync_DEPRECATED(error.filePath, jsonStringify(error.defaultConfig, null, 2), {
              flush: false,
              encoding: "utf8"
            });
            unmount();
            resolve();
            process.exit(0);
          }
        })
      })
    }), renderOptions);
  });
}
export {
  showInvalidConfigDialog
};

//# debugId=39F52A8C515F8FC464756E2164756E21
//# sourceMappingURL=chunk-d53gd72x.js.map
