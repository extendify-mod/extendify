import "./optionType.css";

import type { StringContextOption } from "@api/context/settings";
import { useState } from "@api/react";
import { TextInput } from "@components/input";
import { OptionType, type OptionTypeProps } from "@components/settings/plugins/optionTypes";
import { INVALID_INPUT } from "@shared/constants";

export default function (props: OptionTypeProps<StringContextOption>) {
    const [state, setState] = useState(props.value ?? props.schema.default ?? "");
    const [error, setError] = useState<string | undefined>();

    function onChange(value: string) {
        const isValid = props.schema.isValid?.(value) ?? true;

        if (!isValid) {
            setError(INVALID_INPUT);
        } else {
            setError(undefined);
            props.onChange(value);
        }

        setState(value);
    }

    return (
        <OptionType {...props} error={error}>
            <TextInput
                id={props.id}
                className="ext-plugin-option-element"
                onChange={onChange}
                value={state}
            />
        </OptionType>
    );
}
