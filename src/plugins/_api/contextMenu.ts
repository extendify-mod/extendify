import { Devs } from "@utils/constants";
import { definePlugin } from "@utils/types";

export default definePlugin({
    name: "ContextMenuAPI",
    description: "API to add actions to context menus",
    authors: [Devs.elia],
    required: true,
    patches: [
        {
            find: 'role:\"menu\"',
            replacement: {
                match: /(,children:)(\i)/,
                replace: (_, prefix, children) => {
                    return `${prefix}Extendify.Api.ContextMenu.injectEntries(${children})`;
                }
            }
        }
    ]
});
