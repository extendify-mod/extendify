import type { Context } from "@api/context";
import type { Plugin } from "@api/context/plugin";

export const contexts: Set<Context["name"]> = new Set();
export const plugins: Set<Plugin> = new Set();
