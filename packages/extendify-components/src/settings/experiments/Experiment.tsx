import { getLocalValue } from "@extendify/api/experiment";
import { remoteConfig } from "@extendify/api/platform";
import { useState } from "@extendify/api/react";
import { GarbageIcon } from "@extendify/components/icons";
import {
    ExperimentNumber,
    ExperimentSelect
} from "@extendify/components/settings/experiments/experimentTypes";
import { ButtonTertiary, LabelTooltip, Text } from "@extendify/components/spotify";
import type { AnyExperiment } from "@extendify/shared/types/spotify/experiments";

interface ExperimentProps {
    experiment: AnyExperiment;
    onValueChanged(): void;
}

export default function (props: ExperimentProps) {
    const [changed, setChanged] = useState(
        props.experiment.localValue !== props.experiment.spec.defaultValue
    );

    function onValueChanged() {
        setChanged(getLocalValue(props.experiment.name) !== props.experiment.spec.defaultValue);

        props.onValueChanged();
    }

    async function resetValue() {
        setChanged(false);

        props.onValueChanged();

        await remoteConfig?.setOverride(
            {
                name: props.experiment.name,
                source: props.experiment.source,
                type: props.experiment.type
            },
            props.experiment.spec.defaultValue
        );
    }

    return (
        <div className="ext-settings-container">
            <div className="ext-experiment-header">
                <Text as="span" semanticColor="textBase" variant="bodyMediumBold">
                    {props.experiment.name}
                </Text>
                {changed && (
                    <LabelTooltip label="Reset to default" placement="top">
                        <ButtonTertiary iconOnly={() => <GarbageIcon />} onClick={resetValue} />
                    </LabelTooltip>
                )}
            </div>
            <Text as="span" variant="bodySmall">
                {props.experiment.description}
            </Text>
            <div className="ext-experiment-config">
                {props.experiment.type === "number" ? (
                    <ExperimentNumber
                        experiment={props.experiment}
                        onValueChanged={onValueChanged}
                    />
                ) : (
                    <ExperimentSelect
                        experiment={props.experiment}
                        onValueChanged={onValueChanged}
                    />
                )}
            </div>
        </div>
    );
}
