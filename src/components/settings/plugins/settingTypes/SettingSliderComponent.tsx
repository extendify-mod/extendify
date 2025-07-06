import "./settingComponent.css";

import { ISettingElementProps } from "@components/settings/plugins";

import { textToTitle } from "@utils/text";
import { PluginOptionSlider } from "@utils/types";
import { React, Slider, Text } from "@webpack/common";

export default (props: ISettingElementProps<PluginOptionSlider>) => {
    const getDefaultValue = (): number => {
        const storeValue = props.pluginSettings[props.id];
        if (storeValue) {
            if (storeValue > 1) {
                return (storeValue - props.setting.minValue) / props.setting.maxValue;
            }
            return storeValue;
        } else if (props.setting.default) {
            return (props.setting.default - props.setting.minValue) / props.setting.maxValue;
        }
        return 0;
    };

    const [state, setState] = React.useState(getDefaultValue());
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => props.onError(error !== null), [error]);

    const getRealValue = (v: number) => {
        return v * props.setting.maxValue + props.setting.minValue;
    };

    const onChange = (v: number) => {
        const realValue = getRealValue(v);

        const isValid = props.setting.isValid?.call(props.definedSettings, realValue) ?? true;
        if (typeof isValid === "string") {
            setError(isValid);
        } else if (!isValid) {
            setError("Invalid input provided.");
        } else {
            setError(null);
        }

        setState(v);
        props.onChange(realValue);
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
            <div className="ext-plugin-slider-container">
                <Text as="span" semanticColor="textSubdued" variant="bodySmall">
                    {getRealValue(state).toFixed(0)}
                </Text>
                <Slider
                    value={state}
                    enableAnimation={true}
                    onDragStart={(v: number) => onChange(v)}
                    onDragMove={(v: number) => onChange(v)}
                    onDragEnd={(v: number) => onChange(v)}
                    labelText={getRealValue(state).toString()}
                    key={props.id}
                    max={1}
                    step={0.1}
                    isInteractive={true}
                />
            </div>
            {error && (
                <Text as="span" semanticColor="textNegative">
                    {error}
                </Text>
            )}
        </div>
    );
};
