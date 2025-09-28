import type { Context } from "@api/context";
import type { Patch } from "@api/context/patch";
import type { Plugin } from "@api/context/plugin";
import type { PluginOptions, PluginSettings } from "@api/context/plugin/settings";

export const contexts: Set<Context> = new Set();
export const plugins: Set<Plugin> = new Set();
export const pluginOptions: Map<string, PluginOptions> = new Map();
export const settingsValues: Map<string, PluginSettings> = new Map();
export const patches: Patch[] = [];
