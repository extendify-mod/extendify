import { plugins } from "@extendify/api/registry";
import { createLogger } from "@extendify/shared/logger";

import "@extendify/api/react";
import "@extendify/api/redux";
import "@extendify/api/themes";

import "@extendify/webpack/exporter";
import "@extendify/webpack/interceptor";
import "@extendify/webpack/loader";

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
globPlugins();

logger.debug(`Globbed ${plugins.size} plugins`);
