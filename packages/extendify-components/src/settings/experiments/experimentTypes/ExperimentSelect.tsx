import { remoteConfig } from "@extendify/api/platform";
import { useState } from "@extendify/api/react";
import { Select, type SelectOption } from "@extendify/components/input";
import type { ExperimentTypeProps } from "@extendify/components/settings/experiments/experimentTypes";
import type { BooleanExperiment, EnumExperiment } from "@extendify/shared/types/spotify/experiments";

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
            : props.experiment.spec.values.map(option => ({
                  label: option.toUpperCase(),
                  value: option
              }));

    async function onChange(option: SelectOption) {
        await remoteConfig?.setOverride(
            {
                name: props.experiment.name,
                source: props.experiment.source,
                type: props.experiment.type
            },
            option.value
        );

        setState(option.value);
        props.onValueChanged();
    }

    return (
        <Select
            onSelect={onChange}
            options={options}
            value={options.find(option => option.value === state)}
        />
    );
}
