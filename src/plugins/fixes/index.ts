import "./index.css";

import { registerPatch } from "@api/context/patch";
import { registerPlugin } from "@api/context/plugin";

const { plugin } = registerPlugin({
    name: "Fixes",
    description: "Provides some fixes for Spotify",
    authors: ["7elia"],
    enabledByDefault: true,
    platforms: ["desktop"]
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
