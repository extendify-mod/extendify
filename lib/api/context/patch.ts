import type { Context } from "@api/context";
import { patches } from "@api/registry";
import { type AnyMatch, createExtendedRegExp, type Match } from "@shared/match";
import type { AnyFn, TargetPlatform } from "@shared/types";

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
    find: AnyMatch;
    /** The actual replacement(s) the patch executes */
    replacement: PatchReplacement | PatchReplacement[];
    /**
     * Whether or not all found modules should be
     * patched instead of just the initial module
     */
    all?: boolean;
    /**
     * The platforms to which the patch will be applied.
     * Will always apply if there are no platforms specified.
     */
    platforms?: TargetPlatform[];
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
    /**
     * The platforms to which the replacement will be applied.
     * Will always apply if there are no platforms specified.
     */
    platforms?: TargetPlatform[];
}

window.exportedFunctions = {};

/**
 * You can pass multiple patches here, but in my opinion you should
 * only do this when the patches try to achieve the same goal.
 * This makes sure the patches are clearly separated by category which
 * makes your plugin's code 10x more readable.
 */
export function registerPatch(owner: Context, ...newPatches: PatchDef[]) {
    for (const patch of newPatches) {
        patches.push({ context: owner, ...patch });
    }
}

export function exportFunction(context: Context, fn: AnyFn) {
    if (!fn.name?.length) {
        throw new Error("Exported functions must have a name");
    }

    const contextExports = window.exportedFunctions[context.name] ?? {};

    if (Object.keys(contextExports).includes(fn.name)) {
        throw new Error(`Function ${fn.name} already exported`);
    }

    contextExports[fn.name] = fn;
    window.exportedFunctions[context.name] = contextExports;
}

function escapeRegEx(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function executePatch(
    context: Context,
    src: string,
    match: Match,
    replace: string | ReplaceFn
): string {
    const registryPrefix = `window.exportedFunctions.${context.name}`;

    if (typeof replace === "function") {
        const original = replace;
        replace = (...args) => (original as ReplaceFn)(...args).replaceAll("$exp", registryPrefix);
    } else {
        replace = replace.replaceAll("$exp", registryPrefix);
    }

    if (match instanceof RegExp) {
        match = createExtendedRegExp(match);
    } else {
        // Force the match to be a regex so that you can use $& in the replace string
        // or a replace function.
        match = new RegExp(escapeRegEx(match));
    }

    // @ts-expect-error
    // There are multiple overloads here that conflict which causes an error when having 'string | ReplaceFn'
    return src.replace(match, replace);
}

export function contextHasPatches(contextName: string): boolean {
    return patches.filter(patch => patch.context.name === contextName).length >= 1;
}
