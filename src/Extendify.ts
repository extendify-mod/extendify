import { Logger } from "@utils/logger";
import { StartAt } from "@utils/types";
import { _resolveReady, onceReady, waitFor } from "@webpack";
import "@webpack/patcher";

import { patches, startAllPlugins } from "plugins";

export * as Api from "./api";
export * as Components from "./components";
export * as Plugins from "./plugins";
export * as Util from "./utils";
export * as Webpack from "./webpack";

waitFor("useState", () => _resolveReady());

async function init() {
    await onceReady;
    startAllPlugins(StartAt.WebpackReady);

    if (IS_DEV) {
        const pendingPatches = patches.filter((p) => !p.all && p.predicate?.() !== false);
        if (pendingPatches.length) {
            new Logger("PluginManager", "#a6d189").warn(
                "Webpack has finished initializing, but some patches haven't been applied yet.",
                "This might be expected since some Modules are lazy loaded, but please verify",
                "that all plugins are working as intended.",
                "You are seeing this warning because this is a Development build of Extendify.",
                "\nThe following patches have not been applied:\n\n",
                pendingPatches.map((p) => `${p.plugin}: ${p.find}`).join("\n")
            );
        }
    }
}

startAllPlugins(StartAt.Init);
init();

document.addEventListener(
    "DOMContentLoaded",
    () => {
        startAllPlugins(StartAt.DOMContentLoaded);
    },
    { once: true }
);
