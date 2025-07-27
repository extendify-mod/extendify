import { registerContext } from "@api/context";
import { exportFunction, registerPatch } from "@api/patch";
import { startPlugins } from "@api/plugin";
import { createLazy } from "@shared/lazy";
import type { Platform } from "@shared/types/spotify";
import type { PlaybackAPI } from "@shared/types/spotify/playback";
import type { PlayerAPI } from "@shared/types/spotify/player";

export let platform: Platform | undefined;
export let player = resolveApi<PlayerAPI>("PlayerAPI");
export let playback = resolveApi<PlaybackAPI>("PlaybackAPI");

const { context } = registerContext({ name: "Platform" });

registerPatch(context, {
    find: "const{createPlatformDesktop:",
    replacement: {
        match: /(;const \i=)(await async function\(\){.*?}}\(\))/,
        replace: "$1$exp.loadPlatform($2)"
    }
});

exportFunction(context, function loadPlatform(value: Platform): Platform {
    platform = value;

    startPlugins();

    return value;
});

export function resolveApi<T>(key: string): T | undefined {
    return createLazy(() => {
        if (platform) {
            return platform.getRegistry().resolve(Symbol.for(key));
        }
    });
}
