import { exportFunction, registerPatch } from "@api/context/patch";
import { registerPlugin } from "@api/context/plugin";
import { registerPluginOptions } from "@api/context/plugin/settings";

import ArtistCards from "./ArtistCards";

const { plugin } = registerPlugin({
    name: "MoreArtistCards",
    description: "Displays every artist in the Now Playing section",
    authors: ["7elia"],
    platforms: ["desktop", "browser"]
});

const options = registerPluginOptions(plugin, {
    hideImages: {
        type: "boolean",
        description: "Hide artist images from the artist card",
        default: false,
        restartNeeded: true
    }
});

registerPatch(plugin, {
    find: "NPVLyrics",
    replacement: {
        match: /(\(0,\i\.jsx\)\(\i\.\i,){artistUri:.+?,.+?}\)/,
        replace: "$exp.getArtistCards()"
    }
});

registerPatch(plugin, {
    find: "web-player.now-playing-view.artist-about.title",
    replacement: {
        match: /(children:\[)(\(0,.*?name:\i}\),)/,
        replace: "$1"
    },
    predicate() {
        return options.hideImages;
    }
});

exportFunction(plugin, function getArtistCards() {
    return <ArtistCards />;
});
