import type { Identifiable, LoggingParams } from "@shared/types/spotify";
import type { QueueAction, QueueState } from "@shared/types/spotify/queue";

export interface PlayerAPI {
    forcedShuffle: boolean;
    addToQueue(
        elements: { uid?: string; uri?: string }[],
        loggingParams?: LoggingParams
    ): Promise<void>;
    canPlayEncryptedContent(): Promise<boolean>;
    /**
     * Checks if {@param signal} is in {@link PlayerState.signals}.
     */
    canSendSignal(signal: string): boolean;
    clearQueue(): Promise<void>;
    getCapabilities(): PlayerCapabilities;
    getEvents(): PlayerEvents;
    getForcedShuffle(): boolean;
    getQueue(): QueueState;
    getReferrer(): string;
    getState(): PlayerState;
    insertIntoQueue(e, t, options): Promise<void>;
    pause(): Promise<void>;
    play(e, t, options): Promise<void>;
    playAsNextInQueue(e): Promise<void>;
    refreshCurrentContext(): Promise<void>;
    removeFromQueue(e): Promise<void>;
    reorderQueue(e, t): Promise<void>;
    resume(): Promise<void>;
    seekBackward(ms: number): Promise<void>;
    seekForward(ms: number): Promise<void>;
    seekTo(ms: number): Promise<void>;
    setShuffle(shuffle: boolean): Promise<void>;
    setForcedShuffle(value: boolean): Promise<void>;
    setRepeat(value: Repeat): Promise<void>;
    setSpeed(value: number): Promise<void>;
    skipTo(e): Promise<void>;
    skipToNext(): Promise<void>;
    skipToPrevious(): Promise<void>;
    updateContext(e, t, n): Promise<void>;
}

export interface PlayerState {
    context: {
        uri: string;
        url: string;
    };
    duration: number;
    hasContext: true;
    index: {
        pageURI?: string;
        pageIndex: number;
        itemIndex: number;
    };
    isBuffering: boolean;
    isPaused: boolean;
    item?: Song;
    nextItems?: Song[];
    playbackId: string;
    playbackQuality: {
        bitrateLevel: number;
        losslessStatus: number;
        strategy: number;
        targetBitrateAvailable: boolean;
        targetBitrateLevel: number;
    };
    positionAsOfTimestamp: number;
    previousItems: Song[];
    repeat: Repeat;
    restrictions: any;
    sessionId: string;
    shuffle: boolean;
    signals: string[];
    smartShuffle: boolean;
    speed: number;
    speedEsperanto: number;
    timestamp: number;
}

export enum Repeat {
    NONE = 0,
    CONTEXT = 1,
    SONG = 2
}

export type PlayerEventType =
    | "update"
    | "error"
    | "action"
    | "queue_action"
    | "queue_action_complete"
    | "queue_update"
    | "context_wraparound";

export interface PlayerEvents {
    emitPauseSync(): any;
    emitPlaySync(
        context: {
            playlistQueryOptions: {
                filter: string;
                isExtraColumnsEnabled: boolean;
                limit: number;
                offset: number;
            };
            sort: {
                field: string;
                order: string;
            };
            uri: string;
        },
        origin: {
            featureIdentifier: string;
            referrerIdentifier: string;
        },
        options: {
            loggingParams: LoggingParams;
            shuffle: boolean;
            skipTo?: Identifiable;
        }
    ): any;
    emitQueueActionComplete(action: QueueAction, error?: Error): any;
    emitQueueActionSync(action: QueueAction): any;
    emitQueueUpdate(queueState: QueueState): any;
    emitResumeSync(): any;
    emitSkipToNextSync(): any;
    emitSkipToPreviousSync(): any;
    /**
     * @returns A callback that removes the listener when called.
     */
    addListener(event: PlayerEventType, callback: (e: any) => void, options?: any): () => void;
}

export interface Song {
    album: {
        images: {
            label: string;
            url: string;
        }[];
        name: string;
        type: "album";
        uri: string;
    };
    artists: {
        name: string;
        type: "artist";
        uri: string;
    }[];
    duration: {
        milliseconds: number;
    };
    hasAssociatedVideo: boolean;
    images: {
        label: string;
        url: string;
    }[];
    is19PlusOnly: boolean;
    isExplicit: boolean;
    isLocal: boolean;
    mediaType: string;
    metadata: any;
    name: string;
    provider: string;
    type: "track";
    uid: string;
    uri: string;
}

export interface PlayerCapabilities {
    canChangeSpeed: boolean;
    canChangeVolume: boolean;
    canPlayMultipleContextPages: boolean;
    hasDecoratedQueue: boolean;
    maxNextTracks: number;
}
