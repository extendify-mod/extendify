const unconfigurable = ["arguments", "caller", "prototype"];

const value = Symbol();

type Dummy<T> = (() => T | undefined) & { [value]?: T };

const handler: ProxyHandler<Dummy<unknown>> = {
    getOwnPropertyDescriptor: (target, p) => {
        const obj = ((typeof p !== "string" || !unconfigurable.includes(p)) && target()) || {};
        return Reflect.getOwnPropertyDescriptor(obj, p);
    },
    ownKeys: target => {
        const keys = Reflect.ownKeys(target() || {});
        return [...keys, ...unconfigurable.filter(key => !keys.includes(key))];
    }
};

for (const method of Reflect.ownKeys(Reflect).filter(key => typeof key === "string")) {
    handler[method as keyof typeof handler] ??= (target, ...args: unknown[]) => {
        return (Reflect as any)[method](target() || {}, ...args);
    };
}

export function createLazy<T>(getter: (() => T) | PromiseLike<T>): T {
    const dummy: Dummy<T> = () => {
        if (typeof getter === "function") dummy[value] ??= getter();
        return dummy[value];
    };

    if ("then" in getter)
        getter.then(resolved => {
            dummy[value] = resolved;
        });

    return new Proxy(dummy, handler) as T;
}
