import { execFileSync, execSync } from "child_process";
import { constants } from "fs";
import { access } from "fs/promises";
import { join } from "path";

export function hasArg(key) {
    return Object.keys(process.env).includes(`npm_config_${key}`.toLowerCase());
}

export function getArg(key) {
    return process.env[`npm_config_${key}`.toLowerCase()];
}

export async function exists(path) {
    return await access(path, constants.F_OK)
        .then(() => true)
        .catch(() => false);
}

export function getSpotifyPath() {
    if (hasArg("spotifyPath")) {
        return getArg("spotifyPath");
    }

    switch (process.platform) {
        case "linux":
            return join(
                process.env.HOME,
                hasArg("flatpak")
                    ? ".local/share/flatpak/app/com.spotify.Client/x86_64/stable/active/files/extra/share/spotify"
                    : ".local/share/spotify-launcher/install/usr/share/spotify"
            );
        case "win32":
            return join(process.env.AppData, "Spotify");
        case "darwin":
            return "/Applications/Spotify.app/Contents/Resources";
        default:
            throw new Error(`Platform not implemented: ${process.platform}`);
    }
}

export function getCachePath() {
    if (hasArg("cachePath")) {
        console.log(getArg("cachePath"));
        return getArg("cachePath");
    }

    switch (process.platform) {
        case "linux":
            return join(
                process.env.HOME,
                hasArg("flatpak") ? ".var/app/com.spotify.Client/cache/spotify" : ".cache/spotify"
            );
        case "win32":
            return join(process.env.LocalAppData, "Spotify");
        case "darwin":
            return join(process.env.HOME, "Library/Application Support/Spotify/PersistentCache");
        default:
            throw new Error(`Platform not implemented: ${process.platform}`);
    }
}

export async function killSpotify() {
    return new Promise((resolve) => {
        resolve(
            (() => {
                try {
                    switch (process.platform) {
                        case "linux":
                            return execSync("killall spotify");
                        case "win32":
                            return execSync("taskkill /F /IM Spotify.exe && sleep 0.5");
                        case "darwin":
                            return execSync("killall Spotify && sleep 0.2");
                        default:
                            throw new Error(`Platform not implemented: ${process.platform}`);
                    }
                } catch (e) {
                    console.error(`Couldn't kill Spotify process: ${e}`);
                }
            })()
        );
    });
}

export function launchSpotify() {
    switch (process.platform) {
        case "linux":
            return execSync(hasArg("flatpak") ? "flatpak run com.spotify.Client" : "spotify-launcher");
        case "win32":
            return execFileSync(join(getSpotifyPath(), "Spotify.exe"));
        case "darwin":
            return execFileSync(join(getSpotifyPath(), "../MacOS/Spotify"));
        default:
            throw new Error(`Platform not implemented: ${process.platform}`);
    }
}
