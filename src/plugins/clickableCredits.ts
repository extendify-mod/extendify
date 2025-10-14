import { registerPatch } from "@api/context/patch";
import { registerPlugin } from "@api/context/plugin";

const { plugin } = registerPlugin({
    name: "ClickableCredits",
    description: "Makes all credited artists clickable",
    authors: ["7elia"],
    platforms: ["desktop", "browser"]
});

registerPatch(plugin, {
    find: "isArtistUriLinkable",
    replacement: {
        match: /(\i=>)(\i)\.isArtistUriLinkable/,
        replace: "$1!!$2.artistUri"
    }
});
