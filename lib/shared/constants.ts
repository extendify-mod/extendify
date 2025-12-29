export const LOGGER_NAME = "Extendify";
export const CONFIG_KEY = "extendify-opts-v2";
export const IDENTIFIER_REGEX = String.raw`(?:[A-Za-z_$][\w$]*)`;
export const INVALID_INPUT = "Invalid input provided.";
export const WIN_APP_ID = "SpotifyAB.SpotifyMusic";
// Linux has multiple install methods:
// - spotify-launcher from aur (Implemented)
// - flatpak (Implemented)
// - official Spotify apt repo (Not implemented)
export const FLATPAK_PATH =
    ".local/share/flatpak/app/com.spotify.Client/x86_64/stable/active/files/extra/share/spotify";
export const FLATPAK_CACHE_PATH = ".var/app/com.spotify.Client/cache/spotify";
export const SPOTIFY_LAUNCHER_PATH = ".local/share/spotify-launcher/install/usr/share/spotify";
export const SPOTIFY_CACHE_PATH = ".cache/spotify";
export const DEVTOOLS_TARGET = "app-developer";
