import { Logger, createLogger } from "@shared/logger";

const contexts: Set<string> = new Set();

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
