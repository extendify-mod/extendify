/**
 * Modified version of Vendicated's lazy.ts
 * @link https://github.com/Vendicated/Vencord/blob/main/src/utils/lazy.ts
 */

const handler: ProxyHandler<any> = {};

export const SYM_LAZY_GET = Symbol.for("extendify.lazy.get");
export const SYM_LAZY_CACHED = Symbol.for("extendify.lazy.cached");

export function makeLazy<T>(factory: () => T, attempts = 500): () => T {
    let tries = 0;
    let cache: T;
    return () => {
        if (!cache && (attempts === -1 || attempts > tries++)) {
            cache = factory();
            if (!cache && attempts === tries && attempts !== -1) {
                console.error("Lazy factory failed:", factory);
            }
        }
        return cache;
    };
}

/**
 * Wraps the result of {@link makeLazy} in a Proxy you can consume as if it wasn't lazy.
 * On first property access, the lazy is evaluated
 * @param factory lazy factory
 * @param attempts how many times to try to evaluate the lazy before giving up
 * @returns Proxy
 *
 * Note that the example below exists already as an api, see {@link findByPropsLazy}
 * @example const mod = proxyLazy(() => findByProps("blah")); console.log(mod.blah);
 */
export function proxyLazy<T>(factory: () => T, attempts = 500, isChild = false): T {
    let isSameTick = true;
    if (!isChild) {
        setTimeout(() => (isSameTick = false), 0);
    }

    let tries = 0;
    const proxyDummy = Object.assign(() => {}, {
        [SYM_LAZY_CACHED]: void 0 as T | undefined,
        [SYM_LAZY_GET]() {
            if (!proxyDummy[SYM_LAZY_CACHED] && attempts > tries++) {
                proxyDummy[SYM_LAZY_CACHED] = factory();
                if (!proxyDummy[SYM_LAZY_CACHED] && attempts === tries) {
                    console.error("Lazy factory failed:", factory);
                }
            }
            return proxyDummy[SYM_LAZY_CACHED];
        }
    });

    return new Proxy(proxyDummy, {
        ...handler,
        get(target, p, receiver) {
            if (p === SYM_LAZY_CACHED || p === SYM_LAZY_GET) {
                return Reflect.get(target, p, receiver);
            }

            // If we're still in the same tick, it means the lazy was immediately used.
            // thus, we lazy proxy the get access to make things like destructuring work as expected
            // meow here will also be a lazy
            // `const { meow } = findByPropsLazy("meow");`
            if (!isChild && isSameTick) {
                return proxyLazy(() => Reflect.get(target[SYM_LAZY_GET](), p, receiver), attempts, true);
            }

            const lazyTarget = target[SYM_LAZY_GET]();
            if (typeof lazyTarget === "object" || typeof lazyTarget === "function") {
                return Reflect.get(lazyTarget, p, receiver);
            }
            throw new Error("'proxyLazy' called on a primitive value");
        }
    }) as any;
}
