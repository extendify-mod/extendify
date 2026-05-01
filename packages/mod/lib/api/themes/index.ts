import { registerContext } from "@api/context";
import { emitEvent, registerEventListener } from "@api/context/event";
import { registerContextOptions } from "@api/context/settings";
import { createStyleElement, type StyleSheetOverride } from "@api/themes/styles";

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
        default: "Spotify Dark",
        description: "The user's selected theme",
        type: "string"
    },
    savedThemes: {
        default: JSON.stringify([
            {
                base: "dark",
                builtIn: true,
                description: "Spotify's built-in dark theme",
                name: "Spotify Dark",
                overrides: []
            },
            {
                base: "light",
                builtIn: true,
                description: "Spotify's built-in light theme",
                name: "Spotify Light",
                overrides: []
            }
        ] as Theme[]),
        description: "All of the user's saved themes",
        type: "string"
    }
});

export function findTheme(name: string): Theme | undefined {
    return (JSON.parse(options.savedThemes) as Theme[]).find(theme => theme.name === name);
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
    themes.splice(themes.indexOf(theme));
    options.savedThemes = JSON.stringify(themes);
}

export function enableTheme(theme: Theme) {
    options.enabledTheme = theme.name;
    emitEvent("themeChanged", theme);

    logger.info(`Enabled theme ${theme.name}`);

    document.body.classList.remove("encore-dark-theme", "encore-light-theme");
    document.body.classList.add(`encore-${theme.base}-theme`);

    const query = document.querySelector("#extendify-theme");
    query && document.body.removeChild(query);

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
