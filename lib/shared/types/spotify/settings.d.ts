export interface SettingsAPI {
    autoPlay: {
        autoPlaySupported: Setting<boolean>;
    } & Setting<boolean>;
    contentPreferences: {
        allowExplicitContent: Setting<boolean>;
        explicitContentForceDisallowed: Setting<boolean>;
    };
    display: {
        nativeNotificationOnPlayerTransition: Setting<boolean>;
        nativeOverlayOnMediaKeys: Setting<boolean>;
        newReleasesAnnoucements: Setting<boolean>; // Typo is intentional
    };
    employee: {
        developerMode: Setting<boolean>;
        /**
         * This setting isn't serializable, meaning it can't be written to.
         * It also errors when {@link Setting.getValue()} is called.
         */
        isEmployee: Setting<boolean>;
        showChromeToolbar: Setting<boolean>;
    };
    language: Setting<string>;
    quality: {
        autoAdjustQuality: Setting<boolean>;
        downloadAudioQuality: Setting<number>;
        maxSupportedQuality: Setting<number>;
        normalizeVolume: Setting<boolean>;
        playbackService: PlaybackService;
        /**
         * What the heck is this and why can this return null?
         */
        remoteQuality: Setting<number | null>;
        streamingQuality: Setting<number>;
        volumeLevel: Setting<number>;
    };
    social: {
        autoPublishPlaylist: Setting<boolean>;
        privateSession: Setting<boolean>;
        shareListeningActivity: Setting<boolean>;
        showMyTopArtists: Setting<boolean>;
    };
    /**
     * This is just bound to the zoom level of the webpage.
     * This setting isn't serializable, meaning it can't be written to.
     */
    viewportZoom: Setting<number>;
}

export interface Setting<T> {
    getValue(): Promise<T>;
    setValue(value: T): Promise<void>;
    subValue(callback: (e) => void): void;
    identifier: string;
    key: string;
}

/** TODO */
export interface PlaybackService {
    options: any;
    duck(e, t);
    getFiles(e, t);
    getFormats(e, t);
    getPlaybackInfo(e, t);
    getRawVolume(e, t);
    getVolume(
        e: {
            source: number;
            volume: number;
        },
        t
    );
    lowerVolume(e, t);
    raiseVolume(e, t);
    setRawVolume(e, t);
    setVolume(e, t);
    subBufferUnderrun(e, t);
    subPlaybackInfo(e, t);
    subPosition(e, t);
    subRawVolume(e, t);
    subVolume(e, t);
}
