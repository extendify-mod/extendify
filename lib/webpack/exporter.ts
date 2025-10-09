import { registerContext } from "@api/context";
import { type PatchDef, exportFunction, registerPatch } from "@api/context/patch";
import { moduleCache } from "@api/registry";
import type { RawModule, WebpackRequire } from "@shared/types/webpack";

import {
    type BlockStatement,
    type ClassDeclaration,
    type FunctionDeclaration,
    type Identifier
} from "acorn";
import { parse } from "acorn-loose";

type EvalFunc = (name: string) => any;

const { context, logger } = registerContext({
    name: "WebpackExporter",
    platforms: ["desktop", "browser"]
});

registerPatch(context, {
    all: true,
    replacement: [
        {
            noWarn: true,
            /**
             * Turn every module into a function instead of an arrow function:
             * 1111: (a, b, c) => {} -> 1111: function(a, b, c) {}
             * 2222: (a, b) => {}    -> 2222: function(a, b) {}
             * 3333: a => {}         -> 3333: function(a) {}
             * 4444: module => {}    -> 4444: function(module) {}
             * ^ there's one of these that exists where there is only one argument which has a full name (module)
             * If the module is already a function, which there is at least one example of, this patch will not apply
             */
            match: /(function)?(?:\((.*?)\)|(.|module))=>{/,
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
        exports: typeof module.exports,
        require: WebpackRequire,
        code: string,
        ev: EvalFunc
    ) {
        if (!code || !/function\s|\bclass\s|\bconst\s/.test(code)) {
            return;
        }

        const moduleId = module.id ?? module.i;

        try {
            const customExports = parseScope(code, ev);

            moduleCache[moduleId] = {
                id: moduleId,
                loaded: true,
                exports: { ...customExports, ...module.exports }
            };
        } catch (e) {
            logger.error(`Module ${module.id} couldn't be parsed`, e);
        }
    }
);

export function parseScope(code: string, ev: EvalFunc): Record<string, any> {
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

            if (element.id && element.id.name) {
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
