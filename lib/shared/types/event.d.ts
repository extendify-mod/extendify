import type { EventType } from "@api/event";
import type { Song } from "@shared/types/spotify/player";

export interface EventArgs {
    [EventType.PLATFORM_LOADED]: [];
    [EventType.PLAY]: [state: PlayerState];
    [EventType.PAUSE]: [state: PlayerState];
    [EventType.SONG_CHANGED]: [newSong: Song, state: PlayerState];
    [EventType.QUEUE_ADDED]: [songs: Song[], state: PlayerState];
    [EventType.QUEUE_REMOVED]: [songs: Song[], state: PlayerState];
}

export type EventListener<E extends EventType> = (...args: EventArgs[E]) => void;
