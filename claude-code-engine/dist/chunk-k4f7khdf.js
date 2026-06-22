// @bun
import {
  init_AppState,
  useAppState
} from "./chunk-xzgt0njb.js";
import {
  getDefaultMainLoopModelSetting,
  init_model,
  parseUserSpecifiedModel
} from "./chunk-srbv7hh4.js";
import {
  init_growthbook,
  onGrowthBookRefresh
} from "./chunk-x5wzz44g.js";
import {
  require_react
} from "./chunk-0k4kr3h5.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/hooks/useMainLoopModel.ts
function useMainLoopModel() {
  const mainLoopModel = useAppState((s) => s.mainLoopModel);
  const mainLoopModelForSession = useAppState((s) => s.mainLoopModelForSession);
  const [, forceRerender] = import_react.useReducer((x) => x + 1, 0);
  import_react.useEffect(() => onGrowthBookRefresh(forceRerender), []);
  const model = parseUserSpecifiedModel(mainLoopModelForSession ?? mainLoopModel ?? getDefaultMainLoopModelSetting());
  return model;
}
var import_react;
var init_useMainLoopModel = __esm(() => {
  init_growthbook();
  init_AppState();
  init_model();
  import_react = __toESM(require_react(), 1);
});

export { useMainLoopModel, init_useMainLoopModel };

//# debugId=96A662AD0B65621364756E2164756E21
//# sourceMappingURL=chunk-k4f7khdf.js.map
