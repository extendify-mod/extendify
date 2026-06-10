import { join, resolve } from "node:path";

export const globPlugins: Bun.BunPlugin = {
    name: "glob-plugins",
    setup(build) {
        build.onLoad({ filter: /\.(ts|tsx)$/ }, async ({ path }) => {
            const content = await Bun.file(path).text();

            if (!content.includes("globPlugins()")) {
                return;
            }

            const dir = resolve(path, "..");
            const patterns = [
                "./{plugins,userplugins}/*/index.{ts,tsx}",
                "./{plugins,userplugins}/*.{ts,tsx}"
            ];

            const files: string[] = [];
            for (const pattern of patterns) {
                for await (const file of new Bun.Glob(pattern).scan(dir)) {
                    files.push("./" + file);
                }
            }

            return {
                contents: content.replace(
                    "globPlugins()",
                    files
                        .map(file => {
                            return `import ${JSON.stringify(file)}`;
                        })
                        .join("\n")
                ),
                loader: path.endsWith(".tsx") ? "tsx" : "ts"
            };
        });
    }
};
