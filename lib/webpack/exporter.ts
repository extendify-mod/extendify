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

export async function injectExporter() {
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
}
