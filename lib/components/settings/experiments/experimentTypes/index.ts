import type { AnyExperiment } from "@shared/types/spotify/experiments";

export interface ExperimentTypeProps<T extends AnyExperiment> {
    experiment: T;
    onValueChanged(): void;
}

export { default as ExperimentNumber } from "./ExperimentNumber";
export { default as ExperimentSelect } from "./ExperimentSelect";
