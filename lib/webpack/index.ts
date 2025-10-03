import type { WebpackRequire } from "@shared/types/webpack";

export let wreq: WebpackRequire;

export function initializeWebpack(instance: WebpackRequire) {
    wreq = instance;
}

export function shouldIgnoreValue(value: any): boolean {
    if ([undefined, null, window, document, document.documentElement].includes(value)) {
        return true;
    }

    if (value[Symbol.toStringTag] === "DOMTokenList") {
        return true;
    }

    return false;
}

export function shouldIgnoreModule(exports: any): boolean {
    if (shouldIgnoreValue(exports)) {
        return true;
    }

    if (typeof exports !== "object") {
        return false;
    }

    for (const key in exports) {
        if (!shouldIgnoreValue(exports[key])) {
            return false;
        }
    }

    return true;
}
