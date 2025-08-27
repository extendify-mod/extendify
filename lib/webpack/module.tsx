import { useEffect, useState } from "@api/react";
import { type AnyMatch, srcMatches } from "@shared/match";
import type { RawModule } from "@shared/types/webpack";
import { shouldIgnoreValue, wreq } from "@webpack";

import type { ComponentType } from "react";

export type ExportFilter = (moduleExport: any) => boolean;

interface ExportSubscription<T = unknown> {
    filter: ExportFilter;
    callback: (moduleExport: T) => void;
}

interface ModuleSubscription<T = Record<string, any>> {
    props: string[];
    callback: (module: T) => void;
}

const exportSubscriptions: Set<ExportSubscription> = new Set();
const moduleSubscriptions: Set<ModuleSubscription> = new Set();

export const exportFilters = {
    byProps(...props: string[]): ExportFilter {
        return (moduleExport) => {
            if (typeof moduleExport !== "object") {
                return false;
            }

            const keys = Object.keys(moduleExport);
            return props.every((prop) => keys.includes(prop));
        };
    },
    byCode(match: AnyMatch): ExportFilter {
        function filter(moduleExport: any) {
            if (typeof moduleExport !== "function") {
                return false;
            }

            return srcMatches(moduleExport.toString(), match);
        }

        return (moduleExport) => {
            if (filter(moduleExport)) {
                return true;
            }

            if (!moduleExport.$$typeof) {
                return false;
            }

            if (moduleExport.render) {
                return filter(moduleExport.render);
            }

            const { type: moduleType } = moduleExport;
            if (moduleType) {
                return moduleType.render ? filter(moduleType.render) : filter(moduleType);
            }

            return false;
        };
    },
    byEncoreName(name: string): ExportFilter {
        const filter = exportFilters.byCode(
            new RegExp(String.raw`"data-encore-id":\i\.\i\.${name}[},]`)
        );

        return (moduleExport) => {
            if (moduleExport.displayName === name) {
                return true;
            }

            return filter(moduleExport);
        };
    }
};

function checkExport(moduleExport: any, filter: ExportFilter): boolean {
    if (shouldIgnoreValue(moduleExport)) {
        return false;
    }

    return filter(moduleExport);
}

export function onModuleLoaded(module: RawModule) {
    for (const subscription of exportSubscriptions) {
        function checkSubscription(moduleExport: any): boolean {
            if (!subscription || !checkExport(moduleExport, subscription.filter)) {
                return false;
            }

            subscription.callback(moduleExport);
            exportSubscriptions.delete(subscription);

            return true;
        }

        if (checkSubscription(module.exports)) {
            continue;
        }

        if (typeof module.exports !== "object") {
            continue;
        }

        for (const child of Object.values(module.exports)) {
            checkSubscription(child);
        }
    }

    for (const subscription of moduleSubscriptions) {
        if (typeof module.exports !== "object") {
            continue;
        }

        const exportKeys = Object.keys(module.exports);
        if (subscription.props.every((prop) => exportKeys.includes(prop))) {
            subscription.callback(module.exports);
            moduleSubscriptions.delete(subscription);
        }
    }
}

export async function findModuleExport<T>(filter: ExportFilter): Promise<T> {
    function createPromise(): Promise<T> {
        return new Promise((resolve) => {
            exportSubscriptions.add({
                filter,
                callback: (moduleExport) => resolve(moduleExport as T)
            });
        });
    }

    if (!wreq?.c) {
        return createPromise();
    }

    for (const module of Object.values(wreq.c)) {
        if (!module?.loaded || !module.exports) {
            continue;
        }

        if (checkExport(module.exports, filter)) {
            return module.exports as T;
        }

        if (typeof module.exports !== "object") {
            continue;
        }

        for (const child of Object.values(module.exports)) {
            if (!checkExport(child, filter)) {
                continue;
            }

            return child as T;
        }
    }

    return createPromise();
}

export async function findModule<T = Record<string, any>>(...props: string[]): Promise<T> {
    function createPromise(): Promise<T> {
        return new Promise((resolve) => {
            moduleSubscriptions.add({
                props,
                callback: (module) => resolve(module as T)
            });
        });
    }

    if (!wreq?.c) {
        return createPromise();
    }

    for (const module of Object.values(wreq.c)) {
        if (!module?.loaded || !module.exports) {
            continue;
        }

        if (typeof module.exports !== "object") {
            continue;
        }

        const exportKeys = Object.keys(module.exports);
        if (props.every((prop) => exportKeys.includes(prop))) {
            return module.exports as T;
        }
    }

    return createPromise();
}

type LazyComponent<T> = ComponentType<T> & { hasResolved: boolean };

export function findModuleComponent<T extends object = any>(
    filter: ExportFilter
): LazyComponent<T> {
    let Component: ComponentType<T> | undefined;

    findModuleExport<ComponentType<T>>(filter).then((moduleExport) => {
        Component = moduleExport;
    });

    const Lazy = (props: T) => {
        return Component ? <Component {...props} /> : <></>;
    };

    Object.defineProperty(Lazy, "hasResolved", {
        get() {
            return typeof Component !== "undefined";
        }
    });

    return Lazy as LazyComponent<T>;
}
