export interface PlaybackAPI {
    async getPlaybackInfo(): Promise<PlaybackInfo>;
    async getVolume(): Promise<number>;
    async getVolumeInternal(): Promise<number>;
    async lowerVolume(): Promise<void>;
    async raiseVolume(): Promise<void>;
    async setVolume(value: number): Promise<void>;
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
