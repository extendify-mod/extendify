import type { NumberContextOption } from "@extendify/api/context/settings";
import { useState } from "@extendify/api/react";
import { TextInput } from "@extendify/components/input";
import { OptionType, type OptionTypeProps } from "@extendify/components/settings/plugins/optionTypes";
import { INVALID_INPUT } from "@extendify/shared/constants";

export default function (props: OptionTypeProps<NumberContextOption>) {
    const [state, setState] = useState(`${props.value ?? props.schema.default ?? 0}`);
    const [error, setError] = useState<string | undefined>();

    function onChange(value: string) {
        const isValid = props.schema.isValid?.(Number(value)) ?? true;

        if (!isValid) {
            setError(INVALID_INPUT);
        } else {
            setError(undefined);
            props.onChange(Number(value));
        }

        setState(value);
    }

    return (
        <OptionType {...props} error={error}>
            <TextInput
                className="ext-plugin-option-element"
                id={props.id}
                onChange={onChange}
                placeholder="Enter a number"
                type="number"
                value={state}
            />
        </OptionType>
    );
}
