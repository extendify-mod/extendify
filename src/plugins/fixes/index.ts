import "./index.css";

import { registerPatch } from "@api/context/patch";
import { registerPlugin } from "@api/context/plugin";

const { plugin } = registerPlugin({
    authors: ["7elia"],
    description: "Provides some fixes for Spotify",
    enabledByDefault: true,
    name: "Fixes",
    platforms: ["desktop", "browser"]
});

/**
 * Changes the layout for the tracklist (#, Title, Plays, etc.) header
 * so that it doesn't randomly float at the top of the page after scrolling.
 */
registerPatch(plugin, {
    find: "tracklist.header.plays",
    replacement: {
        match: /(\i\.\i.trackListHeader,.*?style:{top:)\i/,
        replace: "$1 0"
    }
});
