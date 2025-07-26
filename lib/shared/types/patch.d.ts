import type { Plugin } from "./plugin";

export type MatchType = string | RegExp;

export interface PatchConditions {
    /**
     * A callback which returns whether or not the patch should be executed.
     * Used for stuff like settings that enable/disable patches.
     */
    predicate?(): boolean;
    /** Whether or not the patch should execute in the private iife module */
    excludePrivateModule?: boolean;
    /** Whether or not you'll be warned when the patch has no effect */
    noWarn?: boolean;
}

export interface Patch extends PatchConditions {
    /** The name of the plugin or API that owns the patch */
    owner: string;
    /** A unique match to find the correct module */
    find: MatchType | MatchType[];
    /** The actual replacement(s) the patch executes */
    replacement: PatchReplacement | PatchReplacement[];
    /** Whether or not all found modules should be patched instead of just the initial module */
    all?: boolean;
}

export type PatchDef = Omit<Patch, "owner">;

export type ReplaceFn = (match: string, ...groups: string[]) => string;

/** A glorified String.prototype.replace */
export interface PatchReplacement extends PatchConditions {
    /**
     * A string or regular expression to search for
     * TODO: Document \i
     */
    match: MatchType;
    /**
     * A string or callback function containing the text to replace
     * TODO: Document $exp
     * */
    replace: string | ReplaceFn;
}

export type AnyFn = ((...args: any[]) => any) & { name: string };
