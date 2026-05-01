import { registerPlugin } from "@api/context/plugin";
import { executeQuery, findQuery } from "@api/gql";
import { registerApiOverride } from "@api/platform";
import type { Song } from "@shared/types/spotify/player";
import type { PlaylistAPI, PlaylistItems, PlaylistQueryOptions } from "@shared/types/spotify/queue";
import { exportFilters, findModuleExportLazy } from "@webpack/module";

import { filterResults } from "./filter";

interface PlaylistV2 {
    content: {
        items: any[];
        pagingInfo: {
            limit: number;
            offset: number;
        };
    };
}

const itemConverter = findModuleExportLazy<(item: any) => Song>(
    exportFilters.byCode(/\i\.addedAt\?\.isoString/)
);

const { plugin } = registerPlugin({
    authors: ["7elia"],
    description: "Enables playlist sorting in the browser",
    name: "BrowserSorting",
    platforms: ["browser"]
});

registerApiOverride(plugin, "PlaylistAPI", function getCapabilities() {
    return {
        canDecorateAddedBy: false,
        canFetchAllTracks: true,
        canFilter: true,
        canModifyOffline: false,
        canMoveMultipleItems: true,
        canSort: true,
        hasUidsGeneratedFromIndicies: false
    };
});

registerApiOverride(
    plugin,
    "PlaylistAPI",
    async function getPlaylistInternal(
        this: PlaylistAPI,
        uri: string,
        options: PlaylistQueryOptions
    ) {
        return {
            contents: await this.getPlaylistContents(uri, options),
            metadata: await this.getPlaylistMetadata(uri)
        };
    }
);

registerApiOverride(
    plugin,
    "PlaylistAPI",
    async function getPlaylistContents(
        this: PlaylistAPI,
        uri: string,
        options: PlaylistQueryOptions
    ): Promise<PlaylistItems> {
        const query = findQuery("fetchPlaylistContents");
        if (!query) {
            throw new Error("fetchPlaylistContents not found");
        }

        const { items, pagingInfo } = (
            await executeQuery<{ playlistV2: PlaylistV2 }>(query, {
                limit: 5000,
                offset: 0,
                uri
            })
        ).data.playlistV2.content;
        const results = filterResults(items.map(itemConverter), options);

        return {
            items: results,
            limit: pagingInfo.limit,
            offset: pagingInfo.offset,
            totalLength: results.length
        };
    }
);
