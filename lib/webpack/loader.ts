import { createLogger } from "@shared/logger";
import { createExtendedRegExp } from "@shared/match";

const logger = createLogger({ name: "WebpackLoader" });

/**
 * Exposes the private iife module that's buried in Spotify's webpack entrypoint.
 */
function exposePrivateModule(content: string, requireName: string) {
    let exportsName: string | undefined;

    return content
        .replace(
            /**
             * Assigns the whole private module as a property to the wreq instance, and makes the wreq instance
             * accessible to the private module for when we manually call it later on from a different scope.
             */
            createExtendedRegExp(/(var (__webpack_exports__|\i)={};\()\(\)=>/),
            (_, prefix, name) => {
                exportsName = name;
                logger.info(`Found exports name ${name}`);
                return `${prefix}${requireName}.iife=(extendifyModule,extendifyExports,${requireName})=>`;
            }
        )
        .replace(
            /**
             * This patch prevents the private iife module from being called when the entrypoint is loaded.
             * We do this because we want to patch this module, but we can only patch it when our plugins have been initialized.
             * We prevent it from initializing at startup and then initialize it ourselves when we do our webpack patching.
             */
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

async function loadEntrypoint() {
    if (ENTRYPOINTS.length === 0) {
        logger.info("No entrypoints available");
        return;
    }

    let text: string | undefined;

    /**
     * Since Spotify version 1.2.64.407 Spotify has started using V8 startup snapshots.
     * Read more here: https://v8.dev/blog/custom-startup-snapshots
     *
     * This means that instead of having the entrypoint be at "xpui.js" it is instead at "xpui-snapshot.js".
     * Except for taking this change into account by allowing this new entrypoint to exist,
     * we don't have to do anything else to comply with this new feature.
     *
     * However, recent MacOS and Linux versions still use the legacy "xpui.js" as entrypoint,
     * which is why we check both possible entrypoints.
     *
     * This may be removed later on.
     */

    let scriptUrl: string = "";
    for (scriptUrl of ENTRYPOINTS) {
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

    const requireName = text.match(
        createExtendedRegExp(/}(__webpack_require__|\i)\.m=(?:__webpack_modules__|\i)/)
    )?.[1];
    if (!requireName) {
        logger.error("Couldn't find require name in entrypoint");
        return;
    } else {
        logger.info(`Found require name ${requireName}`);
    }

    let script = exposePrivateModule(`// Original name: ${scriptUrl}\n${text}`, requireName);

    if (DEVELOPMENT) {
        script += generateSourceMap(script, scriptUrl);
    }

    const elem = document.createElement("script");
    elem.src = URL.createObjectURL(new Blob([script], { type: "script/js" }));
    document.body.appendChild(elem);

    logger.info("Successfully patched and loaded entrypoint");
    return;
}

loadEntrypoint();
