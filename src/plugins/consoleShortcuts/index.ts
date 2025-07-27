import { platform } from "@api/platform";
import { registerPlugin } from "@api/plugin";
import { wreq } from "@webpack";

const { logger } = registerPlugin({
    name: "ConsoleShortcuts",
    description: "Expose internal APIs to the window object",
    authors: ["7elia"],
    required: DEVELOPMENT,
    start() {
        Object.defineProperties(window, {
            wreq: {
                get: () => wreq
            },
            platform: {
                get: () => platform
            }
        });

        logger.info("Defined shortcuts");
    }
});
