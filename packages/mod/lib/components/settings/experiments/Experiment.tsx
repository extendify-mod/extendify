import "./experiment.css";

import { getLocalValue } from "@api/experiment";
import { remoteConfig } from "@api/platform";
import { useState } from "@api/react";
import { GarbageIcon } from "@components/icons";
import {
    ExperimentNumber,
    ExperimentSelect
} from "@components/settings/experiments/experimentTypes";
import { ButtonTertiary, Text, Tooltip } from "@components/spotify";
import type { AnyExperiment } from "@shared/types/spotify/experiments";

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
                    <Tooltip label="Reset to default" placement="top">
                        <ButtonTertiary iconOnly={() => <GarbageIcon />} onClick={resetValue} />
                    </Tooltip>
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
