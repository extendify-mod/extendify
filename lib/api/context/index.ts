import type { Plugin } from "@api/context/plugin";
import { isPluginEnabled } from "@api/context/plugin/settings";
import { contexts, plugins } from "@api/registry";
import { Logger, createLogger } from "@shared/logger";

export interface Context {
    /**
     * The display name of the context.
     * Should be PascalCase with no spaces.
     */
    name: string;
    /** The color used by the context's logger */
    loggerColor?: string;
    /** The prefixed used by the context's logger */
    loggerPrefix?: string;
}

export function registerContext(context: Context): {
    context: Context;
    logger: Logger;
} {
    if (contexts.has(context.name)) {
        throw new Error(`Context with name ${context.name} already registered`);
    }

    contexts.add(context.name);

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
        const entry = plugins.values().find((v) => v.name === context);
        // If there is no entry, it's probably a plain context, which means it's always enabled
        return entry ? isContextEnabled(entry) : true;
    }

    if ("description" in context) {
        return isPluginEnabled(context);
    }

    return false;
}
