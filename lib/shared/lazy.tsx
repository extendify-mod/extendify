import { useEffect, useState } from "@api/react";
import { type ExportFilter, findModuleExport } from "@webpack/module";

import type { ComponentType } from "react";

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

type LazyComponent<T> = ComponentType<T> & { hasResolved: boolean };

export function createLazyComponent<T extends object = any>(
    filter: ExportFilter
): LazyComponent<T> {
    let hasResolved = false;

    const Lazy = (props: T) => {
        const [Component, setComponent] = useState<ComponentType<T> | undefined>();

        useEffect(() => {
            let mounted = true;

            findModuleExport<ComponentType<T>>(filter).then((moduleExport) => {
                if (!mounted) {
                    return;
                }

                setComponent(moduleExport);
                hasResolved = true;
            });

            return () => {
                mounted = false;
            };
        }, [filter]);

        return Component ? <Component {...props} /> : <></>;
    };

    Object.defineProperty(Lazy, "hasResolved", {
        get() {
            return hasResolved;
        }
    });

    return Lazy as LazyComponent<T>;
}
