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
                <label htmlFor={props.id} className="ext-text-input-label">
                    <Text variant="marginalBold" className="ext-text-input-label-content">
                        {props.label}
                    </Text>
                </label>
            )}
            <input
                {...props}
                type={props.type ?? "text"}
                dir={props.dir ?? "auto"}
                className="ext-text-input-input"
                onChange={(event) => props.onChange?.(event.target.value)}
            />
        </div>
    );
}
