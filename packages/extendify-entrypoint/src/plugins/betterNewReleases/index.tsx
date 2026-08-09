import { exportFunction, registerPatch } from "@extendify/api/context/patch";
import { registerPlugin } from "@extendify/api/context/plugin";

import NewReleases from "./NewReleases";

const { plugin } = registerPlugin({
    authors: ["7elia"],
    description: "A replacement for Spotify's New Releases page",
    name: "BetterNewReleases",
    platforms: ["desktop", "browser"]
});

registerPatch(plugin, {
    find: "whats-new-feed-loading-skeleton",
    replacement: {
        match: /if\(\i\)return\(0,\i\.jsxs\)\("div",{className:"\i",role:"list"/,
        replace: "return $exp.createPage($props);$&"
    }
});

exportFunction(plugin, function createPage(props: FeedProps) {
    return <NewReleases {...props} />;
});

type ContentTypes = "ALBUM" | "EPISODE";

type FeedEntry = any;

interface Timestamp {
    isoString: string;
}

export interface FeedProps {
    data?: {
        whatsNewFeedItems: {
            items: {
                id: string;
                state: {
                    state: "SEEN" | "NEW"; // TODO: "NEW" is just a guess
                    timestamp: Timestamp;
                };
                timestamp: Timestamp;
                content: {
                    data: FeedEntry;
                };
            }[];
        };
    };
    error?: string;
    handleRetry(): void;
    includedContentTypes: ContentTypes[];
    loading: boolean;
}

export interface Group {
    entries: FeedEntry[];
    timestamp: Timestamp;
    label: string;
}
