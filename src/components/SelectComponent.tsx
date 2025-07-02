import "./select.css";

export type SelectOption = {
    value: any;
    label: string;
};

type Props = {
    id?: string;
    className?: string;
    value?: SelectOption;
    options: SelectOption[];
    onSelect?: (option: SelectOption) => void;
};

export default (props: Props) => {
    return (
        <div className={["ext-select-container", props.className].filter((v) => !!v).join(" ")}>
            <span>
                <select
                    id={props.id}
                    className="ext-select-select"
                    onChange={(e) => props.onSelect?.(props.options[e.target.selectedIndex])}
                >
                    {props.options.map((v) => (
                        <option selected={v.value === props.value?.value} value={v.value}>
                            {v.label}
                        </option>
                    ))}
                </select>
            </span>
        </div>
    );
};
