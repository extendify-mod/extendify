import "./optionType.css";

import type { AnyPluginOption } from "@api/context/plugin/settings";
import { Text } from "@components/spotify";

import type { PropsWithChildren } from "react";

export interface OptionTypeProps<T extends AnyPluginOption> {
    id: string;
    schema: T;
    value: T["default"];
    onChange(value: T["default"]): void;
}

export function OptionType<T extends AnyPluginOption>(
    props: PropsWithChildren<OptionTypeProps<T>> & {
        error?: string;
    }
) {
    return (
        <>
            <div className="ext-plugin-option-container">
                <div className="ext-plugin-option-metadata">
                    <Text as="span" semanticColor="textBase" variant="bodyMediumBold">
                        {props.id}
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
