// @bun
import {
  gracefulShutdown,
  init_gracefulShutdown
} from "./chunk-85672e5z.js";
import"./chunk-wttb2t11.js";
import"./chunk-k60b56gr.js";
import"./chunk-14p6wvsq.js";
import"./chunk-28jd8qjx.js";
import {
  distRoot,
  init_distRoot
} from "./chunk-djt39ze3.js";
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
  init_source,
  source_default
} from "./chunk-93gg03n2.js";
import"./chunk-x9xf2qa8.js";
import"./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-3975w415.js";
import"./chunk-23170t3x.js";
import"./chunk-h3vy1y4t.js";
import"./chunk-e3j7m7k2.js";
import {
  execFileNoThrowWithCwd,
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
import {
  init_process,
  writeToStdout
} from "./chunk-kb3758f7.js";
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
import"./chunk-hhsxm2yr.js";

// src/cli/updateCCB.ts
init_source();
init_debug();
init_distRoot();
init_execFileNoThrow();
init_gracefulShutdown();
init_process();
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
var PACKAGE_NAME = "claude-code-best";
function getCurrentVersion() {
  try {
    const pkgPath = join(distRoot, "..", "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.version)
        return pkg.version;
    }
  } catch {}
  return "2.7.0";
}
function isCommandAvailable(cmd) {
  try {
    execSync(`which ${cmd} 2>/dev/null`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
function isBunInstallation() {
  const execPath = process.execPath;
  if (execPath.includes("bun")) {
    return true;
  }
  const bunGlobalDir = join(homedir(), ".bun", "install", "global");
  if (existsSync(join(bunGlobalDir, "node_modules", PACKAGE_NAME))) {
    return true;
  }
  return false;
}
async function getLatestVersion() {
  const result = await execFileNoThrowWithCwd("npm", ["view", `${PACKAGE_NAME}@latest`, "version", "--prefer-online"], { abortSignal: AbortSignal.timeout(1e4), cwd: homedir() });
  if (result.code !== 0) {
    logForDebugging(`npm view failed: ${result.stderr}`);
    return null;
  }
  return result.stdout.trim();
}
function gte(a, b) {
  const parseVer = (v) => v.replace(/^\D/, "").split(".").map(Number);
  const pa = parseVer(a);
  const pb = parseVer(b);
  for (let i = 0;i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0))
      return true;
    if ((pa[i] ?? 0) < (pb[i] ?? 0))
      return false;
  }
  return true;
}
async function updateCCB() {
  const currentVersion = getCurrentVersion();
  writeToStdout(`Current version: ${currentVersion}
`);
  const hasBun = isCommandAvailable("bun");
  const useBun = isBunInstallation();
  const pkgManager = useBun && hasBun ? "bun" : "npm";
  writeToStdout(`Package manager: ${pkgManager}
`);
  writeToStdout(`Checking for updates...
`);
  const latestVersion = await getLatestVersion();
  if (!latestVersion) {
    process.stderr.write(source_default.red("Failed to check for updates") + `
`);
    process.stderr.write(`Unable to fetch latest version from npm registry.
`);
    await gracefulShutdown(1);
    return;
  }
  if (latestVersion === currentVersion || gte(currentVersion, latestVersion)) {
    writeToStdout(source_default.green(`ccb is up to date (${currentVersion})`) + `
`);
    await gracefulShutdown(0);
    return;
  }
  writeToStdout(`New version available: ${latestVersion} (current: ${currentVersion})
`);
  writeToStdout(`Installing update via ${pkgManager}...
`);
  try {
    if (pkgManager === "bun") {
      execSync(`bun install -g ${PACKAGE_NAME}@latest`, {
        stdio: "inherit",
        cwd: homedir(),
        timeout: 120000
      });
    } else {
      execSync(`npm install -g ${PACKAGE_NAME}@latest`, {
        stdio: "inherit",
        cwd: homedir(),
        timeout: 120000
      });
    }
    writeToStdout(source_default.green(`Successfully updated from ${currentVersion} to ${latestVersion}`) + `
`);
  } catch (error) {
    process.stderr.write(source_default.red("Update failed") + `
`);
    process.stderr.write(`${error}
`);
    process.stderr.write(`
`);
    process.stderr.write(`Try manually updating with:
`);
    if (pkgManager === "bun") {
      process.stderr.write(source_default.bold(`  bun install -g ${PACKAGE_NAME}@latest`) + `
`);
    } else {
      process.stderr.write(source_default.bold(`  npm install -g ${PACKAGE_NAME}@latest`) + `
`);
    }
    await gracefulShutdown(1);
  }
  await gracefulShutdown(0);
}
export {
  updateCCB
};

//# debugId=428878B4FCBAC5F764756E2164756E21
//# sourceMappingURL=chunk-8hm3haz4.js.map
