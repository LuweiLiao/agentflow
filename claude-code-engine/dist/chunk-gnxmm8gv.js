// @bun
import {
  getLastSessionLog,
  init_sessionStorage,
  init_teleport,
  teleportResumeCodeSession,
  validateGitState
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
import {
  fetchCodeSessionsFromSessionsAPI,
  init_api
} from "./chunk-aygjk70q.js";
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

//# debugId=06B2CB93BB7DBDBE64756E2164756E21
//# sourceMappingURL=chunk-gnxmm8gv.js.map
