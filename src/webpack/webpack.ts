/**
 * Modified version of Vendicated's webpack.ts
 * @link https://github.com/Vendicated/Vencord/blob/main/src/webpack/webpack.ts
 */
import { makeLazy, proxyLazy } from "@utils/lazy";
import { LazyComponent } from "@utils/lazyReact";
import { Logger } from "@utils/logger";
import { canonicalizeMatch } from "@utils/patches";
import { WebpackInstance } from "@webpack/types";

const logger = new Logger("Webpack");

export let _resolveReady: () => void;
export const onceReady = new Promise<void>((r) => (_resolveReady = r));

export let wreq: WebpackInstance;
export let cache: WebpackInstance["c"];

export type FilterFn = (mod: any) => boolean;
export type PropsFilter = string[];
export type CodeFilter = Array<string | RegExp>;

export const stringMatches = (s: string, filter: CodeFilter) => {
    return filter.every((f) => {
        return typeof f === "string" ? s.includes(f) : (f.global && (f.lastIndex = 0), f.test(s));
    });
};

export const filters = {
    byProps: (...props: PropsFilter): FilterFn => {
        return (modules) => {
            const keys = Object.keys(modules);
            return props.every((p) => keys.includes(p));
        };
    },
    byCode: (...code: CodeFilter): FilterFn => {
        const parsedCode = code.map(canonicalizeMatch);
        const filter = (m: any) => {
            if (typeof m !== "function") {
                return false;
            }
            return stringMatches(m.toString(), parsedCode);
        };
        filter.$$extendifyProps = [...code];
        return filter;
    },
    componentByCode: (...code: CodeFilter): FilterFn => {
        const filter = filters.byCode(...code);
        return (m) => {
            if (filter(m)) {
                return true;
            } else if (!m.$$typeof) {
                return false;
            } else if (m.type) {
                return m.type.render ? filter(m.type.render) /* memo + forwardRef */ : filter(m.type); /* memo */
            } else if (m.render) {
                return filter(m.render); /* forwardRef */
            }
            return false;
        };
    },
    componentByName: (name: string): FilterFn => {
        const codeFilter = filters.componentByCode(new RegExp(String.raw`"data-encore-id":.\..\.${name}[{,]`));
        return (m) => {
            if (m.displayName === name) {
                return true;
            }

            if (m.render && m.$$typeof) {
                if (codeFilter(m)) {
                    return true;
                }
            }

            return false;
        };
    }
};

export type CallbackFn = (mod: any, id: string) => void;

export const subscriptions = new Map<FilterFn, CallbackFn>();
export const moduleListeners = new Set<CallbackFn>();
export const factoryListeners = new Set<
    (factory: (module: any, exports: any, require: WebpackInstance, src: string) => void) => void
>();
export const beforeInitListeners = new Set<(wreq: WebpackInstance) => void>();

export const _initWebpack = (webpackRequire: WebpackInstance) => {
    wreq = webpackRequire;
    cache = webpackRequire.c;
};

export const handleModuleNotFound = (method: string, ...filter: unknown[]) => {
    const err = new Error(`webpack.${method} found no module`);
    logger.error(err, "Filter:\n", filter);
    if (IS_DEV) {
        throw err;
    }
};

export const find = (
    filter: FilterFn,
    { isIndirect = false, isWaitFor = false }: { isIndirect?: boolean; isWaitFor?: boolean } = {}
) => {
    if (typeof filter !== "function") {
        throw new Error("Invalid filter. Expected function got " + typeof filter);
    }

    if (cache) {
        logger.debug(`${Object.keys(cache).length} modules available in Webpack cache`);
    }

    for (const key in cache) {
        const mod = cache[key];

        if (!mod.loaded || mod?.exports === null) {
            continue;
        }

        if (filter(mod.exports)) {
            return isWaitFor ? [mod.exports, key] : mod.exports;
        }

        if (typeof mod.exports !== "object") {
            continue;
        }

        for (const nestedMod in mod.exports) {
            const nested = mod.exports[nestedMod];
            if (nested && filter(nested)) {
                return isWaitFor ? [nested, key] : nested;
            }
        }
    }

    if (!isIndirect) {
        handleModuleNotFound("find", filter);
    }

    return isWaitFor ? [null, null] : null;
};

export const findAll = (filter: FilterFn) => {
    if (typeof filter !== "function") {
        throw new Error("Invalid filter. Expected function got " + typeof filter);
    }

    if (cache) {
        logger.debug(`${Object.keys(cache).length} modules available in Webpack cache`);
    }

    const ret = [] as any[];
    for (const key in cache) {
        const mod = cache[key];
        if (!mod.loaded || mod?.exports === null) {
            continue;
        }

        if (filter(mod.exports)) {
            ret.push(mod.exports);
        }

        if (typeof mod.exports !== "object") {
            continue;
        }

        for (const nestedMod in mod.exports) {
            const nested = mod.exports[nestedMod];
            if (nested && filter(nested)) {
                ret.push(nested);
            }
        }
    }
    return ret;
};

