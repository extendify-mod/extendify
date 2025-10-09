export type ObjectExports = Record<PropertyKey, unknown>;

export type ModuleExports =
    | ObjectExports
    | ((...args: unknown[]) => unknown)
    | string
    | boolean
    | symbol;
export type ModuleExportsWithProps<P extends string> = Record<P, unknown> &
    Record<PropertyKey, unknown>;

export interface RawModule {
    id: number;
    loaded: boolean;
    exports: Record<string, any>;
}

export type WebpackRawModules = Record<string | number, RawModule>;

export type WebpackRequire = ((e: number) => unknown) & {
    d: (module: unknown, exports: Record<string, () => unknown>) => void;
    m: WebpackChunk[1];
    iife: ((wreq: WebpackRequire) => void) & { $$: Omit<WebpackRequire["iife"], "$$"> };
};

export type WebpackModule = ((
    module: RawModule,
    exports: typeof module.exports,
    require: WebpackRequire,
    // This normally doesn't exist, but we can use it to pass our src
    ...args: unknown[]
) => void) & { $$?: Omit<WebpackModule, "$$"> };

export type WebpackChunk = [
    Array<symbol | number>,
    Record<number, WebpackModule>,
    ((r: WebpackRequire) => unknown)?
];

export type WebpackChunkGlobal = {
    push(chunk: WebpackChunk): unknown;
} & WebpackChunk[];
