import type { AdManagers, SettingsAPI } from "@shared/types/spotify";
import type { AnyExperiment } from "@shared/types/spotify/experiments";
import type { User } from "@shared/types/spotify/user";

import type { History } from "history";

export interface Platform {
    container: "Desktop";
    enableCastConnect: boolean;
    /**
     * The API that requests Spotify's advertising services.
     */
    getAdManagers(): AdManagers;
    /**
     * Allows you to retreive the user's audio output devices.
     */
    getAudioOutputDevicesAPI(): {
        devices: {
            fullName: string;
            id: string;
            isDefaultDevice: boolean;
            name: string;
            terminalType: string;
            transportType: string;
        }[];
    };
    /**
     * This API accesses your friends' listening status.
     */
    getBuddyFeedAPI(): any;
    getCollectionPlatformAPI(): any;
    /**
     * This API configures the in-app audio equalizer.
     */
    getEqualizerAPI(): {
        filters: {
            frequency: number;
            gain: number;
            key: string;
            type: string;
        }[];
        localStorageAPI: {
            clearItem(key: string): void;
            getItem<T>(key: string): T;
            setItem(key: string, value: any): void;
        };
    };
    /**
     * I'm pretty sure this is what allows communication from the renderer to the main process.
     */
    getEventSender(): any;
    /**
     * Maybe this is a wrapper for Apple's External Accessory Framework.
     */
    getExternalAccessoryAPI(): any;
    /**
     * Maybe there are more flags in here but I'm probably regionlocked.
     */
    getFeatureFlags(): {
        enableShows: boolean;
    };
    getGraphQLLoader(): (...args: any[]) => Promise<any>;
    getHistory(): History;
    /**
     * Data harvesting shenanigans.
     */
    getPlatformData(): PlatformData;
    getRegistry(): {
        _map: Map<Symbol, any>;
        resolve<T>(key: Symbol): T;
    };
    getRemoteConfiguration(): RemoteConfiguration;
    getRemoteConfigurationWithLocalOverrides(): RemoteConfiguration;
    /**
     * Use {@link Platform.getSession()} instead if you want to get credentials.
     */
    getRequestBuilder(): any;
    getSEOExperiments(): any;
    getServiceWorkerMessenger(): Promise<() => Promise<any>>;
    getSession(): Session;
    getSettingsAPI(): SettingsAPI;
    /**
     * This is not used and doesn't do anything. The service is always disabled on the backend.
     */
    getSingAlongAPI(): any;
    getTranslations(): Record<string, string>;
    /** Stuff with communication */
    getTransport(): any;
    /** This has something to do with analytics. */
    getUBILogger(): any;
    getUrlDispenserServiceClient(): {
        getShortUrl(
            uri: string,
            args: { utmParameters: any; customData: any; linkPreview: any }
        ): Promise<{
            full_url: string;
            share_id: string;
            shareable_url: string;
            spotify_uri: string;
        }>;
    };
    initialProductState: ProductStateAPI["productStateApi"]["options"];
    initialUser: User;
    isDeveloperMode: boolean;
    isVideoSupported: boolean;
    isWebPSupported: boolean;
    operatingSystem: string;
    username: string;
    version: string;
}

export interface PlatformData {
    app_platform: string;
    client_capabilities: {
        can_autostart: boolean;
        can_minimize_or_exit_on_close: boolean;
        can_restart: boolean;
        can_show_system_media_controls: boolean;
        can_show_track_notifications: boolean;
    };
    client_name: string;
    client_variant: string;
    client_version_quadruple: string;
    client_version_quintuple: string;
    client_version_triple: string;
    event_sender_context_information: {
        client_id: string;
        client_version_int: number;
        client_version_string: string;
        device_id: string;
        device_manufacturer: string;
        device_model: string;
        installation_id: string;
        os_version: string;
        platform_type: string;
    };
    is_developer_mode: boolean;
    os_name: string;
    os_settings: {
        double_click_interval_ms: number;
        scroller_style: string;
    };
    os_version: string;
    remote_config_client_id: string;
}

export interface Session {
    accessToken: string;
    accessTokenExpirationTimestampMs: string;
    isAnonymous: boolean;
    locale: string;
    market: string;
    valid: boolean;
}

export interface RemoteConfiguration {
    values: Map<String, any>;
    getValue<T>(key: string): T;
    toJSON(): Record<string, any>;
}

export interface LoggingParams {
    interactionId?: string;
    pageInstanceId?: string;
}

export interface Identifiable {
    index?: number;
    uri: string;
    name: string;
}

export interface ProductStateAPI {
    productStateApi: {
        options: Record<string, string>;
        delOverridesValues(values: any): Promise<void>;
        getValues(): Promise<any>;
        putOverridesValues(values: any): Promise<void>;
    };
}

export interface CosmosAPI {
    head(url: string, headers?: any): Promise<Record<string, string>>;
    get<T>(url: string, params?: any, headers?: any): Promise<T>;
    post<T>(url: string, data?: any, headers?: any): Promise<T>;
    put<T>(url: string, data?: any, headers?: any): Promise<T>;
    del<T>(url: string, data?: any, headers?: any): Promise<T>;
    patch<T>(url: string, data?: any, headers?: any): Promise<T>;
    sub<T>(url: string, data?: any, headers?: any): Promise<T>;
}

export interface RemoteConfigDebugAPI {
    _properties: AnyExperiment[];
    setOverride(
        key: {
            source: string;
            type: "enum" | "number" | "boolean";
            name: string;
        },
        value: any
    ): Promise<void>;
}

export interface SpotifyURI {
    type: string;
    hasBase62Id: boolean;
    id?: string;
    toURI(): string;
    toString(): string;
    toURLPath(relative: boolean): string;
    getPath(): string;
    toURL(parent: string | undefined): string;
    clone(): SpotifyURI;
}
