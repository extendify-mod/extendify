import { exportFunction, registerPatch } from "@api/context/patch";
import { registerPlugin } from "@api/context/plugin";
import { registerContextOptions } from "@api/context/settings";

/**
 * This is how you register a plugin. It returns a logger and the plugin object.
 * The plugin object is used to reference ownership to APIs, like when you register a patch.
 */
const { plugin, logger } = registerPlugin({
    authors: ["7elia"],
    description: "Showcasing some stuff",
    name: "ExamplePlugin",
    /**
     * We support multiple places where the Spotify app runs,
     * like on desktops (Windows, MacOS, Linux) or on TVs (webOS TVs).
     * Some plugins might not be needed for one of these places,
     * so we can make it exclusive to 1 or more platform.
     */
    platforms: ["desktop"],
    start() {
        /**
         * Will show up as:
         * [Extendify] [Plugin/TestPlugin] You get your own prefixed logger
         * with a cool random color based on the name's hash (unless one is specified)
         */
        logger.info("You get your own prefixed logger");
    }
});

// We can also make config options
const { homeNavLog } = registerContextOptions(plugin, {
    homeNavLog: {
        default: true,
        description: "Whether to enable the log message for when the user clicks the Home button!",
        type: "boolean"
    }
});

// We make a custom function (with a name)
function logHomeNavigation() {
    logger.info("Navigated to home!");
}

// And then we can export the function to the registry, which is referenced with $exp.logHomeNavigation
exportFunction(plugin, logHomeNavigation);

// Now we will make a custom patch that will make changes to a webpack module's code
registerPatch(plugin, {
    // Finds the webpack module with this piece of code
    find: 'destination:"spotify:app:home"',
    replacement: {
        // Matches this string in the module
        match: /"home-button",onClick:\(\)=>{/,

        // This means the patch will only apply if the user has enabled the option
        predicate() {
            return homeNavLog;
        },

        /**
         * Replaces the match with this
         * Explanation:
         * - $& in js regex means the entire match
         * - $1 in js regex means group 1 (we're not using it here but still useful to know)
         * - $exp is the registry of custom exported functions
         */
        replace: "$&$exp.logHomeNavigation();"
    }
});
