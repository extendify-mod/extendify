import { Devs } from "@utils/constants";
import { StartAt, definePlugin } from "@utils/types";

import { ReconnectableWebSocket } from "./ws";

const ws = new ReconnectableWebSocket();

export default definePlugin({
    name: "Lpdeck",
    description: "Lpdeck integration with Spotify",
    authors: [Devs.elia],
    startAt: StartAt.ApisLoaded,
    events: {
        onPlay: (_) => ws.sendPlayerData(),
        onPause: (_) => ws.sendPlayerData()
    },
    start: () => {
        ws.connect();
        setInterval(() => ws.sendPlayerData(), 500);
    },
    stop: () => {
        ws.disconnect();
    }
});
