import { TextInputComponent } from "@components";

import { NumberExperiment } from "@utils/experiments";
import { remoteConfig, useState } from "@webpack/common";

export default (props: { experiment: NumberExperiment; onValueChanged(): void }) => {
    const { experiment } = props;

    function getDefaultValue(): number {
        const value = experiment.localValue;
        if (typeof value === "undefined") {
            return experiment.spec.defaultValue;
        }
        return value;
    }

    const [state, setState] = useState(getDefaultValue());

    async function onChange(value: number) {
        if (value > experiment.spec.upper) {
            setState(experiment.spec.upper);
            props.onValueChanged();
            return;
        } else if (value < experiment.spec.lower) {
            setState(experiment.spec.lower);
            props.onValueChanged();
            return;
        }

        setState(value);
        await remoteConfig.setOverride(
            {
                source: experiment.source,
                name: experiment.name,
                type: experiment.type
            },
            value
        );
        // Want to call this at the end because then we can check the value later
        props.onValueChanged();
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
