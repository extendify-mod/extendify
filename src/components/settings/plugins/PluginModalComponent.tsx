import "./pluginModal.css";

import { ModalComponent, ModalFooterComponent } from "@components";
import {
    ISettingCustomElementProps,
    ISettingElementProps,
    SettingBooleanComponent,
    SettingCustomComponent,
    SettingNumericComponent,
    SettingSelectComponent,
    SettingSliderComponent,
    SettingTextComponent
} from "@components/settings";

import { useSettings } from "@api/settings";
import { OptionType, Plugin } from "@utils/types";
import { Link, React, Text, TooltipWrapper } from "@webpack/common";

import { ComponentType } from "react";

type Props = {
    isOpen?: boolean;
    plugin: Plugin;
    onClose?: () => void;
    onRestartNeeded?: () => void;
};

const isObjectEmpty = (obj: object): boolean => {
    for (const k in obj) {
        if (Object.hasOwn(obj, k)) {
            return false;
        }
    }
    return true;
};

export default (props: Props) => {
    const pluginSettings = useSettings().plugins[props.plugin.name];
    const [tempSettings, setTempSettings] = React.useState<Record<string, any>>({});
    const [errors, setErrors] = React.useState<Record<string, boolean>>({});
    const [saveError, setSaveError] = React.useState<string | null>(null);
    const hasSettings = pluginSettings && props.plugin.options && !isObjectEmpty(props.plugin.options);

    const Components: Record<OptionType, ComponentType<ISettingElementProps<any> | ISettingCustomElementProps<any>>> = {
        [OptionType.STRING]: SettingTextComponent,
        [OptionType.NUMBER]: SettingNumericComponent,
        [OptionType.BIGINT]: SettingNumericComponent,
        [OptionType.BOOLEAN]: SettingBooleanComponent,
        [OptionType.SELECT]: SettingSelectComponent,
        [OptionType.SLIDER]: SettingSliderComponent,
        [OptionType.COMPONENT]: SettingCustomComponent,
        [OptionType.CUSTOM]: () => null
    };

    const saveAndClose = async () => {
        if (!props.plugin.options) {
            props.onClose?.();
            return;
        }

        if (props.plugin.beforeSave) {
            const result = await Promise.resolve(props.plugin.beforeSave(tempSettings));
            if (result !== true) {
                setSaveError(result);
                return;
            }
        }

        let restartNeeded = false;
        for (const [key, value] of Object.entries(tempSettings)) {
            const option = props.plugin.options[key];
            pluginSettings[key] = value;

            if (option.type === OptionType.CUSTOM) {
                continue;
            } else if (option?.restartNeeded) {
                restartNeeded = true;
            }
        }
        restartNeeded && props.onRestartNeeded?.();

        props.onClose?.();
    };

    return (
        <ModalComponent
            isOpen={props.isOpen}
            onClose={() => props.onClose?.()}
            animationMs={100}
            title={props.plugin.name}
        >
            <div className="ext-plugin-modal-description">
                <Text as="span" variant="bodyMedium" semanticColor="textSubdued">
                    {props.plugin.description}
                </Text>
            </div>
            <Text as="span" variant="titleSmall" semanticColor="textBase">
                Authors
            </Text>
            <div className="ext-plugin-modal-authors">
                {props.plugin.authors.map((v) => (
                    <TooltipWrapper label={`${v.name} (${v.github})`} placement="bottom">
                        <Link to={`https://github.com/${v.github}`}>
                            <img className="ext-plugin-author-pfp" src={`https://github.com/${v.github}.png`} />
                        </Link>
                    </TooltipWrapper>
                ))}
            </div>
            <Text as="span" variant="titleSmall" semanticColor="textBase">
                Settings
            </Text>
            <div className="ext-plugin-modal-settings">
                {hasSettings ? (
                    Object.entries(props.plugin.options!).map(([key, setting]) => {
                        if (setting.type === OptionType.CUSTOM || setting.hidden) {
                            return null;
                        }
                        const Component = Components[setting.type];
                        return (
                            <Component
                                id={key}
                                key={key}
                                setting={setting}
                                onChange={(v) =>
                                    setTempSettings((obj) => ({
                                        ...obj,
                                        [key]: v
                                    }))
                                }
                                onError={(e) =>
                                    setErrors((obj) => ({
                                        ...obj,
                                        [key]: e
                                    }))
                                }
                                pluginSettings={pluginSettings}
                                definedSettings={props.plugin.settings}
                            />
                        );
                    })
                ) : (
                    <Text as="span" variant="bodyMedium" semanticColor="textSubdued">
                        This plugin has no settings.
                    </Text>
                )}
            </div>
            <ModalFooterComponent onConfirm={() => saveAndClose()} onCancel={() => props.onClose?.()} />
        </ModalComponent>
    );
};
