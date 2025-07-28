import { registerContext } from "@api/context";
import { PlayerEventType, player } from "@api/platform";
import type { Context } from "@shared/types/context";
import type { EventArgs, EventListener } from "@shared/types/event";
import type { PlayerState, Song } from "@shared/types/spotify/player";

import { diffArrays } from "diff";

const { context, logger } = registerContext({ name: "Events" });

export enum EventType {
    PLATFORM_LOADED = "platformLoaded",
    PLAY = "play",
    PAUSE = "pause",
    SONG_CHANGED = "songChanged",
    QUEUE_ADDED = "queueAdded",
    QUEUE_REMOVED = "queueRemoved"
}

const registeredListeners: { [K in EventType]: Set<EventListener<K>> } = {
    [EventType.PLATFORM_LOADED]: new Set(),
    [EventType.PLAY]: new Set(),
    [EventType.PAUSE]: new Set(),
    [EventType.SONG_CHANGED]: new Set(),
    [EventType.QUEUE_ADDED]: new Set(),
    [EventType.QUEUE_REMOVED]: new Set()
};

let previousPlayerState: PlayerState | undefined;
let previousQueue: Song[] | undefined;

// TODO: Bind event listeners to contexts so we can remove the subscriptions
export function registerEventListener<E extends EventType>(
    context: Context,
    event: E,
    callback: (...args: EventArgs[E]) => void
) {
    registeredListeners[event].add(callback);

    logger.debug(`Context ${context.name} registered new event listener for ${event}`);
}

export function emitEvent<E extends EventType>(event: E, ...args: EventArgs[E]) {
    for (const callback of registeredListeners[event]) {
        callback(...args);
    }
}

function createPlayerEvents() {
    if (!player) {
        logger.error("Couldn't initialize events API because the Player API was not found");
        return;
    }

    player
        .getEvents()
        .addListener(PlayerEventType.UPDATE, ({ data: state }: { data: PlayerState }) => {
            onPlayerUpdate(state);
            previousPlayerState = state;
        });

    player.getEvents().addListener(PlayerEventType.QUEUE_ACTION_COMPLETE, () => {
        onQueueUpdate();
        previousQueue = player?.getQueue().queued;
    });

    logger.info("Created event listeners");
}

registerEventListener(context, EventType.PLATFORM_LOADED, createPlayerEvents);

function onPlayerUpdate(state: PlayerState) {
    if (!previousPlayerState) {
        previousPlayerState = state;

        logger.info("Stored initial player state");

        return;
    }

    if (state.isPaused && !previousPlayerState.isPaused) {
        emitEvent(EventType.PAUSE, state);
    }

    if (!state.isPaused && previousPlayerState.isPaused) {
        emitEvent(EventType.PLAY, state);
    }

    if (previousPlayerState.item && state.item && state.item.uri !== previousPlayerState.item.uri) {
        emitEvent(EventType.SONG_CHANGED, state.item, state);
    }
}

function onQueueUpdate() {
    if (!player) {
        return;
    }

    const queue = player.getQueue().queued;

    if (!previousQueue) {
        previousQueue = queue;

        logger.info("Stored initial queue");

        return;
    }

    const diff = diffArrays(previousQueue, queue, {
        comparator(a, b) {
            return a.uri === b.uri;
        }
    });
    const state = player.getState();

    for (const result of diff) {
        if (result.added) {
            emitEvent(EventType.QUEUE_ADDED, result.value, state);
        }

        if (result.removed) {
            emitEvent(EventType.QUEUE_REMOVED, result.value, state);
        }
    }
}
