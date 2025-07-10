/**
 * Edited version of Vendicated's DevCompanion plugin.
 * {@link https://github.com/Vendicated/Vencord/blob/main/src/plugins/devCompanion.dev/index.tsx}
 */
import { Devs } from "@utils/constants";
import { Logger } from "@utils/logger";
import { canonicalizeMatch, canonicalizeReplace } from "@utils/patches";
import { definePlugin } from "@utils/types";
import { filters, findAll, resolveModule, search } from "@webpack";

const PORT = 8485;

const logger = new Logger("DevCompanion");
let socket: WebSocket | undefined;

interface StringNode {
    type: "string";
    value: string;
}

interface RegexNode {
    type: "regex";
    value: {
        pattern: string;
        flags: string;
    };
}

interface FunctionNode {
    type: "function";
    value: string;
}

interface PatchData {
    find: string;
    replacement: {
        match: StringNode | RegexNode;
        replace: StringNode | FunctionNode;
    }[];
}

interface FindData {
    type: string;
    args: Array<StringNode | FunctionNode>;
}

type Node = StringNode | RegexNode | FunctionNode;

function parseNode(node: Node) {
    switch (node.type) {
        case "string":
            return node.value;
        case "regex":
            return new RegExp(node.value.pattern, node.value.flags);
        case "function":
            // We LOVE remote code execution
            // Safety: This comes from localhost only, which actually means we have less permissions than the source,
            // since we're running in the browser sandbox, whereas the sender has host access
            return (0, eval)(node.value);
        default:
            throw new Error("Unknown Node Type " + (node as any).type);
    }
}

function initWs() {
    let connected = false;
    let hasErrored = false;
    const ws = (socket = new WebSocket(`ws://127.0.0.1:${PORT}`));

    ws.addEventListener("open", () => {
        connected = true;
        logger.info("Connected to WebSocket");
    });

    ws.addEventListener("error", (e) => {
        if (!connected) {
            return;
        }

        hasErrored = true;

        logger.error("Dev Companion Error:", e);
    });

    ws.addEventListener("close", (e) => {
        if (!connected || hasErrored) {
            return;
        }

        logger.info("Dev Companion Disconnected:", e.code, e.reason);
    });

    ws.addEventListener("message", (e) => {
        try {
            var { nonce, type, data } = JSON.parse(e.data);
        } catch (err) {
            logger.error("Invalid JSON:", err, "\n" + e.data);
            return;
        }

        function reply(error?: string) {
            const data = { nonce, ok: !error } as Record<string, unknown>;
            if (error) {
                data.error = error;
            }

            ws.send(JSON.stringify(data));
        }

        logger.info("Received Message:", type, "\n", data);

        switch (type) {
            case "testPatch": {
                const { find, replacement } = data as PatchData;

                const candidates = search(find);
                const keys = Object.keys(candidates);
                if (keys.length !== 1) {
                    return reply("Expected exactly one 'find' matches, found " + keys.length);
                }

                const mod = resolveModule(keys[0]) as any;
                let src = (mod.original ?? mod).toString().replaceAll("\n", "");

                if (src.startsWith("function(")) {
                    src = "0," + src;
                }

                let i = 0;
                for (const { match, replace } of replacement) {
                    i++;

                    try {
                        const matcher = canonicalizeMatch(parseNode(match));
                        const replacement = canonicalizeReplace(parseNode(replace), "PlaceHolderPluginName");

                        const newSource = src.replace(matcher, replacement as string);

                        if (src === newSource) {
                            throw "Had no effect";
                        }
                        Function(newSource);

                        src = newSource;
                    } catch (err) {
                        return reply(`Replacement ${i} failed: ${err}`);
                    }
                }

                reply();
                break;
            }
            case "testFind": {
                const { type, args } = data as FindData;
                try {
                    var parsedArgs = args.map(parseNode);
                } catch (err) {
                    return reply("Failed to parse args: " + err);
                }

                try {
                    let results: any[];
                    switch (type.replace("find", "").replace("Lazy", "")) {
                        case "":
                            results = findAll(parsedArgs[0]);
                            break;
                        case "ByProps":
                            results = findAll(filters.byProps(...parsedArgs));
                            break;
                        case "ByCode":
                            results = findAll(filters.byCode(...parsedArgs));
                            break;
                        case "ModuleId":
                            results = Object.keys(search(parsedArgs[0]));
                            break;
                        case "ComponentByCode":
                            results = findAll(filters.componentByCode(...parsedArgs));
                            break;
                        default:
                            return reply("Unknown Find Type " + type);
                    }

                    const uniqueResultsCount = new Set(results).size;
                    if (uniqueResultsCount === 0) {
                        throw "No results";
                    } else if (uniqueResultsCount > 1) {
                        throw "Found more than one result! Make this filter more specific";
                    }
                } catch (err) {
                    return reply("Failed to find: " + err);
                }

                reply();
                break;
            }
            default:
                reply("Unknown Type " + type);
                break;
        }
    });
}

export default definePlugin({
    name: "DevCompanion",
    description: "Dev Companion Plugin",
    authors: [Devs.elia],
    required: IS_DEV,
    hidden: !IS_DEV,
    start() {
        initWs();
    },
    stop() {
        socket?.close(1000, "Plugin Stopped");
    }
});
