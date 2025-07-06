import "./settingComponent.css";

import { TextInputComponent } from "@components";
import { ISettingElementProps } from "@components/settings/plugins";

import { textToTitle } from "@utils/text";
import { PluginOptionString } from "@utils/types";
import { React, Text } from "@webpack/common";

export default (props: ISettingElementProps<PluginOptionString>) => {
    const [state, setState] = React.useState(props.pluginSettings[props.id] ?? props.setting.default ?? null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => props.onError(error !== null), [error]);

    const onChange = (v: string) => {
        const isValid = props.setting.isValid?.call(props.definedSettings, v) ?? true;
        if (typeof isValid === "string") {
            setError(isValid);
        } else if (!isValid) {
            setError("Invalid input provided.");
        } else {
            setError(null);
        }

        setState(v);
        props.onChange(v);
    };

    return (
        <div className="ext-plugin-setting-container">
            <div className="ext-plugin-setting-metadata">
                <Text as="span" semanticColor="textBase" variant="bodyMediumBold">
                    {textToTitle(props.id)}
                </Text>
                <Text as="span" semanticColor="textSubdued" variant="bodyMedium">
                    {props.setting.description}
                </Text>
            </div>
            <TextInputComponent
                id={props.id}
                onChange={(v) => onChange(v)}
                disabled={props.setting.disabled?.call(props.definedSettings) ?? false}
                value={state}
            />
            {error && (
                <Text as="span" semanticColor="textNegative">
                    {error}
                </Text>
            )}
        </div>
    );
};
