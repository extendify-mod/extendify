export type ObjectExports = Record<PropertyKey, unknown>;

export type ModuleExports =
    | ObjectExports
    | ((...args: unknown[]) => unknown)
    | string
    | boolean
    | symbol;
export type ModuleExportsWithProps<P extends string> = Record<P, unknown> &
    Record<PropertyKey, unknown>;

export interface RawModule<T = unknown> {
    id: number;
    loaded: boolean;
    exports: T;
}

export type WebpackRawModules = Record<string | number, RawModule>;

export type WebpackRequire = ((e: number) => unknown) & {
    c?: WebpackRawModules;
    d: (module: unknown, exports: Record<string, () => unknown>) => void;
    m: WebpackChunk[1];
    iife: ((wreq: WebpackRequire) => void) & { $$: WebpackRequire["iife"] };
};

export type WebpackModule = (
    module: RawModule,
    exports: typeof module.exports,
    require: WebpackRequire
) => void;

export type WebpackChunk = [
    Array<symbol | number>,
    Record<number, WebpackModule>,
    ((r: WebpackRequire) => unknown)?
];

export type WebpackChunkGlobal = {
    push(chunk: WebpackChunk): unknown;
} & WebpackChunk[];
