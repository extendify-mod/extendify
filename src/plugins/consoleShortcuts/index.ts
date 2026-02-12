import { registerPlugin } from "@api/context/plugin";
import { executeQuery, findQuery } from "@api/gql";
import { platform, resolveApi } from "@api/platform";
import { React } from "@api/react";
import { contextOptions, moduleCache, settingsValues } from "@api/registry";
import { wreq } from "@webpack";
import {
    exportFilters,
    findAllModuleExports,
    findModule,
    findModuleComponent,
    findModuleExport,
    findModuleExportLazy
} from "@webpack/module";

const { logger } = registerPlugin({
    authors: ["7elia"],
    description: "Expose internal APIs to the window object",
    name: "ConsoleShortcuts",
    platforms: ["desktop", "browser"],
    required: DEVELOPMENT,
    async start() {
        Object.defineProperties(window, {
            exportFilters: {
                get: () => exportFilters
            },
            moduleCache: {
                get: () => moduleCache
            },
            platform: {
                get: () => platform
            },
            pluginOptions: {
                get: () => contextOptions
            },
            settingsValues: {
                get: () => settingsValues
            },
            wreq: {
                get: () => wreq
            }
        });

        window.findModuleExport = findModuleExport;
        window.findModuleExportLazy = findModuleExportLazy;
        window.findAllModuleExports = findAllModuleExports;
        window.findModuleComponent = findModuleComponent;
        window.findModule = findModule;
        window.getExportedComponents = getExportedComponents;

        window.resolveApi = resolveApi;
        window.findTranslation = findTranslation;

        window.setSpotifyLogLevel = setSpotifyLogLevel;

        window.findQuery = findQuery;
        window.executeQuery = executeQuery;

        window.createTestComponent = createTestComponent;

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

export function createTestComponent(component: any, props: any) {
    return React.createElement(component, props);
}
