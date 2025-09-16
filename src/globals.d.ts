import type { TargetPlatform } from "@api/context";
import type { WEBPACK_CHUNK } from "@shared/constants";
import type { AnyFn } from "@shared/types/patch";
import type { WebpackChunkGlobal, WebpackRequire } from "@shared/types/webpack";

import type { createElement } from "react";

declare module "*.css";

declare global {
    export const DEVELOPMENT: boolean;
    export const PLATFORM: TargetPlatform;
    export const ENTRYPOINTS: string[];
    export const WEBPACK_CHUNK: string;

    interface Window {
        [WEBPACK_CHUNK]?: WebpackChunkGlobal;

        ExtendifyFragment: Symbol;
        ExtendifyCreateElement: ((...args: unknown[]) => void) | typeof createElement;

        exportedFunctions: {
            [context: string]: {
                [name: string]: AnyFn;
            };
        };
    }

    interface ImportMeta {
        glob<T = any>(
            pattern: ImportMetaGlobPattern,
            options?: ImportMetaGlobOptions
        ): Record<string, () => Promise<T>>;
        glob<T = any>(
            pattern: ImportMetaGlobPattern,
            options: Extract<ImportMetaGlobOptions, { eager: true }>
        ): Record<string, T>;
    }
}

type ImportMetaGlobPattern = string | string[];

interface ImportMetaGlobOptions {
    eager?: boolean;
    import?: string;
    query?: string | Record<string, string>;
}

export {};
