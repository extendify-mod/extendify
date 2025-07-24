const DEVELOPMENT = Bun.argv.includes("--dev");

await Bun.build({
    entrypoints: ["src/index.ts"],
    outdir: "dist",
    format: "iife",
    minify: true,
    sourcemap: "inline",
    define: {
        DEVELOPMENT: JSON.stringify(DEVELOPMENT)
    }
});
