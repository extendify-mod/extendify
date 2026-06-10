import { registerContext } from "@extendify/api/context";
import { registerEventListener, removeEventListener } from "@extendify/api/context/event";
import { useEffect, useState } from "@extendify/api/react";
import { enableTheme, getEnabledTheme, removeTheme, type Theme } from "@extendify/api/themes";
import { GarbageIcon, GearIcon, ShareIcon } from "@extendify/components/icons";
import { ThemeModal } from "@extendify/components/settings/themes";
import { ButtonTertiary, Chip, Text, Toggle } from "@extendify/components/spotify";

interface Props {
    theme: Theme;
    onDeleted(): void;
    onSave(): void;
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
                onClose={() => {
                    setModalOpen(false);
                    props.onSave();
                }}
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
                        <>
                            <ButtonTertiary
                                aria-label={`Delete ${props.theme.name}`}
                                iconOnly={() => <GarbageIcon />}
                                onClick={() => {
                                    removeTheme(props.theme);
                                    props.onDeleted();
                                }}
                            />
                            <ButtonTertiary
                                aria-label={`Copy to Clipboard`}
                                iconOnly={() => <ShareIcon />}
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        btoa(JSON.stringify(props.theme))
                                    );
                                }}
                            />
                            <ButtonTertiary
                                aria-label={`Modify ${props.theme.name}`}
                                iconOnly={() => <GearIcon />}
                                onClick={() => setModalOpen(true)}
                            />
                        </>
                    )}
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
