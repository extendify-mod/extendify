import { registerEventListener } from "@api/event";
import { player } from "@api/platform";
import { registerPlugin } from "@api/plugin";

const { plugin, logger } = registerPlugin({
    name: "SkipExplicit",
    description: "Automatically skip explicit songs",
    authors: ["7elia"]
});

registerEventListener(plugin, "songChanged", (song) => {
    if (!player || !song.isExplicit) {
        return;
    }

    player.skipToNext();

    logger.info(`Auto-skipped explicit song (${song.name} - ${song.artists.join(", ")})`);
});
