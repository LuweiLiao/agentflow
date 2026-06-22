// @bun
import {
  init_registry,
  registerWindowsTerminalBackend
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
import {
  init_detection,
  isInWindowsTerminal
} from "./chunk-6tebjnq9.js";
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
import {
  getPlatform,
  init_platform
} from "./chunk-7fbjbgr5.js";
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
import {
  execFileNoThrow,
  init_execFileNoThrow
} from "./chunk-w7s0zvjq.js";
import"./chunk-w95hkggk.js";
import"./chunk-kc49dhz0.js";
import"./chunk-k51zdj4e.js";
import"./chunk-mtgfbnth.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-pyv3zrjt.js";
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

// src/utils/swarm/backends/WindowsTerminalBackend.ts
import { randomUUID } from "crypto";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
function quotePowerShellString(value) {
  return `'${value.replace(/'/g, "''")}'`;
}
function wrapPowerShellCommand(command, pidFile) {
  const quotedPidFile = quotePowerShellString(pidFile);
  return [
    "$ErrorActionPreference = 'Stop'",
    `Set-Content -LiteralPath ${quotedPidFile} -Value $PID`,
    [
      `try { ${command}; if ($LASTEXITCODE -is [int]) { exit $LASTEXITCODE } }`,
      `catch { Write-Error $_; exit 1 }`,
      `finally { Remove-Item -LiteralPath ${quotedPidFile} -Force -ErrorAction SilentlyContinue }`
    ].join(`
`)
  ].join("; ");
}
function getWtPaneTimeoutMs() {
  const raw = process.env.CLAUDE_WT_PANE_TIMEOUT_MS;
  if (!raw)
    return WT_PANE_TIMEOUT_DEFAULT_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : WT_PANE_TIMEOUT_DEFAULT_MS;
}
async function waitForPidFile(pidFile, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      const content = (await readFile(pidFile, "utf-8")).trim();
      if (!/^\d+$/.test(content)) {
        lastErr = new Error(`pidFile content not a valid pid: ${JSON.stringify(content)}`);
      } else {
        const pid = Number.parseInt(content, 10);
        if (Number.isFinite(pid) && pid > 0)
          return pid;
        lastErr = new Error(`pidFile content parsed to invalid pid: ${pid}`);
      }
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, WT_PANE_POLL_INTERVAL_MS));
  }
  throw lastErr ?? new Error("pidFile never appeared");
}

