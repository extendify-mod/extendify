import type { TargetPlatform } from "@extendify/api/context";
import type { AnyFn } from "@extendify/api/context/patch";
import type { WebpackChunkGlobal } from "@extendify/shared/types/webpack";

import type React from "react";

declare module "*.css";

declare global {
    /** Whether Extendify is in debug mode */
    export const DEVELOPMENT: boolean;
    /** The platform for which Extendify is being compiled */
    export const PLATFORM: TargetPlatform;
    /** The name of the webpack chunk in the global window object */
    export const WEBPACK_CHUNK_NAME: string;
    /** Replaces the call with globbed imports */
    export function globPlugins(): void;

    interface Window extends Record<WEBPACK_CHUNKS, WebpackChunkGlobal | undefined> {
        ExtendifyFragment: symbol;
        ExtendifyCreateElement: typeof React.createElement | (() => any);

        exportedFunctions: {
            [context: string]: {
                [name: string]: AnyFn;
            };
        };
    }
}
