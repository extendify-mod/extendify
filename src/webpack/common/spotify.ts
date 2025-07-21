import { proxyLazy } from "@utils/lazy";
import { StartAt } from "@utils/types";
import { filters, findByCode, waitFor } from "@webpack";
import {
    ConnectDevicesAPI,
    CosmosAPI,
    Platform,
    PlaybackAPI,
    PlayerAPI,
    RemoteConfigDebugAPI,
    SpotifyURI
} from "@webpack/types";

import { createEventListeners, startAllPlugins } from "plugins";

export const findApiLazy = <T>(name: string): T => {
    const proxy = proxyLazy(
        (): T => {
            if (!platform) {
                return null as T;
            }
            const api = platform.getRegistry().resolve(Symbol.for(name)) as T;
            return api;
        },
        5,
        false
    );
    return proxy;
};

// TODO: this is broken because it just finds the class and not the instance
export const findService = <T>(id: string): T => {
    return findByCode(`SERVICE_ID="${id}"`) as T;
};

export let parseUri: (uri: string) => SpotifyURI;
waitFor(filters.byCode("Argument `uri` must be a string"), (v) => (parseUri = v));

export let platform: Platform;
export let player = findApiLazy<PlayerAPI>("PlayerAPI");
export let playback = findApiLazy<PlaybackAPI>("PlaybackAPI");
export let connectDevices = findApiLazy<ConnectDevicesAPI>("ConnectDevicesAPI");
export let cosmos = findApiLazy<CosmosAPI>("Cosmos");
export let remoteConfig = findApiLazy<RemoteConfigDebugAPI>("RemoteConfigDebugAPI");

export const _loadPlatform = (value: Platform): Platform => {
    platform = value;

    startAllPlugins(StartAt.ApisLoaded);
    createEventListeners();

    return platform;
};
