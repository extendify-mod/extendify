import type { pluginOptions, settingsValues } from "@api/context/plugin/settings";
import type { platform, resolveApi } from "@api/platform";
import type { wreq } from "@webpack";
import type {
    exportFilters,
    findAllModuleExports,
    findModule,
    findModuleComponent,
    findModuleExport
} from "@webpack/module";

declare global {
    interface Window {
        wreq: typeof wreq;
        platform: typeof platform;

        exportFilters: typeof exportFilters;
        findModuleExport: typeof findModuleExport;
        findAllModuleExports: typeof findAllModuleExports;
        findModuleComponent: typeof findModuleComponent;
        findModule: typeof findModule;
        getExportedComponents: () => Promise<Record<string, any>>;

        resolveApi: typeof resolveApi;

        setSpotifyLogLevel: (level: string) => void;

        pluginOptions: typeof pluginOptions;
        settingsValues: typeof settingsValues;
    }
}

export {};
