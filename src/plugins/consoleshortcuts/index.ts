import { Devs } from "@utils/constants";
import { findTranslation } from "@utils/spotify";
import { StartAt, definePlugin } from "@utils/types";
import { wreq } from "@webpack";
import { platform } from "@webpack/common";

export default definePlugin({
    name: "ConsoleShortcuts",
    authors: [Devs.elia],
    description: "Expose internal APIs to the window object",
    required: IS_DEV,
    startAt: StartAt.ApisLoaded,
    start() {
        window.registry = {};
        for (const key of platform.getRegistry()._map.keys()) {
            if (key.description) {
                window.registry[key.description] = platform.getRegistry().resolve(key);
            }
        }

        Object.defineProperty(window, "platform", {
            get() {
                return platform;
            }
        });
        Object.defineProperty(window, "wreq", {
            get() {
                return wreq;
            }
        });

        window.findTranslation = findTranslation;
    }
});
