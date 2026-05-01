import type { TargetPlatform } from "@api/context";
import type { AnyFn } from "@api/context/patch";
import type { WebpackChunkGlobal } from "@shared/types/webpack";

import type React from "react";

declare module "*.css";

declare global {
    /** Whether Extendify is in debug mode */
    export const DEVELOPMENT: boolean;
    /** The platform for which Extendify is being compiled */
    export const PLATFORM: TargetPlatform;
    /** The urls of the possible entrypoint bundles */
    export const ENTRYPOINTS: string[];
    /** The name of the webpack chunk in the global window object */
    export const WEBPACK_CHUNK: string;

    interface Window {
        [WEBPACK_CHUNK]?: WebpackChunkGlobal;

        ExtendifyFragment: symbol;
        ExtendifyCreateElement: typeof React.createElement | (() => any);

        exportedFunctions: {
            [context: string]: {
                [name: string]: AnyFn;
            };
        };
    }

    type ImportMetaGlobPattern = string | string[];

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

    interface ImportMetaGlobOptions {
        eager?: boolean;
        import?: string;
        query?: string | Record<string, string>;
    }
}
