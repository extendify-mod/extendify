import type { Plugin } from "@extendify/api/context/plugin";
import type { ContextOptionType } from "@extendify/api/context/settings";
import { isPluginEnabled } from "@extendify/api/context/settings";
import { contextOptions, settingsValues } from "@extendify/api/registry";
import { Modal, ModalFooter } from "@extendify/components/modal";
import {
    OptionBoolean,
    OptionNumber,
    OptionSelect,
    OptionSlider,
    OptionString,
    type OptionTypeProps
} from "@extendify/components/settings/plugins/optionTypes";
import { LabelTooltip, Link, Text } from "@extendify/components/spotify";

import type { ComponentType } from "react";

interface Props {
    plugin: Plugin;
    isOpen: boolean;
    onClose(): void;
    onRestartNeeded(enabled: boolean): void;
}

const componentMap: Record<ContextOptionType, ComponentType<OptionTypeProps<any>>> = {
    boolean: OptionBoolean,
    number: OptionNumber,
    select: OptionSelect,
    slider: OptionSlider,
    string: OptionString
};

export default function (props: Props) {
    const options = contextOptions.get(props.plugin.name);

    return (
        <Modal
            animationMs={100}
            id={`modal-${props.plugin.name}`}
            isOpen={props.isOpen}
            onClose={props.onClose}
            title={props.plugin.name}
        >
            <div className="ext-plugin-modal-description">
                <Text as="span" semanticColor="textSubdued" variant="bodyMedium">
                    {props.plugin.description}
                </Text>
            </div>

            <Text as="span" semanticColor="textBase" variant="titleSmall">
                Authors
            </Text>
            <div className="ext-plugin-modal-authors">
                {props.plugin.authors.map(author => (
                    <LabelTooltip label={author} placement="bottom">
                        <Link to={`https://github.com/${author}`}>
                            <img
                                alt={author}
                                className="ext-plugin-author-pfp"
                                src={`https://github.com/${author}.png`}
                            />
                        </Link>
                    </LabelTooltip>
                ))}
            </div>

            <Text as="span" semanticColor="textBase" variant="titleSmall">
                Settings
            </Text>
            <div className="ext-plugin-modal-settings">
                {options ? (
                    Object.entries(options).map(([key, option]) => {
                        if (option.hidden) {
                            return <></>;
                        }

                        const Component = componentMap[option.type];
                        return (
                            <Component
                                id={key}
                                key={key}
                                onChange={value => {
                                    if (!settingsValues?.has(props.plugin.name)) {
                                        return;
                                    }

                                    const values = settingsValues.get(props.plugin.name);
                                    if (!values) {
                                        return;
                                    }
                                    values[key] = value;

                                    if (option.restartNeeded) {
                                        props.onRestartNeeded(isPluginEnabled(props.plugin));
                                    }
                                }}
                                schema={option}
                                value={
                                    settingsValues.get(props.plugin.name)?.[key] ?? option.default
                                }
                            />
                        );
                    })
                ) : (
                    <Text as="span" semanticColor="textSubdued" variant="bodyMedium">
                        This plugin has no settings.
                    </Text>
                )}
            </div>

            <ModalFooter onCancel={props.onClose} onConfirm={props.onClose} />
        </Modal>
    );
}
