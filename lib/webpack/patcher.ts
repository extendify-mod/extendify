import { createLogger } from "@shared/logger";
import { type WebpackModule } from "@shared/types/webpack";

const logger = createLogger({ name: "WebpackPatcher" });

export function patchPush(chunk: any) {
    function handlePush(module: any) {
        try {
            console.log(arguments);
            patchFactories(module[1]);
        } catch (e) {
            logger.error("Error while pushing module", e);
        }
        return handlePush.$$.call(chunk, module);
    }

    handlePush.$$ = chunk.push;
    handlePush.toString = handlePush.$$.toString.bind(handlePush.$$);
    handlePush.bind = (...args: unknown[]) => handlePush.$$.bind(...args);

    Object.defineProperty(chunk, "push", {
        configurable: true,
        get: () => handlePush,
        set(push) {
            handlePush.$$ = push;
        }
    });
}

export function patchFactories(factories: Record<number, WebpackModule>) {
    for (const id in factories) {
        const module = factories[id];
        if (!module) {
            continue;
        }
        factories[id] = patchModule(module, id);
    }
}

export function patchModule<T>(module: T, id: string): T {
    return module;
}
