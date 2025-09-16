import { type Context, registerContext } from "@api/context";
import { exportFunction, registerPatch } from "@api/context/patch";

import type { ComponentType } from "react";

const { context, logger } = registerContext({
    name: "Topbar",
    platforms: ["desktop"]
});

const topbarElements: Map<string, ComponentType<any>> = new Map();

registerPatch(context, {
    find: '"data-testid":"top-bar-back-button"',
    replacement: {
        match: /(globalNavBarHistoryButtonsContainer\),children:)(\[.*?\])(}\))/,
        replace: "$1$exp.injectTopbarElements($2)$3"
    }
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
