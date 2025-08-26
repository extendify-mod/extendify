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
