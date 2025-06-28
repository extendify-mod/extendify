#!/usr/bin/node
/**
 * Modified version of Vendicated's build.mjs
 * @link https://github.com/Vendicated/Vencord/blob/main/scripts/build/build.mjs
 */
import { enableDevtools } from "../enableDevtools.mjs";
import { applyPatch } from "../patch/applyPatch.mjs";
import { killSpotify, launchSpotify } from "../utils.mjs";
import {
    BUILD_TIMESTAMP,
    IS_DEV,
    VERSION,
    commonMinifyOpts,
    commonOpts,
    commonRendererPlugins,
    globPlugins
} from "./common.mjs";

import esbuild from "esbuild";
import { mkdir, readFile, writeFile } from "fs/promises";
import { minify as minifyHtml } from "html-minifier-terser";

const defines = {
    IS_DEV: JSON.stringify(IS_DEV),
    VERSION: JSON.stringify(VERSION),
    BUILD_TIMESTAMP: JSON.stringify(BUILD_TIMESTAMP),
    "process.platform": JSON.stringify(process.platform)
};

await esbuild.build({
    ...commonOpts,
    entryPoints: ["src/Extendify.ts"],
    outfile: "dist/extendify.js",
    format: "iife",
    target: ["esnext"],
    globalName: "Extendify",
    define: defines,
    plugins: [globPlugins, ...commonRendererPlugins]
});

await mkdir("dist", { recursive: true });
await writeFile("dist/index.html", await minifyHtml(await readFile("src/index.html", "utf-8"), commonMinifyOpts));

if (process.argv.includes("--apply")) {
    await applyPatch();
    if (IS_DEV) {
        try {
            killSpotify();
        } catch {}
        await enableDevtools();
        launchSpotify();
    }
}
