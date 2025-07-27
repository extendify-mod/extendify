import { exportFunction, registerPatch } from "@api/patch";
import { registerPlugin } from "@api/plugin";

const { plugin } = registerPlugin({
    name: "NoMusicVideos",
    description: "Removes all mentions of music videos",
    authors: ["7elia"]
});

// Remove the "Switch to video" button
registerPatch(
    plugin,
    {
        find: {
            matches: ["npbSwitchButtonContainer", "card.tag.music-video"],
            mode: "all"
        },
        replacement: {
            match: /(switch-to-video"\);return).*?}\)\]}\)/,
            replace: "$1 $exp.getEmptyElement()"
        }
    },
    {
        find: "switch_video_button_click",
        replacement: {
            match: /return \i\?\(0,.*?}\)\]}\)}\):null/,
            replace: "return $exp.getEmptyElement()"
        }
    }
);

// Remove the canvas
registerPatch(
    plugin,
    {
        find: "canvasVideosEnabled",
        replacement: {
            match: /return \i}/,
            replace: "return false}"
        }
    },
    {
        find: "contextmenu.looping-visuals-hide.feedback",
        replacement: {
            match: /return\(0,.*?\)}\)/,
            replace: "return $exp.getEmptyElement()"
        }
    }
);

// Hide the "Music Video" tag
// TODO: EJSOEIHGAPWOFJSOEGHISGEHISEFOSJPESJGPAWOKFPSEJGSE
registerPatch(
    plugin,
    {
        find: {
            matches: ["internal-track-link", "rowImage"],
            mode: "any"
        },
        all: true,
        noWarn: true,
        noError: true,
        replacement: {
            match: /(isVideo:)\i(?:\|\|\i)?([,}])/g,
            replace(_, key, suffix) {
                return `${key}false${suffix}`;
            }
        }
    },
    {
        find: "isVideo:!1",
        replacement: {
            match: /(\i\.isVideo=)!0/,
            replace: "$1false"
        }
    }
);

// Remove "Related music videos"
registerPatch(plugin, {
    find: "queryNpvArtist",
    replacement: {
        match: /(enableRelatedVideos:).*?([,}])/,
        replace: "$1false$2"
    }
});

exportFunction(plugin, function getEmptyElement() {
    return "";
});
