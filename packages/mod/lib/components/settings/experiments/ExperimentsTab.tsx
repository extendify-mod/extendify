import { getLocalValue } from "@api/experiment";
import { remoteConfig } from "@api/platform";
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
    const filtered =
        remoteConfig?._properties.filter(
            experiment =>
                !props.searchQuery?.length ||
                experiment.name.toLowerCase().includes(props.searchQuery) ||
                experiment.description.toLowerCase().includes(props.searchQuery)
        ) ?? [];

    let overridden = filtered.filter(e => getLocalValue(e.name) !== e.spec.defaultValue);
    let experiments = filtered.filter(e => getLocalValue(e.name) === e.spec.defaultValue);

    function onOverrideChanged(experiment: AnyExperiment) {
        if (getLocalValue(experiment.name) === experiment.spec.defaultValue) {
            overridden = prev => prev.filter(exp => exp.name !== experiment.name);
            experiments = prev => [...prev, experiment];
        } else {
            overridden = prev => [...prev, experiment];
            experiments = prev => prev.filter(exp => exp.name !== experiment.name);
        }
    }

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
