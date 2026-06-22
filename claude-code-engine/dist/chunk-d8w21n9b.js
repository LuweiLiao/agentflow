// @bun
import {
  getLastSessionLog,
  init_sessionStorage,
  init_teleport,
  teleportResumeCodeSession,
  validateGitState
} from "./chunk-xzgt0njb.js";
import"./chunk-vzhwvpbr.js";
import"./chunk-861tjjzp.js";
import"./chunk-z2ajd3fw.js";
import"./chunk-28jd8qjx.js";
import"./chunk-djt39ze3.js";
import"./chunk-9a9g5hbj.js";
import"./chunk-ptxteaeh.js";
import"./chunk-hvh0cdgd.js";
import"./chunk-wnhdazsj.js";
import"./chunk-rgyzsbs3.js";
import"./chunk-qn6me9n1.js";
import"./chunk-xef7acwt.js";
import"./chunk-5enwkkas.js";
import"./chunk-jkzgg117.js";
import"./chunk-9hn8e6h1.js";
import"./chunk-2fww5648.js";
import"./chunk-e81mm4jp.js";
import"./chunk-754gszm4.js";
import"./chunk-eemmwhkd.js";
import"./chunk-bcywwfqv.js";
import"./chunk-4k180xch.js";
import"./chunk-prv12vph.js";
import"./chunk-24kv69g3.js";
import"./chunk-meyb0stq.js";
import"./chunk-rknftgwg.js";
import"./chunk-4spgkgr3.js";
import"./chunk-bvcfzg7t.js";
import"./chunk-c79fzdwz.js";
import"./chunk-hqxp6b72.js";
import"./chunk-a2cbjpab.js";
import"./chunk-qbsm2t49.js";
import"./chunk-8zz4z1q3.js";
import"./chunk-e4dsy4g1.js";
import"./chunk-326zehp8.js";
import"./chunk-kc67kt75.js";
import"./chunk-40t1d75v.js";
import"./chunk-60fkafk2.js";
import"./chunk-kvjvqgcx.js";
import"./chunk-srbv7hh4.js";
import"./chunk-093ej2sf.js";
import"./chunk-7tfdhkpy.js";
import"./chunk-snchk5qv.js";
import"./chunk-h2edgmqn.js";
import"./chunk-d1ka4b7m.js";
import"./chunk-tavc33hf.js";
import"./chunk-80p148mw.js";
import"./chunk-49v9e09z.js";
import"./chunk-ayjng5py.js";
import"./chunk-m3c1nydt.js";
import"./chunk-nde5ym6a.js";
import"./chunk-0hvg7s1m.js";
import"./chunk-hdhvk68c.js";
import"./chunk-6tebjnq9.js";
import"./chunk-935nrvdb.js";
import"./chunk-k2hff9tm.js";
import"./chunk-t867bdcq.js";
import"./chunk-dypm8ssd.js";
import"./chunk-459fm40c.js";
import"./chunk-1r8z8ez7.js";
import"./chunk-w5hnghah.js";
import"./chunk-ywnfc8g5.js";
import"./chunk-s76nvx50.js";
import"./chunk-y5f62n0j.js";
import"./chunk-k92qk5av.js";
import"./chunk-vwenx8ke.js";
import"./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import"./chunk-28rzgcvw.js";
import {
  fetchCodeSessionsFromSessionsAPI,
  init_api
} from "./chunk-g5vjgacw.js";
import"./chunk-eavq5vsk.js";
import"./chunk-bgan4cpf.js";
import"./chunk-35jsjk7z.js";
import"./chunk-e45319yt.js";
import"./chunk-jyqypr4z.js";
import"./chunk-m18nccbn.js";
import"./chunk-e2jvken3.js";
import"./chunk-5zhv4jyp.js";
import"./chunk-jwyj6t5m.js";
import"./chunk-87f9np2y.js";
import"./chunk-zq3spn7d.js";
import"./chunk-jmv7k0jn.js";
import"./chunk-7fbjbgr5.js";
import"./chunk-x5wzz44g.js";
import"./chunk-r87btn9p.js";
import"./chunk-v4ypszbb.js";
import"./chunk-dw66fdss.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-qmk4ebrf.js";
import"./chunk-e3abfxpy.js";
import"./chunk-q44zc68f.js";
import"./chunk-fejeqe61.js";
import"./chunk-bj6zyntv.js";
import"./chunk-49x6szsr.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-0k4kr3h5.js";
import"./chunk-x9xf2qa8.js";
import {
  init_analytics,
  logEvent
} from "./chunk-4hpfxga2.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import"./chunk-rm37ayrm.js";
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

