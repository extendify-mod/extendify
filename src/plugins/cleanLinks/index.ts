import { registerPatch } from "@api/patch";
import { registerPlugin } from "@api/plugin";

const plugin = registerPlugin({
    name: "CleanLinks",
    authors: ["7elia"],
    description: "Removes tracking from sharing links",
    enabledByDefault: true
});

registerPatch(plugin, {
    find: '"copy_link"',
    replacement: {
        match: /\?si=\$.*?`/g,
        replace: "`"
    }
});
