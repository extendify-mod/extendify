import { ENTRYPOINT_SCRIPT } from "@utils/constants";
import { wreq } from "@webpack";

function replaceAdd(content: string, find: string, add: string) {
    return content.replace(find, find + add);
}

/**
 * Exposes the webpack module cache.
 */
function exposeModuleCache(content: string) {
    let globals = content.match(/,(.+?)={};/);
    if (!globals) {
        return content;
    }
    const globalNames = globals[1].split(",");
    return replaceAdd(content, "o.m=__webpack_modules__,", `o.c=${globalNames[globalNames.length - 1]},`);
}

/**
 * Exposes the private iife module that's buried in Spotify's webpack initializer.
 * NOTE: This might be broken for platforms like Linux, because their main release version is behind.
 *       That means that if the variables change (like "o") between versions, it will only work for Windows and Mac, but not for Linux.
 */
function exposePrivateModule(content: string) {
    return replaceAdd(content, "var c={};(", "o.iife=")
        .replace(
            // Makes the wreq instance accessible to the private module
            ".iife=()",
            ".iife=(o)"
        )
        .replace(
            // Prevents the private iife module from being called.
            // We do this because we want to patch this module, but we can only patch it when our plugins have been initialized.
            // We prevent it from initializing at startup and then initialize it ourselves when we do our webpack patching.
            "})(),c=o.",
            "}),c=o."
        );
}

let parserPromise: Promise<any>;

async function getParser(): Promise<any> {
    if (parserPromise) {
        return parserPromise;
    }

    return (parserPromise = (async () => {
        const [{ Parser }, classFields, privateMethods] = await Promise.all([
            // @ts-ignore
            import("https://esm.sh/acorn"),
            // @ts-ignore
            import("https://esm.sh/acorn-class-fields").then((m) => m.default),
            // @ts-ignore
            import("https://esm.sh/acorn-private-methods").then((m) => m.default)
        ]);

        return Parser.extend(classFields, privateMethods);
    })());
}

export async function injectExporter() {
    const code: string = arguments[3];

    if (!code) {
        return;
    }

    try {
        const tree = (await getParser()).parse(code, {
            ecmaVersion: "latest"
        });
        const customExport = {};

        for (const element of tree.body[0].body) {
            if (element.type === "FunctionDeclaration") {
                if (element.id && element.id.name) {
                    customExport[`extendifyExport${Object.keys(customExport).length}`] = () =>
                        arguments[4](element.id.name);
                }
            }
        }

        if (!arguments[2].d) {
            wreq.d(arguments[1], customExport);
        } else {
            arguments[2].d(arguments[1], customExport);
        }
    } catch (e) {
        console.log(arguments);
        throw e;
    }
}

export async function loadEntrypoint(): Promise<boolean> {
    let text: string;
    try {
        text = await (await fetch(ENTRYPOINT_SCRIPT)).text();
    } catch {
        return false;
    }
    let r = `// Original name: ${ENTRYPOINT_SCRIPT}\n${text}`;

    [exposeModuleCache, exposePrivateModule].forEach((f) => (r = f(r)));

    if (IS_DEV) {
        const sourceMap = {
            version: 3,
            file: ENTRYPOINT_SCRIPT,
            sources: [ENTRYPOINT_SCRIPT],
            sourcesContent: [r],
            names: [],
            mappings: ""
        };
        const encodedMap = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
        r += `\n//# sourceMappingURL=data:application/json;base64,${encodedMap}`;
    }

    const script = document.createElement("script");
    script.src = URL.createObjectURL(new Blob([r], { type: "script/js" }));

    document.body.appendChild(script);
    return true;
}
