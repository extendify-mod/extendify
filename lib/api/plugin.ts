import { registerContext } from "@api/context";
import { registerEventListener } from "@api/event";
import type { Logger } from "@shared/logger";
import type { Plugin, PluginDef } from "@shared/types/plugin";

const { context, logger: contextLogger } = registerContext({ name: "Plugins" });

export const plugins: Plugin[] = [];

export function registerPlugin(plugin: PluginDef): { plugin: Plugin; logger: Logger } {
    const { logger } = registerContext(plugin);

    plugins.push(plugin);
    contextLogger.debug(`Plugin ${plugin.name} registered`);

    return { plugin, logger };
}

// TODO: Settings.
// Also don't check enabledByDefault here but in the settings themselves.
export function isPluginEnabled(plugin: Plugin | string): boolean {
    if (typeof plugin === "string") {
        const entry = plugins.find((v) => v.name === plugin);
        // If there is no entry, it's probably a plain context, which means it's always enabled
        return entry ? isPluginEnabled(entry) : true;
    }

    return plugin.required || plugin.enabledByDefault || false;
}

function startPlugins() {
    for (const plugin of plugins) {
        if (!isPluginEnabled(plugin) || plugin.started) {
            continue;
        }

        try {
            plugin.start?.();
            plugin.started = true;

            contextLogger.debug(`Started plugin ${plugin.name}`);
        } catch (e) {
            contextLogger.error(`Error starting plugin ${plugin.name}`, e);
        }
    }
}

registerEventListener(context, "platformLoaded", startPlugins);
