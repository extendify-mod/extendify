import "./optionType.css";

import type { SelectPluginOption } from "@api/context/plugin/settings";
import { useState } from "@api/react";
import { Select } from "@components/input";
import type { SelectOption } from "@components/input/Select";
import { OptionType, type OptionTypeProps } from "@components/settings/plugins/optionTypes";
import { INVALID_INPUT } from "@shared/constants";

export default function (props: OptionTypeProps<SelectPluginOption>) {
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
                id={props.id}
                className="ext-plugin-option-element"
                value={createSelectOption(
                    props.schema.options.find((option) => option === state) ?? props.schema.default
                )}
                options={props.schema.options.map(createSelectOption)}
                onSelect={(option) => onChange(option?.value ?? props.schema.default)}
            />
        </OptionType>
    );
}
