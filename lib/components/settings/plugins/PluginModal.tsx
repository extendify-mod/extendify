import "./plugin.css";
import "./pluginModal.css";

import type { Plugin } from "@api/context/plugin";
import type { ContextOptionType } from "@api/context/settings";
import { contextOptions, settingsValues } from "@api/registry";
import { Modal, ModalFooter } from "@components/modal";
import {
    OptionBoolean,
    OptionNumber,
    OptionSelect,
    OptionSlider,
    OptionString,
    type OptionTypeProps
} from "@components/settings/plugins/optionTypes";
import { Link, Text, Tooltip } from "@components/spotify";

import type { ComponentType } from "react";

interface Props {
    plugin: Plugin;
    isOpen: boolean;
    onClose(): void;
    onRestartNeeded(): void;
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
            id={`modal-${props.plugin.name}`}
            isOpen={props.isOpen}
            onClose={props.onClose}
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
                {props.plugin.authors.map((author) => (
                    <Tooltip label={author} placement="bottom">
                        <Link to={`https://github.com/${author}`}>
                            <img
                                src={`https://github.com/${author}.png`}
                                className="ext-plugin-author-pfp"
                            />
                        </Link>
                    </Tooltip>
                ))}
            </div>

            <Text as="span" variant="titleSmall" semanticColor="textBase">
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
                                schema={option}
                                onChange={(value) => {
                                    if (!settingsValues || !settingsValues.has(props.plugin.name)) {
                                        return;
                                    }

                                    settingsValues.get(props.plugin.name)![key] = value;

                                    if (option.restartNeeded) {
                                        props.onRestartNeeded();
                                    }
                                }}
                                value={
                                    settingsValues.get(props.plugin.name)?.[key] ?? option.default
                                }
                            />
                        );
                    })
                ) : (
                    <Text as="span" variant="bodyMedium" semanticColor="textSubdued">
                        This plugin has no settings.
                    </Text>
                )}
            </div>

            <ModalFooter onConfirm={props.onClose} onCancel={props.onClose} />
        </Modal>
    );
}
