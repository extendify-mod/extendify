import type { SelectContextOption } from "@extendify/api/context/settings";
import { useState } from "@extendify/api/react";
import { Select } from "@extendify/components/input";
import type { SelectOption } from "@extendify/components/input/Select";
import { OptionType, type OptionTypeProps } from "@extendify/components/settings/plugins/optionTypes";
import { INVALID_INPUT } from "@extendify/shared/constants";

export default function (props: OptionTypeProps<SelectContextOption>) {
    const [state, setState] = useState(props.value ?? props.schema.default);
    const [error, setError] = useState<string | undefined>();

    function onChange(value: string) {
        const isValid =
            (props.schema.isValid?.(value) ?? true) && props.schema.options.includes(value);

        if (!isValid) {
            setError(INVALID_INPUT);
        } else {
            setError(undefined);
            props.onChange(value);
        }

        setState(value);
    }

    function createSelectOption(option: string): SelectOption {
        // TODO: this can be better obviously
        return {
            label: option,
            value: option
        };
    }

    return (
        <OptionType {...props} error={error}>
            <Select
                className="ext-plugin-option-element"
                id={props.id}
                onSelect={option => onChange(option?.value ?? props.schema.default)}
                options={props.schema.options.map(createSelectOption)}
                value={createSelectOption(
                    props.schema.options.find(option => option === state) ?? props.schema.default
                )}
            />
        </OptionType>
    );
}
