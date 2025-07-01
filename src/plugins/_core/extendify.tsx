import { ExtendifyPageComponent } from "@components/settings";

import { Devs } from "@utils/constants";
import { redirectTo } from "@utils/spotify";
import { StartAt, definePlugin } from "@utils/types";
import { ButtonPrimary } from "@webpack/common";

export default definePlugin({
    name: "Extendify",
    description: "The core of Extendify",
    authors: [Devs.elia],
    required: true,
    patches: [
        {
            // This injects our custom exporter into every module c:
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
                    // Pretty clever: we just pass a function that runs `eval` from the module's scope so that we can reference local variables from our exporter!!
                    replace: "{Extendify.Webpack.injectExporter(...arguments, (v) => eval(v));"
                }
            ]
        },
        {
            // Load the desktop platform
            find: "const{createPlatformDesktop:",
            replacement: {
                match: /(;const .=)(await async function\(\){.*?}}\(\))/,
                replace: (_, prefix, call) => {
                    return `${prefix}Extendify.Webpack.Common._loadPlatform(${call})`;
                }
            }
        },
        {
            // This is to make sure that when components go through the React profiler they can still be picked up by findComponentByCode and similar functions.
            find: "displayName=`profiler(${",
            replacement: {
                match: /return (.{1,3})\.displayName=/,
                replace: (match, func) => {
                    return `${func}.toString=arguments[0].toString.bind(arguments[0]);${match}`;
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
    startAt: StartAt.Init
});
