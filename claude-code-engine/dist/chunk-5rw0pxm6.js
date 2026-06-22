// @bun
import {
  init_computerUseLock,
  isLockHeldLocally,
  releaseComputerUseLock
} from "./chunk-znh8j5rf.js";
import {
  init_escHotkey,
  init_withResolvers,
  unregisterEscHotkey,
  withResolvers
} from "./chunk-m3b9aggc.js";
import {
  errorMessage,
  init_debug,
  init_errors,
  logForDebugging
} from "./chunk-1tytvdt1.js";
import"./chunk-kb3758f7.js";
import"./chunk-xqs9r7pg.js";
import"./chunk-tj0dzck2.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  __esm,
  __require
} from "./chunk-hhsxm2yr.js";

// src/utils/computerUse/cleanup.ts
async function cleanupComputerUseAfterTurn(ctx) {
  const appState = ctx.getAppState();
  const hidden = appState.computerUseMcpState?.hiddenDuringTurn;
  if (hidden && hidden.size > 0) {
    const { unhideComputerUseApps } = await import("./chunk-tc309dc9.js");
    const unhide = unhideComputerUseApps([...hidden]).catch((err) => logForDebugging(`[Computer Use MCP] auto-unhide failed: ${errorMessage(err)}`));
    const timeout = withResolvers();
    const timer = setTimeout(timeout.resolve, UNHIDE_TIMEOUT_MS);
    await Promise.race([unhide, timeout.promise]).finally(() => clearTimeout(timer));
    ctx.setAppState((prev) => prev.computerUseMcpState?.hiddenDuringTurn === undefined ? prev : {
      ...prev,
      computerUseMcpState: {
        ...prev.computerUseMcpState,
        hiddenDuringTurn: undefined
      }
    });
  }
  if (!isLockHeldLocally())
    return;
  try {
    unregisterEscHotkey();
  } catch (err) {
    logForDebugging(`[Computer Use MCP] unregisterEscHotkey failed: ${errorMessage(err)}`);
  }
  if (await releaseComputerUseLock()) {
    ctx.sendOSNotification?.({
      message: "Claude is done using your computer",
      notificationType: "computer_use_exit"
    });
  }
}
var UNHIDE_TIMEOUT_MS = 5000;
var init_cleanup = __esm(() => {
  init_debug();
  init_errors();
  init_withResolvers();
  init_computerUseLock();
  init_escHotkey();
});
init_cleanup();

export {
  cleanupComputerUseAfterTurn
};

//# debugId=C100049B4315D4D064756E2164756E21
//# sourceMappingURL=chunk-5rw0pxm6.js.map
