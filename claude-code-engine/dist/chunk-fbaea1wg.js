// @bun
import {
  findGitRoot,
  init_git
} from "./chunk-bt5n9f4r.js";
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
import"./chunk-hhsxm2yr.js";

// src/cli/up.ts
init_git();
import { readFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
async function up() {
  const cwd = process.cwd();
  const gitRoot = findGitRoot(cwd);
  const searchDirs = gitRoot ? [gitRoot, cwd] : [cwd];
  let upSection = null;
  for (const dir of searchDirs) {
    const claudeMdPath = join(dir, "CLAUDE.md");
    try {
      const content = readFileSync(claudeMdPath, "utf-8");
      upSection = extractUpSection(content);
      if (upSection) {
        console.log(`Found "# claude up" in ${claudeMdPath}`);
        break;
      }
    } catch {}
  }
  if (!upSection) {
    console.log(`No "# claude up" section found in CLAUDE.md.
` + `Add a section like:

` + `  # claude up
` + "  ```bash\n" + `  npm install
` + `  npm run build
` + "  ```");
    return;
  }
  console.log(`Running:
`);
  console.log(upSection);
  console.log();
  const result = spawnSync("bash", ["-c", upSection], {
    cwd,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    console.error(`
claude up failed with exit code ${result.status}`);
    process.exitCode = result.status ?? 1;
  } else {
    console.log(`
claude up completed successfully.`);
  }
}
function extractUpSection(markdown) {
  const lines = markdown.split(`
`);
  let inSection = false;
  const sectionLines = [];
  for (const line of lines) {
    if (/^#\s+claude\s+up\b/i.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && /^#\s/.test(line)) {
      break;
    }
    if (inSection) {
      sectionLines.push(line);
    }
  }
  if (sectionLines.length === 0)
    return null;
  let text = sectionLines.join(`
`).trim();
  text = text.replace(/^```\w*\n?/, "").replace(/\n?```\s*$/, "");
  return text.trim() || null;
}
export {
  up
};

//# debugId=2073CD7DBA8F0BB964756E2164756E21
//# sourceMappingURL=chunk-fbaea1wg.js.map
