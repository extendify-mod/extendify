import { platform } from "@api/platform";
import { exportFilters, findAllModuleExports } from "@webpack/module";

interface Query {
    name: string;
    operation: "query";
    sha256Hash: string;
    value?: any;
}

interface QueryResult<T> {
    data: T;
}

const queryCache: Record<string, Query> = {};

export function findQuery(name: string): Query | undefined {
    if (Object.keys(queryCache).includes(name)) {
        return queryCache[name];
    }

    for (const query of findAllModuleExports<Query>(
        exportFilters.byProps("name", "operation", "sha256Hash", "value")
    )) {
        if (query.operation !== "query") {
            continue;
        }

        queryCache[query.name] = query;

        if (query.name === name) {
            return query;
        }
    }
}

export async function executeQuery<T>(
    query: Query,
    variables: Record<string, any>
): Promise<QueryResult<T>> {
    return (await platform?.getGraphQLLoader()(query, variables)) as QueryResult<T>;
}
