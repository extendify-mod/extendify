export interface ConnectDevicesAPI {
    getActiveDevice(): Device;
    getConnectState(): {
        activeDevice: Device;
        connectingDevice?: Device;
        connectionStatus: string;
        devices: Device[];
    };
    getDevices(): Device[];
}

export interface Device {
    brandDisplayName: string;
    connectStateId: string;
    currentState: string;
    disabledReason?: string;
    id: string;
    incarnation: {
        available: unknown[];
        preferred?: unknown;
    };
    isActive: boolean;
    isConnecting: boolean;
    isDisabled: boolean;
    isGroup: boolean;
    isLocal: boolean;
    isLocalNetwork: boolean;
    isWebApp: boolean;
    isZeroconf: boolean;
    license: string;
    losslessSupport: {
        deviceSupported: boolean;
        fullySupported: boolean;
        userEligible: boolean;
    };
    modelDisplayName: string;
    name: string;
    supportedMediaTypes: Set<string>;
    supportsDJNarration: boolean;
    supportsLogout: boolean;
    type: string;
    volume: number;
}
