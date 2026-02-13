import { registerContext } from "@api/context";
import { emitEvent } from "@api/context/event";
import { exportFunction, registerPatch } from "@api/context/patch";
import { exportFilters, findModuleExportLazy } from "@webpack/module";

import type { UseSelector } from "react-redux";
import type { Store } from "redux";

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
