import "./textInput.css";

import { Text } from "@webpack/common";

type Props = {
    label?: string;
    id?: string;
    className?: string;
    placeholder?: string;
    maxLength?: number;
    value?: string;
    disabled?: boolean;
    type?: "text" | "number";
    onChange?: (v: string) => void;
};

export default (props: Props) => {
    return (
        <div className={["ext-text-input-container", props.className].filter((v) => !!v).join(" ")}>
            {props.label && (
                <label htmlFor={props.id} className="ext-text-input-label">
                    <Text variant="marginalBold" className="ext-text-input-label-content">
                        {props.label}
                    </Text>
                </label>
            )}
            <input
                type={props.type || "text"}
                id={props.id}
                dir="auto"
                className="ext-text-input-input"
                onChange={(e) => props.onChange?.(e.target.value)}
                placeholder={props.placeholder}
                maxLength={props.maxLength}
                value={props.value}
                disabled={props.disabled}
            />
        </div>
    );
};
