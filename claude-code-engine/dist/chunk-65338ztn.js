// @bun
import {
  PermissionDialog,
  init_PermissionDialog
} from "./chunk-yf6tq72j.js";
import {
  MAX_GOAL_TURNS,
  Select,
  clearGoal,
  completeGoal,
  continueGoalFromMaxTurns,
  formatGoalElapsed,
  formatGoalStatusLabel,
  getGoal,
  incrementGoalTurns,
  init_CustomSelect,
  init_goalState,
  init_goalStorage,
  init_messageQueueManager,
  pauseGoal,
  persistCurrentGoal,
  persistGoalClear,
  removeByFilter,
  resumeGoal,
  setGoal
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
  ThemedBox_default,
  ThemedText,
  init_src
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
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/commands/goal/GoalReplaceConfirmDialog.tsx
function GoalReplaceConfirmDialog({ currentGoal, newObjective, onConfirm, onCancel }) {
  function handleResponse(value) {
    if (value === "yes")
      onConfirm();
    else
      onCancel();
  }
  const tokensDisplay = currentGoal.tokenBudget !== null ? `${currentGoal.tokensUsed} / ${currentGoal.tokenBudget}` : `${currentGoal.tokensUsed}`;
  return /* @__PURE__ */ jsx_runtime.jsx(PermissionDialog, {
    color: "warning",
    title: "Replace active goal?",
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      marginTop: 1,
      paddingX: 1,
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "A goal is already in progress. Replacing it will reset all progress and counters."
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
          marginTop: 1,
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor: true,
              children: "Current goal:"
            }),
            /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              children: [
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  dimColor: true,
                  children: "\xB7 Objective: "
                }),
                currentGoal.objective
              ]
            }),
            /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              children: [
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  dimColor: true,
                  children: "\xB7 Status: "
                }),
                formatGoalStatusLabel(currentGoal.status)
              ]
            }),
            /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              children: [
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  dimColor: true,
                  children: "\xB7 Time: "
                }),
                formatGoalElapsed(currentGoal)
              ]
            }),
            /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              children: [
                /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                  dimColor: true,
                  children: "\xB7 Tokens: "
                }),
                tokensDisplay
              ]
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
          marginTop: 1,
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor: true,
              children: "New objective:"
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: newObjective
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginTop: 1,
          children: /* @__PURE__ */ jsx_runtime.jsx(Select, {
            options: [
              { label: "Yes, replace the goal", value: "yes" },
              { label: "No, keep the current goal", value: "no" }
            ],
            onChange: handleResponse,
            onCancel
          })
        })
      ]
    })
  });
}
var jsx_runtime;
var init_GoalReplaceConfirmDialog = __esm(() => {
  init_src();
  init_CustomSelect();
  init_PermissionDialog();
  init_goalState();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/commands/goal/goal.tsx
function truncateForDisplay(objective) {
  const firstLine = objective.split(`
`)[0] ?? objective;
  if (firstLine.length <= MAX_DISPLAY_CHARS)
    return firstLine;
  return firstLine.slice(0, MAX_DISPLAY_CHARS) + "\u2026";
}
function drainGoalContinuationQueue() {
  removeByFilter((cmd) => cmd.origin === "goal-continuation" || cmd.origin === "goal-budget-limit");
}
function formatGoalStatus() {
  const goal = getGoal();
  if (!goal) {
    return "No active goal. Set one with `/goal <objective>`.";
  }
  const tokens = goal.tokenBudget !== null ? `${goal.tokensUsed} / ${goal.tokenBudget}` : `${goal.tokensUsed}`;
  const lines = [
    `Goal: ${goal.objective}`,
    `Status: ${formatGoalStatusLabel(goal.status)}`,
    `Time: ${formatGoalElapsed(goal)}`,
    `Tokens: ${tokens}`,
    `Continuation turns: ${goal.turnsExecuted}`
  ];
  if (goal.status === "max_turns") {
    lines.push(`Hint: Max continuation turns reached (${MAX_GOAL_TURNS}). Run \`/goal continue\` to reset and continue.`);
  }
  return lines.join(`
`);
}
function applySetGoal(objective) {
  setGoal(objective);
  incrementGoalTurns();
  persistCurrentGoal();
  return "Goal set.";
}
async function call(onDone, _context, args) {
  const trimmed = args.trim();
  if (!trimmed || trimmed.toLowerCase() === "status") {
    onDone(formatGoalStatus(), { display: "system" });
    return null;
  }
  const lower = trimmed.toLowerCase();
  if (lower === "clear") {
    const cleared = clearGoal();
    if (cleared) {
      persistGoalClear();
      drainGoalContinuationQueue();
    }
    onDone(cleared ? "Goal cleared." : "No active goal to clear.", {
      display: "system"
    });
    return null;
  }
  if (lower === "pause") {
    const g = pauseGoal();
    if (g) {
      persistCurrentGoal();
      drainGoalContinuationQueue();
    }
    onDone(g ? "Goal paused." : "No active goal to pause.", {
      display: "system"
    });
    return null;
  }
  if (lower === "resume") {
    const current = getGoal();
    if (current?.status === "max_turns") {
      onDone(`Goal reached max continuation turns (${MAX_GOAL_TURNS}). Run \`/goal continue\` to reset turn counter and continue.`, { display: "system" });
      return null;
    }
    const g = resumeGoal();
    if (g)
      persistCurrentGoal();
    onDone(g ? "Goal resumed." : "No paused goal to resume.", {
      display: "system",
      shouldQuery: Boolean(g)
    });
    return null;
  }
  if (lower === "continue") {
    const g = continueGoalFromMaxTurns();
    if (g)
      persistCurrentGoal();
    onDone(g ? `Goal continuation counter reset (0/${MAX_GOAL_TURNS}). Continuing...` : "Current goal is not in max-turns state.", {
      display: "system",
      shouldQuery: Boolean(g)
    });
    return null;
  }
  if (lower === "complete") {
    const g = completeGoal();
    if (g) {
      persistCurrentGoal();
      drainGoalContinuationQueue();
    }
    onDone(g ? "Goal marked complete." : "No active goal to complete.", {
      display: "system"
    });
    return null;
  }
  if (trimmed.length > MAX_OBJECTIVE_CHARS) {
    onDone(`Goal objective is too long (${trimmed.length} chars; limit ${MAX_OBJECTIVE_CHARS}). Save the detailed instructions to a file and reference it from a shorter objective.`, { display: "system" });
    return null;
  }
  const existing = getGoal();
  const needsConfirmation = existing && existing.status !== "complete";
  if (!needsConfirmation) {
    const summary = applySetGoal(trimmed);
    onDone(summary, {
      display: "system",
      shouldQuery: true,
      displayArgs: truncateForDisplay(trimmed),
      metaMessages: [`<goal-objective-updated>
${trimmed}
</goal-objective-updated>`]
    });
    return null;
  }
  return /* @__PURE__ */ jsx_runtime2.jsx(GoalReplaceConfirmDialog, {
    currentGoal: existing,
    newObjective: trimmed,
    onConfirm: () => {
      drainGoalContinuationQueue();
      const summary = applySetGoal(trimmed);
      onDone(summary, {
        display: "system",
        shouldQuery: true,
        displayArgs: truncateForDisplay(trimmed),
        metaMessages: [`<goal-objective-updated>
${trimmed}
</goal-objective-updated>`]
      });
    },
    onCancel: () => {
      onDone("Kept the current goal. New objective discarded.", {
        display: "system"
      });
    }
  });
}
var jsx_runtime2, MAX_OBJECTIVE_CHARS = 4000, MAX_DISPLAY_CHARS = 80;
var init_goal = __esm(() => {
  init_goalState();
  init_goalStorage();
  init_messageQueueManager();
  init_GoalReplaceConfirmDialog();
  jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
});
init_goal();

export {
  call
};

//# debugId=5448ABB94ABE82EF64756E2164756E21
//# sourceMappingURL=chunk-65338ztn.js.map
