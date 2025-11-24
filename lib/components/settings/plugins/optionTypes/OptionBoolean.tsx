import "./optionType.css";

import type { BooleanContextOption } from "@api/context/settings";
import { useState } from "@api/react";
import { OptionType, type OptionTypeProps } from "@components/settings/plugins/optionTypes";
import { Toggle } from "@components/spotify";
import { INVALID_INPUT } from "@shared/constants";

export default function (props: OptionTypeProps<BooleanContextOption>) {
    const [state, setState] = useState(props.value ?? props.schema.default ?? false);
    const [error, setError] = useState<string | undefined>();

    function onChange(value: boolean) {
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
            <Toggle id={props.id} onSelected={onChange} value={state} />
        </OptionType>
    );
}
