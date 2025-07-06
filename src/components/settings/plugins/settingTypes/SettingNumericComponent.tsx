import "./settingComponent.css";

import { TextInputComponent } from "@components";
import { ISettingElementProps } from "@components/settings/plugins";

import { textToTitle } from "@utils/text";
import { OptionType, PluginOptionNumber } from "@utils/types";
import { React, Text } from "@webpack/common";

const MAX_SAFE_NUMBER = BigInt(Number.MAX_SAFE_INTEGER);

export default (props: ISettingElementProps<PluginOptionNumber>) => {
    const [state, setState] = React.useState(`${props.pluginSettings[props.id] ?? props.setting.default ?? 0}`);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => props.onError(error !== null), [error]);

    const serialize = (v: any) => (props.setting.type === OptionType.BIGINT ? BigInt(v) : Number(v));

    const onChange = (v: any) => {
        const isValid = props.setting.isValid?.call(props.definedSettings, v) ?? true;
        if (typeof isValid === "string") {
            setError(isValid);
        } else if (!isValid) {
            setError("Invalid input provided.");
        } else {
            setError(null);
        }

        if (props.setting.type === OptionType.NUMBER && BigInt(v) >= MAX_SAFE_NUMBER) {
            setState(`${Number.MAX_SAFE_INTEGER}`);
            props.onChange(serialize(v));
            return;
        }

        setState(v);
        props.onChange(serialize(v));
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
                className="ext-plugin-setting-element"
                onChange={(v) => onChange(v)}
                disabled={props.setting.disabled?.call(props.definedSettings) ?? false}
                value={state}
                type="number"
                placeholder="Enter a number"
            />
            {error && (
                <Text as="span" semanticColor="textNegative">
                    {error}
                </Text>
            )}
        </div>
    );
};
