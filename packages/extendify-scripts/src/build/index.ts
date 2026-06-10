import { getKwarg, hasArg } from "@extendify/scripts/args";
import { entrypoints, webpackChunkName } from "@extendify/scripts/build/config";
import { globPlugins } from "@extendify/scripts/build/plugins";
import { getTimeDifference, stringify } from "@extendify/scripts/utils";
import type { TargetPlatform } from "@extendify/shared/types";

import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DEVELOPMENT = hasArg("dev");
const PLATFORM = (getKwarg("platform") as TargetPlatform) ?? "desktop";
const OUT = getKwarg("out") ?? "../../dist";
const ENTRYPOINT = await Bun.resolve("@extendify/entrypoint/src/index.ts", import.meta.dir);

const start = performance.now();

try {
    await rm(OUT, { force: true, recursive: true });
} catch {}
await mkdir(OUT, { recursive: true });
console.log(`Created output folder (${getTimeDifference(start)} ms)`);

const assetsCopyStart = performance.now();
for (const fileName of await readdir(`targets/${PLATFORM}`, { recursive: true })) {
    if (fileName === ".gitkeep") {
        continue;
    }

    try {
        await copyFile(join("targets", PLATFORM, fileName), join(OUT, fileName));
    } catch (_) {
        await mkdir(join(OUT, fileName), { recursive: true });
    }
}
console.log(`Copied ${PLATFORM} assets (${getTimeDifference(assetsCopyStart)} ms)`);

const bundleStart = performance.now();
await Bun.build({
    define: stringify({
        DEVELOPMENT: DEVELOPMENT,
        ENTRYPOINTS: entrypoints[PLATFORM],
        PLATFORM: PLATFORM,
        WEBPACK_CHUNK: webpackChunkName[PLATFORM]
    }),
    entrypoints: [ENTRYPOINT],
    format: "iife",
    jsx: {
        factory: "ExtendifyCreateElement",
        fragment: "ExtendifyFragment",
        runtime: "classic"
    },
    naming: "[dir]/extendify.[ext]",
    outdir: OUT,
    plugins: [globPlugins],
    target: "browser",
    tsconfig: "tsconfig.json"
});
console.log(`Created bundle (${getTimeDifference(bundleStart)} ms)`);

const cssProbeStart = performance.now();
const glob = new Bun.Glob("**/*.css").scan({ cwd: "../", followSymlinks: false });
let allCss = "";
for await (const file of glob) {
    const content = (await readFile(join("../", file))).toString();
    allCss += content;
}

await writeFile(join(OUT, "extendify.css"), allCss);
console.log(`Bundled CSS (${getTimeDifference(cssProbeStart)} ms)`);

console.log(`Build finished (${getTimeDifference(start)} ms)`);
