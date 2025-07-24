import { WEBPACK_CHUNK } from "@shared/constants";
import { createLogger } from "@shared/logger";
import { type WebpackModule, type WebpackRequire } from "@shared/types/webpack";

const logger = createLogger({ name: "WebpackPatcher " });

let webpackChunk: any[] | undefined;

Object.defineProperty(window, WEBPACK_CHUNK, {
    configurable: true,
    get: () => webpackChunk,
    set(chunk) {
        if (chunk?.push && !chunk.push.$$extendifyOriginal) {
            patchPush(chunk);
            logger.info(`Patched ${WEBPACK_CHUNK}.push`);

            // @ts-ignore
            delete window[WEBPACK_CHUNK];
            // @ts-ignore
            window[WEBPACK_CHUNK] = chunk;
        }

        webpackChunk = chunk;
    }
});

Object.defineProperty(Function.prototype, "m", {
    configurable: true,
    set(this: WebpackRequire, modules: WebpackRequire["m"]) {
        Object.defineProperty(this, "m", {
            configurable: true,
            value: modules,
            enumerable: true,
            writable: true
        });

        patchFactories(modules);

        // NOTE: This removes one layer, from the original patcher, which might break it.
        Object.defineProperty(this, "iife", {
            configurable: true,
            set(this: WebpackRequire, iife: WebpackRequire["iife"]) {
                const original = iife;
                iife = patchModule(iife, "Private");
                iife.$$ = iife;
                iife(this);

                Object.defineProperty(this, "iife", {
                    value: iife,
                    configurable: true,
                    enumerable: false,
                    writable: true
                });

                logger.info("Found and patched private module");
            }
        });

        logger.info("Found main Webpack instance");
    }
});

function patchPush(chunk: any) {
    function handlePush(module: any) {
        try {
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

function patchFactories(factories: Record<number, WebpackModule>) {}

function patchModule<T>(module: T, id: string): T {
    return module;
}
