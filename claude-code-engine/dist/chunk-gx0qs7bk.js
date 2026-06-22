// @bun
import {
  init_skillLearning
} from "./chunk-v81hn5g1.js";
import {
  exportInstincts,
  findPromotionCandidates,
  generateSkillCandidates,
  loadInstincts,
  prunePendingInstincts,
  saveInstinct,
  upsertInstinct
} from "./chunk-w3mk6b4c.js";
import {
  analyzeObservations
} from "./chunk-xxr7yyj4.js";
import"./chunk-gz0h9658.js";
import {
  ingestTranscript,
  readObservations
} from "./chunk-v3ey5j7f.js";
import {
  promoteGapToDraft,
  readSkillGaps
} from "./chunk-5g26adz6.js";
import {
  applySkillLifecycleDecision,
  compareExistingSkills,
  decideSkillLifecycle
} from "./chunk-ps9qqy8y.js";
import"./chunk-w9ddp3yf.js";
import {
  listKnownProjects,
  resolveProjectContext
} from "./chunk-gv49ez1v.js";
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
import {
  getClaudeConfigHomeDir,
  init_envUtils
} from "./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __esm,
  __require
} from "./chunk-hhsxm2yr.js";

// src/commands/skill-learning/skill-learning.ts
import { join } from "path";
function parseFlagString(parts, flag) {
  const eqForm = parts.find((p) => p.startsWith(`${flag}=`));
  if (eqForm)
    return eqForm.slice(flag.length + 1) || undefined;
  const idx = parts.indexOf(flag);
  if (idx >= 0 && parts[idx + 1] && !parts[idx + 1].startsWith("--")) {
    return parts[idx + 1];
  }
  return;
}
function parseFlagNumber(parts, flag, fallback) {
  const raw = parseFlagString(parts, flag);
  if (raw === undefined)
    return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}
