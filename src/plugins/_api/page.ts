import { Devs } from "@utils/constants";
import { definePlugin } from "@utils/types";

export default definePlugin({
    name: "PageAPI",
    description: "API to add pages",
    authors: [Devs.elia],
    required: true,
    patches: [
        {
            find: '"data-testid":"top-bar-back-button"',
            replacement: [
                {
                    match: /(type:"locale",uri:"home"}\);return)(\[\(0,.*?\])(}\)\({isDesktop:)/,
                    replace: (_, prefix, children, suffix) => {
                        return `${prefix} Extendify.Api.Page._injectPages(${children})${suffix}`;
                    }
                },
                {
                    match: /(children:\[)(\(0,.\.jsx\)\(..,{}\),)(\(0,.\.jsxs\)\("div",{className:"main-view-container",)/,
                    replace: (_, prefix, __, suffix) => {
                        return `${prefix}${suffix}`;
                    }
                }
            ]
        }
    ]
});
