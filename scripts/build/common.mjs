/**
 * Modified version of Vendicated's common.mjs
 * @link https://github.com/Vendicated/Vencord/blob/main/scripts/build/common.mjs
 */
import Package from "../../package.json" with { type: "json" };
import "../checkNodeVersion.js";
import { exists, hasArg } from "../utils.mjs";

import esbuild from "esbuild";
import { readFile, readdir } from "fs/promises";
import { minify as minifyHtml } from "html-minifier-terser";
import { builtinModules } from "module";
import { join } from "path";

export const VERSION = Package.version;
export const BUILD_TIMESTAMP = Number(process.env.SOURCE_DATE_EPOCH) || Date.now();

export const IS_DEV = process.argv.includes("--dev") || hasArg("dev");
export const IS_STANDALONE = process.argv.includes("--standalone") || hasArg("standalone");

const PluginDefinitionNameMatcher = /definePlugin\(\{\s*(["'])?name\1:\s*(["'`])(.+?)\2/;
/**
 * @param {string} base
 * @param {import("fs").Dirent} dirent
 */
export const resolvePluginName = async (base, dirent) => {
    const fullPath = join(base, dirent.name);
    /**
     * @type {string}
     */
    let content;
    if (dirent.isFile()) {
        content = await readFile(fullPath, "utf-8");
    } else {
        for (const file of ["index.ts", "index.tsx"]) {
            try {
                content = await readFile(join(fullPath, file), "utf-8");
                break;
            } catch {
                continue;
            }
        }
        if (!content) {
            throw new Error(`Invalid plugin ${fullPath}: neither index.ts nor index.tsx found`);
        }
    }
    return (
        PluginDefinitionNameMatcher.exec(content)?.[3] ??
        (() => {
            throw new Error(
                `Invalid plugin ${fullPath}: must contain definePlugin call with simple string name property as first property`
            );
        })()
    );
};

// https://github.com/evanw/esbuild/issues/619#issuecomment-751995294
/**
 * @type {import("esbuild").Plugin}
 */
export const makeAllPackagesExternalPlugin = {
    name: "make-all-packages-external",
    setup: (build) => {
        const filter = /^[^./]|^\.[^./]|^\.\.[^/]/; // Must not start with "/" or "./" or "../"
        build.onResolve({ filter }, (args) => ({
            path: args.path,
            external: true
        }));
    }
};

/**
 * @type {import("esbuild").Plugin}
 */
export const globPlugins = {
    name: "glob-plugins",
    setup: (build) => {
        const filter = /^~plugins$/;
        build.onResolve({ filter }, (args) => {
            return {
                namespace: "import-plugins",
                path: args.path
            };
        });

        build.onLoad({ filter, namespace: "import-plugins" }, async () => {
            const pluginDirs = ["plugins", "plugins/_core", "plugins/_api", "userplugins"];

            let code = "";
            let pluginsCode = "\n";
            let metaCode = "\n";
            let i = 0;
            for (const dir of pluginDirs) {
                const userPlugin = dir === "userplugins";

                const fullDir = `./src/${dir}`;
                if (!(await exists(fullDir))) {
                    continue;
                }

                const files = await readdir(fullDir, { withFileTypes: true });
                for (const file of files) {
                    const fileName = file.name;
                    if (fileName.startsWith("_") || fileName.startsWith(".") || fileName === "index.ts") {
                        continue;
                    }

                    const folderName = `src/${dir}/${fileName}`.replace(/^src\/plugins\//, "");
                    const mod = `p${i}`;
                    code += `import ${mod} from "./${dir}/${fileName.replace(/\.tsx?$/, "")}";\n`;
                    pluginsCode += `[${mod}.name]:${mod},\n`;
                    metaCode += `[${mod}.name]:${JSON.stringify({ folderName, userPlugin })},\n`;
                    i++;
                }
            }
            code += `export default {${pluginsCode}};export const PluginMeta={${metaCode}};`;
            return {
                contents: code,
                resolveDir: "./src"
            };
        });
    }
};

/**
 * @type {import("esbuild").Plugin}
 */
export const fileUrlPlugin = {
    name: "file-uri-plugin",
    setup: (build) => {
        const filter = /^file:\/\/.+$/;
        build.onResolve({ filter }, (args) => ({
            namespace: "file-uri",
            path: args.path,
            pluginData: {
                uri: args.path,
                path: join(args.resolveDir, args.path.slice("file://".length).split("?")[0])
            }
        }));

        build.onLoad({ filter, namespace: "file-uri" }, async ({ pluginData: { path, uri } }) => {
            const { searchParams } = new URL(uri);
            const base64 = searchParams.has("base64");
            const minify = searchParams.has("minify");
            const noTrim = searchParams.get("trim") === "false";

            const encoding = base64 ? "base64" : "utf-8";

            let content;
            if (!minify) {
                content = await readFile(path, encoding);
                if (!noTrim) {
                    content = content.trimEnd();
                }
            } else {
                if (path.endsWith(".html")) {
                    content = await minifyHtml(await readFile(path, "utf-8"), commonMinifyOpts);
                } else if (/[mc]?[jt]sx?$/.test(path)) {
                    const res = await esbuild.build({
                        entryPoints: [path],
                        write: false,
                        minify: true
                    });
                    content = res.outputFiles[0].text;
                } else {
                    throw new Error(`Don't know how to minify file type: ${path}`);
                }

                if (base64) {
                    content = Buffer.from(content).toString("base64");
                }
            }

            return {
                contents: `export default ${JSON.stringify(content)}`
            };
        });
    }
};

/**
 * @type {(filter: RegExp, message: string) => import("esbuild").Plugin}
 */
export const banImportPlugin = (filter, message) => ({
    name: "ban-imports",
    setup: (build) => {
        build.onResolve({ filter }, () => {
            return { errors: [{ text: message }] };
        });
    }
});

const escapedBuiltinModules = builtinModules.map((m) => m.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|");
const builtinModuleRegex = new RegExp(`^(node:)?(${escapedBuiltinModules})$`);

/**
 * @type {import("esbuild").BuildOptions}
 */
export const commonOpts = {
    logLevel: "info",
    bundle: true,
    minify: !IS_DEV,
    sourcemap: IS_DEV ? "inline" : false,
    legalComments: "linked",
    plugins: [fileUrlPlugin],
    external: ["~plugins"],
    inject: ["./scripts/build/inject/react.mjs"],
    jsxFactory: "ExtendifyCreateElement",
    jsxFragment: "ExtendifyFragment",
    // Work around https://github.com/evanw/esbuild/issues/2460
    tsconfig: "./scripts/build/tsconfig.esbuild.json"
};

/**
 * @type {import("html-minifier-terser").Options}
 */
export const commonMinifyOpts = {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true
};

export const commonRendererPlugins = [
    banImportPlugin(
        builtinModuleRegex,
        "Cannot import node inbuilt modules in browser code. You need to use a native.ts file"
    ),
    banImportPlugin(/^react$/, "Cannot import from react. React and hooks should imported from @webpack/common")
];
