import { registerContext } from "@api/context";
import { emitEvent, registerEventListener } from "@api/context/event";
import { registerPatch } from "@api/context/patch";
import { registerContextOptions } from "@api/context/settings";
import { type StyleSheetOverride, createStyleElement } from "@api/themes/styles";

export type ThemeBase = "dark" | "light";

export interface Theme {
    name: string;
    description: string;
    base: ThemeBase;
    builtIn?: boolean;
    overrides: StyleSheetOverride[];
}

const { context, logger } = registerContext({
    name: "Themes",
    platforms: ["desktop", "browser"]
});

const options = registerContextOptions(context, {
    enabledTheme: {
        type: "string",
        description: "The user's selected theme",
        default: "Spotify Dark"
    },
    savedThemes: {
        type: "string",
        description: "All of the user's saved themes",
        default: JSON.stringify([
            {
                name: "Spotify Dark",
                base: "dark",
                description: "Spotify's built-in dark theme",
                overrides: [],
                builtIn: true
            },
            {
                name: "Spotify Light",
                base: "light",
                description: "Spotify's built-in light theme",
                overrides: [],
                builtIn: true
            }
        ] as Theme[])
    }
});

function findTheme(name: string): Theme | undefined {
    return (JSON.parse(options.savedThemes) as Theme[]).find((theme) => theme.name === name);
}

export function getSavedThemes(): Theme[] {
    return JSON.parse(options.savedThemes ?? "[]") as Theme[];
}

export function getEnabledTheme(): Theme | undefined {
    return findTheme(options.enabledTheme);
}

export function saveTheme(theme: Theme) {
    if (findTheme(theme.name)) {
        removeTheme(theme);
    }

    options.savedThemes = JSON.stringify([...getSavedThemes(), theme]);
}

export function removeTheme(theme: Theme) {
    if (!findTheme(theme.name)) {
        logger.error(`Theme ${theme.name} doesn't exist`);
        return;
    }

    const themes = JSON.parse(options.savedThemes) as Theme[];
    options.savedThemes = JSON.stringify(themes.splice(themes.indexOf(theme)));
}

export function enableTheme(theme: Theme) {
    options.enabledTheme = theme.name;
    emitEvent("themeChanged", theme);

    logger.info(`Enabled theme ${theme.name}`);

    document.body.classList.remove("encore-dark-theme", "encore-light-theme");
    document.body.classList.add(`encore-${theme.base}-theme`);

    let query;
    if ((query = document.querySelector("#extendify-theme"))) {
        document.body.removeChild(query);
    }

    const element = createStyleElement(theme.overrides);
    element.id = "extendify-theme";

    document.body.appendChild(element);
}

registerEventListener(context, "platformLoaded", async () => {
    const theme = getEnabledTheme();
    if (!theme) {
        logger.warn(`Selected theme ${options.enabledTheme} not installed`);
        return;
    }

    enableTheme(theme);
});
