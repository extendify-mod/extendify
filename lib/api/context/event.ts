import { type Context, isContextEnabled, registerContext } from "@api/context";
import type { Theme } from "@api/themes";
import type { PlayerState, Song } from "@shared/types/spotify/player";

const { logger } = registerContext({
    name: "Events",
    platforms: ["desktop", "browser"]
});

export type EventType =
    | "platformLoaded"
    | "play"
    | "pause"
    | "songChanged"
    | "queueAdded"
    | "queueRemoved"
    | "contextEnabled"
    | "contextDisabled"
    | "themeChanged";

export interface EventArgs {
    platformLoaded: [];
    play: [state: PlayerState];
    pause: [state: PlayerState];
    songChanged: [newSong: Song, state: PlayerState];
    queueAdded: [songs: Song[], state: PlayerState];
    queueRemoved: [songs: Song[], state: PlayerState];
    contextEnabled: [context: Context];
    contextDisabled: [context: Context];
    themeChanged: [newTheme: Theme];
}

export type EventListener<E extends EventType> = (...args: EventArgs[E]) => void;

export interface RegisteredListener<E extends EventType> {
    type: E;
    callback: EventListener<E>;
}

const registeredListeners: Record<
    Context["name"],
    {
        [K in EventType]?: Set<EventListener<K>>;
    }
> = {};

export function registerEventListener<E extends EventType>(
    context: Context,
    event: E,
    callback: EventListener<E>
): RegisteredListener<E> {
    let contextListeners = registeredListeners[context.name];

    if (!contextListeners) {
        contextListeners = registeredListeners[context.name] = {};
    }

    if (!contextListeners[event]) {
        // @ts-expect-error: Why is this even giving an error
        contextListeners[event] = new Set();
    }

    contextListeners[event]?.add(callback);

    logger.debug(`Context ${context.name} registered new event listener for ${event}`);

    return { callback, type: event };
}

export function removeEventListener<E extends EventType>(
    context: Context,
    event: RegisteredListener<E>
) {
    if (!Object.keys(registeredListeners).includes(context.name)) {
        logger.warn(
            `Context ${context.name} tried to remove an event listener of type ${event.type}, but the context was not registered`
        );
        return;
    }

    registeredListeners[context.name]?.[event.type]?.delete(event.callback);

    logger.debug(`Context ${context.name} removed event listener for ${event.type}`);
}

export async function emitEvent<E extends EventType>(event: E, ...args: EventArgs[E]) {
    for (const context in registeredListeners) {
        // If the context is a plugin, check if the plugin is enabled.
        // We don't want to emit to disabled plugins.
        if (!isContextEnabled(context)) {
            continue;
        }

        const listeners = registeredListeners[context]?.[event];
        if (!listeners) {
            continue;
        }

        for (const callback of listeners) {
            callback(...args);
        }
    }
}
