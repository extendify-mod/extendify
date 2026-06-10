import { remoteConfig } from "@extendify/api/platform";
import { useState } from "@extendify/api/react";
import { TextInput } from "@extendify/components/input";
import type { ExperimentTypeProps } from "@extendify/components/settings/experiments/experimentTypes";
import type { NumberExperiment } from "@extendify/shared/types/spotify/experiments";

export default function (props: ExperimentTypeProps<NumberExperiment>) {
    const [state, setState] = useState(
        props.experiment.localValue ?? props.experiment.spec.defaultValue
    );

    async function onChange(value: number) {
        if (value > props.experiment.spec.upper) {
            setState(props.experiment.spec.upper);
            props.onValueChanged();
            return;
        }

        if (value < props.experiment.spec.lower) {
            setState(props.experiment.spec.lower);
            props.onValueChanged();
            return;
        }

        await remoteConfig?.setOverride(
            {
                name: props.experiment.name,
                source: props.experiment.source,
                type: props.experiment.type
            },
            value
        );

        setState(value);
        props.onValueChanged();
    }

    return (
        <TextInput
            onChange={value => onChange(Number(value))}
            placeholder={`Enter a number from ${props.experiment.spec.lower} to ${props.experiment.spec.upper}`}
            type="number"
            value={state}
        />
    );
}
