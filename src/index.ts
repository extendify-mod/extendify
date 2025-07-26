import "@webpack/exporter";
import "@webpack/interceptor";
import { loadEntrypoint } from "@webpack/loader";

import.meta.glob(["./plugins/*/index.ts", "./userplugins/*/index.ts"], { eager: true });

loadEntrypoint();
