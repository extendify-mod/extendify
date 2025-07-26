import type { Plugin } from "./plugin";

export interface Patch {
    /** The plugin that owns the patch */
    owner: Plugin;
    /** A unique match to find the correct module */
    find: string | RegExp;
    /** The actual replacement(s) the patch executes */
    replace: PatchReplacement | PatchReplacement[];
    /** Whether or not the patch should be executed */
    predicate?(): boolean;
}

export type PatchDef = Omit<Patch, "owner">;

export type ReplaceFn = (match: string, ...groups: string[]) => string;

/** A glorified String.prototype.replace */
export interface PatchReplacement {
    /** A string or regular expression to search for */
    match: string | RegExp;
    /** A string or callback function containing the text to replace */
    replace: string | ReplaceFn;
    /** Whether or not the replacement should be executed */
    predicate?(): boolean;
}
