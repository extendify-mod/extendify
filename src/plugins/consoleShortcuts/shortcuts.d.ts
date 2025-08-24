import type { platform } from "@api/platform";
import type { wreq } from "@webpack";
import type { exportFilters, findModule, findModuleExport } from "@webpack/module";

declare global {
    interface Window {
        wreq: typeof wreq;
        platform: typeof platform;

        exportFilters: typeof exportFilters;
        findModuleExport: typeof findModuleExport;
        findModule: typeof findModule;
    }
}

export {};
