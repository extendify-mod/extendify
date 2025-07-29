import "@webpack/exporter";
import "@webpack/interceptor";
import { loadEntrypoint } from "@webpack/loader";

import.meta.glob(
    ["./{plugins,userplugins}/*/index.{ts,tsx}", "./{plugins,userplugins}/*.{ts,tsx}"],
    {
        eager: true
    }
);

loadEntrypoint();