/**
 * Same as {@link find} but in bulk
 * @param filterFns Array of filters. Please note that this array will be modified in place, so if you still
 *                need it afterwards, pass a copy.
 * @returns Array of results in the same order as the passed filters
 */
export const findBulk = (filterFns: FilterFn[]) => {
    if (!Array.isArray(filterFns)) {
        throw new Error("Invalid filters. Expected function[] got " + typeof filterFns);
    }

    const { length } = filterFns;

    if (length === 0) {
        throw new Error("Expected at least two filters.");
    } else if (length === 1) {
        if (IS_DEV) {
            logger.warn("'findBulk' called with only one filter. Use 'find' instead.");
        }
        return find(filterFns[0]);
    }

    const filters = filterFns as Array<FilterFn | undefined>;

    let found = 0;
    const results = Array(length);

    outer: for (const key in cache) {
        const mod = cache[key];
        if (!mod.loaded || !mod?.exports) {
            continue;
        }

        for (let j = 0; j < length; j++) {
            const filter = filters[j];
            if (filter === undefined) {
                // The filter is already done
                continue;
            }

            if (filter(mod.exports)) {
                results[j] = mod.exports;
                filters[j] = undefined;
                if (++found === length) {
                    break outer;
                }
                break;
            }

            if (typeof mod.exports !== "object") {
                continue;
            }

            for (const nestedMod in mod.exports) {
                const nested = mod.exports[nestedMod];
                if (nested && filter(nested)) {
                    results[j] = nested;
                    filters[j] = undefined;
                    if (++found === length) {
                        break outer;
                    }
                    continue outer;
                }
            }
        }
    }

    if (found !== length) {
        const err = new Error(`Got ${length} filters, but only found ${found} modules!`);
        if (IS_DEV) {
            throw err;
        } else {
            logger.warn(err);
        }
    }

    return results;
};

/**
 * Find the id of the first module factory that includes all the given code
 * @returns string or null
 */
export const findModuleId = (...code: CodeFilter) => {
    code = code.map(canonicalizeMatch);

    for (const id in wreq.m) {
        if (stringMatches(wreq.m[id].toString(), code)) {
            return;
        }
    }

    const err = new Error("Didn't find module with code(s):\n" + code.join("\n"));
    if (IS_DEV) {
        throw err;
    } else {
        logger.warn(err);
    }

    return null;
};

/**
 * Find the first module factory that includes all the given code
 * @returns The module factory or null
 */
export const findModuleFactory = (...code: CodeFilter) => {
    const id = findModuleId(...code);
    if (!id) {
        return null;
    }
    return wreq.m[id];
};

/**
 * This is just a wrapper around {@link proxyLazy} to make our reporter test for your webpack finds.
 *
 * Wraps the result of {@link makeLazy} in a Proxy you can consume as if it wasn't lazy.
 * On first property access, the lazy is evaluated
 * @param factory lazy factory
 * @param attempts how many times to try to evaluate the lazy before giving up
 * @returns Proxy
 *
 * Note that the example below exists already as an api, see {@link findByPropsLazy}
 * @example const mod = proxyLazy(() => findByProps("blah")); console.log(mod.blah);
 */
export const proxyLazyWebpack = <T = any>(factory: () => T, attempts?: number) => {
    return proxyLazy<T>(factory, attempts);
};

/**
 * Find the first module that matches the filter, lazily
 */
export const findLazy = (filter: FilterFn) => {
    return proxyLazy(() => find(filter));
};

/**
 * Find the first module that has the specified properties
 */
export const findByProps = (...props: PropsFilter) => {
    const res = find(filters.byProps(...props), { isIndirect: true });
    if (!res) {
        handleModuleNotFound("findByProps", ...props);
    }
    return res;
};

/**
 * Find the first module that has the specified properties, lazily
 */
export const findByPropsLazy = (...props: PropsFilter) => {
    return proxyLazy(() => findByProps(...props));
};

/**
 * Find the first function that includes all the given code
 */
export const findByCode = (...code: CodeFilter) => {
    const res = find(filters.byCode(...code), { isIndirect: true });
    if (!res) {
        handleModuleNotFound("findByCode", ...code);
    }
    return res;
};

/**
 * Find the first function that includes all the given code, lazily
 */
export const findByCodeLazy = (...code: CodeFilter) => {
    return proxyLazy(() => findByCode(...code));
};

/**
 * Finds the component which includes all the given code. Checks for plain components, memos and forwardRefs
 */
