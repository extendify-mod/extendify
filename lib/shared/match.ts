import { IDENTIFIER_REGEX } from "@shared/constants";

export type Match = string | RegExp;

export interface MultiMatch {
    matches: Match[];
    mode: "any" | "all";
}

export type AnyMatch = Match | MultiMatch;

export function createComplexRegExp(regex: RegExp) {
    return new RegExp(regex.source.replaceAll("\\i", IDENTIFIER_REGEX), regex.flags);
}

export function srcMatches(src: string, match: AnyMatch): boolean {
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
