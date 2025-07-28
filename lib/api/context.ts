import { Logger, createLogger } from "@shared/logger";
import type { Context } from "@shared/types/context";

const contexts: Set<string> = new Set();

export function registerContext(context: Context): { context: Context; logger: Logger } {
    if (contexts.has(context.name)) {
        throw new Error(`Context with name ${context.name} already registered`);
    }

    contexts.add(context.name);

    return {
        context,
        logger: createLogger({
            name: context.name,
            color: context.loggerColor
        })
    };
}
