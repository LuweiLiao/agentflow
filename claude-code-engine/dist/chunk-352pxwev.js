// @bun
import {
  getLanguageDisplayName,
  getResolvedLanguage,
  init_language
} from "./chunk-n0kn4r9r.js";
import {
  getGlobalConfig,
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
import"./chunk-fejeqe61.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-4hpfxga2.js";
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
  __esm
} from "./chunk-hhsxm2yr.js";

// src/commands/lang/lang.ts
async function call(onDone, _context, args) {
  const arg = args.trim().toLowerCase();
  if (!arg) {
    const pref = getGlobalConfig().preferredLanguage ?? "auto";
    const resolved2 = getResolvedLanguage();
    const suffix2 = pref === "auto" ? ` \u2192 ${getLanguageDisplayName(resolved2)}` : "";
    onDone(`Language: ${getLanguageDisplayName(pref)}${suffix2}`, {
      display: "system"
    });
    return null;
  }
  if (!VALID_LANGS.includes(arg)) {
    onDone(`Invalid language "${arg}". Use: en, zh, or auto`, {
      display: "system"
    });
    return null;
  }
  const lang = arg;
  saveGlobalConfig((current) => ({ ...current, preferredLanguage: lang }));
  const resolved = getResolvedLanguage();
  const suffix = lang === "auto" ? ` \u2192 ${getLanguageDisplayName(resolved)}` : "";
  onDone(`Language set to ${getLanguageDisplayName(lang)}${suffix}`, {
    display: "system"
  });
  return null;
}
var VALID_LANGS;
var init_lang = __esm(() => {
  init_config();
  init_language();
  VALID_LANGS = ["en", "zh", "auto"];
});
init_lang();

export {
  call
};

//# debugId=A568FEF4D986246764756E2164756E21
//# sourceMappingURL=chunk-352pxwev.js.map
