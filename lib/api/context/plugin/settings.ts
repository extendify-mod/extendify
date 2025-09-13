import type { Plugin } from "@api/context/plugin";
import { pluginOptions, plugins, settingsValues } from "@api/registry";
import { CONFIG_KEY } from "@shared/constants";
import { createLogger } from "@shared/logger";

export type PluginOptionType = "string" | "number" | "boolean" | "select" | "slider";

export interface PluginOption<T extends PluginOptionType, R = any> {
    type: T;
    description: string;
    default?: R;
    restartNeeded?: boolean;
    hidden?: boolean;
    onChange?(newValue: R): void;
    isValid?(value: R): boolean;
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

const logger = createLogger({ name: "Settings" });

function createDefaultMap(): Map<string, PluginSettings> {
    const map = new Map<string, PluginSettings>();

    for (const plugin of plugins) {
        map.set(
            plugin.name,
            createSettingsProxy(plugin.name, {
                enabled: isPluginEnabled(plugin)
            })
        );
    }

    return map;
}

function loadSettings(): Map<string, PluginSettings> {
    const settings = localStorage.getItem(`${CONFIG_KEY}.plugins`);
    if (!settings) {
        return createDefaultMap();
    }

    const parsed = JSON.parse(settings);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return createDefaultMap();
    }

    const savedMap = new Map(
        Object.entries(parsed).map(([plugin, saved]) => [
            plugin,
            createSettingsProxy(plugin, saved as PluginSettings)
        ])
    );
    const defaultMap = createDefaultMap();

    for (const [plugin, settings] of defaultMap) {
        if (savedMap.has(plugin)) {
            continue;
        }

        savedMap.set(plugin, settings);
    }

    return savedMap;
}

function initializeSettings() {
    for (const [key, value] of loadSettings()) {
        settingsValues.set(key, value);
    }
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
                logger.debug(`${value ? "Enabled" : "Disabled"} plugin ${plugin}`);

                target.enabled = value;
                saveSettings();

                return true;
            }

            const option = getOptionOrThrow(key);

            logger.debug(`Set ${key} to ${value} for plugin ${plugin}`);

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
    initializeSettings();

    if (pluginOptions.has(plugin.name)) {
        throw new Error(`Plugin ${plugin.name} tried to register options twice`);
    }

    if (Object.keys(options).includes("enabled")) {
        throw new Error("Option with name 'enabled' is reserved");
    }

    pluginOptions.set(plugin.name, options);

    let state = settingsValues.get(plugin.name);
    if (!state) {
        state = createSettingsProxy(plugin.name, {
            enabled: isPluginEnabled(plugin)
        });
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

export function setPluginEnabled(plugin: Plugin, value: boolean = true) {
    initializeSettings();

    const settings = settingsValues.get(plugin.name);

    if (!settings) {
        throw new Error(`Tried to enable non-existent plugin ${plugin.name}`);
    }

    if (value && !plugin.started) {
        plugin.start?.();
        plugin.started = true;
    }

    if (!value && plugin.started) {
        plugin.stop?.();
        plugin.started = false;
    }

    settings.enabled = value;
}

export function pluginHasOptions(plugin: Plugin): boolean {
    return pluginOptions.has(plugin.name);
}
