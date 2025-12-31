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
    id: number | string;
    i?: number | string;
    loaded: boolean;
    l?: boolean;
    exports: Record<string, any>;
}

export type WebpackRawModules = Record<string | number, RawModule>;

export type WebpackRequire = ((e: number) => unknown) & {
    d: (module: unknown, exports: Record<string, () => unknown>) => void;
    m: WebpackChunk[1];
    p?: string;
    iife: WebpackModule;
};

export type ModuleEval = (name: string) => any;

export type WebpackModule = ((
    module: RawModule,
    exports: typeof module.exports,
    require: WebpackRequire,
    // This normally doesn't exist
    src: string
) => void) & { $$?: Omit<WebpackModule, "$$"> };

export type WebpackChunk = [
    Array<symbol | number>,
    Record<number, WebpackModule>,
    ((r: WebpackRequire) => unknown)?
];

export type WebpackChunkGlobal = {
    push(chunk: WebpackChunk): unknown;
} & WebpackChunk[];
