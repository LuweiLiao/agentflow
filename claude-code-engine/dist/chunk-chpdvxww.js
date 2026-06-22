// @bun
import {
  init_poorMode,
  isPoorModeActive,
  setPoorMode
} from "./chunk-snchk5qv.js";
import"./chunk-h2edgmqn.js";
import"./chunk-d1ka4b7m.js";
import"./chunk-tavc33hf.js";
import"./chunk-80p148mw.js";
import"./chunk-49v9e09z.js";
import"./chunk-vwenx8ke.js";
import"./chunk-bgan4cpf.js";
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
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-bj6zyntv.js";
import"./chunk-49x6szsr.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-0k4kr3h5.js";
import"./chunk-x9xf2qa8.js";
import"./chunk-4hpfxga2.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-3nk9q8dr.js";
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

// src/commands/poor/poor.ts
var call = async (_, context) => {
  const currentlyActive = isPoorModeActive();
  const newState = !currentlyActive;
  setPoorMode(newState);
  if (newState) {
    context.setAppState((prev) => ({
      ...prev,
      promptSuggestionEnabled: false
    }));
  } else {
    context.setAppState((prev) => ({
      ...prev,
      promptSuggestionEnabled: true
    }));
  }
  const status = newState ? "ON" : "OFF";
  const details = newState ? "extract_memories and prompt_suggestion are disabled" : "extract_memories and prompt_suggestion are restored";
  return { type: "text", value: `Poor mode ${status} \u2014 ${details}` };
};
var init_poor = __esm(() => {
  init_poorMode();
});
init_poor();

export {
  call
};

//# debugId=E3E4C9295C75F12B64756E2164756E21
//# sourceMappingURL=chunk-chpdvxww.js.map
