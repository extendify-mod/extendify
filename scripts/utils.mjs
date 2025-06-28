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
        default:
            throw new Error(`Platform not implemented: ${process.platform}`);
    }
}

export function killSpotify() {
    switch (process.platform) {
        case "linux":
            return execSync("killall spotify");
        case "win32":
            return execSync("taskkill /F /IM Spotify.exe /T");
        default:
            throw new Error(`Platform not implemented: ${process.platform}`);
    }
}

export function launchSpotify() {
    switch (process.platform) {
        case "linux":
            return execSync(hasArg("flatpak") ? "flatpak run com.spotify.Client" : "spotify-launcher");
        case "win32":
            return execFileSync(join(getSpotifyPath(), "Spotify.exe"));
        default:
            throw new Error(`Platform not implemented: ${process.platform}`);
    }
}
