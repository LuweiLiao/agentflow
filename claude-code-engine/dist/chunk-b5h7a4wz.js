// @bun
import {
  getLanguageDisplayName,
  getResolvedLanguage,
  init_language
} from "./chunk-h4kwt41j.js";
import {
  getGlobalConfig,
  init_config1 as init_config,
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
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-326zehp8.js";
import"./chunk-40t1d75v.js";
import"./chunk-e3abfxpy.js";
import"./chunk-fejeqe61.js";
import"./chunk-d6c3tr39.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-93gg03n2.js";
import"./chunk-x9xf2qa8.js";
import"./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
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

//# debugId=78871E162A08695E64756E2164756E21
//# sourceMappingURL=chunk-b5h7a4wz.js.map
