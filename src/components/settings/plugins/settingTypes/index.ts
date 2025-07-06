import { DefinedSettings, PluginOptionBase } from "@utils/types";

interface ISettingElementPropsBase<T> {
    setting: T;
    pluginSettings: {
        [setting: string]: any;
        enabled: boolean;
    };
    id: string;
    definedSettings?: DefinedSettings;
    onChange: (v: any) => void;
    onError: (e: boolean) => void;
}

export type ISettingElementProps<T extends PluginOptionBase> = ISettingElementPropsBase<T>;
export type ISettingCustomElementProps<T extends Omit<PluginOptionBase, "description" | "placeholder">> =
    ISettingElementPropsBase<T>;

export { default as SettingBooleanComponent } from "./SettingBooleanComponent";
export { default as SettingCustomComponent } from "./SettingCustomComponent";
export { default as SettingNumericComponent } from "./SettingNumericComponent";
export { default as SettingSelectComponent } from "./SettingSelectComponent";
export { default as SettingSliderComponent } from "./SettingSliderComponent";
export { default as SettingTextComponent } from "./SettingTextComponent";
