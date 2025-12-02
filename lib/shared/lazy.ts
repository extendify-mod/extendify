export function createLazy<T>(getter: () => T): T {
    let cache: T | undefined;

    function getTarget() {
        if (!cache) {
            cache = getter();
        }

        return cache;
    }

    return new Proxy(() => {}, {
        apply(_, thisArg, argArray) {
            return Reflect.apply(getTarget() as any, thisArg, argArray);
        },
        get(_, prop, receiver) {
            return Reflect.get(getTarget() as any, prop, receiver);
        }
    }) as T;
}
