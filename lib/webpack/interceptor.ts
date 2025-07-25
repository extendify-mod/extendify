import { WEBPACK_CHUNK } from "@shared/constants";
import { createLogger } from "@shared/logger";
import { type WebpackRequire } from "@shared/types/webpack";
import { initializeWebpack, wreq } from "@webpack";
import { patchFactories, patchModule, patchPush } from "@webpack/patcher";

const logger = createLogger({ name: "WebpackInterceptor" });

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
                // Now that we've found the private iife module, which is assigned to the
                // wreq instance as 'iife' via a patch (check loader.ts), we can patch it
                // with our plugin patches and then initialize it ourselves.
                const original = iife;
                iife = patchModule(iife, "Private");
                iife.$$ = original;
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

        if (!wreq) {
            logger.info("Found main Webpack instance");
            initializeWebpack(this);
        }
    }
});
