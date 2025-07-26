import type { wreq } from "@webpack";

declare global {
    interface Window {
        werq: typeof wreq;
    }
}

export {};
