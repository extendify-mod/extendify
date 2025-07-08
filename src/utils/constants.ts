import { PluginAuthor } from "./types";

export const WEBPACK_CHUNK = "webpackChunkclient_web";
export const LOGGER_NAME = "Extendify";
export const CONFIG_KEY = "extendify-opts";
export const ENTRYPOINT_SCRIPT = "xpui-snapshot.js";
export const XPUI_SCRIPT = "xpui.js";

export const Devs = Object.freeze({
    elia: {
        name: "Elia",
        github: "7elia"
    }
}) as Record<string, PluginAuthor>;
