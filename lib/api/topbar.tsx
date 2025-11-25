import { type Context, registerContext } from "@api/context";
import { exportFunction, registerPatch } from "@api/context/patch";

import type { ComponentType } from "react";

const { context, logger } = registerContext({
    name: "Topbar",
    platforms: ["desktop", "browser"]
});

const topbarElements: Map<string, ComponentType<any>> = new Map();

registerPatch(context, {
    find: "isGlobalNavDraggable",
    replacement: {
        match: /(,children:)(\[\(0,\i\.\i\)\(\i\.\i\,{label:\i\.\i\.get\("navbar.go-back"\),.*?}\)}\)])/,
        replace: "$1$exp.injectTopbarElements($2)"
    }
});

registerPatch(context, {
    find: "isGlobalNavDraggable",
    replacement: {
        // Enables the desktop topbar for web versions
        match: /({isWeb:\i,isPWA:\i,isDesktop:\i})=.*?\(\)/,
        replace: "$1={isWeb:false,isPWA:false,isDesktop:true}"
    },
    platforms: ["browser"]
});

exportFunction(context, function injectTopbarElements(children: any[]) {
    for (const [_, Element] of topbarElements) {
        children.push(<Element />);
    }

    return children;
});

export function registerTopbarElement(owner: Context, element: ComponentType<any>) {
    if (topbarElements.has(owner.name)) {
        logger.error(`Context ${owner.name} already has a topbar element registered`);
        return;
    }

    topbarElements.set(owner.name, element);

    logger.debug(`Registered topbar element for ${owner.name}`);
}
