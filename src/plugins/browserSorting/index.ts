import { registerPlugin } from "@api/context/plugin";
import { executeQuery, findQuery } from "@api/gql";
import { registerApiOverride } from "@api/platform";
import type { Song } from "@shared/types/spotify/player";
import type { PlaylistAPI, PlaylistItems, PlaylistQueryOptions } from "@shared/types/spotify/queue";
import { exportFilters, findModuleExportSync } from "@webpack/module";

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

const itemConverter = findModuleExportSync<(item: any) => Song>(
    exportFilters.byCode(/\i\.addedAt\?\.isoString/)
);

const { plugin } = registerPlugin({
    name: "BrowserSorting",
    description: "Enables playlist sorting in the browser",
    authors: ["7elia"],
    platforms: ["browser"]
});

registerApiOverride(plugin, "PlaylistAPI", function getCapabilities() {
    return {
        canSort: true,
        canFilter: true,
        canMoveMultipleItems: true,
        canFetchAllTracks: true,
        canModifyOffline: false,
        canDecorateAddedBy: false,
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
            metadata: await this.getPlaylistMetadata(uri),
            contents: await this.getPlaylistContents(uri, options)
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
        if (!itemConverter) {
            throw new Error("GQL Song -> Playlist Song converter not initialized");
        }

        const query = findQuery("fetchPlaylistContents");
        if (!query) {
            throw new Error("fetchPlaylistContents not found");
        }

        const { items, pagingInfo } = (
            await executeQuery<{ playlistV2: PlaylistV2 }>(query, {
                uri,
                offset: 0,
                limit: 5000
            })
        ).data.playlistV2.content;
        const results = filterResults(items.map(itemConverter), options);

        return {
            items: results,
            totalLength: results.length,
            limit: pagingInfo.limit,
            offset: pagingInfo.offset
        };
    }
);
