import { Devs } from "@utils/constants";
import { StartAt, definePlugin } from "@utils/types";

export default definePlugin({
    name: "Themes",
    description: "Custom themes for Spotify",
    authors: [Devs.elia],
    required: true,
    startAt: StartAt.DOMContentLoaded,
    start() {
        if (!window.EXTENDIFY_NATIVE_AVAILABLE) {
            return;
        }

        // TODO: re-implement themes with native object
    }
});
