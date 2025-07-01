import { Platform, WebpackInstance } from "@webpack/types";
import { SettingsType } from "@api/settings";

type Theme = {
    name: string;
    author: string;
    description: string;
    source: string;
    fileName: string;
    version: string;
}

type ExtendifyNative = {
    themes: {
        uploadTheme(fileName: string, fileData: string): void;
        deleteTheme(fileName: string): void;
        getTheme(fileName: string): string | undefined;
        getThemesDir(): string;
        getThemes(): Theme[];
    };
    settings: {
        get(): SettingsType;
        set(settings: SettingsType, path: string): void;
        getSettingsDir(): string;
    };
}

declare global {
    export var IS_DEV: boolean;
    export var Extendify: typeof import("./Extendify");

    interface Window {
        EXTENDIFY_NATIVE_AVAILABLE: boolean = false;
        ExtendifyNative: ExtendifyNative;
    }
}
