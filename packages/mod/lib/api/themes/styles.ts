import type { ThemeBase } from "@api/themes";
import { createLogger } from "@shared/logger";

const logger = createLogger({ name: "StyleSheets" });

export interface StyleSheet {
    selector: string;
    readableName: string;
    variables: StyleSheetVariable[];
}

export interface StyleSheetVariable {
    key: string;
    readableName: string;
    value: string;
}

export interface StyleSheetOverride {
    selector: string;
    variables: Omit<StyleSheetVariable, "readableName">[];
}

function createReadableString(key: string): string {
    return key
        .split("-")
        .map(word => word[0]?.toUpperCase() + word.substring(1))
        .join(" ");
}

async function fetchStyleSheet(): Promise<string | undefined> {
    for (const url of ["xpui-snapshot.css", "xpui.css"]) {
        try {
            const res = await fetch(url);
            if (res.status !== 200) {
                continue;
            }

            return await res.text();
        } catch {}
    }

    logger.error("Failed to fetch xpui stylesheet");
}

export async function parseBaseStyleSheet(base: ThemeBase): Promise<StyleSheet[] | undefined> {
    const stylesheet = await fetchStyleSheet();
    if (!stylesheet) {
        return;
    }

    const styles: StyleSheet[] = [];

    const regex = new RegExp(
        String.raw`((?:\.encore-${base}-theme,)?\.encore-${base}-theme(?:\s+\.[\w-]+)?){([^}]+)}`,
        "g"
    );
    for (const [_, selector, variables] of stylesheet.matchAll(regex)) {
        if (!selector || !variables) {
            continue;
        }

        const parsedVariables: StyleSheet["variables"] = [];

        for (const variable of variables.split(";")) {
            if (!variable.startsWith("--")) {
                continue;
            }

            const [key, value] = variable.split(":");
            if (!key || !value) {
                continue;
            }

            parsedVariables.push({
                key,
                readableName: createReadableString(key.substring(2)),
                value
            });
        }

        styles.push({
            readableName: createReadableString((selector.split(" ")[1] ?? selector).substring(1)),
            selector,
            variables: parsedVariables
        });
    }

    return styles;
}

export function mergeWithOverrides(styles: StyleSheet[], overrides: StyleSheetOverride[]) {
    const overrideMap = new Map(overrides.map(o => [o.selector, o]));

    for (const style of styles) {
        const override = overrideMap.get(style.selector);
        if (!override) {
            continue;
        }

        const varMap = new Map(override.variables.map(v => [v.key, v]));

        for (const variable of style.variables) {
            const overriddenVar = varMap.get(variable.key);

            if (overriddenVar) {
                variable.value = overriddenVar.value;
            }
        }
    }
}

function serializeOverrides(overrides?: StyleSheetOverride[]): string {
    let content = "";

    if (!overrides?.length) {
        return content;
    }

    for (const override of overrides) {
        content += `${override.selector}{`;

        for (const variable of override.variables) {
            content += `${variable.key}:${variable.value};`;
        }
    }

    return `${content}}`;
}

export function createStyleElement(overrides: StyleSheetOverride[]): HTMLStyleElement {
    const element = document.createElement("style");
    element.textContent = serializeOverrides(overrides);
    return element;
}
