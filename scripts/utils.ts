import { getKwarg, hasArg } from "./args";

import { spawn } from "bun";
import { exec, execFile, execFileSync, execSync } from "node:child_process";
import { access, constants } from "node:fs/promises";
import { join } from "node:path";

// Linux has multiple install methods:
// - spotify-launcher from aur (Implemented)
// - flatpak (Implemented)
// - official Spotify apt repo (Not implemented)
const flatpakPath =
    ".local/share/flatpak/app/com.spotify.Client/x86_64/stable/active/files/extra/share/spotify";
const flatpakCachePath = ".var/app/com.spotify.Client/cache/spotify";
const spotifyLauncherPath = ".local/share/spotify-launcher/install/usr/share/spotify";
const spotifyLauncherCachePath = ".cache/spotify";

const usingFlatpak = hasArg("flatpak");

export async function exists(path: string) {
    return await access(path, constants.F_OK)
        .then(() => true)
        .catch(() => false);
}

export function getSpotifyPath(): string {
    let argument;
    if ((argument = getKwarg("spotifyPath"))) {
        return argument;
    }

    switch (process.platform) {
        case "win32":
            return join(process.env.AppData!, "Spotify");
        case "linux":
            return join(process.env.HOME!, usingFlatpak ? flatpakPath : spotifyLauncherPath);
        case "darwin":
            return "/Applications/Spotify.app/Contents/Resources";
        default:
            throw new Error(`Platform ${process.platform} not implemented`);
    }
}

export function getCachePath(): string {
    let argument;
    if ((argument = getKwarg("cachePath"))) {
        return argument;
    }

    switch (process.platform) {
        case "win32":
            return join(process.env.LocalAppData!, "Spotify");
        case "linux":
            return join(
                process.env.HOME!,
                usingFlatpak ? flatpakCachePath : spotifyLauncherCachePath
            );
        case "darwin":
            return join(process.env.HOME!, "Library/Application SUpport/Spotify/PersistentCache");
        default:
            throw new Error(`Platform ${process.platform} not implemented`);
    }
}

export function getAppsPath(): string {
    return join(getSpotifyPath(), "Apps");
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
        }

        try {
            execSync(command + "&& sleep 0.5");
            resolve();
        } catch (e) {
            console.error(`Couldn't kill Spotify process: ${e}`);
        }
    });
}

export function launchSpotify(): void {
    switch (process.platform) {
        case "win32":
            spawn({ cmd: [join(getSpotifyPath(), "Spotify.exe")], stdout: "inherit" });
            break;
        case "linux":
            execSync(usingFlatpak ? "flatpak run com.spotify.Client" : "spotify-launcher");
            break;
        case "darwin":
            execFileSync(join(getSpotifyPath(), "../MacOS/Spotify"));
            break;
    }
}
