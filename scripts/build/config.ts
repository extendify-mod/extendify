import type { TargetPlatform } from "@shared/types";

export const entrypoints: Record<TargetPlatform, string[]> = {
    browser: [],
    desktop: ["xpui-snapshot.js", "xpui.js"]
};

export const webpackChunkName: Record<TargetPlatform, string> = {
    browser: "webpackChunkclient_web",
    desktop: "webpackChunkclient_web"
};
