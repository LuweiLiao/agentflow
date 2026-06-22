// @bun
import {
  init_useVoice,
  normalizeLanguageForSTT
} from "./chunk-rfnyw3ee.js";
import"./chunk-9ckpash5.js";
import {
  getShortcutDisplay,
  init_changeDetector,
  init_shortcutFormat,
  settingsChangeDetector
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
import {
  init_voiceModeEnabled,
  isVoiceAvailable
} from "./chunk-ekewkevz.js";
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
  getInitialSettings,
  init_config1 as init_config,
  init_settings1 as init_settings,
  saveGlobalConfig,
  updateSettingsForSource
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
import"./chunk-93gg03n2.js";
import"./chunk-x9xf2qa8.js";
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
  __require
} from "./chunk-hhsxm2yr.js";

// src/commands/voice/voice.ts
var LANG_HINT_MAX_SHOWS = 2, call = async (args) => {
  if (!isVoiceAvailable()) {
    return {
      type: "text",
      value: "Voice mode is not available."
    };
  }
  const currentSettings = getInitialSettings();
  const isCurrentlyEnabled = currentSettings.voiceEnabled === true;
  const providerArg = args?.trim().toLowerCase();
  if (isCurrentlyEnabled && providerArg === "doubao") {
    const result2 = updateSettingsForSource("userSettings", {
      voiceProvider: "doubao"
    });
    if (result2.error) {
      return {
        type: "text",
        value: "Failed to update settings. Check your settings file for syntax errors."
      };
    }
    settingsChangeDetector.notifyChange("userSettings");
    const key2 = getShortcutDisplay("voice:pushToTalk", "Chat", "Space");
    return {
      type: "text",
      value: `Voice mode switched to Doubao ASR. Hold ${key2} to record.`
    };
  }
  if (isCurrentlyEnabled && providerArg === "anthropic") {
    const result2 = updateSettingsForSource("userSettings", {
      voiceProvider: "anthropic"
    });
    if (result2.error) {
      return {
        type: "text",
        value: "Failed to update settings. Check your settings file for syntax errors."
      };
    }
    settingsChangeDetector.notifyChange("userSettings");
    const key2 = getShortcutDisplay("voice:pushToTalk", "Chat", "Space");
    return {
      type: "text",
      value: `Voice mode switched to Anthropic STT. Hold ${key2} to record.`
    };
  }
  if (isCurrentlyEnabled) {
    const result2 = updateSettingsForSource("userSettings", {
      voiceEnabled: false
    });
    if (result2.error) {
      return {
        type: "text",
        value: "Failed to update settings. Check your settings file for syntax errors."
      };
    }
    settingsChangeDetector.notifyChange("userSettings");
    logEvent("tengu_voice_toggled", { enabled: false });
    return {
      type: "text",
      value: "Voice mode disabled."
    };
  }
  const provider = providerArg === "doubao" ? "doubao" : "anthropic";
  const { isVoiceStreamAvailable } = await import("./chunk-zds6a8mg.js");
  const { checkRecordingAvailability } = await import("./chunk-r0gq0a1d.js");
  const recording = await checkRecordingAvailability();
  if (!recording.available) {
    return {
      type: "text",
      value: recording.reason ?? "Voice mode is not available in this environment."
    };
  }
  if (provider !== "doubao" && !isVoiceStreamAvailable()) {
    return {
      type: "text",
      value: "Voice mode requires a Claude.ai account. Please run /login to sign in."
    };
  }
  const { checkVoiceDependencies, requestMicrophonePermission } = await import("./chunk-r0gq0a1d.js");
  const deps = await checkVoiceDependencies();
  if (!deps.available) {
    const hint = deps.installCommand ? `
Install audio recording tools? Run: ${deps.installCommand}` : `
Install SoX manually for audio recording.`;
    return {
      type: "text",
      value: `No audio recording tool found.${hint}`
    };
  }
  if (!await requestMicrophonePermission()) {
    let guidance;
    if (process.platform === "win32") {
      guidance = "Settings \u2192 Privacy \u2192 Microphone";
    } else if (process.platform === "linux") {
      guidance = "your system's audio settings";
    } else {
      guidance = "System Settings \u2192 Privacy & Security \u2192 Microphone";
    }
    return {
      type: "text",
      value: `Microphone access is denied. To enable it, go to ${guidance}, then run /voice again.`
    };
  }
  const result = updateSettingsForSource("userSettings", {
    voiceEnabled: true,
    ...provider === "doubao" ? { voiceProvider: "doubao" } : {}
  });
  if (result.error) {
    return {
      type: "text",
      value: "Failed to update settings. Check your settings file for syntax errors."
    };
  }
  settingsChangeDetector.notifyChange("userSettings");
  logEvent("tengu_voice_toggled", { enabled: true });
  const key = getShortcutDisplay("voice:pushToTalk", "Chat", "Space");
  let langNote = "";
  const providerLabel = provider === "doubao" ? "Doubao ASR" : "Anthropic";
  if (provider !== "doubao") {
    const stt = normalizeLanguageForSTT(currentSettings.language);
    const cfg = getGlobalConfig();
    const langChanged = cfg.voiceLangHintLastLanguage !== stt.code;
    const priorCount = langChanged ? 0 : cfg.voiceLangHintShownCount ?? 0;
    const showHint = !stt.fellBackFrom && priorCount < LANG_HINT_MAX_SHOWS;
    if (stt.fellBackFrom) {
      langNote = ` Note: "${stt.fellBackFrom}" is not a supported dictation language; using English. Change it via /config.`;
    } else if (showHint) {
      langNote = ` Dictation language: ${stt.code} (/config to change).`;
    }
    if (langChanged || showHint) {
      saveGlobalConfig((prev) => ({
        ...prev,
        voiceLangHintShownCount: priorCount + (showHint ? 1 : 0),
        voiceLangHintLastLanguage: stt.code
      }));
    }
  }
  return {
    type: "text",
    value: `Voice mode enabled (${providerLabel}). Hold ${key} to record.${langNote}`
  };
};
var init_voice = __esm(() => {
  init_useVoice();
  init_shortcutFormat();
  init_analytics();
  init_config();
  init_changeDetector();
  init_settings();
  init_voiceModeEnabled();
});
init_voice();

export {
  call
};

//# debugId=3B2574D9E87056DF64756E2164756E21
//# sourceMappingURL=chunk-bgg14x7p.js.map
