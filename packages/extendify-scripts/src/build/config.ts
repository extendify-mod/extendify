import type { TargetPlatform } from "@extendify/shared/types";

export const webpackChunkNames: Record<TargetPlatform, string[]> = {
    browser: ["rspackChunk"],
    desktop: ["rspackChunk", "rspackChunkclient_web"]
};
