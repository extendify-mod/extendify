import type { TargetPlatform } from "@extendify/shared/types";

export const entrypoints: Record<TargetPlatform, string[]> = {
    browser: [],
    desktop: ["xpui-snapshot.js", "xpui.js"]
};

export const webpackChunkNames: Record<TargetPlatform, string[]> = {
    browser: ["webpackChunkclient_web", "rspackChunkclient_web"],
    desktop: ["webpackChunkclient_web", "rspackChunkclient_web"]
};
