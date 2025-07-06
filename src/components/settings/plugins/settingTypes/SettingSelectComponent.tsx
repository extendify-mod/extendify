import "./settingComponent.css";

import { SelectComponent, SelectOption } from "@components";
import { ISettingElementProps } from "@components/settings/plugins";

import { textToTitle } from "@utils/text";
import { PluginOptionSelect } from "@utils/types";
import { React, Text } from "@webpack/common";

export default (props: ISettingElementProps<PluginOptionSelect>) => {
    const [state, setState] = React.useState(
        props.pluginSettings[props.id] ?? props.setting.options?.find((o) => o.default)?.value ?? null
    );
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => props.onError(error !== null), [error]);

    const onChange = (v: any) => {
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
            <SelectComponent
                id={props.id}
                className="ext-plugin-setting-element"
                value={props.setting.options?.find((v) => v.value === state)}
                options={props.setting.options as SelectOption[]}
                onSelect={(v) => onChange(v.value)}
            />
            {error && (
                <Text as="span" semanticColor="textNegative">
                    {error}
                </Text>
            )}
        </div>
    );
};
