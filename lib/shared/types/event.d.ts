import type { Song } from "@shared/types/spotify/player";

export type EventType =
    | "platformLoaded"
    | "play"
    | "pause"
    | "songChanged"
    | "queueAdded"
    | "queueRemoved";

export interface EventArgs {
    platformLoaded: [];
    play: [state: PlayerState];
    pause: [state: PlayerState];
    songChanged: [newSong: Song, state: PlayerState];
    queueAdded: [songs: Song[], state: PlayerState];
    queueRemoved: [songs: Song[], state: PlayerState];
}

export type EventListener<E extends EventType> = (...args: EventArgs[E]) => void;

export interface RegisteredListener<E extends EventType> {
    type: E;
    callback: EventListener;
}
