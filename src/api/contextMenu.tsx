import { Renderable } from "@utils/types";
import { React, parseUri } from "@webpack/common";

import { ComponentType } from "react";

interface MenuFactory {
    menu: { props: any };
    children: Renderable[] | Renderable;
}

const enum MenuFactoryType {
    FOLDER
}

function hasKeys(props: any, keys: string[]): boolean {
    for (const key of keys) {
        if (!Object.keys(props).includes(key)) {
            return false;
        }
    }
    return true;
}

function isUriType(props: any, type: string): boolean {
    if (!props.uri) {
        return false;
    }
    return parseUri(props.uri).type === type;
}

const factoryTypeFilters: Record<MenuFactoryType, (props: any) => boolean> = {
    [MenuFactoryType.FOLDER](props) {
        if (!props.spec?._path || !props.divider) {
            return false;
        }

        for (const path of props.spec._path) {
            if (isUriType(path, "folder")) {
                return true;
            }
        }

        return false;
    }
};

const registeredEntries: Record<MenuFactoryType, ComponentType<any>[]> = {
    [MenuFactoryType.FOLDER]: [
        (props: any) => {
            console.log(props);
            return <p>TESTTEST</p>;
        }
    ]
};

export function injectEntries(factory: any): any {
    if (!factory || typeof factory !== "object") {
        return null;
    }

    checkComponent(factory);

    function checkComponent(component: any, parent?: any) {
        if (!component || typeof component !== "object") {
            return;
        }

        if (Array.isArray(component)) {
            iterateComponents(component, parent);
            return;
        }

        if (parent) {
            for (const key in factoryTypeFilters) {
                if (factoryTypeFilters[key](component.props)) {
                    parent.props.children = parent.props.children.concat(
                        registeredEntries[key].map((Entry: any) => <Entry {...component.props} />)
                    );

                    break;
                }
            }
        }

        if (component.props.children?.length) {
            iterateComponents(component.props.children, component);
        }
    }

    function iterateComponents(components: any[], parent: any) {
        for (const component of components) {
            checkComponent(component, parent);
        }
    }

    return React.cloneElement(factory, factory.props, factory.props.children);
}

export function registerContextMenuEntry(type: MenuFactoryType, entry: Renderable) {
    registeredEntries[type].push(entry);
}
