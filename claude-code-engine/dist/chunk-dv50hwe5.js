// @bun
import {
  addFlaggedPlugin,
  getFlaggedPlugins,
  init_pluginFlagging,
  loadFlaggedPlugins
} from "./chunk-fv78rnmh.js";
import {
  init_pluginOperations,
  uninstallPluginOp
} from "./chunk-5dha4p3h.js";
import {
  getMarketplace,
  init_installedPluginsManager,
  init_marketplaceManager,
  loadInstalledPluginsV2,
  loadKnownMarketplacesConfigSafe
} from "./chunk-85672e5z.js";
import {
  errorMessage,
  init_debug,
  init_errors,
  logForDebugging
} from "./chunk-1tytvdt1.js";

// src/utils/plugins/pluginBlocklist.ts
init_pluginOperations();
init_debug();
init_errors();
init_installedPluginsManager();
init_marketplaceManager();
init_pluginFlagging();
function detectDelistedPlugins(installedPlugins, marketplace, marketplaceName) {
  const marketplacePluginNames = new Set(marketplace.plugins.map((p) => p.name));
  const suffix = `@${marketplaceName}`;
  const delisted = [];
  for (const pluginId of Object.keys(installedPlugins.plugins)) {
    if (!pluginId.endsWith(suffix))
      continue;
    const pluginName = pluginId.slice(0, -suffix.length);
    if (!marketplacePluginNames.has(pluginName)) {
      delisted.push(pluginId);
    }
  }
  return delisted;
}
async function detectAndUninstallDelistedPlugins() {
  await loadFlaggedPlugins();
  const installedPlugins = loadInstalledPluginsV2();
  const alreadyFlagged = getFlaggedPlugins();
  const knownMarketplaces = await loadKnownMarketplacesConfigSafe();
  const newlyFlagged = [];
  for (const marketplaceName of Object.keys(knownMarketplaces)) {
    try {
      const marketplace = await getMarketplace(marketplaceName);
      if (!marketplace.forceRemoveDeletedPlugins)
        continue;
      const delisted = detectDelistedPlugins(installedPlugins, marketplace, marketplaceName);
      for (const pluginId of delisted) {
        if (pluginId in alreadyFlagged)
          continue;
        const installations = installedPlugins.plugins[pluginId] ?? [];
        const hasUserInstall = installations.some((i) => i.scope === "user" || i.scope === "project" || i.scope === "local");
        if (!hasUserInstall)
          continue;
        for (const installation of installations) {
          const { scope } = installation;
          if (scope !== "user" && scope !== "project" && scope !== "local") {
            continue;
          }
          try {
            await uninstallPluginOp(pluginId, scope);
          } catch (error) {
            logForDebugging(`Failed to auto-uninstall delisted plugin ${pluginId} from ${scope}: ${errorMessage(error)}`, { level: "error" });
          }
        }
        await addFlaggedPlugin(pluginId);
        newlyFlagged.push(pluginId);
      }
    } catch (error) {
      logForDebugging(`Failed to check for delisted plugins in "${marketplaceName}": ${errorMessage(error)}`, { level: "warn" });
    }
  }
  return newlyFlagged;
}

export { detectAndUninstallDelistedPlugins };

//# debugId=441778792AF9EE9564756E2164756E21
//# sourceMappingURL=chunk-dv50hwe5.js.map
