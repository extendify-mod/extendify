import { type Context, isContextEnabled, registerContext } from "@api/context";
import { registerEventListener } from "@api/context/event";
import { plugins } from "@api/registry";
import type { Logger } from "@shared/logger";

const { context, logger: contextLogger } = registerContext({
    name: "Plugins",
    platforms: ["desktop", "webos"]
});

export type PluginDef = Omit<Plugin, "started">;

export interface Plugin extends Context {
    /** A description of the plugin */
    description: string;
    /** The plugin's authors as GitHub usernames */
    authors: string[];
    /** Whether or not the plugin should be enabled regardless of the user's configuration */
    required?: boolean;
    /** Whether or not the plugin will show up in the plugin configuration screen */
    hidden?: boolean;
    /** Whether or not the plugin should be enabled before the user has configured it */
    enabledByDefault?: boolean;
    /** A callback for when the plugin is enabled or initialized */
    start?(): void;
    /** A callback for when the plugin gets disabled */
    stop?(): void;
    /** Whether or not the plugin's start method passed (or true if there is none) */
    started?: boolean;
}

export function registerPlugin(plugin: PluginDef): { plugin: Plugin; logger: Logger } {
    const { logger } = registerContext({
        ...plugin,
        loggerPrefix: plugin.loggerPrefix ?? "Plugin"
    });

    plugins.add(plugin);
    contextLogger.debug(`Plugin ${plugin.name} registered`);

    return { plugin, logger };
}

function startPlugins() {
    for (const plugin of Array.from(plugins.values())) {
        if (!isContextEnabled(plugin) || plugin.started) {
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
