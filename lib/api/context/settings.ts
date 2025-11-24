import type { Context } from "@api/context";
import { emitEvent } from "@api/context/event";
import { type Plugin, isPlugin } from "@api/context/plugin";
import { contextOptions, contexts, settingsValues } from "@api/registry";
import { CONFIG_KEY } from "@shared/constants";
import { createLogger } from "@shared/logger";

export type ContextOptionType = "string" | "number" | "boolean" | "select" | "slider";

export interface ContextOption<T extends ContextOptionType, R = any> {
    type: T;
    description: string;
    default: R;
    restartNeeded?: boolean;
    hidden?: boolean;
    onChange?(newValue: R): void;
    isValid?(value: R): boolean;
}

export interface SelectContextOption extends ContextOption<"select", string> {
    options: string[];
}

export interface SliderContextOption extends ContextOption<"slider", number> {
    min: number;
    max: number;
}

export type StringContextOption = ContextOption<"string", string>;
export type NumberContextOption = ContextOption<"number", number>;
export type BooleanContextOption = ContextOption<"boolean", boolean>;

export type AnyContextOption =
    | StringContextOption
    | NumberContextOption
    | BooleanContextOption
    | SelectContextOption
    | SliderContextOption;

export type ContextOptions = Record<string, AnyContextOption>;
export type ContextSettings = Record<string, any> & { enabled?: boolean };

const logger = createLogger({ name: "Settings" });

initializeSettings();

function createDefaultMap(): Map<string, ContextSettings> {
    const map = new Map<string, ContextSettings>();

    for (const context of Array.from(contexts.values())) {
        map.set(context.name, createSettingsProxy(context.name, getDefaultSettings(context)));
    }

    return map;
}

function getDefaultSettings(context: Context) {
    if (!isPlugin(context)) {
        return {};
    }

    return { enabled: isPluginEnabled(context as Plugin) };
}

function loadSettings(): Map<string, ContextSettings> {
    const settings = localStorage.getItem(`${CONFIG_KEY}`);
    if (!settings) {
        logger.info("Creating context config");

        const defaultOptions = createDefaultMap();
        saveSettings(defaultOptions);

        return defaultOptions;
    }

    const parsed = JSON.parse(settings);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        logger.warn("Invalid config format was parsed");
        return createDefaultMap();
    }

    const savedMap = new Map(
        Object.entries(parsed).map(([context, saved]) => {
            return [context, createSettingsProxy(context, saved as ContextSettings)];
        })
    );
    const defaultMap = createDefaultMap();

    for (const [context, settings] of Array.from(defaultMap.entries())) {
        if (savedMap.has(context)) {
            continue;
        }

        savedMap.set(context, settings);
    }

    return savedMap;
}

function initializeSettings() {
    for (const [key, value] of Array.from(loadSettings().entries())) {
        settingsValues.set(key, value);
    }
}

function saveSettings(values: typeof settingsValues = settingsValues) {
    const plain: Record<string, any> = {};

    for (const [context, state] of Array.from(values.entries())) {
        plain[context] = { ...state };
    }

    localStorage.setItem(`${CONFIG_KEY}`, JSON.stringify(plain));
}

function createSettingsProxy(context: string, settings: ContextSettings): ContextSettings {
    function getOptionOrThrow(key: string) {
        const option = contextOptions.get(context)?.[key];

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
            if (key === "enabled" && isPlugin(context)) {
                logger.debug(`${value ? "Enabled" : "Disabled"} plugin ${context}`);

                target.enabled = value;
                saveSettings();

                return true;
            }

            const option = getOptionOrThrow(key);

            logger.debug(`Set ${key} to ${value} for context ${context}`);

            target[key] = value;
            settingsValues.set(context, target);

            saveSettings();

            option.onChange?.(value as never);

            return true;
        }
    });
}

export function registerContextOptions<
    T extends ContextOptions,
    // Magic to convert T into a usable Record
    R = {
        [K in keyof T]: T[K]["default"];
    }
>(context: Context, options: T): R {
    initializeSettings();

    if (contextOptions.has(context.name)) {
        throw new Error(`Plugin ${context.name} tried to register options twice`);
    }

    if (Object.keys(options).includes("enabled") && isPlugin(context)) {
        throw new Error("Option with name 'enabled' is reserved");
    }

    contextOptions.set(context.name, options);

    let state = settingsValues.get(context.name);
    if (!state) {
        state = createSettingsProxy(context.name, getDefaultSettings(context));
        settingsValues.set(context.name, state);
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

    settings.enabled = value;
    saveSettings();

    if (value && !plugin.started) {
        plugin.start?.();
        plugin.started = true;

        emitEvent("contextEnabled", plugin);
    }

    if (!value && plugin.started) {
        plugin.stop?.();
        plugin.started = false;

        emitEvent("contextDisabled", plugin);
    }
}

export function contextHasOptions(context: Context): boolean {
    return contextOptions.has(context.name);
}
