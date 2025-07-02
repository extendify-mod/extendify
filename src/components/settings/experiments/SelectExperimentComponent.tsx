import { SelectComponent, SelectOption, TextInputComponent } from "@components";

import { BooleanExperiment, EnumExperiment } from "@utils/experiments";
import { remoteConfig, useState } from "@webpack/common";

type SelectExperiment = BooleanExperiment | EnumExperiment;

export default (props: { experiment: SelectExperiment; onValueChanged(): void }) => {
    const { experiment } = props;

    const options: SelectOption[] =
        experiment.type === "boolean"
            ? [
                  { label: "ENABLED", value: true },
                  { label: "DISABLED", value: false }
              ]
            : experiment.spec.values.map((v) => ({ label: v.toUpperCase(), value: v }) as SelectOption);

    function getDefaultValue(): any {
        const value = experiment.localValue ?? (experiment as SelectExperiment).remoteValue;
        if (typeof value === "undefined") {
            return experiment.spec.defaultValue;
        }
        return value;
    }

    const [state, setState] = useState(getDefaultValue());

    async function onChange(value: any) {
        props.onValueChanged();

        setState(value);
        remoteConfig.setOverride(
            {
                source: experiment.source,
                name: experiment.name,
                type: experiment.type
            },
            value
        );
    }

    return (
        <SelectComponent
            value={options.find((v) => v.value === state)}
            options={options}
            onSelect={(v) => onChange(v.value)}
        />
    );
};
