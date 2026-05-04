import { useState } from "@api/react";
import type { StyleSheetVariable } from "@api/themes";
import { Text } from "@components/spotify";

interface ThemeVariableProps {
    variable: StyleSheetVariable;
    onValueChanged(value: string): void;
}

export default function (props: ThemeVariableProps) {
    const [colorValue, setColorValue] = useState(props.variable.value);

    return (
        <div className="ext-theme-modal-variable">
            <Text as="span" variant="bodyMediumBold">
                {props.variable.readableName}:
            </Text>
            <input
                onChange={event => {
                    const { value } = event.target;

                    setColorValue(value);
                    props.onValueChanged(value);
                }}
                type="color"
                value={colorValue}
            />
        </div>
    );
}
