import { plugins } from "@api/registry";
import { createLogger } from "@shared/logger";

import "@api/react";
import "@api/redux";
import "@api/themes";

import "@webpack/exporter";
import "@webpack/interceptor";
import "@webpack/loader";

const logger = createLogger({ name: "Entrypoint" });

/**
 * This imports plugins with any of the following file structures:
 * 1. plugins/pluginName.ts
 * 2. plugins/pluginName/index.ts
 *
 * The first structure is meant for simple plugins that only require a simple patch.
 * The 2nd structure is meant for plugins that require multiple files to function,
 * like stylesheets or typescript definitions.
 *
 * Where the folder "plugins" is referenced we also read the "userplugins" folder.
 * This folder, by default, is included in the .gitignore file.
 * This folder allows users to make their own plugins that are not built-in to Extendify.
 *
 * Where the ".ts" file extension is referenced we also accept ".tsx" files.
 * This filetype allows JSX syntax, where an html-like structure can
 * be used in tandem with javascript/typescript.
 */

import.meta.glob(
    ["./{plugins,userplugins}/*/index.{ts,tsx}", "./{plugins,userplugins}/*.{ts,tsx}"],
    { eager: true }
);

logger.debug(`Globbed ${plugins.size} plugins`);
