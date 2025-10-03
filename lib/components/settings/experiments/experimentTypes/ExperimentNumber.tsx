import { remoteConfig } from "@api/platform";
import { useState } from "@api/react";
import { TextInput } from "@components/input";
import type { ExperimentTypeProps } from "@components/settings/experiments/experimentTypes";
import type { NumberExperiment } from "@shared/types/spotify/experiments";

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
                source: props.experiment.source,
                name: props.experiment.name,
                type: props.experiment.type
            },
            value
        );

        setState(value);
        props.onValueChanged();
    }

    return (
        <TextInput
            onChange={(value) => onChange(Number(value))}
            value={state}
            type="number"
            placeholder={`Enter a number from ${props.experiment.spec.lower} to ${props.experiment.spec.upper}`}
        />
    );
}
