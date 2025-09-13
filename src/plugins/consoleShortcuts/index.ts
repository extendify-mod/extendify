import { registerPlugin } from "@api/context/plugin";
import { platform, resolveApi } from "@api/platform";
import { pluginOptions, settingsValues } from "@api/registry";
import { wreq } from "@webpack";
import {
    exportFilters,
    findAllModuleExports,
    findModule,
    findModuleComponent,
    findModuleExport
} from "@webpack/module";

const { logger } = registerPlugin({
    name: "ConsoleShortcuts",
    description: "Expose internal APIs to the window object",
    authors: ["7elia"],
    required: DEVELOPMENT,
    async start() {
        Object.defineProperties(window, {
            wreq: {
                get: () => wreq
            },
            platform: {
                get: () => platform
            },
            exportFilters: {
                get: () => exportFilters
            },
            pluginOptions: {
                get: () => pluginOptions
            },
            settingsValues: {
                get: () => settingsValues
            }
        });

        window.findModuleExport = findModuleExport;
        window.findAllModuleExports = findAllModuleExports;
        window.findModuleComponent = findModuleComponent;
        window.findModule = findModule;
        window.getExportedComponents = async () => {
            const result: Record<string, any> = {};
            const components = (await import("@components/spotify")) as any;
            for (const component in components) {
                result[component] = components[component];
            }
            return result;
        };

        window.resolveApi = resolveApi;

        window.setSpotifyLogLevel = (level: string) => {
            const acceptedLevels = ["debug", "warn", "info", "error"];

            if (!acceptedLevels.includes(level)) {
                throw new Error(
                    `Invalid log level, must be one of the following: ${acceptedLevels.join(", ")}`
                );
            }

            localStorage.setItem("rcLogLevel", level);
            window.location.reload();
        };

        logger.info("Defined shortcuts");
    }
});
