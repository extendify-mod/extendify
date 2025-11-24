import type { Context } from "@api/context";
import type { Patch } from "@api/context/patch";
import type { Plugin } from "@api/context/plugin";
import type { ContextOptions, ContextSettings } from "@api/context/settings";
import type { ApiOverride } from "@api/platform";
import type { WebpackRawModules } from "@shared/types/webpack";

export const contexts: Set<Context> = new Set();
export const plugins: Set<Plugin> = new Set();
export const contextOptions: Map<string, ContextOptions> = new Map();
export const settingsValues: Map<string, ContextSettings> = new Map();
export const patches: Patch[] = [];
export const moduleCache: WebpackRawModules = {};
export const overriddenFunctions: ApiOverride[] = [];