export const findComponentByCode = (...code: CodeFilter) => {
    const res = find(filters.componentByCode(...code), { isIndirect: true });
    if (!res) {
        handleModuleNotFound("findComponentByCode", ...code);
    }
    return res;
};

/**
 * Finds the first component that matches the filter, lazily.
 */
export const findComponentLazy = <T extends object = any>(filter: FilterFn) => {
    return LazyComponent<T>(() => find(filter, { isIndirect: true }));
};

/**
 * Finds the first component that includes all the given code, lazily
 */
export const findComponentByCodeLazy = <T extends object = any>(...code: CodeFilter) => {
    return LazyComponent<T>(() => find(filters.componentByCode(...code), { isIndirect: true }));
};

/**
 * Finds the first component that is exported by the first prop name, lazily
 */
export const findExportedComponentLazy = <T extends object = any>(...props: PropsFilter) => {
    return LazyComponent<T>(() => find(filters.byProps(...props), { isIndirect: true })[props[0]]);
};

/**
 * Finds a mangled module by the provided code "code" (must be unique and can be anywhere in the module)
 * then maps it into an easily usable module via the specified mappers.
 *
 * @param code The code to look for
 * @param mappers Mappers to create the non mangled exports
 * @returns Unmangled exports as specified in mappers
 *
 * @example mapMangledModule("headerIdIsManaged:", {
 *             openModal: filters.byCode("headerIdIsManaged:"),
 *             closeModal: filters.byCode("key==")
 *          })
 */
export const mapMangledModule = <S extends string>(
    code: string | RegExp | CodeFilter,
    mappers: Record<S, FilterFn>
): Record<S, any> => {
    const exports = {} as Record<S, any>;

    const id = findModuleId(...(Array.isArray(code) ? code : [code]));
    if (id === null) {
        return exports;
    }

    const mod = wreq(id as any);
    outer: for (const key in mod) {
        const member = mod[key];
        for (const newName in mappers) {
            // If the current mapper matches this module
            if (mappers[newName](member)) {
                exports[newName] = member;
                continue outer;
            }
        }
    }

    return exports;
};

/**
 * {@link mapMangledModule}, lazy.

 * Finds a mangled module by the provided code "code" (must be unique and can be anywhere in the module)
 * then maps it into an easily usable module via the specified mappers.
 *
 * @param code The code to look for
 * @param mappers Mappers to create the non mangled exports
 * @returns Unmangled exports as specified in mappers
 *
 * @example mapMangledModule("headerIdIsManaged:", {
 *             openModal: filters.byCode("headerIdIsManaged:"),
 *             closeModal: filters.byCode("key==")
 *          })
 */
export const mapMangledModuleLazy = <S extends string>(
    code: string | RegExp | CodeFilter,
    mappers: Record<S, FilterFn>
): Record<S, any> => {
    return proxyLazy(() => mapMangledModule(code, mappers));
};

export const DefaultExtractAndLoadChunksRegex =
    /(?:(?:Promise\.all\(\[)?(\i\.e\("?[^)]+?"?\)[^\]]*?)(?:\]\))?|Promise\.resolve\(\))\.then\(\i\.bind\(\i,"?([^)]+?)"?\)\)/;
export const ChunkIdsRegex = /\("([^"]+?)"\)/g;

/**
 * Extract and load chunks using their entry point
 * @param code An array of all the code the module factory containing the lazy chunk loading must include
 * @param matcher A RegExp that returns the chunk ids array as the first capture group and the entry point id as the second. Defaults to a matcher that captures the first lazy chunk loading found in the module factory
 * @returns A promise that resolves with a boolean whether the chunks were loaded
 */
export const extractAndLoadChunks = async (code: CodeFilter, matcher: RegExp = DefaultExtractAndLoadChunksRegex) => {
    const module = findModuleFactory(...code);
    if (!module) {
        const err = new Error("extractAndLoadChunks: Couldn't find module factory");
        logger.warn(err, "Code:", code, "Matcher:", matcher);

        if (IS_DEV) {
            throw err;
        }

        return false;
    }

    const match = module.toString().match(canonicalizeMatch(matcher));
    if (!match) {
        const err = new Error("extractAndLoadChunks: Couldn't find chunk loading in module factory code");
        logger.warn(err, "Code:", code, "Matcher:", matcher);

        if (IS_DEV) {
            throw err;
        }

        return false;
    }

    const [, rawChunkIds, entryPointId] = match;
    if (Number.isNaN(Number(entryPointId))) {
        const err = new Error(
            "extractAndLoadChunks: Matcher didn't return a capturing group with the chunk ids array, or the entry point id returned as the second group wasn't a number"
        );
        logger.warn(err, "Code:", code, "Matcher:", matcher);

        if (IS_DEV) {
            throw err;
        }

        return false;
    }

    if (rawChunkIds) {
        const chunkIds = Array.from(rawChunkIds.matchAll(ChunkIdsRegex)).map((m: any) => Number(m[1]));
        await Promise.all(chunkIds.map((id) => wreq.e(id)));
    }

    if (wreq.m[entryPointId] === null) {
        const err = new Error(
            "extractAndLoadChunks: Entry point is not loaded in the module factories, perhaps one of the chunks failed to load"
        );
        logger.warn(err, "Code:", code, "Matcher:", matcher);

        if (IS_DEV) {
            throw err;
        }

        return false;
    }

    wreq(Number(entryPointId));
    return true;
};

