import { exportFunction, registerPatch } from "@api/patch";
import type { Platform } from "@shared/types/spotify";

export let platform: Platform | undefined;

registerPatch("Platform", {
    find: "const{createPlatformDesktop:",
    replacement: {
        match: /(;const \i=)(await async function\(\){.*?}}\(\))/,
        replace: "$1$exp.loadPlatform($2)"
    }
});

function loadPlatform(value: Platform): Platform {
    platform = value;
    return value;
}

exportFunction(loadPlatform);
