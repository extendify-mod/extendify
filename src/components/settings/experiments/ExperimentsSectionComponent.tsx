import "../settingsSection.css";

import { ExperimentComponent } from "@components/settings/experiments";

import { useSettings } from "@api/settings";
import { AnyExperiment } from "@utils/experiments";
import { filters, waitFor } from "@webpack";
import { Text, remoteConfig } from "@webpack/common";

const InnerSection = (props: { title: string; values: AnyExperiment[] }) => {
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
                    <ExperimentComponent experiment={v} />
                ))}
            </div>
        </>
    );
};

export default (props: { searchQuery?: string }) => {
    const { searchQuery } = props;

    const all = remoteConfig._properties.filter(
        (v) =>
            !searchQuery?.length ||
            v.name.toLowerCase().includes(searchQuery) ||
            v.description.toLowerCase().includes(searchQuery)
    );
    const experiments: AnyExperiment[] = [];
    const overridden: AnyExperiment[] = [];

    const { experimentOverrides } = useSettings();
    all.forEach((v) =>
        !experimentOverrides.find((i) => i.name === v.name) ? experiments.push(v) : overridden.push(v)
    );

    return (
        <div className="ext-settings-section-layout">
            <InnerSection title="Overridden" values={overridden} />
            <InnerSection title="Experiments" values={experiments} />
        </div>
    );
};
