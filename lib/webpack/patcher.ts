import { executePatch, isMatch, patches } from "@api/patch";
import { createLogger } from "@shared/logger";
import type { WebpackModule } from "@shared/types/webpack";
import { shouldIgnoreModule, wreq } from "@webpack";

const logger = createLogger({ name: "WebpackPatcher" });

export function patchPush(global: any) {
    function handlePush(chunk: any) {
        try {
            patchFactories(chunk[1]);
        } catch (e) {
            logger.error("Error while pushing chunk", e);
        }
        return handlePush.$$.call(global, chunk);
    }

    handlePush.$$ = global.push;
    handlePush.toString = handlePush.$$.toString.bind(handlePush.$$);
    handlePush.bind = (...args: unknown[]) => handlePush.$$.bind(...args);

    Object.defineProperty(global, "push", {
        configurable: true,
        get: () => handlePush,
        set(push) {
            handlePush.$$ = push;
        }
    });
}

export function patchFactories(factories: Record<number, WebpackModule> | WebpackModule[]) {
    for (const id in factories) {
        let mod = factories[id];
        if (!mod) {
            continue;
        }

        const originalMod = mod;

        const factory = (factories[id] = function (module, exports, require) {
            if (!mod) {
                return;
            }

            let src = mod.toString();
            src = src.substring(src.indexOf("{"));

            if (wreq === null && DEVELOPMENT) {
                return void originalMod(module, exports, require, src);
            }

            try {
                mod(module, exports, require, src);
            } catch (e) {
                if (mod === originalMod) {
                    throw e;
                }

                logger.error(`Error in patched module (Module id is ${id})\n`, e);
                return void originalMod(module, exports, require, src);
            }

            exports = module.exports;
            if (!exports) {
                return;
            }

            if (require.c && shouldIgnoreModule(exports)) {
                Object.defineProperty(require.c, id, {
                    value: require.c[id],
                    enumerable: false,
                    configurable: true,
                    writable: true
                });
                return;
            }
        } as {
            (...args: any[]): void;
            $$: any;
            toString: () => string;
        });

        factory.$$ = originalMod;
        factory.toString = originalMod.toString.bind(originalMod);

        mod = patchModule(mod, id.toString());
    }
}

export function patchModule<T>(module: T, id: string): T {
    if (typeof module !== "function") {
        return module;
    }

    const patchedBy: Set<string> = new Set();
    let src = "0," + module.toString().replaceAll("\n", "");

    for (let i = 0; i < patches.length; i++) {
        const patch = patches[i];

        if (!patch || (patch.predicate && !patch.predicate())) {
            continue;
        }

        if (patch.excludePrivateModule && id === "Private") {
            continue;
        }

        if (!isMatch(src, patch.find)) {
            continue;
        }

        const replacements = Array.isArray(patch.replacement)
            ? patch.replacement
            : [patch.replacement];
        for (const replacement of replacements) {
            if (replacement.predicate && !replacement.predicate()) {
                continue;
            }

            if (replacement.excludePrivateModule && id === "Private") {
                continue;
            }

            const originalSrc = src;
            const originalModule = module;

            try {
                const newSrc = executePatch(
                    patch.context,
                    src,
                    replacement.match,
                    replacement.replace
                );

                if (newSrc === src && !patch.noWarn && !replacement.noWarn) {
                    logger.warn(
                        `Patch by ${patch.context.name} had no effect (Module id is ${id}): ${replacement.match}`
                    );

                    if (DEVELOPMENT) {
                        logger.debug("Function source:\n", src);
                    }

                    continue;
                }

                patchedBy.add(patch.context.name);

                const header = `// Webpack Module ${id} - Patched by ${[...patchedBy].join(", ")}`;
                const footer = `//# sourceURL=https://xpui.app.spotify.com/modules/WebpackModule${id}.js`;
                module = (0, eval)(`${header}\n${newSrc}\n${footer}`);

                src = newSrc;
            } catch (e) {
                src = originalSrc;
                module = originalModule;

                patchedBy.delete(patch.context.name);

                if (patch.noError || replacement.noError) {
                    continue;
                }

                logger.error(
                    `Patch by ${patch.context.name} errored (Module id is ${id}): ${replacement.match}\n`,
                    e
                );

                if (DEVELOPMENT) {
                    logger.debug("Function source:\n", src);
                }
            }
        }

        if (!patch.all) {
            patches.splice(i--, 1);
        }
    }

    return module;
}
