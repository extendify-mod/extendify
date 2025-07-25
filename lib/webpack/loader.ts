import { ENTRYPOINT_SCRIPT, XPUI_SCRIPT } from "@shared/constants";
import { createLogger } from "@shared/logger";

const logger = createLogger({ name: "WebpackLoader" });

/**
 * Exposes the webpack module cache, since Spotify's webpack configuration
 * disables this functionality. But webpack still generates it.
 */
function exposeModuleCache(content: string, requireName: string) {
    let cacheName = "__webpack_module_cache__";

    if (!content.includes(cacheName)) {
        let globals = content.match(/,(.+?)={};/);
        if (!globals) {
            return content;
        }

        const globalNames = globals[1]!.split(",");
        cacheName = globalNames[globalNames.length - 1] ?? cacheName;
    }

    return content.replace(
        `${requireName}.m=__webpack_modules__,`,
        (match) => `${match}${requireName}.c=${cacheName},`
    );
}

/**
 * Exposes the private iife module that's buried in Spotify's webpack initializer.
 */
function exposePrivateModule(content: string, requireName: string) {
    let exportsName: string | undefined;

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

function generateSourceMap(content: string, scriptUrl: string) {
    const sourceMap = {
        version: 3,
        file: scriptUrl,
        sources: [scriptUrl],
        sourcesContent: [content],
        names: [],
        mappings: ""
    };
    const encodedMap = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));

    logger.info("Generated source map for entrypoint");
    return `\n//# sourceMappingURL=data:application/json;base64,${encodedMap}`;
}

export async function loadEntrypoint() {
    let text: string | undefined;

    let scriptUrl: string = "";
    for (scriptUrl of [ENTRYPOINT_SCRIPT, XPUI_SCRIPT]) {
        try {
            text = await (await fetch(scriptUrl)).text();
            logger.info(`Found entrypoint at ${scriptUrl}`);
            break;
        } catch {}
    }

    if (!text) {
        logger.error(
            "Failed to load entrypoint, make sure you're manually updated to the latest Spotify version"
        );
        return;
    }

    const requireName = text.match(/}(__webpack_require__|.{1,3})\.m=__webpack_modules__/)?.[1];
    if (!requireName) {
        logger.error("Couldn't find require name in entrypoint");
        return;
    } else {
        logger.info(`Found require name ${requireName}`);
    }

    let script = `// Original name: ${scriptUrl}\n${text}`;
    [exposeModuleCache, exposePrivateModule].forEach(
        (patch) => (script = patch(script, requireName))
    );

    if (DEVELOPMENT) {
        script += generateSourceMap(script, scriptUrl);
    }

    const elem = document.createElement("script");
    elem.src = URL.createObjectURL(new Blob([script], { type: "script/js" }));
    document.body.appendChild(elem);

    logger.info("Successfully patched and loaded entrypoint");
    return;
}
