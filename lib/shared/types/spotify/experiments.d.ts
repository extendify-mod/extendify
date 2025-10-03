export interface Experiment<T, S extends ExperimentSpec<T>> {
    name: string;
    description: string;
    source: string;
    localValue?: T;
    remoteValue: T;
    spec: S;
}

export interface ExperimentSpec<T> {
    defaultValue: T;
}

export interface NumberExperimentSpec extends ExperimentSpec<number> {
    upper: number;
    lower: number;
}

export interface EnumExperimentSpec extends ExperimentSpec<string> {
    values: string[];
}

export interface BooleanExperiment extends Experiment<boolean, ExperimentSpec<boolean>> {
    type: "boolean";
}

export interface NumberExperiment extends Experiment<number, NumberExperimentSpec> {
    type: "number";
}

export interface EnumExperiment extends Experiment<string, EnumExperimentSpec> {
    type: "enum";
    values: string[];
}

export type AnyExperiment = BooleanExperiment | NumberExperiment | EnumExperiment;
