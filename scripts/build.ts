import { mkdir, readFile, writeFile } from "fs/promises";
import { minify as minifyHtml } from "html-minifier-terser";
import { rolldown } from "rolldown";
import { importGlobPlugin } from "rolldown/experimental";

const DEVELOPMENT = Bun.argv.includes("--dev");

await mkdir("dist", { recursive: true });
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

const bundle = await rolldown({
    input: "src/index.ts",
    platform: "browser",
    experimental: {
        strictExecutionOrder: true
    },
    treeshake: true,
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

await bundle.write({
    minify: {
        compress: false,
        mangle: true
    },
    minifyInternalExports: true,
    file: "dist/extendify.js",
    format: "iife"
});
