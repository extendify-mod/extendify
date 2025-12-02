import { getKwarg, hasArg } from "@scripts/args";
import { entrypoints, webpackChunkName } from "@scripts/build/config";
import { exists, getTimeDifference, stringify } from "@scripts/utils";
import type { TargetPlatform } from "@shared/types";

import { rolldown } from "rolldown";
import { importGlobPlugin } from "rolldown/experimental";

import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

const DEVELOPMENT = hasArg("dev");
const PLATFORM = (getKwarg("platform") as TargetPlatform) ?? "desktop";

const start = performance.now();

try {
    await rm("dist", { force: true, recursive: true });
} catch {}
await mkdir("dist", { recursive: true });
console.log(`Created dist folder (${getTimeDifference(start)} ms)`);

const assetsCopyStart = performance.now();
for (const fileName of await readdir(`src/targets/${PLATFORM}`, { recursive: true })) {
    try {
        await copyFile(join("src/targets", PLATFORM, fileName), join("dist", fileName));
    } catch (_) {
        await mkdir(join("dist", fileName), { recursive: true });
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
    file: "dist/extendify.js",
    format: "iife",
    minify: {
        compress: false,
        // Having this set to false is important for the $exp exporting stuff
        mangle: false
    },
    minifyInternalExports: true,
    sourcemap: DEVELOPMENT ? "inline" : "hidden"
});
console.log(`Wrote bundle (${getTimeDifference(bundleWriteStart)} ms)`);

if (await exists("dist/dist")) {
    const fixStart = performance.now();
    for (const fileName of await readdir("dist/dist", { recursive: true })) {
        await copyFile(join("dist", "dist", fileName), join("dist", fileName));
    }

    await rm("dist/dist", { force: true, recursive: true });
    console.log(`Fixed dist/dist (${getTimeDifference(fixStart)} ms)`);
}

console.log(`Build finished (${getTimeDifference(start)} ms)`);
