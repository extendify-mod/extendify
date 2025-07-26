import type { Plugin } from "@shared/types/plugin";

export const plugins: Plugin[] = [];

export function registerPlugin(plugin: Plugin): Plugin {
    plugins.push(plugin);
    return plugin;
}

export function startPlugins() {
    for (const plugin of plugins) {
        if (plugin.started) {
            continue;
        }

        plugin.start?.();
        plugin.started = true;
    }
}
