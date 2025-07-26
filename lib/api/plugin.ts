import type { Plugin } from "@shared/types/plugin";

export const plugins: Plugin[] = [];

export function registerPlugin(plugin: Plugin): Plugin {
    plugins.push(plugin);
    return plugin;
}
