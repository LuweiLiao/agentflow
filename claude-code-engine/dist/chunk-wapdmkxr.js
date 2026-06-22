// @bun
import {
  PermissionDialog,
  init_PermissionDialog
} from "./chunk-t8y9ddrf.js";
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
import"./chunk-g5vjgacw.js";
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
import {
  ThemedBox_default,
  ThemedText,
  init_src
} from "./chunk-49x6szsr.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-0k4kr3h5.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import"./chunk-4hpfxga2.js";
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

//# debugId=9E396ED375CB276964756E2164756E21
//# sourceMappingURL=chunk-wapdmkxr.js.map
