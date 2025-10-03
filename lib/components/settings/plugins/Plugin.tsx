import "../extendifyPage.css";
import "./plugin.css";

import { contextHasPatches } from "@api/context/patch";
import type { Plugin } from "@api/context/plugin";
import { isPluginEnabled, pluginHasOptions, setPluginEnabled } from "@api/context/plugin/settings";
import { useState } from "@api/react";
import { GearIcon, InfoIcon } from "@components/icons";
import { PluginModal } from "@components/settings/plugins";
import { TertiaryButton, Text, Toggle } from "@components/spotify";

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
            <div className="ext-plugin-header">
                <Text
                    className="ext-plugin-header-name"
                    semanticColor="textBase"
                    variant="titleSmall"
                >
                    {props.plugin.name}
                </Text>
                <TertiaryButton
                    className="ext-plugin-header-icon"
                    aria-label={`Configure ${props.plugin.name}`}
                    iconOnly={() => (pluginHasOptions(props.plugin) ? <GearIcon /> : <InfoIcon />)}
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
                className="ext-plugin-description"
            >
                {props.plugin.description}
            </Text>
        </div>
    );
}