class WindowsTerminalBackend {
  type = "windows-terminal";
  displayName = "Windows Terminal";
  supportsHideShow = false;
  panes = new Map;
  runCommand;
  getPlatformValue;
  pidFileDir;
  constructor(runCommandOrOptions, getPlatformValue) {
    if (typeof runCommandOrOptions === "function" || runCommandOrOptions === undefined) {
      this.runCommand = runCommandOrOptions ?? execFileNoThrow;
      this.getPlatformValue = getPlatformValue ?? getPlatform;
      this.pidFileDir = tmpdir();
    } else {
      this.runCommand = runCommandOrOptions.runCommand ?? execFileNoThrow;
      this.getPlatformValue = runCommandOrOptions.getPlatform ?? getPlatform;
      this.pidFileDir = runCommandOrOptions.pidFileDir ?? tmpdir();
    }
  }
  makePidFile(paneId) {
    return join(this.pidFileDir, `${paneId.replace(/[^a-zA-Z0-9_-]/g, "-")}.pid`);
  }
  async isAvailable() {
    if (this.getPlatformValue() !== "windows") {
      return false;
    }
    if (process.env.WT_SESSION) {
      return true;
    }
    const result = await this.runCommand("where.exe", ["wt.exe"]);
    return result.code === 0;
  }
  async isRunningInside() {
    return this.getPlatformValue() === "windows" && isInWindowsTerminal();
  }
  async createTeammatePaneInSwarmView(name, _color) {
    const paneId = `wt-${randomUUID()}`;
    const isFirstTeammate = this.panes.size === 0;
    this.panes.set(paneId, {
      title: name,
      mode: "pane",
      pidFile: this.makePidFile(paneId),
      status: "registered"
    });
    return { paneId, isFirstTeammate };
  }
  async createTeammateWindowInSwarmView(name, _color) {
    const paneId = `wt-${randomUUID()}`;
    const windowName = `teammate-${name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;
    this.panes.set(paneId, {
      title: name,
      mode: "window",
      pidFile: this.makePidFile(paneId),
      status: "registered"
    });
    return { paneId, isFirstTeammate: false, windowName };
  }
  async sendCommandToPane(paneId, command, _useExternalSession) {
    const pane = this.panes.get(paneId);
    if (!pane) {
      throw new Error(`Unknown Windows Terminal pane id: ${paneId}`);
    }
    if (pane.status === "ready" || pane.status === "killing") {
      throw new Error(`Pane ${paneId} already spawned (status=${pane.status}); create a new pane to re-launch`);
    }
    if (pane.status === "spawning") {
      throw new Error(`Pane ${paneId} is currently spawning; wait for the in-flight launch to complete`);
    }
    if (pane.status === "dead") {
      throw new Error(`Pane ${paneId} is dead; create a new pane`);
    }
    let resolveSpawn;
    let rejectSpawn;
    const spawnPromise = new Promise((res, rej) => {
      resolveSpawn = res;
      rejectSpawn = rej;
    });
    spawnPromise.catch(() => {});
    pane.status = "spawning";
    pane.spawnPromise = spawnPromise;
    try {
      const launcher = wrapPowerShellCommand(command, pane.pidFile);
      const encoded = Buffer.from(launcher, "utf16le").toString("base64");
      const args = pane.mode === "window" ? ["-w", "-1", "new-tab", "--title", pane.title] : ["-w", "0", "split-pane", "--vertical", "--title", pane.title];
      await unlink(pane.pidFile).catch(() => {});
      const result = await this.runCommand("wt.exe", [
        ...args,
        "powershell.exe",
        "-NoLogo",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-EncodedCommand",
        encoded
      ]);
      if (result.code !== 0) {
        throw new Error(`Failed to launch Windows Terminal teammate ${paneId}: ${result.stderr}`);
      }
      const timeoutMs = getWtPaneTimeoutMs();
      let pid;
      try {
        pid = await waitForPidFile(pane.pidFile, timeoutMs);
      } catch (err) {
        throw new Error(`Windows Terminal pane failed to launch within ${timeoutMs}ms
` + `  paneId: ${paneId}
` + `  pidFile: ${pane.pidFile}
` + `  wt.exe stdout: ${result.stdout || "(empty)"}
` + `  wt.exe stderr: ${result.stderr || "(empty)"}
` + `  underlying: ${err instanceof Error ? err.message : String(err)}
` + `  override timeout via env CLAUDE_WT_PANE_TIMEOUT_MS`);
      }
      pane.pid = pid;
      pane.status = "ready";
      resolveSpawn();
    } catch (err) {
      pane.status = "dead";
      pane.pid = undefined;
      rejectSpawn(err);
      throw err;
    } finally {
      pane.spawnPromise = undefined;
    }
  }
  async setPaneBorderColor(_paneId, _color, _useExternalSession) {}
  async setPaneTitle(_paneId, _name, _color, _useExternalSession) {}
  async enablePaneBorderStatus(_windowTarget, _useExternalSession) {}
  async rebalancePanes(_windowTarget, _hasLeader) {}
  async killPane(paneId, _useExternalSession) {
    const pane = this.panes.get(paneId);
    if (!pane) {
      return false;
    }
    if (pane.status === "spawning" && pane.spawnPromise) {
      await pane.spawnPromise.catch(() => {});
    }
    if (pane.status === "dead") {
      this.panes.delete(paneId);
      return false;
    }
    if (pane.status !== "ready") {
      return false;
    }
    pane.status = "killing";
    let pid = pane.pid;
    if (pid === undefined) {
      let pidContent = null;
      for (let attempt = 0;attempt < 3; attempt++) {
        try {
          pidContent = (await readFile(pane.pidFile, "utf-8")).trim();
          break;
        } catch {
          if (attempt === 2) {
            pane.status = "dead";
            this.panes.delete(paneId);
            return false;
          }
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      if (!pidContent || !/^\d+$/.test(pidContent)) {
        pane.status = "dead";
        this.panes.delete(paneId);
        return false;
      }
      const parsed = Number.parseInt(pidContent, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        pane.status = "dead";
        this.panes.delete(paneId);
        return false;
      }
      pid = parsed;
    }
    const result = await this.runCommand("powershell.exe", [
      "-NoLogo",
      "-NoProfile",
      "-Command",
      `Stop-Process -Id ${pid} -Force -ErrorAction Stop`
    ]);
    pane.pid = undefined;
    pane.status = "dead";
    this.panes.delete(paneId);
    logForDebugging(`[WindowsTerminalBackend] killPane ${paneId} pid=${pid} code=${result.code}`);
    return result.code === 0;
  }
  async hidePane(_paneId, _useExternalSession) {
    return false;
  }
  async showPane(_paneId, _targetWindowOrPane, _useExternalSession) {
    return false;
  }
}
var WT_PANE_TIMEOUT_DEFAULT_MS = 8000, WT_PANE_POLL_INTERVAL_MS = 200;
var init_WindowsTerminalBackend = __esm(() => {
  init_debug();
  init_execFileNoThrow();
  init_platform();
  init_detection();
  init_registry();
  registerWindowsTerminalBackend(WindowsTerminalBackend);
});
init_WindowsTerminalBackend();

export {
  WindowsTerminalBackend
};

//# debugId=D6C2FABCEA3F09DC64756E2164756E21
//# sourceMappingURL=chunk-6dg7kr1b.js.map
