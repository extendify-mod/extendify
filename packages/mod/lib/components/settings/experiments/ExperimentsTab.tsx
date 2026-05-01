import "../extendifyPage.css";

import { getLocalValue } from "@api/experiment";
import { remoteConfig } from "@api/platform";
import { useEffect, useState } from "@api/react";
import type { ExtendifyTabProps } from "@components/settings";
import { Experiment } from "@components/settings/experiments";
import { Text } from "@components/spotify";
import type { AnyExperiment } from "@shared/types/spotify/experiments";

interface InnerSectionProps {
    title: string;
    experiments: AnyExperiment[];
    onValueChanged(experiment: AnyExperiment): void;
}

function InnerSection(props: InnerSectionProps) {
    if (props.experiments.length === 0) {
        return <></>;
    }

    return (
        <>
            <Text as="span" semanticColor="textSubdued" variant="bodyMediumBold">
                {props.title}
            </Text>
            <div className="ext-settings-grid">
                {props.experiments.map(experiment => (
                    <Experiment
                        experiment={experiment}
                        onValueChanged={() => props.onValueChanged(experiment)}
                    />
                ))}
            </div>
        </>
    );
}

export default function (props: ExtendifyTabProps) {
    const [overridden, setOverridden] = useState<AnyExperiment[]>([]);
    const [experiments, setExperiments] = useState<AnyExperiment[]>([]);

    function onOverrideChanged(experiment: AnyExperiment) {
        if (getLocalValue(experiment.name) === experiment.spec.defaultValue) {
            setOverridden(prev => prev.filter(exp => exp.name !== experiment.name));
            setExperiments(prev => [...prev, experiment]);
            return;
        }

        setOverridden(prev => [...prev, experiment]);
        setExperiments(prev => prev.filter(exp => exp.name !== experiment.name));
    }

    useEffect(() => {
        if (!remoteConfig) {
            return;
        }

        remoteConfig._properties
            .filter(
                experiment =>
                    !props.searchQuery?.length ||
                    experiment.name.toLowerCase().includes(props.searchQuery) ||
                    experiment.description.toLowerCase().includes(props.searchQuery)
            )
            .forEach(experiment => {
                const localValue = getLocalValue(experiment.name);

                if (localValue === experiment.spec.defaultValue) {
                    setExperiments(prev => [...prev, experiment]);
                } else {
                    setOverridden(prev => [...prev, experiment]);
                }
            });
    }, [remoteConfig]);

    return (
        <div className="ext-settings-section-layout">
            <InnerSection
                experiments={overridden}
                onValueChanged={onOverrideChanged}
                title="Overridden"
            />
            <InnerSection
                experiments={experiments}
                onValueChanged={onOverrideChanged}
                title="Experiments"
            />
        </div>
    );
}
