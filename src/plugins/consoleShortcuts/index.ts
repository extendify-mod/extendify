import { registerPlugin } from "@api/context/plugin";
import { platform } from "@api/platform";
import { wreq } from "@webpack";
import { exportFilters, findModule, findModuleExport } from "@webpack/module";

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
            },
            exportFilters: {
                get: () => exportFilters
            }
        });

        window.findModuleExport = findModuleExport;
        window.findModule = findModule;

        logger.info("Defined shortcuts");
    }
});
