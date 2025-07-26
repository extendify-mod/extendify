export type PluginDef = Omit<Plugin, "started">;

export interface Plugin {
    /**
     * The display name of the plugin.
     * Should be PascalCase with no spaces.
     */
    name: string;
    /** A description of the plugin */
    description: string;
    /** The plugin's authors as GitHub usernames */
    authors: string[];
    /** Whether or not the plugin should be enabled regardless of the user's configuration */
    required?: boolean;
    /** Whether or not the plugin will show up in the plugin configuration screen */
    hidden?: boolean;
    /** Whether or not the plugin should be enabled before the user has configured it */
    enabledByDefault?: boolean;
    /** A callback for when the plugin is initialized */
    start?(): void;
    started?: boolean;
}
