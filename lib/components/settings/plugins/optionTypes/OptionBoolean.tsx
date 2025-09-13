import "./optionType.css";

import type { BooleanPluginOption } from "@api/context/plugin/settings";
import { useState } from "@api/react";
import type { OptionTypeProps } from "@components/settings/plugins/optionTypes";
import { Text, Toggle } from "@components/spotify";

export default function (props: OptionTypeProps<BooleanPluginOption>) {
    const [state, setState] = useState(props.value ?? props.schema.default ?? false);
    const [error, setError] = useState<string | undefined>();

    function onChange(value: boolean) {
        const isValid = props.schema.isValid?.(value) ?? true;

        if (!isValid) {
            setError("Invalid input provided");
        } else {
            setError(undefined);
        }

        setState(value);
    }

    return (
        <div className="ext-plugin-setting-container">
            <div className="ext-plugin-setting-metadata">
                <Text as="span" semanticColor="textBase" variant="bodyMediumBold">
                    {props.id}
                </Text>
                <Text as="span" semanticColor="textSubdued" variant="bodyMedium">
                    {props.schema.description}
                </Text>
            </div>
            <Toggle id={props.id} onSelected={onChange} value={state} />
            {error && (
                <Text as="span" semanticColor="textNegative">
                    {error}
                </Text>
            )}
        </div>
    );
}
