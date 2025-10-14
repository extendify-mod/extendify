import type { Capabilities } from "@shared/types/spotify";
import { Song } from "@shared/types/spotify/player";

export interface QueueState {
    current: Song;
    nextUp: Song[];
    queued: Song[];
}

export enum QueueAction {
    ADD = "add",
    REMOVE = "remove",
    CLEAR = "clear",
    INSERT = "insert",
    REORDER = "reorder"
}

export type SortField = "TITLE" | "ARTIST" | "ALBUM" | "ADDED_AT" | "DURATION";
export type SortOrder = "ASC" | "DESC";

export interface PlaylistQueryOptions {
    filter?: string;
    sort?: {
        field: SortField;
        order: SortOrder;
    };
}

export interface PlaylistItems {
    items: Song[];
    limit: number;
    offset: number;
    totalLength: number;
}

export interface PlaylistAPI {
    _username: string;
    _playlistAttributesCache: unknown;
    getCapabilities(): Capabilities;
    getPlaylistMetadata(uri: string): Promise<any>;
    getPlaylistContents(uri: string, options?: PlaylistQueryOptions): Promise<PlaylistItems>;
}
