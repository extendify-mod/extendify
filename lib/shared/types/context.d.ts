export interface Context {
    /**
     * The display name of the context.
     * Should be PascalCase with no spaces.
     */
    name: string;
    /** The color used by the context's logger */
    loggerColor?: string;
}
