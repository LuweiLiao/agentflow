// @bun
import {
  getDesktopPath,
  init_file
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
import {
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-23170t3x.js";
import"./chunk-h3vy1y4t.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-09kej9nc.js";
import"./chunk-c4dyxsat.js";
import {
  init_log,
  logError
} from "./chunk-jsbc7abp.js";
import"./chunk-m28vg9w4.js";
import"./chunk-01w7y5nh.js";
import"./chunk-rhhvp5gh.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import {
  getFsImplementation,
  init_debug,
  init_errors,
  init_fsOperations,
  init_slowOperations,
  jsonStringify,
  logForDebugging,
  toError
} from "./chunk-1tytvdt1.js";
import"./chunk-kb3758f7.js";
import {
  getSessionId,
  init_state
} from "./chunk-xqs9r7pg.js";
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

// src/utils/heapDumpService.ts
import { createWriteStream, writeFileSync } from "fs";
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { pipeline } from "stream/promises";
import {
  getHeapSnapshot,
  getHeapSpaceStatistics,
  getHeapStatistics
} from "v8";
async function captureMemoryDiagnostics(trigger, dumpNumber = 0) {
  const usage = process.memoryUsage();
  const heapStats = getHeapStatistics();
  const resourceUsage = process.resourceUsage();
  const uptimeSeconds = process.uptime();
  let heapSpaceStats;
  try {
    heapSpaceStats = getHeapSpaceStatistics();
  } catch {}
  const activeHandles = process._getActiveHandles().length;
  const activeRequests = process._getActiveRequests().length;
  let openFileDescriptors;
  try {
    openFileDescriptors = (await readdir("/proc/self/fd")).length;
  } catch {}
  let smapsRollup;
  try {
    smapsRollup = await readFile("/proc/self/smaps_rollup", "utf8");
  } catch {}
  const nativeMemory = usage.rss - usage.heapUsed;
  const bytesPerSecond = uptimeSeconds > 0 ? usage.rss / uptimeSeconds : 0;
  const mbPerHour = bytesPerSecond * 3600 / (1024 * 1024);
  const potentialLeaks = [];
  if (heapStats.number_of_detached_contexts > 0) {
    potentialLeaks.push(`${heapStats.number_of_detached_contexts} detached context(s) - possible iframe/context leak`);
  }
  if (activeHandles > 100) {
    potentialLeaks.push(`${activeHandles} active handles - possible timer/socket leak`);
  }
  if (nativeMemory > usage.heapUsed) {
    potentialLeaks.push("Native memory > heap - leak may be in native addons (node-pty, sharp, etc.)");
  }
  if (mbPerHour > 100) {
    potentialLeaks.push(`High memory growth rate: ${mbPerHour.toFixed(1)} MB/hour`);
  }
  if (openFileDescriptors && openFileDescriptors > 500) {
    potentialLeaks.push(`${openFileDescriptors} open file descriptors - possible file/socket leak`);
  }
  return {
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    trigger,
    dumpNumber,
    uptimeSeconds,
    memoryUsage: {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      rss: usage.rss
    },
    memoryGrowthRate: {
      bytesPerSecond,
      mbPerHour
    },
    v8HeapStats: {
      heapSizeLimit: heapStats.heap_size_limit,
      mallocedMemory: heapStats.malloced_memory,
      peakMallocedMemory: heapStats.peak_malloced_memory,
      detachedContexts: heapStats.number_of_detached_contexts,
      nativeContexts: heapStats.number_of_native_contexts
    },
    v8HeapSpaces: heapSpaceStats?.map((space) => ({
      name: space.space_name,
      size: space.space_size,
      used: space.space_used_size,
      available: space.space_available_size
    })),
    resourceUsage: {
      maxRSS: resourceUsage.maxRSS * 1024,
      userCPUTime: resourceUsage.userCPUTime,
      systemCPUTime: resourceUsage.systemCPUTime
    },
    activeHandles,
    activeRequests,
    openFileDescriptors,
    analysis: {
      potentialLeaks,
      recommendation: potentialLeaks.length > 0 ? `WARNING: ${potentialLeaks.length} potential leak indicator(s) found. See potentialLeaks array.` : "No obvious leak indicators. Check heap snapshot for retained objects."
    },
    smapsRollup,
    platform: process.platform,
    nodeVersion: process.version,
    ccVersion: "2.7.0"
  };
}
async function performHeapDump(trigger = "manual", dumpNumber = 0) {
  try {
    const sessionId = getSessionId();
    const diagnostics = await captureMemoryDiagnostics(trigger, dumpNumber);
    const toGB = (bytes) => (bytes / 1024 / 1024 / 1024).toFixed(3);
    logForDebugging(`[HeapDump] Memory state:
  heapUsed: ${toGB(diagnostics.memoryUsage.heapUsed)} GB (in snapshot)
  external: ${toGB(diagnostics.memoryUsage.external)} GB (NOT in snapshot)
  rss: ${toGB(diagnostics.memoryUsage.rss)} GB (total process)
  ${diagnostics.analysis.recommendation}`);
    const dumpDir = getDesktopPath();
    await getFsImplementation().mkdir(dumpDir);
    const suffix = dumpNumber > 0 ? `-dump${dumpNumber}` : "";
    const heapFilename = `${sessionId}${suffix}.heapsnapshot`;
    const diagFilename = `${sessionId}${suffix}-diagnostics.json`;
    const heapPath = join(dumpDir, heapFilename);
    const diagPath = join(dumpDir, diagFilename);
    await writeFile(diagPath, jsonStringify(diagnostics, null, 2), {
      mode: 384
    });
    logForDebugging(`[HeapDump] Diagnostics written to ${diagPath}`);
    await writeHeapSnapshot(heapPath);
    logForDebugging(`[HeapDump] Heap dump written to ${heapPath}`);
    logEvent("tengu_heap_dump", {
      triggerManual: trigger === "manual",
      triggerAuto15GB: trigger === "auto-1.5GB",
      dumpNumber,
      success: true
    });
    return { success: true, heapPath, diagPath };
  } catch (err) {
    const error = toError(err);
    logError(error);
    logEvent("tengu_heap_dump", {
      triggerManual: trigger === "manual",
      triggerAuto15GB: trigger === "auto-1.5GB",
      dumpNumber,
      success: false
    });
    return { success: false, error: error.message };
  }
}
async function writeHeapSnapshot(filepath) {
  if (typeof Bun !== "undefined") {
    writeFileSync(filepath, Bun.generateHeapSnapshot("v8", "arraybuffer"), {
      mode: 384
    });
    Bun.gc(true);
    return;
  }
  const writeStream = createWriteStream(filepath, { mode: 384 });
  const heapSnapshotStream = getHeapSnapshot();
  await pipeline(heapSnapshotStream, writeStream);
}
var init_heapDumpService = __esm(() => {
  init_state();
  init_analytics();
  init_debug();
  init_errors();
  init_file();
  init_fsOperations();
  init_log();
  init_slowOperations();
});

// src/commands/heapdump/heapdump.ts
async function call() {
  const result = await performHeapDump();
  if (!result.success) {
    return {
      type: "text",
      value: `Failed to create heap dump: ${result.error}`
    };
  }
  return {
    type: "text",
    value: `${result.heapPath}
${result.diagPath}`
  };
}
var init_heapdump = __esm(() => {
  init_heapDumpService();
});
init_heapdump();

export {
  call
};

//# debugId=A4E89E1E08EFBAA364756E2164756E21
//# sourceMappingURL=chunk-2gcx9wv6.js.map
