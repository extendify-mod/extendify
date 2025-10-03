import { type Context, registerContext } from "@api/context";
import { exportFunction, registerPatch } from "@api/context/patch";
import { platform } from "@api/platform";
import { React } from "@api/react";
import { Route } from "@components/spotify";

import type { ComponentType } from "react";

interface Page {
    context: Context;
    route: string;
    component: ComponentType<any>;
}

type PageDef = Omit<Page, "context">;

const { context, logger } = registerContext({
    name: "Page",
    platforms: ["desktop"]
});

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

registerPatch(context, {
    find: "React Router",
    replacement: {
        /**
         * This patch skips the check that makes sure the type is the actual Route component,
         * and since we don't pass the Route component, but instead a wrapper component,
         * this always fails, which throws an error.
         */
        match: /\i\.type!==\i/,
        replace: "false"
    }
});

exportFunction(context, function injectPages(children: any[]) {
    if (!Route.hasResolved) {
        return children;
    }

    for (const page of registeredPages) {
        const { route, component: Component } = page;
        const key = (route.startsWith("/") ? route.substring(1) : route).replaceAll("/", "-");

        children.push(<Route key={key} path={route} element={<Component />} />);
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
