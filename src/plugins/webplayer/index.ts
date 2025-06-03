import { Devs } from "@utils/constants";
import { Logger } from "@utils/logger";
import { StartAt, definePlugin } from "@utils/types";
import { platform } from "@webpack/common";
import { PlaybackAPI } from "@webpack/types";

const logger = new Logger("WebPlayer");

// Super unfinished and probably needs a patch from native.
export default definePlugin({
    name: "WebPlayer",
    description: "Play music on the frontend instead of the backend",
    authors: [Devs.elia],
    required: false,
    startAt: StartAt.ApisLoaded,
    start() {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);

        (window as any).onSpotifyWebPlaybackSDKReady = this.initPlayer;
    },
    async initPlayer() {
        logger.info("Initializing Web Playback SDK");

        // I don't want to add types for this just yet
        const player = new (window as any).Spotify.Player({
            name: "Extendify",
            getOAuthToken(callback: (at: string) => void) {
                callback(platform.getSession().accessToken);
            },
            volume: await (platform.getRegistry().resolve(Symbol.for("PlaybackAPI")) as PlaybackAPI).getVolume()
        });

        player.addListener("ready", (e: any) => logger.info("Web Player ready\n", e));
        player.addListener("not_ready", (e: any) => logger.info("Web Player not ready\n", e));
        player.addListener("player_state_changed", (e: any) => logger.info("Web Player state changed\n", e));
        player.addListener("initialization_error", (e: any) => logger.error("Web Player initialization error\n", e));
        player.addListener("authentication_error", (e: any) => logger.error("Web Player authentication error\n", e));
        player.addListener("account_error", (e: any) => logger.error("Web Player account error\n", e));

        // player.connect();
    }
});
