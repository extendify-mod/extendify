import type { Context } from "@shared/types/context";
import type { Plugin } from "@shared/types/plugin";

export type Match = string | RegExp;

export interface MultiMatch {
    matches: Match[];
    mode: "any" | "all";
}

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
    /** Whether or not you'll be warned when the patch errors */
    noError?: boolean;
}

export interface Patch extends PatchConditions {
    /** The context that owns the patch */
    context: Context;
    /** A unique match to find the correct module */
    find: Match | MultiMatch;
    /** The actual replacement(s) the patch executes */
    replacement: PatchReplacement | PatchReplacement[];
    /**
     * Whether or not all found modules should be
     * patched instead of just the initial module
     */
    all?: boolean;
}

export type PatchDef = Omit<Patch, "context">;

export type ReplaceFn = (match: string, ...groups: string[]) => string;

/** A glorified String.replace */
export interface PatchReplacement extends PatchConditions {
    /**
     * A string or regular expression to search for.
     *
     * You can use `\i` in your regex to match variable names and keywords.
     */
    match: Match;
    /**
     * A string or callback function containing the text to replace.
     *
     * You can use `$exp.functionName` in your string to reference functions your plugin
     * exported to the registry.
     * */
    replace: string | ReplaceFn;
}

export type AnyFn = ((...args: any[]) => any) & { name: string };
