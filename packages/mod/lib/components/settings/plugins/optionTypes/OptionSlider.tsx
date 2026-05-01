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
                    className="ext-plugin-option-slider-input"
                    id={`${props.id}-input`}
                    onChange={onInputChange}
                    type="number"
                    value={getRealValue(state).toFixed(1)}
                />
                <Slider
                    className={"ext-plugin-option-slider"}
                    enableAnimation={true}
                    id={`${props.id}-slider`}
                    labelText={getRealValue(state).toFixed(0)}
                    max={1}
                    onDragEnd={onSliderChange}
                    onDragMove={onSliderChange}
                    onDragStart={onSliderChange}
                    step={0.1}
                    value={state}
                />
            </div>
        </OptionType>
    );
}
