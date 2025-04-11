export type AdManagers = {
    audio: {
        disable(): Promise<void>;
        inStreamApi: {
            adsCoreConnector: {
                clearSlot(slotId: string): void;
                subscribeToSlot(slotId: string, callback: (data: { adSlotEvent: { slotId: string } }) => void): void;
            };
        };
        isNewAdsNpvEnabled: boolean;
    };
    billboard: {
        disable(): Promise<void>;
    };
    leaderboard: {
        disableLeaderboard(): Promise<void>;
    };
    inStreamApi: {
        disable(): Promise<void>;
    };
    sponsoredPlaylist: {
        disable(): Promise<void>;
    };
    vto: {
        manager: {
            disable(): Promise<void>;
        };
        isNewAdsNpvEnabled: boolean;
    };
};

export type InStreamApi = {
    adsCoreConnector: any;
    enabled: boolean;
    inStreamAd: any | null;
    inStreamAdsSubscription: any | null;
    /**
     * I'm just making this up omE
     */
    onAdMessageCallbacks: ((m: any) => void)[];
};

export type Ad = {
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
};
