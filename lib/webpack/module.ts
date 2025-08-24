import { type AnyMatch, srcMatches } from "@shared/match";
import type { RawModule } from "@shared/types/webpack";
import { wreq } from "@webpack";

export type ExportFilter = (moduleExport: any) => boolean;

interface ExportSubscription<T = unknown> {
    filter: ExportFilter;
    callback: (moduleExport: T) => void;
}

interface ModuleSubscription<T = Record<string, any>> {
    props: string[];
    callback: (module: T) => void;
}

const exportSubscriptions: ExportSubscription[] = [];
const moduleSubscriptions: ModuleSubscription[] = [];

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

            const { type: moduleType } = moduleExport;
            if (moduleType) {
                return moduleType.render ? filter(moduleType.render) : filter(moduleType);
            }

            if (moduleExport.render) {
                return filter(moduleExport.render);
            }

            return false;
        };
    },
    byEncoreName(name: string): ExportFilter {
        const filter = exportFilters.byCode!(
            new RegExp(String.raw`"data-encore-id":\i\.\i\.${name}[{,]`)
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
    if (typeof moduleExport !== "function") {
        return false;
    }

    return filter(moduleExport);
}

export function onModuleLoaded(module: RawModule) {
    for (let i = 0; i < exportSubscriptions.length; i++) {
        const subscription = exportSubscriptions[i];
        if (!subscription) {
            continue;
        }

        function checkSubscription(moduleExport: any): boolean {
            if (!subscription || !checkExport(moduleExport, subscription.filter)) {
                return false;
            }

            subscription.callback(moduleExport);
            exportSubscriptions.splice(i--, 1);

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

    for (let i = 0; i < moduleSubscriptions.length; i++) {
        const subscription = moduleSubscriptions[i];
        if (!subscription) {
            continue;
        }

        if (typeof module.exports !== "object") {
            continue;
        }

        const exportKeys = Object.keys(module.exports);
        if (subscription.props.every((prop) => exportKeys.includes(prop))) {
            subscription.callback(module.exports);
            moduleSubscriptions.splice(i--, 1);
        }
    }
}

export async function findModuleExport<T>(filter: ExportFilter): Promise<T> {
    function createPromise(): Promise<T> {
        return new Promise((resolve) => {
            exportSubscriptions.push({
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
            moduleSubscriptions.push({
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
