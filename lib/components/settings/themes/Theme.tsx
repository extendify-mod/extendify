import "../extendifyPage.css";
import "./theme.css";

import { registerContext } from "@api/context";
import { registerEventListener, removeEventListener } from "@api/context/event";
import { useEffect, useState } from "@api/react";
import { enableTheme, getEnabledTheme, removeTheme, type Theme } from "@api/themes";
import { GarbageIcon, GearIcon } from "@components/icons";
import { ThemeModal } from "@components/settings/themes";
import { ButtonTertiary, Chip, Text, Toggle } from "@components/spotify";

interface Props {
    theme: Theme;
}

const { context } = registerContext({
    name: "ThemeComponent",
    platforms: ["browser", "desktop"]
});

export default function (props: Props) {
    const [enabled, setEnabled] = useState(getEnabledTheme()?.name === props.theme.name);
    const [modalOpen, setModalOpen] = useState(false);

    function onToggle(value: boolean) {
        if (!value) {
            return;
        }

        enableTheme(props.theme);
        setEnabled(true);
    }

    useEffect(() => {
        const listener = registerEventListener(context, "themeChanged", newTheme => {
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
        <>
            <ThemeModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                theme={props.theme}
            />
            <div className="ext-settings-container">
                <div className="ext-settings-container-header">
                    <Text
                        className="ext-settings-container-title"
                        semanticColor="textBase"
                        variant="titleSmall"
                    >
                        {props.theme.name}
                    </Text>
                    {!props.theme.builtIn && (
                        <ButtonTertiary
                            aria-label={`Delete ${props.theme.name}`}
                            iconOnly={() => <GarbageIcon />}
                            onClick={() => removeTheme(props.theme)}
                        />
                    )}
                    <ButtonTertiary
                        aria-label={`Modify ${props.theme.name}`}
                        iconOnly={() => <GearIcon />}
                        onClick={() => setModalOpen(true)}
                    />
                    <Toggle onSelected={onToggle} value={enabled} />
                </div>
                <Text
                    className="ext-settings-container-description"
                    semanticColor="textSubdued"
                    variant="bodyMedium"
                >
                    {props.theme.description}
                </Text>
                <div>
                    <Chip selected={true} selectedColorSet="invertedLight">
                        {props.theme.base}
                    </Chip>
                </div>
            </div>
        </>
    );
}
