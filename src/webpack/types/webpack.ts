/**
 * Modified version of Swishilicous's Discord WebpackInstance
 * @link https://github.com/Swishilicous/discord-types/blob/main/other/WebpackInstance.d.ts
 */
export interface WebpackInstance {
    (id: number): any;
    /**
     * Returns the modules that have been loaded. (Module cache)
     */
    c: {
        [id: number]: {
            id: number | string;
            loaded: boolean;
            exports: any;
        };
    };
    e: (chunkId: number) => any;
    /**
     * Returns the module factories.
     */
    m: {
        [id: number]: {
            (e: { exports: any; id: number; loaded: boolean }, ret: object, req: WebpackInstance): void;
            original: (e: { exports: any; id: number; loaded: boolean }, ret: object, req: WebpackInstance) => void;
        };
    };
    /**
     * Returns the bundle path.
     */
    p: string;
    /**
     * Returns the script name of the given module id.
     * Falls back to `return e + "js"`.
     */
    u: (e: any) => string;
    iife: (wreq: WebpackInstance) => void;
    d: (id: any, exports: any) => void;
}
