import "./experiments.css";

import { NumberExperimentComponent } from "@components/settings/experiments";

import { Settings } from "@api/settings";
import { AnyExperiment } from "@utils/experiments";
import { filters, waitFor } from "@webpack";
import { ButtonTertiary, Icon, Text, TooltipWrapper, remoteConfig } from "@webpack/common";

let GarbageIcon: Icon;
waitFor(filters.byCode("M5.25 3v-.917C5.25.933"), (v) => (GarbageIcon = v));

export default (props: { experiment: AnyExperiment }) => {
    const { experiment } = props;

    return (
        <div className="ext-settings-container">
            <div className="ext-experiment-header">
                <Text variant="bodyMediumBold" semanticColor="textBase">
                    {experiment.name}
                </Text>
                {experiment.localValue !== experiment.spec.defaultValue && (
                    <TooltipWrapper label="Reset to default" placement="top">
                        <ButtonTertiary
                            aria-label="Reset to default"
                            iconOnly={() => <GarbageIcon semanticColor="textSubdued" size="small" />}
                            onClick={async () => {
                                await remoteConfig.setOverride(
                                    {
                                        name: experiment.name,
                                        source: experiment.source,
                                        type: experiment.type
                                    },
                                    experiment.spec.defaultValue
                                );
                                delete Settings.experimentOverrides[experiment.name];
                            }}
                        />
                    </TooltipWrapper>
                )}
            </div>
            <Text variant="bodySmall">{experiment.description}</Text>
            <div className="ext-experiment-config">
                {experiment.type === "number" ? <NumberExperimentComponent experiment={experiment} /> : <></>}
            </div>
        </div>
    );
};
