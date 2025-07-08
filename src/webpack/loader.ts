import { ENTRYPOINT_SCRIPT, XPUI_SCRIPT } from "@utils/constants";
import { Logger } from "@utils/logger";

function replaceAdd(content: string, find: string, add: string) {
    return content.replace(find, find + add);
}

/**
 * Exposes the webpack module cache.
 */
function exposeModuleCache(content: string, requireName: string) {
    if (content.includes("__webpack_module_cache__")) {
        return replaceAdd(
            content,
            `${requireName}.m=__webpack_modules__,`,
            `${requireName}.c=__webpack_module_cache__,`
        );
    }

    let globals = content.match(/,(.+?)={};/);
    if (!globals) {
        return content;
    }
    const globalNames = globals[1].split(",");

    return replaceAdd(
        content,
        `${requireName}.m=__webpack_modules__,`,
        `${requireName}.c=${globalNames[globalNames.length - 1]},`
    );
}

/**
 * Exposes the private iife module that's buried in Spotify's webpack initializer.
 * NOTE: This might be broken for platforms like Linux, because their main release version is behind.
 *       That means that if the variables change (like "o") between versions, it will only work for Windows and Mac, but not for Linux.
 */
function exposePrivateModule(content: string, requireName: string) {
    let exportsName: string | null = null;
    return content
        .replace(
            // Assigns the whole private module as a property
            // and makes the wreq instance accessible to the private module for when we manually call it later on from a different scope
            /(var (__webpack_exports__|.{1,3})={};\()\(\)=>/,
            (_, prefix, name) => {
                exportsName = name;
                logger.info(`Found exports name ${name}`);
                return `${prefix}${requireName}.iife=(${requireName})=>`;
            }
        )
        .replace(
            // Prevents the private iife module from being called.
            // We do this because we want to patch this module, but we can only patch it when our plugins have been initialized.
            // We prevent it from initializing at startup and then initialize it ourselves when we do our webpack patching.
            `})(),${exportsName}=${requireName}.`,
            `}),${exportsName}=${requireName}.`
        );
}

function getRequireName(content: string): string | undefined {
    const match = content.match(/}(__webpack_require__|.{1,3})\.m=__webpack_modules__/);
    return match?.[1];
}

const logger = new Logger("WebpackLoader", "#e28743");

export async function loadEntrypoint(): Promise<boolean> {
    let text: string | null = null;
    let scriptUrl: string = "";
    for (scriptUrl of [ENTRYPOINT_SCRIPT, XPUI_SCRIPT]) {
        try {
            text = await (await fetch(scriptUrl)).text();
            logger.info(`Found entrypoint at ${scriptUrl}`);
            break;
        } catch {}
    }

    if (!text) {
        logger.error("Failed to load entrypoint, make sure you're manually updated to the latest Spotify version");
        return false;
    }

    const requireName = getRequireName(text);
    if (!requireName) {
        logger.error("Couldn't find require name in entrypoint");
        return false;
    }
    logger.info(`Found require name ${requireName}`);

    let r = `// Original name: ${scriptUrl}\n${text}`;
    [exposeModuleCache, exposePrivateModule].forEach((f) => (r = f(r, requireName)));

    if (IS_DEV) {
        const sourceMap = {
            version: 3,
            file: scriptUrl,
            sources: [scriptUrl],
            sourcesContent: [r],
            names: [],
            mappings: ""
        };
        const encodedMap = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
        r += `\n//# sourceMappingURL=data:application/json;base64,${encodedMap}`;
        logger.debug("Generated source map for entrypoint");
    }

    const script = document.createElement("script");
    script.src = URL.createObjectURL(new Blob([r], { type: "script/js" }));

    document.body.appendChild(script);

    logger.info("Successfully patched and loaded entrypoint");
    return true;
}
