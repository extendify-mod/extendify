import { createLogger } from "@extendify/shared/logger";
import type { WebpackRequire } from "@extendify/shared/types/webpack";
import { initializeWebpack, wreq } from "@extendify/webpack";
import { patchFactories, patchPush } from "@extendify/webpack/patcher";

const logger = createLogger({ name: "WebpackInterceptor" });

let webpackChunk: any[] | undefined;

for (const chunkName of WEBPACK_CHUNK_NAMES) {
    Object.defineProperty(window, chunkName, {
        configurable: true,
        get: () => webpackChunk,
        set(chunk) {
            if (chunk?.push && !chunk.push.$$) {
                patchPush(chunk);
                logger.info(`Patched ${chunkName}.push`);

                delete window[chunkName];
                window[chunkName] = chunk;
            }

            webpackChunk = chunk;
        }
    });
}

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
                 * On desktop, only the main instance has an absolute bundle path.
                 * On web, only the main instance contains "spotifycdn".
                 */
                if (PLATFORM === "browser" && !bundlePath.includes("spotifycdn")) {
                    return;
                } else if (PLATFORM === "desktop" && !bundlePath.startsWith("/")) {
                    return;
                }

                patchFactories(modules);

                if (!wreq) {
                    logger.info("Found main Webpack instance");

                    forceLoadFactories(this);
                    initializeWebpack(this);
                }
            }
        });
    }
});

function forceLoadFactories(wreq: WebpackRequire) {
    [...wreq.u.toString().matchAll(/(\d*?):/g)].forEach(([_, id]) => {
        wreq.e(Number(id));
    });
}
