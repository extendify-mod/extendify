import { TextInputComponent } from "@components";

import { NumberExperiment } from "@utils/experiments";
import { remoteConfig, useState } from "@webpack/common";

export default (props: { experiment: NumberExperiment; onValueChanged(): void }) => {
    const { experiment } = props;

    function getDefaultValue(): number {
        const value = experiment.localValue ?? experiment.remoteValue;
        if (typeof value === "undefined") {
            return experiment.spec.defaultValue;
        }
        return value;
    }

    const [state, setState] = useState(getDefaultValue());

    async function onChange(value: number) {
        props.onValueChanged();

        if (value > experiment.spec.upper) {
            setState(experiment.spec.upper);
            return;
        } else if (value < experiment.spec.lower) {
            setState(experiment.spec.lower);
            return;
        }

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
        <TextInputComponent
            onChange={(v) => onChange(Number(v))}
            value={String(state)}
            type="number"
            placeholder={`Enter a number from ${experiment.spec.lower} to ${experiment.spec.upper}`}
        />
    );
};
