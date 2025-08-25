import { type Context, registerContext } from "@api/context";
import { exportFunction, registerPatch } from "@api/context/patch";
import { Route } from "@components/spotify";

import { platform } from "./platform";

import type { ComponentType } from "react";

interface Page {
    context: Context;
    route: string;
    component: ComponentType<any>;
}

type PageDef = Omit<Page, "context">;

const { context, logger } = registerContext({ name: "Page" });

const registeredPages: Page[] = [];

registerPatch(context, {
    find: '"data-testid":"top-bar-back-button"',
    replacement: [
        {
            match: /(type:"locale",uri:"home"}\);return)(\[\(0,.*?\])(}\)\({isDesktop:)/,
            replace: "$1 $exp.injectPages($2)$3"
        },
        {
            // I don't remember what this is for but I think it had something to do with alignment of custom pages
            match: /(children:\[)(\(0,\i\.jsx\)\(\i,{}\),)(\(0,\i\.jsxs\)\("div",{className:"main-view-container",)/,
            replace: "$1$3"
        }
    ]
});

exportFunction(context, function injectPages(children: any[]) {
    if (!Route.hasResolved) {
        return children;
    }

    for (const page of registeredPages) {
        const { route, component: Component } = page;

        children.push(
            <Route key={route.replaceAll("/", "_")} path={route} element={<Component />} />
        );
    }

    return children;
});

export function registerPage(owner: Context, page: PageDef) {
    registeredPages.push({
        ...page,
        context: owner
    });

    logger.debug(`Registered page ${page.route} for context ${owner.name}`);
}

export function isCustomPage(route?: string) {
    if (!route) {
        route = platform?.getHistory().location.pathname;
    }

    return route ? !!registeredPages.find((page) => page.route === route) : false;
}

export function redirectTo(route: string) {
    platform?.getHistory().push(route);
}
