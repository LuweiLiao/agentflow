// @bun
import {
  getRecentActivity,
  init_logoV2Utils
} from "./chunk-04yxyb00.js";
import"./chunk-bt9jemws.js";
import"./chunk-85672e5z.js";
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
import {
  createTask,
  getTask,
  getTasksDir,
  init_tasks,
  listTasks,
  updateTask
} from "./chunk-vj6qsm24.js";
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
import"./chunk-93gg03n2.js";
import"./chunk-x9xf2qa8.js";
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
  __require
} from "./chunk-hhsxm2yr.js";

// src/cli/handlers/ant.ts
init_tasks();
init_logoV2Utils();
var DEFAULT_LIST = "default";
async function taskCreateHandler(subject, opts) {
  const listId = opts.list || DEFAULT_LIST;
  const id = await createTask(listId, {
    subject,
    description: opts.description || "",
    status: "pending",
    blocks: [],
    blockedBy: []
  });
  console.log(`Created task ${id}: ${subject}`);
}
async function taskListHandler(opts) {
  const listId = opts.list || DEFAULT_LIST;
  let tasks = await listTasks(listId);
  if (opts.pending) {
    tasks = tasks.filter((t) => t.status === "pending");
  }
  if (opts.json) {
    console.log(JSON.stringify(tasks, null, 2));
    return;
  }
  if (tasks.length === 0) {
    console.log("No tasks found.");
    return;
  }
  for (const t of tasks) {
    console.log(`  [${t.status}] ${t.id}: ${t.subject}`);
    if (t.description)
      console.log(`    ${t.description}`);
    if (t.owner)
      console.log(`    owner: ${t.owner}`);
  }
}
async function taskGetHandler(id, opts) {
  const listId = opts.list || DEFAULT_LIST;
  const task = await getTask(listId, id);
  if (!task) {
    console.error(`Task not found: ${id}`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(task, null, 2));
}
async function taskUpdateHandler(id, opts) {
  const listId = opts.list || DEFAULT_LIST;
  const updates = {};
  if (opts.status)
    updates.status = opts.status;
  if (opts.subject)
    updates.subject = opts.subject;
  if (opts.description)
    updates.description = opts.description;
  if (opts.owner)
    updates.owner = opts.owner;
  if (opts.clearOwner)
    updates.owner = undefined;
  const task = await updateTask(listId, id, updates);
  if (!task) {
    console.error(`Task not found: ${id}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Updated task ${id}: [${task.status}] ${task.subject}`);
}
async function taskDirHandler(opts) {
  const listId = opts.list || DEFAULT_LIST;
  console.log(getTasksDir(listId));
}
async function logHandler(logId) {
  const logs = await getRecentActivity();
  if (logId === undefined) {
    if (logs.length === 0) {
      console.log("No recent sessions.");
      return;
    }
    for (let i = 0;i < Math.min(logs.length, 20); i++) {
      const log2 = logs[i];
      const date = log2.modified ? new Date(log2.modified).toLocaleString() : "unknown";
      const title = log2.title || log2.sessionId || "untitled";
      console.log(`  ${i}: ${title}  (${date})`);
    }
    return;
  }
  const idx = typeof logId === "string" ? parseInt(logId, 10) : logId;
  const log = Number.isFinite(idx) && idx >= 0 && idx < logs.length ? logs[idx] : logs.find((l) => l.sessionId === String(logId));
  if (!log) {
    console.error(`Session not found: ${logId}`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(log, null, 2));
}
async function errorHandler(num) {
  const logs = await getRecentActivity();
  const count = num ?? 5;
  console.log(`Last ${count} sessions:`);
  for (let i = 0;i < Math.min(count, logs.length); i++) {
    const log = logs[i];
    const date = log.modified ? new Date(log.modified).toLocaleString() : "unknown";
    console.log(`  ${i}: ${log.sessionId}  (${date})`);
  }
}
async function exportHandler(source, outputFile) {
  const { writeFile, readFile } = await import("fs/promises");
  const logs = await getRecentActivity();
  const idx = parseInt(source, 10);
  let log;
  if (Number.isFinite(idx) && idx >= 0 && idx < logs.length) {
    log = logs[idx];
  } else {
    log = logs.find((l) => l.sessionId === source);
  }
  if (!log) {
    try {
      const content = await readFile(source, "utf-8");
      await writeFile(outputFile, content, "utf-8");
      console.log(`Exported ${source} \u2192 ${outputFile}`);
      return;
    } catch {
      console.error(`Source not found: ${source}`);
      process.exitCode = 1;
      return;
    }
  }
  await writeFile(outputFile, JSON.stringify(log, null, 2), "utf-8");
  console.log(`Exported session ${log.sessionId} \u2192 ${outputFile}`);
}
async function completionHandler(shell, opts, _program) {
  const { regenerateCompletionCache } = await import("./chunk-9e0h1zgh.js");
  if (opts.output) {
    await regenerateCompletionCache();
    console.log(`Completion cache regenerated for ${shell}.`);
  } else {
    await regenerateCompletionCache();
    console.log(`Completion cache regenerated for ${shell}.`);
  }
}
export {
  taskUpdateHandler,
  taskListHandler,
  taskGetHandler,
  taskDirHandler,
  taskCreateHandler,
  logHandler,
  exportHandler,
  errorHandler,
  completionHandler
};

//# debugId=BCB12B570CCDFA5964756E2164756E21
//# sourceMappingURL=chunk-mf0edf4z.js.map