// src/commands/teleport/launchTeleport.ts
function meta(s) {
  return s;
}
function formatSessionsPicker(sessions) {
  const rows = sessions.slice(0, PICKER_PAGE_CAP).map((s, i) => {
    const idx = String(i + 1).padStart(2);
    const title = s.title.slice(0, 50).padEnd(50);
    const status = s.status.padEnd(14);
    const created = s.created_at.slice(0, 10);
    return `  ${idx}. ${title}  ${status}  ${created}  id=${s.id}`;
  });
  return [
    "## Available sessions (most recent first)",
    "",
    ...rows,
    "",
    "Run `/teleport <session-id>` to resume a session."
  ].join(`
`);
}
var SESSION_ID_MIN_LENGTH = 8, PICKER_PAGE_CAP = 20, callTeleport = async (onDone, context, args) => {
  const rawArgs = args.trim();
  const isPrintMode = rawArgs === "--print" || rawArgs.startsWith("--print ");
  const sessionId = isPrintMode ? rawArgs.replace(/^--print\s*/, "").trim() : rawArgs;
  logEvent("tengu_teleport_started", {
    has_session_id: meta(sessionId ? "true" : "false")
  });
  if (!sessionId) {
    logEvent("tengu_teleport_source_decision", {
      source: meta("sessions_api")
    });
    let sessions;
    try {
      const raw = await fetchCodeSessionsFromSessionsAPI();
      sessions = raw.map((s) => ({
        id: s.id,
        title: s.title ?? "Untitled",
        status: s.status ?? "unknown",
        created_at: s.created_at ?? ""
      }));
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      if (/forbidden|401|403/i.test(msg)) {
        logEvent("tengu_teleport_events_fetch_forbidden", {
          error: meta(msg.slice(0, 200))
        });
        onDone("Teleport: permission denied fetching sessions. Check your OAuth token (`claude auth status`).", { display: "system" });
        return null;
      }
      if (/not found|404/i.test(msg)) {
        logEvent("tengu_teleport_events_fetch_not_found", {
          error: meta(msg.slice(0, 200))
        });
        onDone("Teleport: sessions endpoint returned 404. The Sessions API may not be available for your account.", { display: "system" });
        return null;
      }
      if (/token|unauthorized/i.test(msg)) {
        logEvent("tengu_teleport_error_bad_token", {
          error: meta(msg.slice(0, 200))
        });
        onDone(`Teleport: authentication error \u2014 ${msg}. Try \`claude auth login\`.`, { display: "system" });
        return null;
      }
      logEvent("tengu_teleport_events_fetch_fail", {
        error: meta(msg.slice(0, 200))
      });
      onDone(`Teleport: failed to fetch sessions \u2014 ${msg}.
Usage: /teleport SESSION_ID`, { display: "system" });
      return null;
    }
    if (sessions.length === 0) {
      logEvent("tengu_teleport_null", {});
      onDone(`No active sessions found on claude.ai/code.
Start a new session at https://claude.ai/code`, { display: "system" });
      return null;
    }
    if (sessions.length >= PICKER_PAGE_CAP) {
      logEvent("tengu_teleport_page_cap", {
        count: meta(String(sessions.length))
      });
    }
    const pickerText = formatSessionsPicker(sessions);
    if (isPrintMode) {
      onDone(pickerText, { display: "system" });
      return null;
    }
    onDone(pickerText, { display: "system" });
    return null;
  }
  if (sessionId.length < SESSION_ID_MIN_LENGTH || !/^[0-9a-f-]{8,}$/i.test(sessionId)) {
    logEvent("tengu_teleport_error_bad_status", {
      error: meta(`invalid_session_id: ${sessionId.slice(0, 40)}`)
    });
    onDone(`Invalid session id "${sessionId}". Expected a UUID-like string (e.g. 12345678-abcd-...).`, { display: "system" });
    return null;
  }
  logEvent("tengu_teleport_source_decision", { source: meta("explicit_id") });
  const steps = [];
  const recordStep = (step) => {
    steps.push(step);
  };
  recordStep("validate");
  try {
    await validateGitState();
  } catch (gErr) {
    const msg = gErr instanceof Error ? gErr.message : String(gErr);
    logEvent("tengu_teleport_errors_detected", {
      error: meta(msg.slice(0, 200))
    });
    onDone(`Cannot teleport: ${msg}`, { display: "system" });
    return null;
  }
  recordStep("resume");
  try {
    let lastProgress = "";
    await teleportResumeCodeSession(sessionId, (stage) => {
      lastProgress = String(stage);
    });
    logEvent("tengu_teleport_resume_session", {
      stage: meta(lastProgress)
    });
    recordStep("ready");
    if (!context.resume) {
      logEvent("tengu_teleport_null", {});
      if (isPrintMode) {
        onDone(`Session ${sessionId} fetched successfully.`, {
          display: "system"
        });
        return null;
      }
      onDone(`Teleport resume succeeded for ${sessionId}, but the REPL did not provide a resume callback.`, { display: "system" });
      return null;
    }
    recordStep("fetch");
    const log = await getLastSessionLog(sessionId);
    if (!log) {
      logEvent("tengu_teleport_errors_detected", {
        error: meta("log_not_found_after_resume")
      });
      onDone(`Teleport fetched session ${sessionId} but the local log was not found. Try /resume ${sessionId} manually.`, { display: "system" });
      return null;
    }
    logEvent("tengu_teleport_errors_resolved", {});
    await context.resume(sessionId, log, "slash_command_session_id");
    logEvent("tengu_teleport_first_message_success", {});
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    let evt = "tengu_teleport_failed";
    if (/not found/i.test(msg)) {
      evt = "tengu_teleport_error_session_not_found_";
    } else if (/repo.*mismatch/i.test(msg)) {
      evt = "tengu_teleport_error_repo_mismatch_sessions_api";
    } else if (/not in.*git|git.*dir/i.test(msg)) {
      evt = "tengu_teleport_error_repo_not_in_git_dir_sessions_api";
    } else if (/cancelled|aborted/i.test(msg)) {
      evt = "tengu_teleport_cancelled";
    } else if (/token|unauthorized|401/i.test(msg)) {
      evt = "tengu_teleport_error_bad_token";
    } else if (/status|4\d\d|5\d\d/i.test(msg)) {
      evt = "tengu_teleport_error_bad_status";
    }
    logEvent(evt, { error: meta(msg.slice(0, 200)) });
    logEvent("tengu_teleport_first_message_error", {
      error: meta(msg.slice(0, 200))
    });
    onDone(`Teleport failed: ${msg}`, { display: "system" });
    return null;
  }
};
var init_launchTeleport = __esm(() => {
  init_analytics();
  init_sessionStorage();
  init_teleport();
  init_api();
});
init_launchTeleport();

export {
  callTeleport
};

//# debugId=B5E71F5493070EDC64756E2164756E21
//# sourceMappingURL=chunk-d8w21n9b.js.map
