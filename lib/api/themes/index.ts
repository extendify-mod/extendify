import { registerContext } from "@api/context";
import { registerEventListener } from "@api/context/event";
import {
    type StyleSheetOverride,
    createStyleElement,
    parseBaseStyleSheet
} from "@api/themes/styles";

export type ThemeBase = "dark" | "light";

export interface Theme {
    name: string;
    description: string;
    base: ThemeBase;
    overrides: StyleSheetOverride[];
}

const { context } = registerContext({
    name: "Themes",
    platforms: ["desktop", "browser"]
});

export function applyTheme(theme: Theme) {
    let query;
    if ((query = document.querySelector("#extendify-theme"))) {
        document.body.removeChild(query);
    }

    const element = createStyleElement(theme.overrides);
    element.id = "extendify-theme";

    document.body.appendChild(element);
}

registerEventListener(context, "platformLoaded", async () => {
    const defaults = await parseBaseStyleSheet("dark");
    if (!defaults) {
        return;
    }
    console.log(defaults);

    const selectedTheme: Theme = {
        name: "Extendify Dark",
        description: "Test theme",
        base: "dark",
        overrides: [
            {
                selector: ".encore-dark-theme .encore-base-set",
                variables: [{ key: "--text-base", value: "#000" }]
            }
        ]
    };
});
