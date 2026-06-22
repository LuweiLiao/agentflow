// @bun
import {
  init_skillLearning
} from "./chunk-ekd372cz.js";
import {
  promoteGapToDraft,
  readSkillGaps
} from "./chunk-njzfc439.js";
import {
  exportInstincts,
  findPromotionCandidates,
  generateSkillCandidates,
  loadInstincts,
  prunePendingInstincts,
  saveInstinct,
  upsertInstinct
} from "./chunk-cqde890a.js";
import {
  applySkillLifecycleDecision,
  compareExistingSkills,
  decideSkillLifecycle
} from "./chunk-5w55g5xv.js";
import {
  listKnownProjects,
  resolveProjectContext
} from "./chunk-gv49ez1v.js";
import {
  analyzeObservations
} from "./chunk-p407x6cd.js";
import"./chunk-w9ddp3yf.js";
import"./chunk-045xqj7j.js";
import {
  ingestTranscript,
  readObservations
} from "./chunk-v3ey5j7f.js";
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
import {
  getClaudeConfigHomeDir,
  init_envUtils
} from "./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
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

//# debugId=785745FCBACED6AF64756E2164756E21
//# sourceMappingURL=chunk-72rcs311.js.map
