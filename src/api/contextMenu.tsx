import { MenuItem, React, parseUri } from "@webpack/common";

import { ComponentType } from "react";

export enum ContextMenuType {
    ALBUM = "album",
    ARTIST = "artist",
    /** Local Files, Liked Songs (?) */
    COLLECTION = "collection",
    CHAPTER = "chapter",
    FOLDER = "folder",
    PLAYLIST = "playlist",
    EPISODE = "episode",
    SHOW = "show",
    TRACK = "track",
    USER = "user"
}

export interface ContextMenuSpec {
    specType: string;
    _parentAbsoluteLocation: {
        locations: {
            pathNodes: {
                name: string;
                identifier?: string;
                uri?: string;
            }[];
            specMode: string[];
            specVersion: string[];
        }[];
    };
    _path: {
        name: string;
        uri: string;
    }[];
}

function isUriType(spec: ContextMenuSpec, type: string): boolean {
    if (!spec?._path) {
        return false;
    }

    for (const path of spec._path) {
        if (!path.uri || !path.uri.length) {
            continue;
        }

        if (parseUri(path.uri).type === type) {
            return true;
        }
    }

    return false;
}

const factoryTypeFilters: Record<ContextMenuType, (spec: ContextMenuSpec) => boolean> = {
    [ContextMenuType.FOLDER](spec) {
        return isUriType(spec, "folder");
    },
    [ContextMenuType.PLAYLIST](spec) {
        return isUriType(spec, "playlist") || isUriType(spec, "playlist-v2");
    },
    [ContextMenuType.ALBUM](spec) {
        return isUriType(spec, "album");
    },
    [ContextMenuType.ARTIST](spec) {
        return isUriType(spec, "artist");
    },
    [ContextMenuType.SHOW](spec) {
        return isUriType(spec, "show");
    },
    [ContextMenuType.COLLECTION](spec) {
        return isUriType(spec, "collection");
    },
    [ContextMenuType.CHAPTER](spec) {
        return isUriType(spec, "chapter");
    },
    [ContextMenuType.EPISODE](spec) {
        return isUriType(spec, "episode");
    },
    [ContextMenuType.TRACK](spec) {
        return isUriType(spec, "track");
    },
    [ContextMenuType.USER](spec) {
        return isUriType(spec, "user");
    }
};

const registeredEntries: {
    [K in ContextMenuType]?: ComponentType<{ spec: ContextMenuSpec }>[];
} = {};

if (IS_DEV) {
    for (const key of Object.values(ContextMenuType)) {
        registeredEntries[key] = [
            ({ spec }) => {
                return (
                    <MenuItem divider="before" onClick={() => console.log(spec)}>
                        {key}
                    </MenuItem>
                );
            }
        ];
    }
}

function isObject(obj: any) {
    return obj && !Array.isArray(obj) && typeof obj === "object";
}

export function injectEntries(factory: any): any {
    if (!factory || !Array.isArray(factory)) {
        return factory;
    }

    for (const child of factory) {
        if (!isObject(child)) {
            continue;
        }

        if (child.$$typeof !== Symbol.for("react.element")) {
            continue;
        }

        if (!child.type || child.type === Symbol.for("react.fragment")) {
            continue;
        }

        if (!child.props || !child.props.spec) {
            continue;
        }

        const { spec }: { spec: ContextMenuSpec } = child.props;

        for (const menuType in factoryTypeFilters) {
            if (factoryTypeFilters[menuType](spec)) {
                const entries = registeredEntries[menuType];
                console.log(factory);
                for (let i = 0; i < entries.length; i++) {
                    if (factory.find((v) => isObject(v) && v.key === `${i}`)) {
                        continue;
                    }
                    const Element = entries[i];
                    factory.push(<Element key={i} spec={spec} />);
                }

                return factory;
            }
        }
    }

    return factory;
}

export function addContextMenuEntry(menuType: ContextMenuType, entry: ComponentType<{ spec: ContextMenuSpec }>) {
    if (!registeredEntries[menuType]) {
        registeredEntries[menuType] = [];
    }

    registeredEntries[menuType].push(entry);
}
