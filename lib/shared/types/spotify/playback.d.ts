export interface PlaybackAPI {
    getPlaybackInfo(): Promise<PlaybackInfo>;
    getVolume(): Promise<number>;
    getVolumeInternal(): Promise<number>;
    lowerVolume(): Promise<void>;
    raiseVolume(): Promise<void>;
    setVolume(value: number): Promise<void>;
}

export interface PlaybackInfo {
    advisedBitrate: number;
    audioId: string;
    buffering: boolean;
    codecName: string;
    error: number;
    fileBitrate: number;
    fileId: string;
    fileType: string;
    gainAdjustment: number;
    hasLoudness: boolean;
    lengthMs: BigInt;
    loudness: number;
    playbackSpeed: number;
    playing: boolean;
    resolvedContentUrl: string;
    status: number;
    strategy: string;
    targetBitrate: number;
    targetFileAvailable: boolean;
}
