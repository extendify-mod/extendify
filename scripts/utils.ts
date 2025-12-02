import { getKwarg, hasArg } from "@scripts/args";
import { createLogger } from "@shared/logger";

import { $ } from "bun";
import { access, constants, readdir } from "node:fs/promises";
import { join } from "node:path";

const winAppId = "SpotifyAB.SpotifyMusic";

// Linux has multiple install methods:
// - spotify-launcher from aur (Implemented)
// - flatpak (Implemented)
// - official Spotify apt repo (Not implemented)
const flatpakPath =
    ".local/share/flatpak/app/com.spotify.Client/x86_64/stable/active/files/extra/share/spotify";
const flatpakCachePath = ".var/app/com.spotify.Client/cache/spotify";
const spotifyLauncherPath = ".local/share/spotify-launcher/install/usr/share/spotify";
const spotifyCachePath = ".cache/spotify";

const usingFlatpak = hasArg("flatpak");

const logger = createLogger({ name: "Scripts" });

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
                    if (!appName.startsWith(winAppId)) {
                        continue;
                    }

                    return join(winAppsPath, appName);
                }
            } catch {
                logger.error("Couldn't access WinApps folder");
            }

            noInstall();
            return;
        }
        case "linux": {
            if (!process.env.HOME) {
                noInstall();
                return;
            }

            const path = join(process.env.HOME, usingFlatpak ? flatpakPath : spotifyLauncherPath);
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
                    if (!pkgName.startsWith(winAppId)) {
                        continue;
                    }

                    return join(packagesPath, pkgName, "LocalState/Spotify");
                }
            } catch {
                logger.error("Couldn't access Packages folder");
            }

            noData();
            return;
        }
        case "linux": {
            if (!process.env.HOME) {
                noData();
                return;
            }

            const path = join(process.env.HOME, usingFlatpak ? flatpakCachePath : spotifyCachePath);
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

export function killSpotify(): Promise<void> {
    return new Promise((resolve, reject) => {
        let command: string;
        switch (process.platform) {
            case "win32":
                command = "taskkill /F /IM Spotify.exe";
                break;
            case "linux":
                command = "pkill spotify";
                break;
            case "darwin":
                command = "killall Spotify";
                break;
            default:
                reject(`Platform ${process.platform} not implemented`);
                return;
        }

        $`${command}`
            .then(() => resolve())
            .catch(e => logger.error(`Couldn't kill Spotify process: ${e}`));
    });
}

export async function launchSpotify(): Promise<void> {
    const spotifyPath = await getSpotifyPath();
    if (!spotifyPath) {
        return;
    }

    switch (process.platform) {
        case "win32":
            await $`start \"${join(spotifyPath, "Spotify.exe")}\"`;
            break;
        case "linux":
            await $`${usingFlatpak ? "flatpak run com.spotify.Client" : "spotify-launcher"}`;
            break;
        case "darwin":
            await $`${join(spotifyPath, "../MacOS/Spotify")}`;
            break;
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
