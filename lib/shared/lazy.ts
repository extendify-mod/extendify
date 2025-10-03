export function createLazy<T>(getter: () => T): T {
    let cache: T | undefined;

    const getTarget = () => {
        if (cache === undefined) {
            cache = getter();
        }
        return cache;
    };

    return new Proxy(
        {},
        {
            get(_, prop, receiver) {
                return Reflect.get(getTarget() as any, prop, receiver);
            }
        }
    ) as T;
}
