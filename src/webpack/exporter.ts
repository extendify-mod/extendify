/**
 * Exports the following things from the module's scope:
 * - consts (not vars, because those are usually imports or complicated objects)
 * - functions
 * - classes
 */
import { wreq } from "@webpack";

import { BlockStatement, Identifier, Parser, Token, tokenizer } from "acorn";
import classFields from "acorn-class-fields";
import privateMethods from "acorn-private-methods";

export const parser: typeof Parser = Parser.extend(classFields, privateMethods);

/**
 * Uses Acorn's parser. Slow but reliable. Currently the default.
 */
function parseScopeParser(code: string, ev: (name: string) => any) {
    const tree = parser.parse(code, {
        ecmaVersion: "latest",
        sourceType: "script"
    });

    const customExport = {};
    function addExport(name: string) {
        customExport[`extendifyExport__${name}`] = () => ev(name);
    }

    for (const element of (tree.body[0] as BlockStatement).body) {
        if (element.type === "FunctionDeclaration" || element.type === "ClassDeclaration") {
            if (element.id && element.id.name) {
                addExport(element.id.name);
            }
        } else if (element.type === "VariableDeclaration") {
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

/**
 * Uses Acorn's tokenizer. Extremely fast but super unreliable. Currently experimental.
 * Using `exporterProfiler()` after startup I roughly estimate this to be ~85% faster: (500 - 3500) / 3500 * 100 = -85.7
 * I don't know if it's possible to get this working though.
 */
function parseScopeTokenizer(code: string, ev: (name: string) => any) {
    const tokens = tokenizer(code, { ecmaVersion: "latest" });

    const customExport = {};
    function addExport(name: string) {
        try {
            if (Array.from(arguments).includes(ev(name))) {
                return;
            }
            customExport[`extendifyExport__${name}`] = () => ev(name);
        } catch {}
    }

    let lastToken: Token | undefined;

    for (let token = tokens.getToken(); token.type.label !== "eof"; token = tokens.getToken()) {
        if (!lastToken) {
            lastToken = token;
            continue;
        }

        if (token.type.label === "name" && ["function", "class", "const"].includes((lastToken as any).value)) {
            addExport((token as any).value);
        }

        lastToken = token;
    }

    return customExport;
}

function exporterProfiler() {
    let total = 0;
    exporterProfiler.records.forEach((v) => (total += v));
    return total;
}
exporterProfiler.records = [] as number[];
(window as any).exporterProfiler = exporterProfiler;

function parseScope(code: string, ev: (name: string) => any, tokenizer: boolean = false): any {
    const start = Date.now();

    try {
        const result = tokenizer ? parseScopeTokenizer(code, ev) : parseScopeParser(code, ev);
        if (IS_DEV) {
            exporterProfiler.records.push(Date.now() - start);
        }
        return result;
    } catch (e) {
        console.error(`Exporter failed in ${Date.now() - start}ms`);
        throw e;
    }
}

export async function injectExporter() {
    const code: string = arguments[3];

    if (!code || !/function\s|\bclass\s|\bconst\s/.test(code)) {
        return;
    }

    const customExport = parseScope(code, arguments[4]);

    if (!arguments[2]?.d) {
        wreq.d(arguments[1], customExport);
    } else {
        arguments[2].d(arguments[1], customExport);
    }
}
