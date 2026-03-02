import { registerContext } from "@api/context";
import { emitEvent } from "@api/context/event";
import { exportFunction, registerPatch } from "@api/context/patch";
import { exportFilters, findModuleExportLazy } from "@webpack/module";

import type { UseSelector } from "react-redux";
import type { combineReducers as CombineReducers, Store } from "redux";

const { context } = registerContext({
    name: "Redux",
    platforms: ["browser", "desktop"]
});

export let globalStore: Store;
export const useSelector = findModuleExportLazy<UseSelector<any>>(
    exportFilters.byCode({
        matches: [/{equalityFn:\i/, /^(?!.*===).*/],
        mode: "all"
    })
);
/**
 * https://github.com/reduxjs/redux/blob/master/src/combineReducers.ts#L123
 *
 * Can be found as 333->HY as of 1.2.84.476
 *
 * The reason this works is because it includes the `assertReducerShape`
 * function in the combineReducers function.
 */
export const combineReducers = findModuleExportLazy<typeof CombineReducers>(
    exportFilters.byCode(/type:\i\.PROBE_UNKNOWN_ACTION\(\)/)
);

registerPatch(context, {
    find: "ANONYMOUS_DEFERRED_ACTION_KEY",
    replacement: {
        match: /(\i)=\i\({session:\i,features:\i,seoExperiment:\i},{.*?}\);/,
        replace: "$&$exp.loadGlobalStore($1);"
    }
});

exportFunction(context, function loadGlobalStore(store) {
    globalStore = store;

    emitEvent("reduxLoaded", store);
});
