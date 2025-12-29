import { getKwarg, hasArg } from "@scripts/args";
import {
    FLATPAK_CACHE_PATH,
    FLATPAK_PATH,
    SPOTIFY_CACHE_PATH,
    SPOTIFY_LAUNCHER_PATH,
    WIN_APP_ID
} from "@shared/constants";

import { access, constants, readdir } from "node:fs/promises";
import { join } from "node:path";
import { $, spawn } from "bun";

const usingFlatpak = hasArg("flatpak");

function noInstall() {
    throw new Error(
        "No Spotify installation found. Use --spotifyPath if it was moved somewhere else"
    );
}

function noData() {
    throw new Error("No Spotify data folder found. Use --cachePath if it was moved somewhere else");
}

export async function exists(path: string) {
    return await access(path, constants.F_OK)
        .then(() => true)
        .catch(() => false);
}

export async function getSpotifyPath(): Promise<string | undefined> {
    const argument = getKwarg("spotifyPath");
    if (argument) {
        return argument;
    }

    switch (process.platform) {
        case "win32": {
            if (!process.env.AppData || !process.env.ProgramFiles) {
                noInstall();
                return;
            }

            const appDataPath = join(process.env.AppData, "Spotify");
            if (await exists(appDataPath)) {
                return appDataPath;
            }

            try {
                const winAppsPath = join(process.env.ProgramFiles, "WindowsApps");
                for (const appName of await readdir(winAppsPath)) {
                    if (!appName.startsWith(WIN_APP_ID)) {
                        continue;
                    }

                    return join(winAppsPath, appName);
                }
            } catch {
                console.error("Couldn't access WinApps folder");
            }

            noInstall();
            return;
        }
        case "linux": {
            if (!process.env.HOME) {
                noInstall();
                return;
            }

            const path = join(
                process.env.HOME,
                usingFlatpak ? FLATPAK_PATH : SPOTIFY_LAUNCHER_PATH
            );
            if (!(await exists(path))) {
                noInstall();
                return;
            }

            return path;
        }
        case "darwin": {
            const path = "/Applications/Spotify.app/Contents/Resources";
            if (!(await exists(path))) {
                noInstall();
                return;
            }

            return path;
        }
        default:
            throw new Error(`Platform ${process.platform} not implemented`);
    }
}

export async function getCachePath(): Promise<string | undefined> {
    const argument = getKwarg("cachePath");
    if (argument) {
        return argument;
    }

    switch (process.platform) {
        case "win32": {
            if (!process.env.LocalAppData) {
                noData();
                return;
            }

            const appDataPath = join(process.env.LocalAppData, "Spotify");
            if (await exists(appDataPath)) {
                return appDataPath;
            }

            try {
                const packagesPath = join(process.env.LocalAppData, "Packages");
                for (const pkgName of await readdir(packagesPath)) {
                    if (!pkgName.startsWith(WIN_APP_ID)) {
                        continue;
                    }

                    return join(packagesPath, pkgName, "LocalState/Spotify");
                }
            } catch {
                console.error("Couldn't access Packages folder");
            }

            noData();
            return;
        }
        case "linux": {
            if (!process.env.HOME) {
                noData();
                return;
            }

            const path = join(
                process.env.HOME,
                usingFlatpak ? FLATPAK_CACHE_PATH : SPOTIFY_CACHE_PATH
            );
            if (!(await exists(path))) {
                noData();
                return;
            }

            return path;
        }
        case "darwin": {
            if (!process.env.HOME) {
                noData();
                return;
            }

            const path = join(
                process.env.HOME,
                "Library/Application Support/Spotify/PersistentCache"
            );
            if (!(await exists(path))) {
                noData();
                return;
            }

            return path;
        }
        default:
            throw new Error(`Platform ${process.platform} not implemented`);
    }
}

export async function getAppsPath(): Promise<string | undefined> {
    const spotifyPath = await getSpotifyPath();
    if (!spotifyPath) {
        return;
    }

    return join(spotifyPath, "Apps");
}

export async function killSpotify(): Promise<void> {
    try {
        switch (process.platform) {
            case "win32":
                await $`taskkill /F /IM Spotify.exe`.quiet();
                break;
            case "linux":
                await $`pkill spotify`;
                break;
            case "darwin":
                await $`pkill Spotify`;
                break;
            default:
                console.error(`Platform ${process.platform} not implemented`);
                return;
        }
    } catch {}
}

export async function launchSpotify(): Promise<void> {
    const spotifyPath = await getSpotifyPath();
    if (!spotifyPath) {
        return;
    }

    switch (process.platform) {
        case "win32":
            spawn([join(spotifyPath, "Spotify.exe")]);
            break;
        case "linux":
            await $`${usingFlatpak ? "flatpak run com.spotify.Client" : "spotify-launcher"}`;
            break;
        case "darwin":
            await $`${join(spotifyPath, "../MacOS/Spotify")}`;
            break;
        default:
            console.error(`Platform ${process.platform} not implemented`);
            return;
    }
}

export function getTimeDifference(timestamp: DOMHighResTimeStamp): string {
    return (performance.now() - timestamp).toFixed(2);
}

export function stringify(obj: Record<string, any>) {
    const result: Record<string, string> = {};

    for (const key in obj) {
        result[key] = JSON.stringify(obj[key]);
    }

    return result;
}
