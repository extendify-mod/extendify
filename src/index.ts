import "@webpack/interceptor";
import { loadEntrypoint } from "@webpack/loader";

import { Glob } from "bun";

const glob = new Glob("**/index.ts");
for (const file of glob.scanSync("./plugins")) {
    console.log(file);
}

loadEntrypoint();
