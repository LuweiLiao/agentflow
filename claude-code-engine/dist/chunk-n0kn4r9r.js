// @bun
import {
  getGlobalConfig,
  init_config
} from "./chunk-jyqypr4z.js";
import {
  getSystemLocaleLanguage,
  init_intl
} from "./chunk-hn4w9pkj.js";
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/utils/language.ts
function getResolvedLanguage() {
  const pref = getGlobalConfig().preferredLanguage ?? "auto";
  if (pref === "en" || pref === "zh")
    return pref;
  const sysLang = getSystemLocaleLanguage();
  return sysLang === "zh" ? "zh" : "en";
}
function getLanguageDisplayName(lang) {
  return DISPLAY_NAMES[lang] ?? lang;
}
var DISPLAY_NAMES;
var init_language = __esm(() => {
  init_config();
  init_intl();
  DISPLAY_NAMES = {
    auto: "Auto (follow system)",
    en: "English",
    zh: "\u4E2D\u6587"
  };
});

export { getResolvedLanguage, getLanguageDisplayName, init_language };

//# debugId=116EAD1DBF7CC3DA64756E2164756E21
//# sourceMappingURL=chunk-n0kn4r9r.js.map
