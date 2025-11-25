import { remoteConfig } from "@api/platform";
import { useState } from "@api/react";
import { Select, type SelectOption } from "@components/input";
import type { ExperimentTypeProps } from "@components/settings/experiments/experimentTypes";
import type { BooleanExperiment, EnumExperiment } from "@shared/types/spotify/experiments";

const booleanSelectOpts = [
    { label: "ENABLED", value: true },
    { label: "DISABLED", value: false }
];

export default function (props: ExperimentTypeProps<EnumExperiment | BooleanExperiment>) {
    const [state, setState] = useState(
        props.experiment.localValue ?? props.experiment.spec.defaultValue
    );

    const options: SelectOption[] =
        props.experiment.type === "boolean"
            ? booleanSelectOpts
            : props.experiment.spec.values.map((option) => ({
                  label: option.toUpperCase(),
                  value: option
              }));

    async function onChange(option: SelectOption) {
        await remoteConfig?.setOverride(
            {
                source: props.experiment.source,
                name: props.experiment.name,
                type: props.experiment.type
            },
            option.value
        );

        setState(option.value);
        props.onValueChanged();
    }

    return (
        <Select
            value={options.find((option) => option.value === state)}
            options={options}
            onSelect={onChange}
        />
    );
}
