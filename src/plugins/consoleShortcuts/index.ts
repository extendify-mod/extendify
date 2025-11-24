import { registerPlugin } from "@api/context/plugin";
import { executeQuery, findQuery } from "@api/gql";
import { platform, resolveApi } from "@api/platform";
import { contextOptions, moduleCache, settingsValues } from "@api/registry";
import { wreq } from "@webpack";
import {
    exportFilters,
    findAllModuleExports,
    findModule,
    findModuleComponent,
    findModuleExport,
    findModuleExportSync
} from "@webpack/module";

const { logger } = registerPlugin({
    name: "ConsoleShortcuts",
    description: "Expose internal APIs to the window object",
    authors: ["7elia"],
    required: DEVELOPMENT,
    platforms: ["desktop", "webos", "browser"],
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
                get: () => contextOptions
            },
            settingsValues: {
                get: () => settingsValues
            },
            moduleCache: {
                get: () => moduleCache
            }
        });

        window.findModuleExport = findModuleExport;
        window.findModuleExportSync = findModuleExportSync;
        window.findAllModuleExports = findAllModuleExports;
        window.findModuleComponent = findModuleComponent;
        window.findModule = findModule;
        window.getExportedComponents = getExportedComponents;

        window.resolveApi = resolveApi;
        window.findTranslation = findTranslation;

        window.setSpotifyLogLevel = setSpotifyLogLevel;

        window.findQuery = findQuery;
        window.executeQuery = executeQuery;

        logger.info("Defined shortcuts");
    }
});

export async function getExportedComponents() {
    const result: Record<string, any> = {};

    const components = (await import("@components/spotify")) as any;
    for (const component in components) {
        result[component] = components[component];
    }

    return result;
}

export function setSpotifyLogLevel(level: string) {
    const acceptedLevels = ["debug", "warn", "info", "error"];

    if (!acceptedLevels.includes(level)) {
        throw new Error(
            `Invalid log level, must be one of the following: ${acceptedLevels.join(", ")}`
        );
    }

    localStorage.setItem("rcLogLevel", level);
    window.location.reload();
}

export function findTranslation(
    value: string,
    object = platform?.getTranslations()
): Record<string, any> {
    if (!object) {
        return {};
    }

    const results: Record<string, any> = {};

    for (const key in object) {
        const translation = object[key];

        if (typeof translation === "string") {
            if (translation.toLowerCase().includes(value.toLowerCase())) {
                results[key] = translation;
            }
        }

        if (typeof translation === "object") {
            const scan = findTranslation(value, translation);

            if (Object.keys(scan).length > 0) {
                results[key] = scan;
            }
        }
    }

    return results;
}
