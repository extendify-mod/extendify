import type { Plugin } from "@api/context/plugin";
import { isPluginEnabled } from "@api/context/plugin/settings";
import { contexts, plugins } from "@api/registry";
import { Logger, createLogger } from "@shared/logger";

export type TargetPlatform = "desktop" | "webos";

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
    if (contexts.values().find((c) => c.name === context.name)) {
        throw new Error(`Context with name ${context.name} already registered`);
    }

    contexts.add(context);

    return {
        context,
        logger: createLogger({
            name: `${context.loggerPrefix ?? "Context"}/${context.name}`,
            color: context.loggerColor
        })
    };
}

/**
 * @param context can either be a context's or plugin's name, a plain context, or a plugin.
 * @returns a boolean indicating whether the passed context is considered enabled.
 *          This is always `true` for plain contexts, and depends on the user's settings for plugins.
 */
export function isContextEnabled(context: Context | Plugin | string): boolean {
    if (typeof context === "string") {
        const entry =
            plugins.values().find((p) => p.name === context) ??
            contexts.values().find((c) => c.name === context);

        if (!entry) {
            throw new Error(`Couldn't find plugin or context entry ${context}`);
        }

        return isContextEnabled(entry);
    }

    if (!context.platforms.includes(PLATFORM)) {
        return false;
    }

    if ("description" in context) {
        return isPluginEnabled(context);
    }

    return false;
}
