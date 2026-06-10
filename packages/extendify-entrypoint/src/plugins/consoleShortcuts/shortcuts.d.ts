import type { executeQuery, findQuery } from "@extendify/api/gql";
import type { platform, resolveApi } from "@extendify/api/platform";
import type { contextOptions, moduleCache, services, settingsValues } from "@extendify/api/registry";
import type { wreq } from "@extendify/webpack/";
import type {
    exportFilters,
    findAllModuleExports,
    findModule,
    findModuleComponent,
    findModuleExport,
    findModuleExportLazy
} from "@extendify/webpack/module";

import type { Store } from "redux";

import type {
    createTestComponent,
    findTranslation,
    getExportedComponents,
    setSpotifyLogLevel
} from ".";

declare global {
    interface Window {
        ReactVersion: string;

        wreq: typeof wreq;
        platform: typeof platform;
        globalStore: typeof Store;
        esperantoServices: typeof services;

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

        createTestComponent: typeof createTestComponent;
    }
}
