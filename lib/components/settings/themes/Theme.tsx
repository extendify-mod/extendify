import "../extendifyPage.css";
import "./theme.css";

import { registerContext } from "@api/context";
import { registerEventListener, removeEventListener } from "@api/context/event";
import { useEffect, useState } from "@api/react";
import { type Theme, enableTheme, getEnabledTheme } from "@api/themes";
import { Chip, Text, Toggle } from "@components/spotify";

interface Props {
    theme: Theme;
}

const { context, logger } = registerContext({
    name: "ThemeComponent",
    platforms: ["browser", "desktop"]
});

export default function (props: Props) {
    const [enabled, setEnabled] = useState(getEnabledTheme()?.name === props.theme.name);

    function onToggle(value: boolean) {
        if (!value) {
            return;
        }

        enableTheme(props.theme);
        setEnabled(true);
    }

    useEffect(() => {
        const listener = registerEventListener(context, "themeChanged", (newTheme) => {
            if (!enabled) {
                return;
            }

            setEnabled(newTheme.name === props.theme.name);
        });

        return () => {
            removeEventListener(context, listener);
        };
    });

    return (
        <div className="ext-settings-container">
            <div className="ext-settings-container-header">
                <Text
                    className="ext-settings-container-title"
                    semanticColor="textBase"
                    variant="titleSmall"
                >
                    {props.theme.name}
                </Text>
                <Toggle value={enabled} onSelected={onToggle} />
            </div>
            <Text
                semanticColor="textSubdued"
                variant="bodyMedium"
                className="ext-settings-container-description"
            >
                {props.theme.description}
            </Text>
            <div>
                <Chip selected={true} selectedColorSet="invertedLight">
                    {props.theme.base}
                </Chip>
            </div>
        </div>
    );
}
