import { registerContext } from "@api/context";
import { emitEvent } from "@api/context/event";
import { exportFunction, registerPatch } from "@api/context/patch";
import { createLazy } from "@shared/lazy";
import type { Platform } from "@shared/types/spotify";
import type { PlaybackAPI } from "@shared/types/spotify/playback";
import type { PlayerAPI, PlayerState, Song } from "@shared/types/spotify/player";

import { diffArrays } from "diff";

export let platform: Platform | undefined;
export let player = resolveApi<PlayerAPI>("PlayerAPI");
export let playback = resolveApi<PlaybackAPI>("PlaybackAPI");

const { context, logger } = registerContext({ name: "Platform" });

registerPatch(context, {
    find: "const{createPlatformDesktop:",
    replacement: {
        match: /(;const \i=)(await async function\(\){.*?}}\(\))/,
        replace: "$1$exp.loadPlatform($2)"
    }
});

exportFunction(context, function loadPlatform(value: Platform): Platform {
    platform = value;

    emitEvent("platformLoaded");

    createPlayerEvents();

    return value;
});

export function resolveApi<T>(key: string): T | undefined {
    return createLazy(() => {
        if (!platform) {
            return;
        }

        return platform.getRegistry().resolve(Symbol.for(key));
    });
}

let previousPlayerState: PlayerState | undefined;
let previousQueue: Song[] | undefined;

function createPlayerEvents() {
    if (!player) {
        logger.error("Couldn't initialize events API because the Player API was not found");
        return;
    }

    player.getEvents().addListener("update", ({ data: state }: { data: PlayerState }) => {
        onPlayerUpdate(state);
        previousPlayerState = state;
    });

    player.getEvents().addListener("queue_action_complete", () => {
        onQueueUpdate();
        previousQueue = player?.getQueue().queued;
    });

    logger.info("Created player event listeners");
}

function onPlayerUpdate(state: PlayerState) {
    if (!previousPlayerState) {
        previousPlayerState = state;

        logger.info("Stored initial player state");

        return;
    }

    if (state.isPaused && !previousPlayerState.isPaused) {
        emitEvent("pause", state);
    }

    if (!state.isPaused && previousPlayerState.isPaused) {
        emitEvent("play", state);
    }

    if (previousPlayerState.item && state.item && state.item.uri !== previousPlayerState.item.uri) {
        emitEvent("songChanged", state.item, state);
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
            emitEvent("queueAdded", result.value, state);
        }

        if (result.removed) {
            emitEvent("queueRemoved", result.value, state);
        }
    }
}
