import "@webpack/exporter";
import "@webpack/interceptor";
import { loadEntrypoint } from "@webpack/loader";

import.meta.glob(
    ["./plugins/*/index.ts", "./plugins/*.ts", "./userplugins/*/index.ts", "./userplugins/*.ts"],
    {
        eager: true
    }
);

loadEntrypoint();
