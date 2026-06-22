// @bun
import {
  init_registry,
  registerWindowsTerminalBackend
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
import {
  init_detection,
  isInWindowsTerminal
} from "./chunk-zbwxz8qy.js";
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
import {
  getPlatform,
  init_platform
} from "./chunk-hvc6rn64.js";
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
import {
  execFileNoThrow,
  init_execFileNoThrow
} from "./chunk-09kej9nc.js";
import"./chunk-c4dyxsat.js";
import"./chunk-jsbc7abp.js";
import"./chunk-m28vg9w4.js";
import"./chunk-01w7y5nh.js";
import"./chunk-rhhvp5gh.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-1tytvdt1.js";
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

//# debugId=DA0436C0B1C1801564756E2164756E21
//# sourceMappingURL=chunk-xdgqxhj7.js.map
