import { type Context, registerContext } from "@api/context";
import { registerEventListener } from "@api/context/event";
import type { Logger } from "@shared/logger";

const { context, logger: contextLogger } = registerContext({ name: "Plugins" });

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

export const plugins: Plugin[] = [];

export function registerPlugin(plugin: PluginDef): { plugin: Plugin; logger: Logger } {
    const { logger } = registerContext({
        ...plugin,
        loggerPrefix: plugin.loggerPrefix ?? "Plugin"
    });

    plugins.push(plugin);
    contextLogger.debug(`Plugin ${plugin.name} registered`);

    return { plugin, logger };
}

// TODO: Settings. And don't check enabledByDefault here but in the settings themselves.
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
