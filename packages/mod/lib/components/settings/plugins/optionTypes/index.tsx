import "./optionType.css";

import type { AnyContextOption } from "@api/context/settings";
import { Text } from "@components/spotify";

import type { PropsWithChildren } from "react";

export interface OptionTypeProps<T extends AnyContextOption> {
    id: string;
    schema: T;
    value: T["default"];
    onChange(value: T["default"]): void;
}

function createReadableId(id: string) {
    return (
        id[0]?.toUpperCase() +
        Array.from(id.substring(1))
            .map(c => (c === c.toUpperCase() ? ` ${c}` : c))
            .join("")
    );
}

export function OptionType<T extends AnyContextOption>(
    props: PropsWithChildren<OptionTypeProps<T>> & {
        error?: string;
    }
) {
    return (
        <>
            <div className="ext-plugin-option-container">
                <div className="ext-plugin-option-metadata">
                    <Text as="span" semanticColor="textBase" variant="bodyMediumBold">
                        {props.schema.label ?? createReadableId(props.id)}
                    </Text>
                    <Text as="span" semanticColor="textSubdued" variant="bodyMedium">
                        {props.schema.description}
                    </Text>
                </div>
                {props.children}
            </div>
            {props.error && (
                <Text as="span" semanticColor="textNegative">
                    {props.error}
                </Text>
            )}
        </>
    );
}

export { default as OptionBoolean } from "./OptionBoolean";
export { default as OptionNumber } from "./OptionNumber";
export { default as OptionSelect } from "./OptionSelect";
export { default as OptionSlider } from "./OptionSlider";
export { default as OptionString } from "./OptionString";
