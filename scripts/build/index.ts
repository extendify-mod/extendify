import type { TargetPlatform } from "../../lib/shared/types";
import { getKwarg } from "../args";
import { exists, getTimeDifference } from "../utils";
import { entrypoints, webpackChunkName } from "./config";

import { copyFile, mkdir, readdir, rm } from "fs/promises";
import { join } from "path";
import { rolldown } from "rolldown";
import { importGlobPlugin } from "rolldown/experimental";

const DEVELOPMENT = Bun.argv.includes("--dev");
const PLATFORM = (getKwarg("platform") as TargetPlatform) ?? "desktop";

const start = performance.now();

try {
    await rm("dist", { recursive: true, force: true });
} catch {}
await mkdir("dist", { recursive: true });
console.log(`Created dist folder (${getTimeDifference(start)} ms)`);

const assetsCopyStart = performance.now();
for (const fileName of await readdir(`src/targets/${PLATFORM}`, { recursive: true })) {
    try {
        await copyFile(join("src/targets", PLATFORM, fileName), join("dist", fileName));
    } catch (e) {
        await mkdir(join("dist", fileName), { recursive: true });
    }
}
console.log(`Copied ${PLATFORM} assets (${getTimeDifference(assetsCopyStart)} ms)`);

const bundleStart = performance.now();
const bundle = await rolldown({
    input: "src/index.ts",
    platform: "browser",
    experimental: {
        strictExecutionOrder: true
    },
    treeshake: true,
    keepNames: false,
    define: {
        DEVELOPMENT: JSON.stringify(DEVELOPMENT),
        PLATFORM: JSON.stringify(PLATFORM),
        ENTRYPOINTS: JSON.stringify(entrypoints[PLATFORM]),
        WEBPACK_CHUNK: JSON.stringify(webpackChunkName[PLATFORM])
    },
    plugins: [importGlobPlugin()],
    tsconfig: "tsconfig.json",
    jsx: {
        mode: "classic",
        factory: "ExtendifyCreateElement",
        fragment: "ExtendifyFragment"
    }
});
console.log(`Created bundle (${getTimeDifference(bundleStart)} ms)`);

const bundleWriteStart = performance.now();
await bundle.write({
    minify: {
        compress: false,
        // Having this set to false is important for the $exp exporting stuff
        mangle: false
    },
    minifyInternalExports: true,
    sourcemap: DEVELOPMENT ? "inline" : "hidden",
    file: "dist/extendify.js",
    format: "iife"
});
console.log(`Wrote bundle (${getTimeDifference(bundleWriteStart)} ms)`);

if (await exists("dist/dist")) {
    const fixStart = performance.now();
    for (const fileName of await readdir("dist/dist", { recursive: true })) {
        await copyFile(join("dist", "dist", fileName), join("dist", fileName));
    }

    await rm("dist/dist", { recursive: true, force: true });
    console.log(`Fixed dist/dist (${getTimeDifference(fixStart)} ms)`);
}

console.log(`Build finished (${getTimeDifference(start)} ms)`);
