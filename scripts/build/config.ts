import type { TargetPlatform } from ".";

export const entrypoints: Record<TargetPlatform, string[]> = {
    desktop: ["xpui-snapshot.js", "xpui.js"],
    webos: ["https://tv.scdn.co/webos/v2/3232bdc/js/spotifytv.js"]
};

export const webpackChunkName: Record<TargetPlatform, string> = {
    desktop: "webpackChunkclient_web",
    webos: "webpackChunkSpotifyTVApp"
};
