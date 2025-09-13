import type { AnyPluginOption } from "@api/context/plugin/settings";

export interface OptionTypeProps<T extends AnyPluginOption> {
    id: string;
    schema: T;
    value: T["default"];
}
