import { Devs } from "@utils/constants";
import { definePlugin } from "@utils/types";
import { player } from "@webpack/common";

export default definePlugin({
    name: "SkipExplicit",
    description: "Automatically skip explicit songs",
    authors: [Devs.elia],
    events: {
        onSongChange(e) {
            if (e.isExplicit) {
                player.skipToNext();
            }
        }
    }
});
