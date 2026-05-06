import { useState } from "@api/react";
import { TextInput } from "@components/input";
import { Text } from "@components/spotify";

interface ThemeVariableProps {
    value: string;
    name: string;
    onValueChanged(value: string): void;
}

// TODO:
//<Colorful
//    color={colorValue}
//    disableAlpha={false}
//    onChange={(value: any) => {
//        const col = value.rgba;
//        const formatted = `#${col.r}${col.g}${col.b}${col.a}`;
//        setColorValue(formatted);
//        props.onValueChanged(formatted);
//    }}
///>

export default function (props: ThemeVariableProps) {
    const [textValue, setTextValue] = useState(props.value);
    const [colorValue, setColorValue] = useState(props.value);

    function onTextChanged(value: string) {
        if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
            setColorValue(value);
            props.onValueChanged(value);
        }
    }

    return (
        <div className="ext-theme-modal-variable">
            <Text as="span" variant="bodyMediumBold">
                {props.name}:
            </Text>
            <div className="ext-theme-modal-variable-right">
                <TextInput
                    onChange={value => {
                        setTextValue(value);
                        onTextChanged(value);
                    }}
                    value={textValue}
                />
                <div
                    className="ext-theme-modal-variable-preview"
                    key={colorValue}
                    style={{ backgroundColor: colorValue }}
                ></div>
            </div>
        </div>
    );
}
