import { registerContext } from "@api/context";
import type { Context } from "@shared/types/context";
import type { EventArgs, EventListener, EventType, RegisteredListener } from "@shared/types/event";

const { logger } = registerContext({ name: "Events" });

const registeredListeners: Record<
    Context["name"],
    {
        [K in EventType]: Set<EventListener<K>>;
    }
> = {};

export function registerEventListener<E extends EventType>(
    context: Context,
    event: E,
    callback: EventListener<E>
): RegisteredListener<E> | undefined {
    if (!Object.keys(registeredListeners).includes(context.name)) {
        registeredListeners[context.name] = {
            pause: new Set(),
            platformLoaded: new Set(),
            play: new Set(),
            queueAdded: new Set(),
            queueRemoved: new Set(),
            songChanged: new Set()
        };
    }

    registeredListeners[context.name]?.[event].add(callback);

    logger.debug(`Context ${context.name} registered new event listener for ${event}`);

    return { type: event, callback };
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

    registeredListeners[context.name]?.[event.type].delete(event.callback);
}

export async function emitEvent<E extends EventType>(event: E, ...args: EventArgs[E]) {
    // Need to do this because of circular import issues
    const { isPluginEnabled } = await import("@api/plugin");

    for (const context in registeredListeners) {
        // If the context is a plugin, check if the plugin is enabled.
        // We don't want to emit to disabled plugins.
        if (!isPluginEnabled(context)) {
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
