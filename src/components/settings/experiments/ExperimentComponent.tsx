import "./experiments.css";

import { NumberExperimentComponent, SelectExperimentComponent } from "@components/settings/experiments";

import { AnyExperiment } from "@utils/experiments";
import { filters, waitFor } from "@webpack";
import { ButtonTertiary, Icon, Text, TooltipWrapper, remoteConfig } from "@webpack/common";

let GarbageIcon: Icon;
waitFor(filters.byCode("M5.25 3v-.917C5.25.933"), (v) => (GarbageIcon = v));

export default (props: { experiment: AnyExperiment; onValueChanged(): void }) => {
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
                                props.onValueChanged();
                                await remoteConfig.setOverride(
                                    {
                                        name: experiment.name,
                                        source: experiment.source,
                                        type: experiment.type
                                    },
                                    experiment.spec.defaultValue
                                );
                            }}
                        />
                    </TooltipWrapper>
                )}
            </div>
            <Text variant="bodySmall">{experiment.description}</Text>
            <div className="ext-experiment-config">
                {experiment.type === "number" ? (
                    <NumberExperimentComponent experiment={experiment} onValueChanged={props.onValueChanged} />
                ) : (
                    <SelectExperimentComponent experiment={experiment} onValueChanged={props.onValueChanged} />
                )}
            </div>
        </div>
    );
};
