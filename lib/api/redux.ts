import { registerContext } from "@api/context";
import { exportFunction, registerPatch } from "@api/context/patch";

import type { Store } from "redux";

const { context } = registerContext({
    name: "Redux",
    platforms: ["browser", "desktop"]
});

export let globalStore: Store;

registerPatch(context, {
    find: "ANONYMOUS_DEFERRED_ACTION_KEY",
    replacement: {
        match: /(\i)=\i\({session:\i,features:\i,seoExperiment:\i},{.*?}\);/,
        replace: "$&$exp.loadGlobalStore($1);"
    }
});

exportFunction(context, function loadGlobalStore(store) {
    globalStore = store;
});
