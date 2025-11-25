import type { TargetPlatform } from "@shared/types";

export const entrypoints: Record<TargetPlatform, string[]> = {
    desktop: ["xpui-snapshot.js", "xpui.js"],
    browser: []
};

export const webpackChunkName: Record<TargetPlatform, string> = {
    desktop: "webpackChunkclient_web",
    browser: "webpackChunkclient_web"
};
