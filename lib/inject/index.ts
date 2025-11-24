// sort-imports-ignore

import "@api/themes";
import "@webpack/exporter";
import "@webpack/interceptor";
import "@webpack/loader";

import { registerContext } from "@api/context";
import { registerEventListener } from "@api/context/event";

const { context } = registerContext({
    name: "Inject",
    platforms: ["browser", "desktop", "webos"]
});

window.ExtendifyFragment = Symbol.for("react.fragment");
window.ExtendifyCreateElement = () => {};

registerEventListener(context, "reactLoaded", (instance) => {
    window.ExtendifyCreateElement = instance.createElement;
});
