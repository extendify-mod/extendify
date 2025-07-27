import { registerContext } from "@api/context";
import type { Logger } from "@shared/logger";
import type { Plugin, PluginDef } from "@shared/types/plugin";

export const plugins: Plugin[] = [];

export function registerPlugin(plugin: PluginDef): { plugin: Plugin; logger: Logger } {
    const { logger } = registerContext(plugin);

    plugins.push(plugin);

    return { plugin, logger };
}

export function isPluginEnabled(plugin: Plugin): boolean {
    // TODO: Settings. Also don't check enabledByDefault here but in the settings.
    return plugin.required || plugin.enabledByDefault || false;
}

export function startPlugins() {
    for (const plugin of plugins) {
        if (!isPluginEnabled(plugin) || plugin.started) {
            continue;
        }

        plugin.start?.();
        plugin.started = true;
    }
}
