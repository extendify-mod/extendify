import { registerContext } from "@api/context";
import { type PatchDef, exportFunction, registerPatch } from "@api/context/patch";
import { wreq } from "@webpack";

import {
    type BlockStatement,
    type ClassDeclaration,
    type FunctionDeclaration,
    type Identifier,
    Parser
} from "acorn";
// @ts-expect-error
import classFields from "acorn-class-fields";
// @ts-expect-error
import privateMethods from "acorn-private-methods";

const parser: typeof Parser = Parser.extend(classFields, privateMethods);

const { context } = registerContext({ name: "WebpackExporter" });

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
            // Inject the exporter at the very start of the function
            match: "{",
            // Pretty clever: we just pass a function that runs `eval` from the module's scope so that we can reference local variables from our exporter
            replace: "{$exp.injectExporter(...arguments,(v)=>eval(v));"
        }
    ]
} as PatchDef);

registerPatch(context, {
    find: "displayName=`profiler(${",
    replacement: {
        match: /return (\i)\.displayName=/,
        replace: "$1.toString=arguments[0].toString.bind(arguments[0]);$&"
    }
});

exportFunction(context, async function injectExporter() {
    const code: string = arguments[3];

    if (!code || !/function\s|\bclass\s|\bconst\s/.test(code)) {
        return;
    }

    const customExport = parseScope(code, arguments[4]);

    if (arguments[2]?.d) {
        arguments[2].d(arguments[1], customExport);
    } else {
        wreq.d(arguments[1], customExport);
    }
});

function parseScope(code: string, ev: (name: string) => any): any {
    const tree = parser.parse(code, {
        ecmaVersion: "latest",
        sourceType: "script"
    });

    const customExport: Record<string, () => any> = {};
    function addExport(name: string) {
        customExport[`extendify__${name}`] = () => ev(name);
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

    return customExport;
}
