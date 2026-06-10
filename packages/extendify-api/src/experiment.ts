import { remoteConfig } from "@extendify/api/platform";

export function getLocalValue<T>(name: string): T | undefined {
    return remoteConfig?._properties.find(experiment => experiment.name === name)?.localValue as T;
}
