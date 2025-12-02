import { exportFunction, registerPatch } from "@api/context/patch";
import { registerPlugin } from "@api/context/plugin";
import { registerContextOptions } from "@api/context/settings";

import ArtistCards from "./ArtistCards";

const { plugin } = registerPlugin({
    authors: ["7elia"],
    description: "Displays every artist in the Now Playing section",
    name: "MoreArtistCards",
    platforms: ["desktop", "browser"]
});

const options = registerContextOptions(plugin, {
    alwaysShow: {
        default: true,
        description: "Show artist cards even if they don't have a description",
        restartNeeded: true,
        type: "boolean"
    },
    hideImages: {
        default: false,
        description: "Hide artist images from the artist card",
        restartNeeded: true,
        type: "boolean"
    }
});

// Replaces the ArtistAbout component with our custom handler
registerPatch(plugin, {
    find: "NPVLyrics",
    replacement: {
        match: /(\(0,\i\.jsx\)\(\i\.\i,){artistUri:.+?,.+?}\)/,
        replace: "$exp.getArtistCards()"
    }
});

// Removes the image from the ArtistAbout component
registerPatch(plugin, {
    find: "web-player.now-playing-view.artist-about.title",
    predicate() {
        return options.hideImages;
    },
    replacement: {
        match: /(children:\[)(\(0,.*?name:\i}\),)/,
        replace: "$1"
    }
});

// Skips the check for an empty biography
registerPatch(plugin, {
    find: "NPVArtistAboutV2",
    predicate() {
        return options.alwaysShow;
    },
    replacement: {
        match: /!\i\.biography\?\.text/,
        replace: "false"
    }
});

exportFunction(plugin, function getArtistCards() {
    return <ArtistCards />;
});
