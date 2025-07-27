import { exists, getTimeDifference } from "./utils";

import { mkdir, readFile, writeFile } from "fs/promises";
import { minify as minifyHtml } from "html-minifier-terser";
import { rolldown } from "rolldown";
import { importGlobPlugin } from "rolldown/experimental";

const DEVELOPMENT = Bun.argv.includes("--dev");

const start = performance.now();

if (!(await exists("dist"))) {
    await mkdir("dist", { recursive: true });
    console.log("Created dist folder");
}

const minifyStart = performance.now();
await writeFile(
    "dist/index.html",
    await minifyHtml(await readFile("src/index.html", "utf-8"), {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
        removeEmptyAttributes: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
    })
);
console.log(`Wrote & minified index.html (${getTimeDifference(minifyStart)} ms)`);

const bundleStart = performance.now();
const bundle = await rolldown({
    input: "src/index.ts",
    platform: "browser",
    experimental: {
        strictExecutionOrder: true
    },
    treeshake: true,
    // This is important for the $exp exporting stuff
    keepNames: true,
    define: {
        DEVELOPMENT: JSON.stringify(DEVELOPMENT)
    },
    plugins: [importGlobPlugin()],
    resolve: {
        tsconfigFilename: "tsconfig.json"
    }
    // jsx: {
    //     factory: "ExtendifyCreateElement",
    //     fragment: "ExtendifyFragment"
    // }
});
console.log(`Created bundle (${getTimeDifference(bundleStart)} ms)`);

const bundleWriteStart = performance.now();
await bundle.write({
    minify: {
        compress: false,
        mangle: true
    },
    minifyInternalExports: true,
    sourcemap: DEVELOPMENT ? "inline" : "hidden",
    file: "dist/extendify.js",
    format: "iife"
});
console.log(`Wrote bundle (${getTimeDifference(bundleWriteStart)} ms)`);

console.log(`Build finished (${getTimeDifference(start)} ms)`);
