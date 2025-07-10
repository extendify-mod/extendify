/**
 * Modified version of Vendicated's patches.ts
 * @link https://github.com/Vendicated/Vencord/blob/main/src/utils/patches.ts
 */
import { runtimeHashMessageKey } from "./hash";
import { Patch, PatchReplacement, ReplaceFn } from "./types";

export const canonicalizeMatch = <T extends RegExp | string>(match: T): T => {
    let partialCanon = typeof match === "string" ? match : match.source;
    partialCanon = partialCanon.replaceAll(/#{intl::([\w$+/]*)(?:::(\w+))?}/g, (_, key, modifier) => {
        const hashed = modifier === "raw" ? key : runtimeHashMessageKey(key);

        const isString = typeof match === "string";
        const hasSpecialChars = !Number.isNaN(Number(hashed[0])) || hashed.includes("+") || hashed.includes("/");

        if (hasSpecialChars) {
            return isString ? `["${hashed}"]` : String.raw`(?:\["${hashed}"\])`.replaceAll("+", "\\+");
        }

        return isString ? `.${hashed}` : String.raw`(?:\.${hashed})`;
    });

    if (typeof match === "string") {
        return partialCanon as T;
    }

    const canonSource = partialCanon.replaceAll("\\i", String.raw`(?:[A-Za-z_$][\w$]*)`);
    return new RegExp(canonSource, match.flags) as T;
};

export const canonicalizeReplace = <T extends string | ReplaceFn>(replace: T, pluginName: string): T => {
    const self = `Extendify.Plugins.plugins[${JSON.stringify(pluginName)}]`;

    if (typeof replace !== "function") {
        return replace.replaceAll("$self", self) as T;
    }

    return ((...args) => replace(...args).replaceAll("$self", self)) as T;
};

export const canonicalizeDescriptor = <T>(descriptor: TypedPropertyDescriptor<T>, canonicalize: (value: T) => T) => {
    if (descriptor.get) {
        const original = descriptor.get;
        descriptor.get = function () {
            return canonicalize(original.call(this));
        };
    } else if (descriptor.value) {
        descriptor.value = canonicalize(descriptor.value);
    }
    return descriptor;
};

export const canonicalizeReplacement = (replacement: Pick<PatchReplacement, "match" | "replace">, plugin: string) => {
    const descriptors = Object.getOwnPropertyDescriptors(replacement);
    descriptors.match = canonicalizeDescriptor(descriptors.match, canonicalizeMatch);
    descriptors.replace = canonicalizeDescriptor(descriptors.replace, (replace) =>
        canonicalizeReplace(replace, plugin)
    );
    Object.defineProperties(replacement, descriptors);
};

export const canonicalizeFind = (patch: Patch) => {
    const descriptors = Object.getOwnPropertyDescriptors(patch);
    descriptors.find = canonicalizeDescriptor(descriptors.find, canonicalizeMatch);
    Object.defineProperties(patch, descriptors);
};
