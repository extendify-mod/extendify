import { getKwarg, hasArg } from "./args";

import { spawn, spawnSync } from "bun";
import { access, constants, readdir } from "fs/promises";
import { join } from "path";

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

export async function exists(path: string) {
    return await access(path, constants.F_OK)
        .then(() => true)
        .catch(() => false);
}

export async function getSpotifyPath(): Promise<string> {
    let argument;
    if ((argument = getKwarg("spotifyPath"))) {
        return argument;
    }

    switch (process.platform) {
        case "win32":
            const appDataPath = join(process.env.AppData!, "Spotify");
            if (await exists(appDataPath)) {
                return appDataPath;
            }

            const winAppsPath = join(process.env.ProgramFiles!, "WindowsApps");
            for (const appName of await readdir(winAppsPath)) {
                if (!appName.startsWith(winAppId)) {
                    continue;
                }

                return join(winAppsPath, appName);
            }

            throw new Error(
                "No Spotify installation found. Use --spotifyPath if it was moved somewhere else"
            );
        case "linux":
            return join(process.env.HOME!, usingFlatpak ? flatpakPath : spotifyLauncherPath);
        case "darwin":
            return "/Applications/Spotify.app/Contents/Resources";
        default:
            throw new Error(`Platform ${process.platform} not implemented`);
    }
}

export async function getCachePath(): Promise<string> {
    let argument;
    if ((argument = getKwarg("cachePath"))) {
        return argument;
    }

    switch (process.platform) {
        case "win32":
            const appDataPath = join(process.env.LocalAppData!, "Spotify");
            if (await exists(appDataPath)) {
                return appDataPath;
            }

            const packagesPath = join(process.env.LocalAppData!, "Packages");
            for (const pkgName of await readdir(packagesPath)) {
                if (!pkgName.startsWith(winAppId)) {
                    continue;
                }

                return join(packagesPath, pkgName, "LocalState/Spotify");
            }

            throw new Error(
                "No Spotify data folder found. Use --cachePath if it was moved somewhere else"
            );
        case "linux":
            return join(process.env.HOME!, usingFlatpak ? flatpakCachePath : spotifyCachePath);
        case "darwin":
            return join(process.env.HOME!, "Library/Application SUpport/Spotify/PersistentCache");
        default:
            throw new Error(`Platform ${process.platform} not implemented`);
    }
}

export async function getAppsPath(): Promise<string> {
    return join(await getSpotifyPath(), "Apps");
}

export async function killSpotify(): Promise<void> {
    return new Promise((resolve, reject) => {
        let command;
        switch (process.platform) {
            case "win32":
                command = "taskkill /F /IM Spotify.exe";
                break;
            case "linux":
                command = "killall spotify";
                break;
            case "darwin":
                command = "killall Spotify";
                break;
            default:
                reject(`Platform ${process.platform} not implemented`);
                return;
        }

        try {
            spawnSync({ cmd: command.split(" ") });
            resolve();
        } catch (e) {
            console.error(`Couldn't kill Spotify process: ${e}`);
        }
    });
}

export async function launchSpotify(): Promise<void> {
    switch (process.platform) {
        case "win32":
            spawn({ cmd: [join(await getSpotifyPath(), "Spotify.exe")] });
            break;
        case "linux":
            spawn({
                cmd: usingFlatpak ? ["flatpak", "run", "com.spotify.Client"] : ["spotify-launcher"]
            });
            break;
        case "darwin":
            spawn({ cmd: [join(await getSpotifyPath(), "../MacOS/Spotify")] });
            break;
    }
}

export function getTimeDifference(timestamp: DOMHighResTimeStamp): string {
    return (performance.now() - timestamp).toFixed(2);
}
