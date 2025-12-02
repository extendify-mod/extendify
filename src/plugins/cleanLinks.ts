import { exportFunction, registerPatch } from "@api/context/patch";
import { registerPlugin } from "@api/context/plugin";

const { plugin } = registerPlugin({
    authors: ["7elia"],
    description: "Removes tracking from sharing links",
    enabledByDefault: true,
    name: "CleanLinks",
    platforms: ["desktop", "browser"]
});

registerPatch(plugin, {
    find: "feedback.link-copied",
    replacement: {
        match: /(const{shareUrl:\i,shareId:\i})=(\i)/,
        replace: "$1={...$2,shareUrl:$exp.removeShareId($2.shareUrl)}"
    }
});

exportFunction(plugin, function removeShareId(shareUrl: string) {
    const url = new URL(shareUrl);
    url.searchParams.delete("si");
    return url.toString();
});