var call = async (args) => {
  const parts = args.trim().split(/\s+/).filter(Boolean);
  const sub = parts[0] ?? "status";
  const project = resolveProjectContext(process.cwd());
  const rootDir = process.env.CLAUDE_SKILL_LEARNING_HOME;
  const options = { project, rootDir };
  switch (sub) {
    case "status": {
      const [observations, instincts] = await Promise.all([
        readObservations(options),
        loadInstincts(options)
      ]);
      return {
        type: "text",
        value: [
          `Skill Learning status for ${project.projectName} (${project.projectId})`,
          `Observations: ${observations.length}`,
          `Instincts: ${instincts.length}`
        ].join(`
`)
      };
    }
    case "ingest": {
      const transcript = parts[1];
      if (!transcript) {
        return {
          type: "text",
          value: "Usage: /skill-learning ingest <transcript.jsonl> [--min-session-length=<n>]"
        };
      }
      const minSessionLength = parseFlagNumber(parts, "--min-session-length", 10);
      const observations = await ingestTranscript(transcript, options);
      if (observations.length < minSessionLength) {
        return {
          type: "text",
          value: `Session too short for learning (${observations.length} < min=${minSessionLength}). Skipping instinct extraction.`
        };
      }
      const instincts = analyzeObservations(observations);
      const saved = [];
      for (const instinct of instincts) {
        saved.push(await upsertInstinct(instinct, options));
      }
      return {
        type: "text",
        value: `Ingested ${observations.length} observations and saved ${saved.length} instincts.`
      };
    }
    case "evolve": {
      const generate = parts.includes("--generate");
      const instincts = await loadInstincts(options);
      const drafts = generateSkillCandidates(instincts, { cwd: process.cwd() });
      const written = [];
      if (generate) {
        for (const draft of drafts) {
          const roots = [
            join(process.cwd(), ".claude", "skills"),
            join(getClaudeConfigHomeDir(), "skills")
          ];
          const existing = await compareExistingSkills(draft, roots);
          const decision = decideSkillLifecycle(draft, existing);
          const result = await applySkillLifecycleDecision(decision);
          written.push(`${decision.type}: ${result.activePath ?? result.archivedPath ?? result.deletedPath ?? "no active write"}`);
        }
      }
      return {
        type: "text",
        value: generate ? `Generated ${written.length} learned skill(s):
${written.join(`
`)}` : `Found ${drafts.length} skill candidate(s). Use --generate to write them.`
      };
    }
    case "export": {
      const output = parts[1] ?? "skill-learning-instincts.json";
      const scope = parseFlagString(parts, "--scope");
      const minConf = parseFlagNumber(parts, "--min-conf", undefined);
      const domain = parseFlagString(parts, "--domain");
      const filter = (instincts) => instincts.filter((i) => {
        if (scope && i.scope !== scope)
          return false;
        if (minConf !== undefined && i.confidence < minConf)
          return false;
        if (domain && i.domain !== domain)
          return false;
        return true;
      });
      const all = await loadInstincts(options);
      const filtered = filter(all);
      if (filtered.length !== all.length) {
        await exportInstincts(output, options);
        const { writeFile } = await import("fs/promises");
        await writeFile(output, `${JSON.stringify(filtered, null, 2)}
`);
      } else {
        await exportInstincts(output, options);
      }
      const parts2 = [
        `Exported ${filtered.length} instincts to ${output}`
      ];
      if (scope || minConf !== undefined || domain) {
        const filters = [];
        if (scope)
          filters.push(`scope=${scope}`);
        if (minConf !== undefined)
          filters.push(`min-conf=${minConf}`);
        if (domain)
          filters.push(`domain=${domain}`);
        parts2.push(`(filters: ${filters.join(", ")})`);
      }
      return { type: "text", value: parts2.join(" ") };
    }
    case "import": {
      const input = parts[1];
      if (!input) {
        return {
          type: "text",
          value: "Usage: /skill-learning import <instincts.json> [--scope=<scope>] [--min-conf=<n>] [--domain=<d>] [--dry-run]"
        };
      }
      const scope = parseFlagString(parts, "--scope");
      const minConf = parseFlagNumber(parts, "--min-conf", undefined);
      const domain = parseFlagString(parts, "--domain");
      const dryRun = parts.includes("--dry-run");
      const { readFile: readFileFs } = await import("fs/promises");
      const parsed = JSON.parse(await readFileFs(input, "utf8"));
      const filtered = parsed.filter((i) => {
        if (scope && i.scope !== scope)
          return false;
        if (minConf !== undefined && i.confidence < minConf)
          return false;
        if (domain && i.domain !== domain)
          return false;
        return true;
      });
      if (dryRun) {
        return {
          type: "text",
          value: `Dry run: would import ${filtered.length}/${parsed.length} instincts.`
        };
      }
      for (const instinct of filtered) {
        await upsertInstinct(instinct, options);
      }
      return {
        type: "text",
        value: `Imported ${filtered.length}/${parsed.length} instincts.`
      };
    }
    case "prune": {
      const maxAgeIndex = parts.indexOf("--max-age");
      const maxAge = maxAgeIndex >= 0 && parts[maxAgeIndex + 1] ? Number(parts[maxAgeIndex + 1]) : 30;
      const pruned = await prunePendingInstincts(maxAge, options);
      return {
        type: "text",
        value: `Pruned ${pruned.length} pending instincts.`
      };
    }
    case "promote": {
      const target = parts[1];
      if (!target) {
        const gaps = await readSkillGaps(project, rootDir);
        const instincts = await loadInstincts(options);
        const candidates = findPromotionCandidates(instincts);
        const lines = [
          `Promotion candidates for ${project.projectName} (${project.projectId}):`,
          `Pending gaps: ${gaps.filter((g) => g.status === "pending").length}`,
          `Global-eligible instincts (>=2 projects, avg confidence >=0.8): ${candidates.length}`,
          "",
          "Usage:",
          "  /skill-learning promote gap <gap-key>           # pending gap -> draft",
          "  /skill-learning promote instinct <instinct-id>  # project instinct -> global"
        ];
        return { type: "text", value: lines.join(`
`) };
      }
      if (target === "gap") {
        const gapKey = parts[2];
        if (!gapKey) {
          return {
            type: "text",
            value: "Usage: /skill-learning promote gap <gap-key>"
          };
        }
        const updated = await promoteGapToDraft(gapKey, project, rootDir);
        if (!updated) {
          return { type: "text", value: `No gap found for key "${gapKey}".` };
        }
        return {
          type: "text",
          value: `Promoted gap ${gapKey} to status=${updated.status} (draft=${updated.draft?.skillPath ?? "none"}).`
        };
      }
      if (target === "instinct") {
        const instinctId = parts[2];
        if (!instinctId) {
          return {
            type: "text",
            value: "Usage: /skill-learning promote instinct <instinct-id>"
          };
        }
        const projectInstincts = await loadInstincts(options);
        const match = projectInstincts.find((i) => i.id === instinctId);
        if (!match) {
          return {
            type: "text",
            value: `No project-scoped instinct found for id "${instinctId}".`
          };
        }
        if (match.scope === "global") {
          return {
            type: "text",
            value: `Instinct ${instinctId} is already global.`
          };
        }
        const globalCopy = { ...match, scope: "global" };
        await saveInstinct(globalCopy, { scope: "global", rootDir });
        return {
          type: "text",
          value: `Promoted instinct ${instinctId} to global scope.`
        };
      }
      return {
        type: "text",
        value: "Usage: /skill-learning promote [gap <gap-key>|instinct <instinct-id>]"
      };
    }
    case "projects": {
      const projects = listKnownProjects();
      if (projects.length === 0) {
        return { type: "text", value: "No known project scopes yet." };
      }
      const lines = ["Known project scopes:"];
      for (const record of projects) {
        const projectOptions = { project: record, rootDir };
        const [instincts, observations] = await Promise.all([
          loadInstincts(projectOptions),
          readObservations(projectOptions)
        ]);
        lines.push(`- ${record.projectName} (${record.projectId}) \u2014 instincts: ${instincts.length}, observations: ${observations.length}, lastSeen: ${record.lastSeenAt}`);
      }
      return { type: "text", value: lines.join(`
`) };
    }
    default:
      return {
        type: "text",
        value: "Usage: /skill-learning [status|ingest|evolve|export|import|prune|promote|projects]"
      };
  }
};
var init_skill_learning = __esm(() => {
  init_envUtils();
  init_skillLearning();
});
init_skill_learning();

export {
  call
};

//# debugId=2AA9D3EBA6B938F064756E2164756E21
//# sourceMappingURL=chunk-gx0qs7bk.js.map
