import "./plugins.css";

import { CogIcon, InfoIcon } from "@components/icons";
import { PluginModalComponent } from "@components/settings/plugins";

import { Plugin } from "@utils/types";
import { ButtonTertiary, React, Text, getToggleComponent } from "@webpack/common";

import { setPluginEnabled } from "plugins";

type Props = {
    plugin: Plugin;
    onRestartNeeded: (name: string) => void;
};

export default (props: Props) => {
    const [enabled, setEnabled] = React.useState(Extendify.Plugins.isPluginEnabled(props.plugin.name));
    const [modalOpened, setModalOpened] = React.useState(false);

    const Toggle = getToggleComponent();

    return (
        <div className="ext-plugin">
            <PluginModalComponent
                onRestartNeeded={() => props.onRestartNeeded(props.plugin.name)}
                isOpen={modalOpened}
                onClose={() => setModalOpened(false)}
                plugin={props.plugin}
            />
            <div className="ext-plugin-header">
                <Text semanticColor="textBase" variant="titleSmall" className="ext-plugin-header-name">
                    {props.plugin.name}
                </Text>
                <ButtonTertiary
                    className="ext-plugin-header-icon"
                    aria-label={`Configure ${props.plugin.name}`}
                    iconOnly={() => (props.plugin.settings || props.plugin.options ? <CogIcon /> : <InfoIcon />)}
                    onClick={(_: any) => setModalOpened(true)}
                />
                <Toggle
                    id={`toggle-${props.plugin.name}`}
                    value={enabled}
                    disabled={props.plugin.required || props.plugin.isDependency}
                    onSelected={(value) => {
                        setEnabled(value);
                        setPluginEnabled(props.plugin, value, props.onRestartNeeded);
                    }}
                />
            </div>
            <Text semanticColor="textSubdued" variant="bodyMedium" className="ext-plugin-description">
                {props.plugin.description}
            </Text>
        </div>
    );
};
