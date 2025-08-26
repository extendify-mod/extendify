import { registerPlugin } from "@api/context/plugin";
import { platform } from "@api/platform";
import { wreq } from "@webpack";
import { exportFilters, findModule, findModuleExport } from "@webpack/module";

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
            exportedComponents: {
                async get() {}
            }
        });

        window.findModuleExport = findModuleExport;
        window.findModule = findModule;

        window.getExportedComponents = async () => {
            const result: Record<string, any> = {};
            const components = (await import("@components/spotify")) as any;
            for (const component in components) {
                result[component] = components[component];
            }
            return result;
        };

        logger.info("Defined shortcuts");
    }
});
