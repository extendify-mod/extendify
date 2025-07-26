import type { AnyFn, MatchType, Patch, PatchDef, ReplaceFn } from "@shared/types/patch";
import type { Plugin } from "@shared/types/plugin";

export const patches: Patch[] = [];
window.exportedFunctions = {};

export function registerPatch(owner: Plugin | string, patch: PatchDef) {
    patches.push({ owner: typeof owner === "string" ? owner : owner.name, ...patch });
}

export function exportFunction(fn: AnyFn) {
    if (!fn.name?.length) {
        throw new Error("Exported functions must have a name");
    }

    if (Object.keys(window.exportedFunctions).includes(fn.name)) {
        throw new Error(`Function ${fn.name} already exported`);
    }

    window.exportedFunctions[fn.name] = fn;
}

function createComplexRegExp(regex: RegExp) {
    return new RegExp(
        regex.source.replaceAll("\\i", String.raw`(?:[A-Za-z_$][\w$]*)`),
        regex.flags
    );
}

export function findMatches(src: string, match: MatchType | MatchType[]): boolean {
    const find = Array.isArray(match) ? match : [match];

    for (const filter of find) {
        // Might remove this in the future 'cause it's hacky as hell,
        // but it saves us a little bit of time with the exporter
        if (typeof filter === "string" && !filter.length) {
            return true;
        }

        if (typeof filter === "string" && !src.includes(filter)) {
            return false;
        }

        if (filter instanceof RegExp && !createComplexRegExp(filter).test(src)) {
            return false;
        }
    }

    return true;
}

export function executePatch(src: string, match: MatchType, replace: string | ReplaceFn): string {
    if (typeof replace === "function") {
        const original = replace;
        replace = (...args) =>
            (original as ReplaceFn)(...args).replaceAll("$exp", "window.exportedFunctions");
    } else {
        replace = replace.replaceAll("$exp", "window.exportedFunctions");
    }

    // @ts-ignore: There are multiple overloads here that conflict which causes an error when having 'string | ReplaceFn'
    return src.replace(match, replace);
}
