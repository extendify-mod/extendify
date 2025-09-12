import type { Plugin } from "@api/context/plugin";
import { CONFIG_KEY } from "@shared/constants";

export type PluginOptionType = "string" | "number" | "boolean" | "select" | "slider";

export interface PluginOption<T extends PluginOptionType, R = any> {
    type: T;
    description: string;
    default?: R;
    restartNeeded?: boolean;
    hidden?: boolean;
    onChange?(newValue: R): void;
}

export interface SelectPluginOption extends PluginOption<"select", string> {
    options: string[];
}

export interface SliderPluginOption extends PluginOption<"slider", number> {
    min: number;
    max: number;
}

export type StringPluginOption = PluginOption<"string", string>;
export type NumberPluginOption = PluginOption<"number", number>;
export type BooleanPluginOption = PluginOption<"boolean", boolean>;

export type AnyPluginOption =
    | StringPluginOption
    | NumberPluginOption
    | BooleanPluginOption
    | SelectPluginOption
    | SliderPluginOption;

export type PluginOptions = Record<string, AnyPluginOption>;
export type PluginSettings = Record<string, any> & { enabled: boolean };

export const pluginOptions: Map<string, PluginOptions> = new Map();
export const settingsValues: Map<string, PluginSettings> = loadSettings();

function loadSettings(): Map<string, PluginSettings> {
    const settings = localStorage.getItem(`${CONFIG_KEY}.plugins`);
    if (!settings) {
        return new Map();
    }

    const parsed = JSON.parse(settings);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return new Map();
    }

    return new Map(Object.entries(parsed));
}

function saveSettings() {
    const plain: Record<string, any> = {};

    for (const [plugin, state] of settingsValues.entries()) {
        plain[plugin] = { ...state };
    }

    localStorage.setItem(`${CONFIG_KEY}.plugins`, JSON.stringify(plain));
}

function createSettingsProxy(plugin: string, settings: PluginSettings): PluginSettings {
    const options = pluginOptions.get(plugin);
    if (!options) {
        throw new Error(`Tried to create proxy for non-existent plugin ${plugin}`);
    }

    function getOptionOrThrow(key: string) {
        const option = options?.[key];

        if (!option) {
            throw new Error(`Unknown option: ${key}`);
        }

        return option;
    }

    return new Proxy(settings, {
        get(target, key: string) {
            if (key === "enabled") {
                return target.enabled;
            }

            const option = getOptionOrThrow(key);
            return target[key] ?? option.default;
        },
        set(target, key: string, value) {
            if (key === "enabled") {
                target.enabled = value;
                saveSettings();

                return true;
            }

            const option = getOptionOrThrow(key);

            target[key] = value;
            saveSettings();

            option.onChange?.(value as never);

            return true;
        }
    });
}

export function registerPluginOptions<
    T extends PluginOptions,
    // Magic to convert T into a usable Record
    R = {
        [K in keyof T]: T[K]["default"];
    }
>(plugin: Plugin, options: T): R {
    if (pluginOptions.has(plugin.name)) {
        throw new Error(`Plugin ${plugin.name} tried to register options twice`);
    }

    if (Object.keys(options).includes("enabled")) {
        throw new Error("Option with name 'enabled' is reserved");
    }

    pluginOptions.set(plugin.name, options);

    let state = settingsValues.get(plugin.name);
    if (!state) {
        state = createSettingsProxy(plugin.name, { enabled: plugin.enabledByDefault ?? false });
        settingsValues.set(plugin.name, state);
    }

    return state as R;
}

export function isPluginEnabled(plugin: Plugin): boolean {
    return (
        plugin.required ??
        settingsValues.get(plugin.name)?.enabled ??
        plugin.enabledByDefault ??
        false
    );
}
