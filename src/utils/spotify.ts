import { connectDevices, platform, player } from "@webpack/common";

export function getProgress(): number {
    if (!player) {
        return 0;
    }
    const state = player.getState();
    if (state.isPaused) {
        return state.positionAsOfTimestamp;
    }
    return Date.now() - state.timestamp + state.positionAsOfTimestamp;
}

export function isPlayingLocally(): boolean {
    if (!connectDevices || !connectDevices.getActiveDevice()) {
        return true;
    }
    return connectDevices.getActiveDevice().isLocal;
}

export function redirectTo(path: string) {
    platform.getHistory().push(path);
}

export function findTranslation(value: string, object = platform.getTranslations()): Record<string, any> {
    const results: Record<string, any> = {};
    for (const key in object) {
        const translation = object[key];
        if (typeof translation === "string") {
            if (translation.toLowerCase().includes(value.toLowerCase())) {
                results[key] = translation;
            }
        } else if (typeof translation === "object") {
            const scan = findTranslation(value, translation);
            if (Object.keys(scan).length > 0) {
                results[key] = scan;
            }
        }
    }
    return results;
}
