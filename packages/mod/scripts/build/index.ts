import { getKwarg, hasArg } from "@scripts/args";
import { entrypoints, webpackChunkName } from "@scripts/build/config";
import { getTimeDifference, stringify } from "@scripts/utils";
import type { TargetPlatform } from "@shared/types";

import { rolldown } from "rolldown";
import { importGlobPlugin } from "rolldown/experimental";

import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DEVELOPMENT = hasArg("dev");
const PLATFORM = (getKwarg("platform") as TargetPlatform) ?? "desktop";
const OUT = getKwarg("out") ?? "dist";

const start = performance.now();

try {
    await rm(OUT, { force: true, recursive: true });
} catch {}
await mkdir(OUT, { recursive: true });
console.log(`Created output folder (${getTimeDifference(start)} ms)`);

const assetsCopyStart = performance.now();
for (const fileName of await readdir(`src/targets/${PLATFORM}`, { recursive: true })) {
    if (fileName === ".gitkeep") {
        continue;
    }

    try {
        await copyFile(join("src/targets", PLATFORM, fileName), join(OUT, fileName));
    } catch (_) {
        await mkdir(join(OUT, fileName), { recursive: true });
    }
}
console.log(`Copied ${PLATFORM} assets (${getTimeDifference(assetsCopyStart)} ms)`);

const bundleStart = performance.now();
const bundle = await rolldown({
    define: stringify({
        DEVELOPMENT: DEVELOPMENT,
        ENTRYPOINTS: entrypoints[PLATFORM],
        PLATFORM: PLATFORM,
        WEBPACK_CHUNK: webpackChunkName[PLATFORM]
    }),
    experimental: {
        strictExecutionOrder: true
    },
    input: "src/index.ts",
    jsx: {
        factory: "ExtendifyCreateElement",
        fragment: "ExtendifyFragment",
        mode: "classic"
    },
    keepNames: false,
    platform: "browser",
    plugins: [importGlobPlugin()],
    treeshake: true,
    tsconfig: "tsconfig.json"
});
console.log(`Created bundle (${getTimeDifference(bundleStart)} ms)`);

const bundleWriteStart = performance.now();
await bundle.write({
    file: join(OUT, "extendify.js"),
    format: "iife",
    minify: {
        compress: false,
        // Having this set to false is important for the $exp exporting stuff
        mangle: false
    },
    minifyInternalExports: true,
    sourcemap: DEVELOPMENT ? "inline" : undefined
});
console.log(`Wrote bundle (${getTimeDifference(bundleWriteStart)} ms)`);

const cssProbeStart = performance.now();
let allCss = "";
for (const fileName of await readdir(".", { recursive: true })) {
    if (!fileName.endsWith(".css")) {
        continue;
    }

    const content = (await readFile(fileName)).toString();
    allCss += content;
}

await writeFile(join(OUT, "extendify.css"), allCss);
console.log(`Bundled CSS (${getTimeDifference(cssProbeStart)} ms)`);

console.log(`Build finished (${getTimeDifference(start)} ms)`);
