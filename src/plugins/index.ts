import { ContextMenuType, addContextMenuEntry } from "@api/contextMenu";
import { addPage, removePage } from "@api/page";
import { Settings, SettingsStore } from "@api/settings";
import { addTopbarElement, removeTopbarElement } from "@api/topbar";
import { Logger } from "@utils/logger";
import { canonicalizeFind } from "@utils/patches";
import { Patch, Plugin, StartAt } from "@utils/types";
import { player } from "@webpack/common";
import { PlayerEventType, PlayerState, Song } from "@webpack/types";

import { diffArrays } from "diff";
import Plugins from "~plugins";

const logger = new Logger("PluginManager", "#a6d189");

export const plugins = Plugins;
export const patches = [] as Patch[];

const pluginsValues = Object.values(Plugins);

export const isPluginEnabled = (p: string) => {
    return (Plugins[p]?.required || Plugins[p]?.isDependency || Settings?.plugins[p]?.enabled) ?? false;
};

export function addPatch(newPatch: Omit<Patch, "plugin">, pluginName: string) {
    const patch = newPatch as Patch;
    patch.plugin = pluginName;

    if (patch.predicate && !patch.predicate()) {
        return;
    }

    canonicalizeFind(patch);
    if (!Array.isArray(patch.replacement)) {
        patch.replacement = [patch.replacement];
    }

    patch.replacement = patch.replacement.filter(({ predicate }) => !predicate || predicate());

    patches.push(patch);
}

const neededApiPlugins = new Set<string>();

// First round-trip to mark and force enable dependencies
// FIXME: might need to revisit this if there's ever nested dependencies (dependencies of dependencies) since this only
// goes for the top level and their children, but for now this works okay with the current API plugins
for (const p of pluginsValues) {
    if (isPluginEnabled(p.name)) {
        p.dependencies?.forEach((d) => {
            const dep = Plugins[d];
            if (!dep) {
                const error = new Error(`Plugin ${p.name} has unresolved dependency ${d}`);
                if (IS_DEV) {
                    throw error;
                }
                logger.warn(error);
                return;
            }

            Settings.plugins[d].enabled = true;
            dep.isDependency = true;
        });

        // if (p.pages?.length) {
        //     neededApiPlugins.add("PageAPI");
        // }
        // if (p.components?.renderTopbar) {
        //     neededApiPlugins.add("TopbarAPI");
        // }
    }
}

for (const p of neededApiPlugins) {
    Plugins[p].isDependency = true;
    Settings.plugins[p].enabled = true;
}

for (const p of pluginsValues) {
    if (p.settings) {
        p.options ??= {};

        p.settings.pluginName = p.name;
        for (const name in p.settings.def) {
            const def = p.settings.def[name];
            const checks = p.settings.checks?.[name];
            p.options[name] = { ...def, ...checks };
        }
    }

    if (p.options) {
        for (const name in p.options) {
            const opt = p.options[name];
            if (opt.onChange !== null) {
                SettingsStore.addChangeListener(`plugins.${p.name}.${name}`, opt.onChange!);
            }
        }
    }

    if (p.patches && isPluginEnabled(p.name)) {
        for (const patch of p.patches) {
            addPatch(patch, p.name);
        }
    }
}

export const startAllPlugins = (target: StartAt) => {
    logger.info(`Starting plugins (stage ${target})`);

    for (const name in Plugins) {
        if (isPluginEnabled(name)) {
            const p = Plugins[name];

            const startAt = p.startAt ?? StartAt.WebpackReady;
            if (startAt !== target) {
                continue;
            }

            startPlugin(p);
        }
    }
};

const getPluginsForEvent = (event?: string): Plugin[] => {
    if (!event) {
        return [];
    }

    const result: Plugin[] = [];

    for (const name in Plugins) {
        if (isPluginEnabled(name) && Plugins[name].events) {
            const p = Plugins[name];
            if (p.events?.[event]) {
                result.push(p);
            }
        }
    }

    return result;
};

let previousPlayerState: PlayerState = {} as PlayerState;
let previousQueue: Song[] = [];

