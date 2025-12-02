import { type Context, registerContext } from "@api/context";
import { emitEvent, registerEventListener } from "@api/context/event";
import { exportFunction, registerPatch } from "@api/context/patch";
import { overriddenFunctions } from "@api/registry";
import { createLazy } from "@shared/lazy";
import type { AnyFn } from "@shared/types";
import type { Platform, ProductStateAPI, RemoteConfigDebugAPI } from "@shared/types/spotify";
import type { PlaybackAPI } from "@shared/types/spotify/playback";
import type { PlayerAPI, PlayerState, Song } from "@shared/types/spotify/player";

import { diffArrays } from "diff";

export let platform: Platform | undefined;
export const player = resolveApi<PlayerAPI>("PlayerAPI");
export const playback = resolveApi<PlaybackAPI>("PlaybackAPI");
export const remoteConfig = resolveApi<RemoteConfigDebugAPI>("RemoteConfigDebugAPI");
export const productState = resolveApi<ProductStateAPI>("ProductStateAPI");

export interface ApiOverride {
    context: string;
    apiName: string;
    fnName: string;
    original?: AnyFn;
    replacement: AnyFn;
}

const { context, logger } = registerContext({
    name: "Platform",
    platforms: ["desktop", "browser"]
});

registerPatch(context, {
    find: /{createPlatform(?:Desktop|Web):\i}/,
    replacement: [
        {
            match: /(;const \i=)(await async function\(\){.*?}(?:})?\(\))/,
            replace: "$1$exp.loadPlatform($2)"
        }
    ]
});

exportFunction(context, function loadPlatform(value: Platform): Platform {
    platform = value;

    emitEvent("platformLoaded");

    createPlayerEvents();

    return value;
});

registerEventListener(context, "contextEnabled", context => {
    overrideApi(context.name, true);
});

registerEventListener(context, "contextDisabled", context => {
    overrideApi(context.name, false);
});

export function resolveApi<T>(key: string): T {
    return createLazy(() => {
        if (!platform) {
            return;
        }

        return platform.getRegistry().resolve(Symbol.for(key));
    }) as T;
}

function overrideApi(context: string, enable: boolean) {
    if (!platform) {
        return;
    }

    for (const override of overriddenFunctions) {
        if (override.context !== context) {
            continue;
        }

        const instance = platform.getRegistry()._map.get(Symbol.for(override.apiName))?.instance;

        if (!instance) {
            logger.error(`No instance found for API ${override.apiName}`);
            continue;
        }

        if (!instance[override.fnName]) {
            logger.warn(`No original ${override.fnName} function found for ${override.apiName}`);
        }

        if (!override.original) {
            override.original = instance[override.fnName];
        }

        Object.defineProperty(instance, override.fnName, {
            configurable: true,
            enumerable: false,
            value: enable ? override.replacement : override.original,
            writable: true
        });
    }
}

export function registerApiOverride(context: Context, apiName: string, fn: AnyFn) {
    if (!fn.name?.length) {
        throw new Error(`Can't override function from ${apiName} with no name`);
    }

    const override = overriddenFunctions.find(
        func => func.fnName === fn.name && func.apiName === apiName
    );
    if (override) {
        logger.error(
            `Function ${apiName}#${override.fnName} already overridden by ${override.context}`
        );
        return;
    }

    overriddenFunctions.push({
        apiName,
        context: context.name,
        fnName: fn.name,
        replacement: fn
    });

    logger.debug(`Context ${context.name} registered override for ${apiName}#${fn.name}`);
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
