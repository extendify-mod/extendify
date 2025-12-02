import "./textInput.css";

import { Text } from "@components/spotify";

import classNames from "classnames";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<"input">, "onChange"> & {
    label?: string;
    onChange?(value: string): void;
};

export default function (props: Props) {
    return (
        <div className={classNames(props.className, "ext-text-input-container")}>
            {props.label && (
                <label className="ext-text-input-label" htmlFor={props.id}>
                    <Text className="ext-text-input-label-content" variant="marginalBold">
                        {props.label}
                    </Text>
                </label>
            )}
            <input
                {...props}
                className="ext-text-input-input"
                dir={props.dir ?? "auto"}
                onChange={event => props.onChange?.(event.target.value)}
                type={props.type ?? "text"}
            />
        </div>
    );
}
