// @bun
import {
  init_ListItem
} from "./chunk-aybek5zs.js";
import {
  init_Dialog
} from "./chunk-xcf4b81a.js";
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
import {
  init_useKeybinding
} from "./chunk-qnqdg4g2.js";
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
  ListItem,
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react,
  useKeybindings
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
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/assistant/AssistantSessionChooser.tsx
init_src();
init_Dialog();
init_ListItem();
init_overlayContext();
init_useKeybinding();
var import_react = __toESM(require_react(), 1);
var jsx_runtime = __toESM(require_jsx_runtime(), 1);
function AssistantSessionChooser({ sessions, onSelect, onCancel }) {
  useRegisterOverlay("assistant-session-chooser");
  const [focusIndex, setFocusIndex] = import_react.useState(0);
  useKeybindings({
    "select:next": () => setFocusIndex((i) => (i + 1) % sessions.length),
    "select:previous": () => setFocusIndex((i) => (i - 1 + sessions.length) % sessions.length),
    "select:accept": () => onSelect(sessions[focusIndex].id)
  }, { context: "Select" });
  return /* @__PURE__ */ jsx_runtime.jsx(Dialog, {
    title: "Select Assistant Session",
    onCancel,
    hideInputGuide: true,
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "Multiple sessions found. Select one to attach:"
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          flexDirection: "column",
          children: sessions.map((s, i) => /* @__PURE__ */ jsx_runtime.jsx(ListItem, {
            isFocused: focusIndex === i,
            children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
              children: [
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  children: s.title || s.id.slice(0, 20)
                }),
                /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                  dimColor: true,
                  children: [
                    " [",
                    s.status,
                    "]"
                  ]
                })
              ]
            })
          }, s.id))
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "\u2191\u2193 navigate \xB7 Enter select \xB7 Esc cancel"
        })
      ]
    })
  });
}
export {
  AssistantSessionChooser
};

//# debugId=B9FFD517831D223964756E2164756E21
//# sourceMappingURL=chunk-8qjjjn1k.js.map
