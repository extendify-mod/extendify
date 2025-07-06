import { ISettingCustomElementProps } from "@components/settings/plugins";

import { PluginOptionComponent } from "@utils/types";

export default (props: ISettingCustomElementProps<PluginOptionComponent>) => {
    return props.setting.component({
        setValue: props.onChange,
        setError: props.onError,
        setting: props.setting
    });
};