/**
 * This is just a wrapper around {@link extractAndLoadChunks} to make our reporter test for your webpack finds.
 *
 * Extract and load chunks using their entry point
 * @param code An array of all the code the module factory containing the lazy chunk loading must include
 * @param matcher A RegExp that returns the chunk ids array as the first capture group and the entry point id as the second. Defaults to a matcher that captures the first lazy chunk loading found in the module factory
 * @returns A function that returns a promise that resolves with a boolean whether the chunks were loaded, on first call
 */
export const extractAndLoadChunksLazy = (code: CodeFilter, matcher = DefaultExtractAndLoadChunksRegex) => {
    return makeLazy(() => extractAndLoadChunks(code, matcher));
};

/**
 * Wait for a module that matches the provided filter to be registered,
 * then call the callback with the module as the first argument
 */
export function waitFor(
    filter: string | PropsFilter | FilterFn,
    callback: CallbackFn,
    { isIndirect = false }: { isIndirect?: boolean } = {}
) {
    if (typeof filter === "string") {
        filter = filters.byProps(filter);
    } else if (Array.isArray(filter)) {
        filter = filters.byProps(...filter);
    } else if (typeof filter !== "function") {
        throw new Error("Filter must be string, string[] or function, got " + typeof filter);
    }

    if (cache !== null) {
        const [existing, id] = find(filter, {
            isIndirect: true,
            isWaitFor: true
        });
        if (existing) {
            return void callback(existing, id);
        }
    }

    subscriptions.set(filter, callback);
}

export function waitForComponent<T extends React.ComponentType<any> = React.ComponentType<any> & Record<string, any>>(
    name: string,
    filter: FilterFn | string | string[]
): T {
    let value: T = function () {
        // throw new Error(`Extendify could not find the ${name} Component`);
    } as any;

    let lazyComponent = LazyComponent(() => value, -1) as T;
    waitFor(
        filter,
        (v: any) => {
            value = v;
            Object.assign(lazyComponent, v);
        },
        { isIndirect: true }
    );

    return lazyComponent;
}

/**
 * Search modules by keyword. This searches the factory methods,
 * meaning you can search all sorts of things, displayName, methodName, strings somewhere in the code, etc
 * @param code One or more strings or regexes
 * @returns Mapping of found modules
 */
export const search = (...code: CodeFilter) => {
    code = code.map(canonicalizeMatch);

    const results = {} as Record<number, Function>;
    const factories = wreq.m;

    for (const id in factories) {
        const factory = factories[id].original ?? factories[id];

        if (stringMatches(factory.toString(), code)) {
            results[id] = factory;
        }
    }

    return results;
};

/**
 * Extract a specific module by id into its own Source File. This has no effect on
 * the code, it is only useful to be able to look at a specific module without having
 * to view a massive file. extract then returns the extracted module so you can jump to it.
 * As mentioned above, note that this extracted module is not actually used,
 * so putting breakpoints or similar will have no effect.
 * @param id The id of the module to extract
 */
export const extract = (id: string | number) => {
    const mod = wreq.m[id] as Function;
    if (!mod) {
        return null;
    }

    const code = `
// [EXTRACTED] WebpackModule${id}
// WARNING: This module was extracted to be more easily readable.
//          This module is NOT ACTUALLY USED! This means putting breakpoints will have NO EFFECT!!

0,${mod.toString()}
//# sourceURL=ExtractedWebpackModule${id}
`;
    return (0, eval)(code) as Function;
};

export const shouldIgnoreValue = (value: any) => {
    if ([undefined, null, window, document, document.documentElement].includes(value)) {
        return true;
    } else if (value[Symbol.toStringTag] === "DOMTokenList") {
        return true;
    }
    return false;
};

export const shouldIgnoreModule = (exports: any) => {
    if (shouldIgnoreValue(exports)) {
        return true;
    }

    if (typeof exports !== "object") {
        return false;
    }

    // NOTE: Don't use `of` here. It will throw a TypeError.
    for (const key in exports) {
        if (!shouldIgnoreValue(exports[key])) {
            return false;
        }
    }

    return true;
};
