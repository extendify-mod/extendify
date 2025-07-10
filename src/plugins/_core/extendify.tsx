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
                    // Turn every module into a function instead of an arrow function:
                    // 1111: (a, b, c) => {} -> 1111: function(a, b, c) {}
                    // 2222: (a, b) => {}    -> 2222: function(a, b) {}
                    // 3333: a => {}         -> 3333: function(a) {}
                    // 4444: module => {}    -> 4444: function(module) {}
                    // ^ there's one of these that exists where there is only one argument which has a full name (module)
                    // If the module is already a function, which there is at least one example of, this patch will not apply
                    noWarn: true,
                    match: /(function)?(?:\((.*?)\)|(.|module))=>{/,
                    replace: (match, func, args1, args2) => {
                        return func ? match : `function(${args1 ?? args2}){`;
                    }
                },
                {
                    // Inject the exporter at the very start of the function
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
                match: /return (\i)\.displayName=/,
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
