import type { AnyFn } from "@shared/types/patch";
import type { WebpackRequire } from "@shared/types/webpack";

declare global {
    export const DEVELOPMENT: boolean;

    interface Window {
        exportedFunctions: { [name: string]: AnyFn };
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
