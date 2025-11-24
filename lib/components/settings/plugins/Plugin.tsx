import "../extendifyPage.css";
import "./plugin.css";

import { contextHasPatches } from "@api/context/patch";
import type { Plugin } from "@api/context/plugin";
import { contextHasOptions, isPluginEnabled, setPluginEnabled } from "@api/context/settings";
import { useState } from "@api/react";
import { GearIcon, InfoIcon } from "@components/icons";
import { PluginModal } from "@components/settings/plugins";
import { ButtonTertiary, Text, Toggle } from "@components/spotify";

interface Props {
    plugin: Plugin;
    onRestartNeeded?(name: string): void;
}

export default function (props: Props) {
    const [enabled, setEnabled] = useState(isPluginEnabled(props.plugin));
    const [modalOpened, setModalOpened] = useState(false);

    return (
        <div className="ext-settings-container">
            <PluginModal
                plugin={props.plugin}
                isOpen={modalOpened}
                onClose={() => setModalOpened(false)}
                onRestartNeeded={() => props.onRestartNeeded?.(props.plugin.name)}
            />
            <div className="ext-settings-container-header">
                <Text
                    className="ext-settings-container-title"
                    semanticColor="textBase"
                    variant="titleSmall"
                >
                    {props.plugin.name}
                </Text>
                <ButtonTertiary
                    className="ext-plugin-header-icon"
                    aria-label={`Configure ${props.plugin.name}`}
                    iconOnly={() => (contextHasOptions(props.plugin) ? <GearIcon /> : <InfoIcon />)}
                    onClick={() => setModalOpened(true)}
                />
                <Toggle
                    id={`toggle-${props.plugin.name}`}
                    value={enabled}
                    disabled={props.plugin.required}
                    onSelected={(value) => {
                        setEnabled(value);
                        setPluginEnabled(props.plugin, value);

                        if (contextHasPatches(props.plugin.name)) {
                            props.onRestartNeeded?.(props.plugin.name);
                        }
                    }}
                />
            </div>
            <Text
                semanticColor="textSubdued"
                variant="bodyMedium"
                className="ext-settings-container-description"
            >
                {props.plugin.description}
            </Text>
        </div>
    );
}
