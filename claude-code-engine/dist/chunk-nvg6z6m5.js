// @bun
import {
  init_browser,
  openBrowser
} from "./chunk-eavq5vsk.js";
import {
  init_config,
  saveGlobalConfig
} from "./chunk-jyqypr4z.js";
import"./chunk-m18nccbn.js";
import"./chunk-e2jvken3.js";
import"./chunk-5zhv4jyp.js";
import"./chunk-jwyj6t5m.js";
import"./chunk-87f9np2y.js";
import"./chunk-zq3spn7d.js";
import"./chunk-7fbjbgr5.js";
import"./chunk-x5wzz44g.js";
import"./chunk-r87btn9p.js";
import"./chunk-v4ypszbb.js";
import"./chunk-dw66fdss.js";
import"./chunk-fejeqe61.js";
import {
  init_analytics,
  logEvent
} from "./chunk-4hpfxga2.js";
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
  __esm
} from "./chunk-hhsxm2yr.js";

// src/commands/install-slack-app/install-slack-app.ts
async function call() {
  logEvent("tengu_install_slack_app_clicked", {});
  saveGlobalConfig((current) => ({
    ...current,
    slackAppInstallCount: (current.slackAppInstallCount ?? 0) + 1
  }));
  const success = await openBrowser(SLACK_APP_URL);
  if (success) {
    return {
      type: "text",
      value: "Opening Slack app installation page in browser\u2026"
    };
  } else {
    return {
      type: "text",
      value: `Couldn't open browser. Visit: ${SLACK_APP_URL}`
    };
  }
}
var SLACK_APP_URL = "https://slack.com/marketplace/A08SF47R6P4-claude";
var init_install_slack_app = __esm(() => {
  init_analytics();
  init_browser();
  init_config();
});
init_install_slack_app();

export {
  call
};

//# debugId=A33F6A940F200F0864756E2164756E21
//# sourceMappingURL=chunk-nvg6z6m5.js.map
