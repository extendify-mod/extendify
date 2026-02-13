import { registerEventListener } from "@api/context/event";
import { isPlugin, type Plugin } from "@api/context/plugin";
import { isPluginEnabled } from "@api/context/settings";
import { contexts, plugins } from "@api/registry";
import { createLogger, type Logger } from "@shared/logger";
import type { TargetPlatform } from "@shared/types";

export interface Context {
    /**
     * The display name of the context.
     * Should be PascalCase with no spaces.
     */
    name: string;
    /** The target platforms */
    platforms: TargetPlatform[];
    /** The color used by the context's logger */
    loggerColor?: string;
    /** The prefixed used by the context's logger */
    loggerPrefix?: string;
}

export function registerContext(context: Context): {
    context: Context;
    logger: Logger;
} {
    if (contexts.values().find(c => c.name === context.name)) {
        throw new Error(`Context with name ${context.name} already registered`);
    }

    contexts.add(context);

    return {
        context,
        logger: createLogger({
            color: context.loggerColor,
            name: `${context.loggerPrefix ?? "Context"}/${context.name}`
        })
    };
}

export function registerInterval(
    context: Context,
    callback: () => any,
    delay: number,
    instant: boolean = true
) {
    if (instant) {
        callback();
    }

    let interval: any;

    registerEventListener(context, "contextEnabled", c => {
        if (c.name !== context.name || interval) {
            return;
        }

        interval = setInterval(callback, delay);
    });

    registerEventListener(context, "contextDisabled", c => {
        if (c.name !== context.name || !interval) {
            return;
        }

        clearInterval(interval);
    });
}

/**
 * @param context can either be a context's or plugin's name, a plain context, or a plugin.
 * @returns a boolean indicating whether the passed context is considered enabled.
 *          This is always `true` for plain contexts, and depends on the user's settings for plugins.
 */
export function isContextEnabled(context: Context | Plugin | string): boolean {
    if (typeof context === "string") {
        const entry =
            plugins.values().find(p => p.name === context) ??
            contexts.values().find(c => c.name === context);

        if (!entry) {
            throw new Error(`Couldn't find plugin or context entry ${context}`);
        }

        return isContextEnabled(entry);
    }

    if (!context.platforms.includes(PLATFORM)) {
        return false;
    }

    if (isPlugin(context)) {
        return isPluginEnabled(context as Plugin);
    }

    return true;
}
