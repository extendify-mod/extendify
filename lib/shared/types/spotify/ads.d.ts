export interface AdManagers {
    audio: {
        disable(): void;
        inStreamApi: {
            adsCoreConnector: {
                clearSlot(slotId: string): void;
                subscribeToSlot(
                    slotId: string,
                    callback: (data: { adSlotEvent: { slotId: string } }) => void
                ): void;
            };
        };
    };
    billboard: {
        disable(): Promise<void>;
    };
    leaderboard: {
        disableLeaderboard(): void;
    };
    inStreamApi: {
        disable(): void;
    };
    sponsoredPlaylist: {
        disable(): void;
    };
    vto: {
        manager: {
            disable(): void;
        };
    };
}

export interface InStreamApi {
    adsCoreConnector: any;
    enabled: boolean;
    inStreamAd: any | null;
    inStreamAdsSubscription: any | null;
    /** Making this up */
    onAdMessageCallbacks: ((m: any) => void)[];
}

export interface Ad {
    adId: string;
    audio: any[];
    clickthroughUrl: string;
    companions: any[];
    coverArt: any[];
    display: {
        audioFileId?: string;
        bitrate: number;
        duration: number;
        height: number;
        imageFileId?: string;
        mimeType: string;
        text: string;
        url?: string;
        videoManifestId?: string;
        width: number;
    }[];
    format: number;
    isDsaEligible: boolean;
    isDummy: boolean;
    metadata: {
        bookmarkable: string;
    };
    requestId: string;
    slot: string;
    trackingEvents: any;
    video: any[];
}

export interface AdsTestingClient {
    addPlaytime(opts: { seconds: number });
}

export interface SlotsClient {
    clearAllAds(params: { slotId: string }): Promise<void>;
    getSlots(): Promise<{ adSlots: { slotId: string; slot_id: string }[] }>;
}

export interface SlotSettingsClient {
    updateAdServerEndpoint(params: { slotIds: string[]; url: string }): Promise<void>;
    updateDisplayTimeInterval(params: { slotId: string; timeInterval: bigint }): Promise<void>;
    updateSlotEnabled(params: { slotId: string; enabled: boolean }): Promise<void>;
    updateStreamTimeInterval(params: { slotId: string; timeInterval: bigint }): Promise<void>;
}
