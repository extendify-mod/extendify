import type { WebpackRequire } from "@shared/types/webpack";

declare global {
    export const DEVELOPMENT: boolean;

    interface Window {
        wreq: WebpackRequire;
    }
}

export {};
