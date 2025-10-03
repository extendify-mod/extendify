import { registerEventListener } from "@api/context/event";
import { registerPlugin } from "@api/context/plugin";
import { player } from "@api/platform";

const { plugin, logger } = registerPlugin({
    name: "SkipExplicit",
    description: "Automatically skip explicit songs",
    authors: ["7elia"],
    platforms: ["desktop", "webos"]
});

registerEventListener(plugin, "songChanged", (song) => {
    if (!player || !song.isExplicit) {
        return;
    }

    player.skipToNext();

    logger.info(`Auto-skipped explicit song (${song.name} - ${song.artists.join(", ")})`);
});
