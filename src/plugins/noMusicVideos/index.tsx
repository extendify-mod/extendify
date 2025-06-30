import { Devs } from "@utils/constants";
import { definePlugin } from "@utils/types";

export default definePlugin({
    name: "NoMusicVideos",
    description: "Removes all music videos from Spotify",
    authors: [Devs.elia],
    patches: [
        {
            // Remove the "Switch to video" button
            find: "npbSwitchButtonContainer,",
            replacement: {
                match: /(switch-to-video"\);return).*?}\)\]}\)/,
                replace: (_, prefix) => {
                    return `${prefix} $self.getEmptyElement()`;
                }
            }
        },
        {
            // Remove the "Switch to video" button
            find: "switch_video_button_click",
            replacement: {
                match: /return .{1,3}?\?\(0,.*?}\)\]}\)}\):null/,
                replace: "return $self.getEmptyElement()"
            }
        },
        {
            // Always show art instead of canvas
            find: "canvasVideosEnabled",
            replacement: {
                match: /return .*?}/,
                replace: "return false}"
            }
        },
        {
            // Remove the canvas
            find: "contextmenu.looping-visuals-hide.feedback",
            replacement: {
                match: /return\(0,.*?\)}\)/,
                replace: "return $self.getEmptyElement()"
            }
        },
        {
            // Hide the "Music Video" tag
            find: "internal-track-link",
            all: true,
            noWarn: true,
            replacement: {
                match: /(isVideo:).{1,3}\|\|.{1,3}([,}])/,
                replace: (_, prefix, suffix) => {
                    return `${prefix}false${suffix}`;
                }
            }
        },
        {
            // Remove "Related music videos"
            find: "queryNpvArtist",
            replacement: {
                match: /(enableRelatedVideos:).*?([,}])/,
                replace: (_, prefix, suffix) => {
                    return `${prefix}false${suffix}`;
                }
            }
        }
    ],
    getEmptyElement() {
        return <></>;
    }
});

// 72655.P
