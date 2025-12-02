import { registerPatch } from "@api/context/patch";
import { registerPlugin } from "@api/context/plugin";

const { plugin } = registerPlugin({
    authors: ["7elia"],
    description: "Makes all credited artists clickable",
    name: "ClickableCredits",
    platforms: ["desktop", "browser"]
});

registerPatch(plugin, {
    find: "isArtistUriLinkable",
    replacement: {
        match: /(\i=>)(\i)\.isArtistUriLinkable/,
        replace: "$1!!$2.artistUri"
    }
});
