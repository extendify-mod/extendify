import "./select.css";

import classNames from "classnames";
import type { ComponentProps } from "react";

export interface SelectOption<T = any> {
    label: string;
    value: T;
}

type Props = Omit<ComponentProps<"select">, "value" | "onSelect"> & {
    value?: SelectOption;
    options: SelectOption[];
    onSelect?(option: SelectOption | undefined): void;
};

export default function (props: Props) {
    return (
        <div className={classNames("ext-select-container", props.className)}>
            <span>
                <select
                    className="ext-select-input"
                    id={props.id}
                    onChange={event => props.onSelect?.(props.options[event.target.selectedIndex])}
                >
                    {props.options.map(option => (
                        <option selected={option.value === props.value?.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </span>
        </div>
    );
}
