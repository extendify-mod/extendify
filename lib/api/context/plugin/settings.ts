import type { Plugin } from "@api/context/plugin";

export interface PluginSettings {
    enabled: boolean;
    options: Record<string, PluginOption<any>>;
}

export type PluginOptionType = "string" | "number" | "boolean" | "select" | "slider";

export interface PluginOption<T extends PluginOptionType, R = any> {
    type: T;
    default?: R;
    description: string;
    restartNeeded?: boolean;
    hidden?: boolean;
    onChange?(newValue: R): void;
}

export type StringPluginOption = PluginOption<"string", string>;
export const pluginSettings: Map<string, PluginSettings> = new Map();

export function isPluginEnabled(plugin: Plugin): boolean {
    return (
        plugin.required ??
        pluginSettings.get(plugin.name)?.enabled ??
        plugin.enabledByDefault ??
        false
    );
}
