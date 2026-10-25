import { registerPatch } from "@extendify/api/context/patch";
import { registerPlugin } from "@extendify/api/context/plugin";

const { plugin } = registerPlugin({
    authors: ["wynjamin"],
    description: "Removes tracking from sharing links",
    enabledByDefault: true,
    name: "CleanLinks",
    platforms: ["desktop", "browser"]
});

registerPatch(plugin, {
    find: "feedback.link-copied",
    replacement: {
        match: /\?si=\${\i}/g,
        replace: ""
    }
});
