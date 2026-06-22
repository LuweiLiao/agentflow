// @bun
import {
  CHANGELOG_URL,
  fetchAndStoreChangelog,
  getAllReleaseNotes,
  getStoredChangelog,
  init_releaseNotes
} from "./chunk-bt9jemws.js";
import"./chunk-4spgkgr3.js";
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
import"./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
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
  __esm
} from "./chunk-hhsxm2yr.js";

// src/commands/release-notes/release-notes.ts
function formatReleaseNotes(notes) {
  return notes.map(([version, notes2]) => {
    const header = `Version ${version}:`;
    const bulletPoints = notes2.map((note) => `\xB7 ${note}`).join(`
`);
    return `${header}
${bulletPoints}`;
  }).join(`

`);
}
async function call() {
  let freshNotes = [];
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout((rej) => rej(new Error("Timeout")), 500, reject);
    });
    await Promise.race([fetchAndStoreChangelog(), timeoutPromise]);
    freshNotes = getAllReleaseNotes(await getStoredChangelog());
  } catch {}
  if (freshNotes.length > 0) {
    return { type: "text", value: formatReleaseNotes(freshNotes) };
  }
  const cachedNotes = getAllReleaseNotes(await getStoredChangelog());
  if (cachedNotes.length > 0) {
    return { type: "text", value: formatReleaseNotes(cachedNotes) };
  }
  return {
    type: "text",
    value: `See the full changelog at: ${CHANGELOG_URL}`
  };
}
var init_release_notes = __esm(() => {
  init_releaseNotes();
});
init_release_notes();

export {
  call
};

//# debugId=FAA4896596E42EAE64756E2164756E21
//# sourceMappingURL=chunk-sw07y09r.js.map
