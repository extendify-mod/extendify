import "./optionType.css";

import type { SliderContextOption } from "@api/context/settings";
import { useState } from "@api/react";
import { TextInput } from "@components/input";
import { OptionType, type OptionTypeProps } from "@components/settings/plugins/optionTypes";
import { Slider } from "@components/spotify";
import { INVALID_INPUT } from "@shared/constants";

export default function (props: OptionTypeProps<SliderContextOption>) {
    function getInitialValue(): number {
        if (!props.value) {
            return (
                (props.schema.default - props.schema.min) / (props.schema.max - props.schema.min)
            );
        }

        return props.value > 1
            ? (props.value - props.schema.min) / (props.schema.max - props.schema.min)
            : props.value;
    }

    const [state, setState] = useState(getInitialValue());
    const [error, setError] = useState<string | undefined>();

    function getRealValue(progress: number) {
        return props.schema.min + (props.schema.max - props.schema.min) * progress;
    }

    function onSliderChange(progress: number) {
        onChange(getRealValue(progress));
        setState(progress);
    }

    function onInputChange(value: string) {
        const numValue = Number(value);

        onChange(numValue);
        setState((numValue - props.schema.min) / props.schema.max);
    }

    function onChange(value: number) {
        const isValid =
            (props.schema.isValid?.(value) ?? true) &&
            value <= props.schema.max &&
            value >= props.schema.min;

        if (!isValid) {
            setError(INVALID_INPUT);
        } else {
            setError(undefined);
            props.onChange(value);
        }
    }

    return (
        <OptionType {...props} error={error}>
            <div className="ext-plugin-option-slider-container">
                <TextInput
                    id={`${props.id}-input`}
                    className="ext-plugin-option-slider-input"
                    onChange={onInputChange}
                    value={getRealValue(state).toFixed(1)}
                    type="number"
                />
                {/* <Text as="span" semanticColor="textSubdued" variant="bodySmall">
                    {getRealValue(state).toFixed(0)}
                </Text> */}
                <Slider
                    id={`${props.id}-slider`}
                    className={"ext-plugin-option-slider"}
                    value={state}
                    enableAnimation={true}
                    onDragStart={onSliderChange}
                    onDragMove={onSliderChange}
                    onDragEnd={onSliderChange}
                    labelText={getRealValue(state).toFixed(0)}
                    max={1}
                    step={0.1}
                />
            </div>
        </OptionType>
    );
}
