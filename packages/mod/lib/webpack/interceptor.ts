import { createLogger } from "@shared/logger";
import type { RawModule, WebpackRequire } from "@shared/types/webpack";
import { initializeWebpack, wreq } from "@webpack";
import { patchFactories, patchModule, patchPush } from "@webpack/patcher";

const logger = createLogger({ name: "WebpackInterceptor" });

let webpackChunk: any[] | undefined;

Object.defineProperty(window, WEBPACK_CHUNK, {
    configurable: true,
    get: () => webpackChunk,
    set(chunk) {
        if (chunk?.push && !chunk.push.$$) {
            patchPush(chunk);
            logger.info(`Patched ${WEBPACK_CHUNK}.push`);

            delete window[WEBPACK_CHUNK];
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
            enumerable: true,
            value: modules,
            writable: true
        });

        /**
         * Spotify bundles multiple libraries that create their own webpack instance.
         * Patching them is undesirable since they share common modules with the main bundle (eg React),
         * and text based patches cannot replicate the scope in which these modules were originally imported.
         */

        Object.defineProperty(this, "p", {
            configurable: true,
            set(this: WebpackRequire, bundlePath: string) {
                Object.defineProperty(this, "p", {
                    configurable: true,
                    enumerable: true,
                    value: bundlePath,
                    writable: true
                });

                /**
                 * Only the main instance has an absolute bundle path.
                 */
                if (!bundlePath.startsWith("/")) {
                    return;
                }

                patchFactories(modules);

                initializePrivateModule(this);

                if (!wreq) {
                    logger.info("Found main Webpack instance");
                    initializeWebpack(this);
                }
            }
        });
    }
});

function initializePrivateModule(wreq: WebpackRequire) {
    Object.defineProperty(wreq, "iife", {
        configurable: true,
        set(this: WebpackRequire, iife: WebpackRequire["iife"]) {
            /**
             * Now that we've found the private iife module, which is assigned to the
             * wreq instance as "iife" via a patch (check loader.ts), we can patch it
             * with our plugin patches and then initialize it ourselves.
             */

            let src = iife.toString();
            src = src.substring(src.indexOf("{"));
            const fakeModule: RawModule = { exports: {}, id: "Private", loaded: true };
            const original = iife;

            iife = patchModule(iife, String(fakeModule.id));
            iife.$$ = original;
            iife(fakeModule, {}, this, src);

            Object.defineProperty(this, "iife", {
                configurable: true,
                enumerable: false,
                value: iife,
                writable: true
            });

            logger.info("Found and patched private module");
        }
    });
}
