import { exportFunction, registerPatch } from "@api/context/patch";
import { registerPlugin } from "@api/context/plugin";
import { registerContextOptions } from "@api/context/settings";

import ArtistCards from "./ArtistCards";

const { plugin } = registerPlugin({
    name: "MoreArtistCards",
    description: "Displays every artist in the Now Playing section",
    authors: ["7elia"],
    platforms: ["desktop", "browser"]
});

const options = registerContextOptions(plugin, {
    hideImages: {
        type: "boolean",
        description: "Hide artist images from the artist card",
        default: false,
        restartNeeded: true
    },
    alwaysShow: {
        type: "boolean",
        description: "Show artist cards even if they don't have a description",
        default: true,
        restartNeeded: true
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
    replacement: {
        match: /(children:\[)(\(0,.*?name:\i}\),)/,
        replace: "$1"
    },
    predicate() {
        return options.hideImages;
    }
});

// Skips the check for an empty biography
registerPatch(plugin, {
    find: "NPVArtistAboutV2",
    replacement: {
        match: /!\i\.biography\?\.text/,
        replace: "false"
    },
    predicate() {
        return options.alwaysShow;
    }
});

exportFunction(plugin, function getArtistCards() {
    return <ArtistCards />;
});
