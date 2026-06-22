// @bun
import {
  getRecentActivity,
  init_logoV2Utils
} from "./chunk-9j1kkxr6.js";
import"./chunk-j5hk5kex.js";
import"./chunk-xzgt0njb.js";
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
import {
  createTask,
  getTask,
  getTasksDir,
  init_tasks,
  listTasks,
  updateTask
} from "./chunk-xef7acwt.js";
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
import"./chunk-49x6szsr.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-0k4kr3h5.js";
import"./chunk-x9xf2qa8.js";
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
  const { regenerateCompletionCache } = await import("./chunk-hheh81gf.js");
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

//# debugId=C5EEEE2433553DD364756E2164756E21
//# sourceMappingURL=chunk-9pqps3zq.js.map
