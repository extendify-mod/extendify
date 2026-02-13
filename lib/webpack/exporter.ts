import { registerContext } from "@api/context";
import { exportFunction, type PatchDef, registerPatch } from "@api/context/patch";
import { moduleCache } from "@api/registry";
import { PROPS_ARG_NAME } from "@shared/constants";
import type { ModuleEval, RawModule, WebpackRequire } from "@shared/types/webpack";

import type { BlockStatement, ClassDeclaration, FunctionDeclaration, Identifier } from "acorn";
import { parse } from "acorn-loose";

const { context, logger } = registerContext({
    name: "WebpackExporter",
    platforms: ["desktop", "browser"]
});

registerPatch(context, {
    all: true,
    replacement: [
        {
            /**
             * Turn every module into a function instead of an arrow function:
             * 1111: (a, b, c) => {} -> 1111: function(a, b, c) {}
             * 2222: (a, b) => {}    -> 2222: function(a, b) {}
             * 3333: a => {}         -> 3333: function(a) {}
             * 4444: module => {}    -> 4444: function(module) {}
             * 5555(a, b, c) {}      -> 5555: function(a, b, c) {}
             * ^ there's one of these that exists where there is only one argument which has a full name (module)
             * If the module is already a function, which there is at least one example of, this patch will not apply
             */
            match: /(function)?(?:\((.*?)\)(?:=>)?|(.|module)=>){/,
            noWarn: true,
            replace(match, func, args1, args2) {
                return func ? match : `function(${args1 ?? args2}){`;
            }
        },
        {
            // Inject the exporter at the very end of the function
            match: /}$/,
            // Pretty clever: we just pass a function that runs `eval` from the module's scope so that we can reference local variables from our exporter
            replace: ";$exp.injectExporter(...arguments,(v)=>eval(v));$&"
        }
    ]
} as PatchDef);

registerPatch(context, {
    all: true,
    noError: true,
    noWarn: true,
    /**
     * Replaces all arrow- and nameless functions in a module (usually components) with spread properties
     * with a single argument and then destructures that as the first line of the module.
     *
     * Example:
     *
     * ```
     * const component = ({ a: b, c: d=e, ...f }) => {
     *
     * function({ a: b, c: d=e, ...f }) {
     * ```
     *
     * Will turn into:
     *
     * ```
     * const component = (__extendifyProps) => {
     *     let { a: b, c: d=e, ...f } = __extendifyProps;
     *
     * function(__extendifyProps) {
     *     let { a: b, c: d=e, ...f } = __extendifyProps;
     * ```
     */
    replacement: [
        {
            match: /\((\{[^}]*(?:\.\.\.|:|=)[^}]*\})\)=>{/g,
            replace: `(${PROPS_ARG_NAME})=>{let $1=${PROPS_ARG_NAME};`
        },
        {
            match: /function\((\{[^}]*(?:\.\.\.|:|=)[^}]*\})\){/g,
            replace: `function(${PROPS_ARG_NAME}){let $1=${PROPS_ARG_NAME};`
        }
    ]
} as PatchDef);

registerPatch(context, {
    find: "displayName=`profiler(${",
    replacement: {
        /**
         * Fixes some components' displayNames not being available as they're forwarded by the React profiler.
         * This patch assigns the displayName to the exported function, while still allowing the React profiler to function properly.
         */
        match: /return (\i)\.displayName=/,
        replace: "$1.toString=arguments[0].toString.bind(arguments[0]);$&"
    }
});

exportFunction(
    context,
    async function injectExporter(
        module: RawModule,
        _exports: typeof module.exports,
        _require: WebpackRequire,
        code: string,
        ev: ModuleEval
    ) {
        const moduleId = module.id ?? module.i;

        /**
         * Hardcoded, but 125 makes sense.
         * Most of the empty modules that I tested are 120 characters or less.
         * Accounting for longer ids that these might import I'd say 125 is a pretty fair number.
         */
        if (!code || code.length <= 125) {
            logger.debug(`Skipping module ${moduleId}\n`, code);
            return;
        }

        try {
            const customExports = parseScope(code, ev);

            moduleCache[moduleId] = {
                exports: { ...customExports, ...module.exports },
                id: moduleId,
                loaded: true
            };
        } catch (e) {
            logger.error(`Module ${module.id} couldn't be parsed`, e);
        }
    }
);

export function parseScope(code: string, ev: ModuleEval): Record<string, any> {
    const tree = parse(code, {
        ecmaVersion: "latest",
        sourceType: "script"
    });

    const customExports: Record<string, any> = {};
    function addExport(name: string) {
        try {
            customExports[`extendify__${name}`] = ev(name);
        } catch {
            logger.debug(`Skipping '${name}' for module ${module.id}`);
        }
    }

    for (let element of (tree.body[0] as BlockStatement).body) {
        if (["FunctionDeclaration", "ClassDeclaration"].includes(element.type)) {
            element = element as FunctionDeclaration | ClassDeclaration;

            if (element.id?.name) {
                addExport(element.id.name);
            }

            continue;
        }

        if (element.type === "VariableDeclaration") {
            if (element.kind !== "const") {
                continue;
            }

            for (const declaration of element.declarations) {
                addExport((declaration.id as Identifier).name);
            }
        }
    }

    return customExports;
}
