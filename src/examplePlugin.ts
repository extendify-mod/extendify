import { exportFunction, registerPatch } from "@api/patch";
import { registerPlugin } from "@api/plugin";

/**
 * This is how you register a plugin. It returns a logger and the plugin object.
 * The plugin object is used to reference ownership to APIs, like when you register a patch.
 */
const { plugin, logger } = registerPlugin({
    name: "ExamplePlugin",
    description: "Showcasing some stuff",
    authors: ["7elia"],
    hidden: true, // (Optional)
    required: false, // (Optional)
    enabledByDefault: false, // (Optional)
    loggerColor: undefined, // (Optional)
    start() {
        /**
         * Will show up as:
         * [Extendify] [Plugin/TestPlugin] You get your own prefixed logger
         * with a cool random color based on the name's hash (unless one is specified)
         */
        logger.info("You get your own prefixed logger");
    }
});

// Now we will make a custom patch that will make changes to a webpack module's code
registerPatch(plugin, {
    // Finds the webpack module with this piece of code
    find: 'destination:"spotify:app:home"',
    replacement: {
        // Matches this string in the module
        match: /"home-button",onClick:\(\)=>{/,
        /**
         * And replaces it with this
         * Explanation:
         * - $& in js regex means the entire match
         * - $1 in js regex means group 1 (we're not using it here but still useful to know)
         * - $exp is a registry of custom exported functions (see below)
         */
        replace: "$&$exp.logHomeNavigation();"
    }
});

// We make a custom function (with a name)
function logHomeNavigation() {
    logger.info("Navigated to home!");
}

// And then we can export the function to the registry, which is referenced with $exp
exportFunction(plugin, logHomeNavigation);
