import { filters, findAll } from "@webpack";
import { platform } from "@webpack/common";

const queryCache = {};

export interface Query {
    name: string;
    operation: "query";
    sha256Hash: string;
    value?: any;
}

export async function executeQuery(query: Query, variables: Record<string, any>) {
    return platform.getGraphQLLoader()(query, variables);
}

export function findQuery(name: string): Query | null {
    if (Object.keys(queryCache).includes(name)) {
        return queryCache[name];
    }

    for (const query of findAll(filters.byProps("name", "operation", "sha256Hash", "value"))) {
        queryCache[query.name] = query;
        if (query.name === name) {
            return query;
        }
    }

    return null;
}
