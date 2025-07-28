import { registerContext } from "@api/context";
import { EventType, registerEventListener } from "@api/event";
import type { Logger } from "@shared/logger";
import type { Plugin, PluginDef } from "@shared/types/plugin";

const { context, logger } = registerContext({ name: "Plugins" });

export const plugins: Plugin[] = [];

export function registerPlugin(plugin: PluginDef): { plugin: Plugin; logger: Logger } {
    const { logger } = registerContext(plugin);

    plugins.push(plugin);

    logger.debug(`Plugin ${plugin.name} registered`);

    return { plugin, logger };
}

// TODO: Settings. Also don't check enabledByDefault here but in the settings themselves.
export function isPluginEnabled(plugin: Plugin): boolean {
    return plugin.required || plugin.enabledByDefault || false;
}

function startPlugins() {
    for (const plugin of plugins) {
        if (!isPluginEnabled(plugin) || plugin.started) {
            continue;
        }

        plugin.start?.();
        plugin.started = true;

        logger.debug(`Started plugin ${plugin.name}`);
    }
}

registerEventListener(context, EventType.PLATFORM_LOADED, startPlugins);
