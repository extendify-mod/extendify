export interface WebpackRequire {
    m: WebpackChunk[1];
    p: string;
    iife: ((wreq: WebpackRequire) => void) & { $$: WebpackRequire["iife"] };
}

export interface WebpackModule<T = unknown> {
    id: number;
    loaded: boolean;
    exports: T;
}

export type WebpackChunk = [
    (symbol | number)[],
    Record<number, WebpackModule>,
    ((wreq: WebpackRequire) => unknown)?
];
