import { ExtendifyPageComponent } from "@components/settings";

import { Devs } from "@utils/constants";
import { isPlayingLocally, redirectTo } from "@utils/spotify";
import { StartAt, definePlugin } from "@utils/types";
import { ButtonPrimary, player } from "@webpack/common";

export default definePlugin({
    name: "Extendify",
    description: "The core of Extendify",
    authors: [Devs.elia],
    required: true,
    patches: [
        {
            find: "",
            all: true,
            replacement: [
                {
                    noWarn: true,
                    match: /(function)?(?:\((.*?)\)|(.|module))=>{/,
                    replace: (match, func, args1, args2) => {
                        return func ? match : `function(${args1 ?? args2}){`;
                    }
                },
                {
                    match: "{",
                    replace: "{Extendify.Webpack.injectExporter(...arguments, (v) => eval(v));"
                }
            ]
        },
        {
            find: "const{createPlatformDesktop:",
            replacement: {
                match: /(;const .=)(await async function\(\){.*?}}\(\))/,
                replace: (_, prefix, call) => {
                    return `${prefix}Extendify.Webpack.Common._loadPlatform(${call})`;
                }
            }
        }
    ],
    components: {
        renderTopbar: () => (
            <ButtonPrimary size="small" onClick={(_: any) => redirectTo("/extendify")}>
                Extendify
            </ButtonPrimary>
        )
    },
    pages: {
        "/extendify": () => <ExtendifyPageComponent />
    },
    events: {
        /**
         * Sometimes Spotify keeps buffering when the next song starts playing and I have no idea why.
         * I hope this is a temporary solution.
         */
        onSongChange: () => {
            if (isPlayingLocally()) {
                player.seekTo(0);
            }
        }
    },
    startAt: StartAt.Init
});
