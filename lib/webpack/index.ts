import type { WebpackRequire } from "@shared/types/webpack";

export let wreq: WebpackRequire;
export let moduleCache: WebpackRequire["c"];

export function initializeWebpack(instance: WebpackRequire) {
    wreq = window.wreq = instance;
}