export const createEventListeners = () => {
    player.getEvents().addListener(PlayerEventType.UPDATE, (e: { data: PlayerState }) => {
        if (!previousPlayerState) {
            previousPlayerState = e.data;
            return;
        }

        if (e.data.isPaused !== previousPlayerState.isPaused) {
            if (e.data.isPaused) {
                getPluginsForEvent("onPause").forEach((p) => p.events?.onPause!(e.data));
            } else {
                getPluginsForEvent("onPlay").forEach((p) => p.events?.onPlay!(e.data));
            }
        }

        if (previousPlayerState.item && e.data.item?.uri !== previousPlayerState.item.uri) {
            getPluginsForEvent("onSongChange").forEach((p) => p.events?.onSongChange!(e.data.item!, e.data));
        }

        previousPlayerState = e.data;
    });

    player.getEvents().addListener(PlayerEventType.QUEUE_ACTION_COMPLETE, (_) => {
        if (previousQueue) {
            const diff = diffArrays(previousQueue, player.getQueue().queued, {
                comparator: (left, right) => left.uri === right.uri
            });
            for (const result of diff) {
                const event = result.added ? "onQueueAdded" : result.removed ? "onQueueRemoved" : undefined;
                if (!event) {
                    continue;
                }
                getPluginsForEvent(event).forEach((p) => p.events?.[event]!(result.value, player.getState()));
            }
        }

        previousQueue = player.getQueue().queued;
    });
};

export const startDependenciesRecursive = (p: Plugin): { restartNeeded: boolean; failures: string[] } => {
    let restartNeeded = false;
    const failures: string[] = [];

    p.dependencies?.forEach((d) => {
        if (!Settings.plugins[d].enabled) {
            const dep = Plugins[d];
            startDependenciesRecursive(dep);

            Settings.plugins[d].enabled = true;
            dep.isDependency = true;

            if (dep.patches) {
                logger.warn(`Enabling dependency ${d} requires restart.`);
                restartNeeded = true;
                // If the plugin has patches, don't start the plugin, just enable it
                return;
            }

            const result = startPlugin(dep);
            if (!result) {
                failures.push(d);
            }
        }
    });

    return { restartNeeded, failures };
};

export const startPlugin = (p: Plugin) => {
    const { name } = p;

    logger.info("Starting plugin", name);

    if (p.start) {
        if (p.started) {
            logger.warn(`${name} already started`);
            return false;
        }
        try {
            p.start();
        } catch (e) {
            logger.error(`Failed to start ${name}`, e);
            return false;
        }
    }

    if (p.pages) {
        for (const key in p.pages) {
            addPage(key, p.pages[key]);
        }
    }

    if (p.components) {
        const { renderTopbar, contextMenu } = p.components;
        if (renderTopbar) {
            addTopbarElement(name, renderTopbar);
        }

        if (contextMenu) {
            Object.entries(contextMenu).forEach(([menuType, components]) => {
                const items = Array.isArray(components) ? components : [components];

                for (const component of items) {
                    addContextMenuEntry(menuType as unknown as ContextMenuType, component);
                }
            });
        }
    }

    p.started = true;

    return true;
};

export const stopPlugin = (p: Plugin) => {
    const { name } = p;

    if (p.stop) {
        logger.info("Stopping plugin", name);
        if (!p.started) {
            logger.warn(`${name} already stopped`);
            return false;
        }
        try {
            p.stop();
        } catch (e) {
            logger.error(`Failed to stop ${name}`, e);
            return false;
        }
    }

    if (p.pages) {
        for (const key in p.pages) {
            removePage(key);
        }
    }

    if (p.components) {
        if (p.components.renderTopbar) {
            removeTopbarElement(p.name);
        }
    }

    p.started = false;

    return true;
};

export const setPluginEnabled = (plugin: Plugin, value: boolean, onRestartNeeded: (name: string) => void) => {
    const settings = Settings.plugins[plugin.name];

    if (value) {
        const { restartNeeded, failures } = startDependenciesRecursive(plugin);
        if (failures.length) {
            logger.error(`Failed to start dependencies for ${plugin.name}: ${failures.join(", ")}`);
            return;
        } else if (restartNeeded) {
            settings.enabled = true;
            onRestartNeeded(plugin.name);
            return;
        }
    }

    if (plugin.patches?.length) {
        settings.enabled = value;
        onRestartNeeded(plugin.name);
        return;
    }

    if (!value && !plugin.started) {
        settings.enabled = value;
        return;
    }

    const result = !value ? stopPlugin(plugin) : startPlugin(plugin);
    if (!result) {
        settings.enabled = false;
        logger.error(`Error while ${!value ? "stopping" : "starting"} plugin ${plugin.name}`);
        return;
    }

    settings.enabled = value;
};
