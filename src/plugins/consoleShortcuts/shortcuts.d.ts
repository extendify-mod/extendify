import type { executeQuery, findQuery } from "@api/gql";
import type { platform, resolveApi } from "@api/platform";
import type { contextOptions, moduleCache, settingsValues } from "@api/registry";
import type { wreq } from "@webpack";
import type {
    exportFilters,
    findAllModuleExports,
    findModule,
    findModuleComponent,
    findModuleExport,
    findModuleExportLazy
} from "@webpack/module";

import type { findTranslation, getExportedComponents, setSpotifyLogLevel } from ".";

declare global {
    interface Window {
        wreq: typeof wreq;
        platform: typeof platform;

        exportFilters: typeof exportFilters;
        findModuleExport: typeof findModuleExport;
        findModuleExportLazy: typeof findModuleExportLazy;
        findAllModuleExports: typeof findAllModuleExports;
        findModuleComponent: typeof findModuleComponent;
        findModule: typeof findModule;
        getExportedComponents: typeof getExportedComponents;
        moduleCache: typeof moduleCache;

        resolveApi: typeof resolveApi;
        findTranslation: typeof findTranslation;

        setSpotifyLogLevel: typeof setSpotifyLogLevel;

        contextOptions: typeof contextOptions;
        settingsValues: typeof settingsValues;

        findQuery: typeof findQuery;
        executeQuery: typeof executeQuery;
    }
}
