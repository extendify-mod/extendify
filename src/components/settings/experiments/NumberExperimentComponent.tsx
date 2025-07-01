import { Settings } from "@api/settings";
import { NumberExperiment } from "@utils/experiments";
import { Slider, useState } from "@webpack/common";

export default (props: { experiment: NumberExperiment }) => {
    const {
        experiment,
        experiment: { spec }
    } = props;

    function getDefaultValue(): number {
        const value = experiment.localValue ?? experiment.remoteValue;
        if (value) {
            return (value - spec.lower) / spec.upper;
        } else if (spec.defaultValue) {
            return (spec.defaultValue - spec.lower) / spec.upper;
        }
        return 0;
    }

    const [progress, setProgress] = useState(getDefaultValue());

    function getNumberValue(progress: number): number {
        if (experiment.type !== "number") {
            return 0;
        }
        return progress * experiment.spec.upper + experiment.spec.lower;
    }

    async function onChange(progress: number) {
        setProgress(progress);
        setValue(getNumberValue(progress));
    }

    function setValue(value: number) {
        // remoteConfig.setOverride(
        //     {
        //         source: experiment.source,
        //         name: experiment.name,
        //         type: experiment.type
        //     },
        //     value
        // );
        Settings.experimentOverrides[experiment.name] = value;
        console.log(value);
    }

    return (
        <Slider
            value={progress}
            enableAnimation={true}
            onDragStart={(v: number) => onChange(v)}
            onDragMove={(v: number) => onChange(v)}
            onDragEnd={(v: number) => onChange(v)}
            labelText={getNumberValue(progress).toString()}
            min={0}
            max={1}
            step={0.1}
            isInteractive={true}
        />
    );
};
