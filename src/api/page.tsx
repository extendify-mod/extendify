import { Logger } from "@utils/logger";
import { Renderable } from "@utils/types";
import { findComponentByCode } from "@webpack";
import { platform } from "@webpack/common";

const logger = new Logger("Page API");
const pages = new Map<string, Renderable>();

let Route: any;

export const _injectPages = (children: React.ReactNode[]) => {
    if (!Route) {
        Route = findComponentByCode(/^function [\w$]+\([\w$]+\)\{\(0,[\w$]+\.[\w$]+\)\(\!1\)\}$/);
    }

    for (const [path, Element] of pages) {
        children.push(
            <Route key={path.replaceAll("/", "_")} path={path} element={<Element data-custom-page={true} />} />
        );
        logger.debug(`Registered page ${path}`);
    }
    return children;
};

export const addPage = (route: string, renderable: Renderable) => pages.set(route, renderable);
export const removePage = (route: string) => pages.delete(route);
export const isCustomPage = (route: string = platform.getHistory().location.pathname) => pages.has(route);
