import { Devs } from "@utils/constants";
import { definePlugin } from "@utils/types";

export default definePlugin({
    name: "CleanLinks",
    authors: [Devs.elia],
    description: "Removes tracking from sharing links",
    patches: [
        {
            find: '"copy_link"',
            replacement: {
                match: /\?si=\$.*?`/g,
                replace: "`"
            }
        }
    ]
});
