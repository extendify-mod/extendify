import "../settingsSection.css";

import { ExperimentComponent } from "@components/settings/experiments";

import { AnyExperiment, getLocalValue } from "@utils/experiments";
import { Text, remoteConfig, useEffect, useState } from "@webpack/common";

const InnerSection = (props: { title: string; values: AnyExperiment[]; onValueChanged(): void }) => {
    const { title, values } = props;

    if (!values.length) {
        return <></>;
    }

    return (
        <>
            <Text as="span" variant="bodyMediumBold" semanticColor="textSubdued">
                {title}
            </Text>
            <div className="ext-settings-grid">
                {values.map((v) => (
                    <ExperimentComponent experiment={v} onValueChanged={props.onValueChanged} />
                ))}
            </div>
        </>
    );
};

export default (props: { searchQuery?: string }) => {
    const { searchQuery } = props;

    const [experiments, setExperiments] = useState<AnyExperiment[]>([]);
    const [overridden, setOverridden] = useState<AnyExperiment[]>([]);

    function initializeState() {
        const all = remoteConfig._properties.filter(
            (v) =>
                !searchQuery?.length ||
                v.name.toLowerCase().includes(searchQuery) ||
                v.description.toLowerCase().includes(searchQuery)
        );

        const experiments: AnyExperiment[] = [];
        const overridden: AnyExperiment[] = [];
        all.forEach((v) => {
            const localValue = getLocalValue(v.name);
            localValue === v.spec.defaultValue ? experiments.push(v) : overridden.push(v);
        });
        setExperiments(experiments);
        setOverridden(overridden);
    }

    useEffect(() => {
        initializeState();
    }, []);

    return (
        <div className="ext-settings-section-layout">
            <InnerSection title="Overridden" values={overridden} onValueChanged={initializeState} />
            <InnerSection title="Experiments" values={experiments} onValueChanged={initializeState} />
        </div>
    );
};
