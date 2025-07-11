/**
 * Modified version of Vendicated's plugins/index.ts, mergeDefaults.ts and SettingsStore.ts
 * @link https://github.com/Vendicated/Vencord/blob/main/src/plugins/index.ts,
 *       https://github.com/Vendicated/Vencord/blob/main/src/utils/mergeDefaults.ts,
 *       https://github.com/Vendicated/Vencord/blob/main/src/shared/SettingsStore.ts
 */
import { SettingsStore as SettingsStoreClass } from "@api/settingsStore";
import { CONFIG_KEY } from "@utils/constants";
import { Logger } from "@utils/logger";
import { DefinedSettings, OptionType, SettingsChecks, SettingsDefinition } from "@utils/types";
import { React, useEffect } from "@webpack/common";

import plugins from "~plugins";

const logger = new Logger("Settings");

export type SettingsType = {
    plugins: {
        [plugin: string]: {
            enabled: boolean;
            [setting: string]: any;
        };
    };
    enableQuickCss: boolean;
    enabledThemes: string[];
};

const DefaultSettings: SettingsType = {
    plugins: {},
    enableQuickCss: true,
    enabledThemes: []
};

const settings: SettingsType = window.EXTENDIFY_NATIVE_AVAILABLE
    ? window.ExtendifyNative.settings.get()
    : JSON.parse(localStorage.getItem(CONFIG_KEY) ?? "{}");
mergeDefaults(settings, DefaultSettings);

export const SettingsStore = new SettingsStoreClass(settings, {
    readOnly: true,
    getDefaultValue({ target, key, path }) {
        const v = target[key];
        if (!plugins) {
            return v;
        }

        if (path === "plugins" && key in plugins) {
            return (target[key] = {
                enabled: plugins[key].required || plugins[key].enabledByDefault || false
            });
        }

        if (path.startsWith("plugins.")) {
            const plugin = path.slice("plugins.".length);
            if (plugin in plugins) {
                const setting = plugins[plugin].options?.[key];
                if (!setting) {
                    return v;
                }

                if ("default" in setting) {
                    // Normal setting with a default value
                    return (target[key] = setting.default);
                }

                if (setting.type === OptionType.SELECT) {
                    const def = setting.options.find((o) => o.default);
                    if (def) {
                        target[key] = def.value;
                    }
                    return def?.value;
                }
            }
        }

        return v;
    }
});

SettingsStore.addGlobalChangeListener((_, path) => {
    if (window.EXTENDIFY_NATIVE_AVAILABLE) {
        window.ExtendifyNative.settings.set(SettingsStore.plain, path);
        return;
    }
    localStorage.setItem(
        CONFIG_KEY,
        JSON.stringify(SettingsStore.plain, (_, value) => (typeof value === "bigint" ? value.toString() : value))
    );
});

/**
 * Same as {@link SettingsType} but unproxied. You should treat this as readonly,
 * as modifying properties on this will not save to disk or call settings
 * listeners.
 * WARNING: default values specified in plugin.options will not be ensured here. In other words,
 * settings for which you specified a default value may be uninitialised. If you need proper
 * handling for default values, use {@link SettingsType}
 */
export const PlainSettings = settings;
/**
 * A smart settings object. Altering props automagically saves
 * the updated settings to disk.
 * This recursively proxies objects. If you need the object non proxied, use {@link PlainSettings}
 */
export const Settings = SettingsStore.store;

/**
 * Settings hook for React components. Returns a smart settings
 * object that automagically triggers a rerender if any properties
 * are altered
 * @param paths An optional list of paths to whitelist for rerenders
 * @returns Settings
 */
// TODO: Representing paths as essentially "string[].join('.')" wont allow dots in paths, change to "paths?: string[][]" later
export const useSettings = (paths?: UseSettings<SettingsType>[]) => {
    const [, forceUpdate] = React.useReducer(() => ({}), {});

    useEffect(() => {
        if (paths) {
            paths.forEach((p) => SettingsStore.addChangeListener(p, forceUpdate));
            return () => paths.forEach((p) => SettingsStore.removeChangeListener(p, forceUpdate));
        } else {
            SettingsStore.addGlobalChangeListener(forceUpdate);
            return () => SettingsStore.removeGlobalChangeListener(forceUpdate);
        }
    }, [paths]);

    return SettingsStore.store;
};

export const migratePluginSettings = (name: string, ...oldNames: string[]) => {
    const { plugins } = SettingsStore.plain;
    if (name in plugins) {
        return;
    }

    for (const oldName of oldNames) {
        if (oldName in plugins) {
            logger.info(`Migrating settings from old name ${oldName} to ${name}`);
            plugins[name] = plugins[oldName];
            delete plugins[oldName];
            SettingsStore.markAsChanged();
            break;
        }
    }
};

export const migratePluginSetting = (pluginName: string, oldSetting: string, newSetting: string) => {
    const settings = SettingsStore.plain.plugins[pluginName];
    if (!settings) {
        return;
    }

    if (!Object.hasOwn(settings, oldSetting) || Object.hasOwn(settings, newSetting)) {
        return;
    }

    settings[newSetting] = settings[oldSetting];
    delete settings[oldSetting];
    SettingsStore.markAsChanged();
};

export function definePluginSettings<
    Def extends SettingsDefinition,
    Checks extends SettingsChecks<Def>,
    PrivateSettings extends object = {}
>(def: Def, checks?: Checks) {
    const definedSettings: DefinedSettings<Def, Checks, PrivateSettings> = {
        get store() {
            if (!definedSettings.pluginName) {
                throw new Error("Cannot access settings before plugin is initialized");
            }
            return Settings.plugins[definedSettings.pluginName] as any;
        },
        get plain() {
            if (!definedSettings.pluginName) {
                throw new Error("Cannot access settings before plugin is initialized");
            }
            return PlainSettings.plugins[definedSettings.pluginName] as any;
        },
        use: (settings) => {
            return useSettings(
                settings?.map((name) => `plugins.${definedSettings.pluginName}.${name}`) as UseSettings<SettingsType>[]
            ).plugins[definedSettings.pluginName] as any;
        },
        def,
        checks: checks ?? ({} as any),
        pluginName: "",
        withPrivateSettings<T extends object>() {
            return this as DefinedSettings<Def, Checks, T>;
        }
    };

    return definedSettings;
}

function mergeDefaults<T>(obj: T, defaults: T): T {
    for (const key in defaults) {
        const v = defaults[key];
        if (typeof v === "object" && !Array.isArray(v)) {
            obj[key] ??= {} as any;
            mergeDefaults(obj[key], v);
        } else {
            obj[key] ??= v;
        }
    }
    return obj;
}

type UseSettings<T extends object> = ResolveUseSettings<T>[keyof T];

type ResolveUseSettings<T extends object> = {
    [Key in keyof T]: Key extends string
        ? T[Key] extends Record<string, unknown>
            ? UseSettings<T[Key]> extends string
                ? // @ts-ignore "Type instantiation is excessively deep and possibly infinite"
                  `${Key}.${UseSettings<T[Key]>}`
                : never
            : Key
        : never;
};
