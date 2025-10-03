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
