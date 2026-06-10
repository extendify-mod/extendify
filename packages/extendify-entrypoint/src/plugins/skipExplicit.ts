import { registerEventListener } from "@extendify/api/context/event";
import { registerPlugin } from "@extendify/api/context/plugin";
import { player } from "@extendify/api/platform";

const { plugin, logger } = registerPlugin({
    authors: ["7elia"],
    description: "Automatically skip explicit songs",
    name: "SkipExplicit",
    platforms: ["desktop", "browser"]
});

registerEventListener(plugin, "songChanged", song => {
    if (!player || !song.isExplicit) {
        return;
    }

    player.skipToNext();

    logger.info(`Auto-skipped explicit song (${song.name} - ${song.artists.join(", ")})`);
});
