import { minify as minifyHtml } from "html-minifier-terser";
import { mkdir, readFile, writeFile } from "node:fs/promises";

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

await Bun.build({
    entrypoints: ["src/index.ts"],
    outdir: "dist",
    format: "iife",
    minify: true,
    sourcemap: "inline",
    define: {
        DEVELOPMENT: JSON.stringify(DEVELOPMENT)
    },
    external: ["react"]
});
