import { React } from "@api/react";

window.ExtendifyFragment = Symbol.for("react.fragment");
window.ExtendifyCreateElement = (...args: unknown[]) => {
    if (!React) {
        // @ts-ignore
        setTimeout(() => window.ExtendifyCreateElement?.(...args), 100);
        return;
    }
    // @ts-ignore
    return (window.ExtendifyCreateElement = React.createElement)(...args);
};
