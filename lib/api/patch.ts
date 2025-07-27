import { IDENTIFIER_REGEX } from "@shared/constants";
import type { ContextOwner } from "@shared/types/context";
import type { AnyFn, Match, MultiMatch, Patch, PatchDef, ReplaceFn } from "@shared/types/patch";

export const patches: Patch[] = [];
window.exportedFunctions = {};

/**
 * You can pass multiple patches here, but in my opinion you should
 * only do this when the patches try to achieve the same goal.
 * This makes sure the patches are clearly separated by category which
 * makes your plugin's code 10x more readable.
 */
export function registerPatch(owner: ContextOwner, ...newPatches: PatchDef[]) {
    for (const patch of newPatches) {
        patches.push({ owner, ...patch });
    }
}

export function exportFunction(context: ContextOwner, fn: AnyFn) {
    if (!fn.name?.length) {
        throw new Error("Exported functions must have a name");
    }

    let contextExports = window.exportedFunctions[context.name] ?? {};

    if (Object.keys(contextExports).includes(fn.name)) {
        throw new Error(`Function ${fn.name} already exported`);
    }

    contextExports[fn.name] = fn;
    window.exportedFunctions[context.name] = contextExports;
}

function createComplexRegExp(regex: RegExp) {
    return new RegExp(regex.source.replaceAll("\\i", IDENTIFIER_REGEX), regex.flags);
}

export function isMatch(src: string, match: Patch["find"]): boolean {
    // If the patch doesn't specify the 'find' propery,
    // we'll asssume it wants to patch every module.
    if (!match) {
        return true;
    }

    if (typeof match === "string") {
        return src.includes(match);
    }

    function test(filter: string | RegExp): boolean {
        if (typeof filter === "string") {
            return src.includes(filter);
        }
        return createComplexRegExp(filter).test(src);
    }

    const { mode, matches } = match as MultiMatch;
    return mode === "all" ? matches.every(test) : matches.some(test);
}

export function executePatch(
    context: ContextOwner,
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
        match = createComplexRegExp(match);
    }

    // @ts-ignore
    // There are multiple overloads here that conflict which causes an error when having 'string | ReplaceFn'
    return src.replace(match, replace);
}
