import "./themeModal.css";

import { useEffect, useState } from "@api/react";
import { getSavedThemes, type Theme, type ThemeBase } from "@api/themes";
import { parseBaseStyleSheet, type StyleSheet } from "@api/themes/styles";
import { Select, type SelectOption, TextInput } from "@components/input";
import { Modal, ModalFooter } from "@components/modal";
import { Text } from "@components/spotify";

interface Props {
    theme: Theme;
    isOpen: boolean;
    onClose(): void;
}

const themeBaseOptions: SelectOption<ThemeBase>[] = [
    { label: "Dark", value: "dark" },
    { label: "Light", value: "light" }
];

export default function (props: Props) {
    const [name, setName] = useState(props.theme.name);
    const [themeBase, setThemeBase] = useState<ThemeBase>(props.theme.base);
    const [validInput, setValidInput] = useState(false);
    const [styles, setStyles] = useState<StyleSheet[]>();
    const [selectedStyle, setSelectedStyle] = useState<StyleSheet>();
    const [stylesSelectOpts, setStylesSelectOpts] = useState<SelectOption<StyleSheet>[]>([]);

    useEffect(() => {
        parseBaseStyleSheet(themeBase).then(styles => {
            if (!styles) {
                return;
            }

            setStyles(styles);
            setStylesSelectOpts(
                styles.map(style => {
                    return {
                        label: style.readableName,
                        value: style
                    };
                })
            );
            setSelectedStyle(styles[0]);
        });
    }, [themeBase]);

    function onNameChange(name: string) {
        let valid = true;

        if (name === "New Theme") {
            valid = false;
        }

        if (!name.length) {
            valid = false;
        }

        if (getSavedThemes().find(theme => theme.name.toLowerCase() === name.toLowerCase())) {
            valid = false;
        }

        setValidInput(valid);
        setName(name);
    }

    function onBaseChange(option: (typeof themeBaseOptions)[0] | undefined) {
        if (!option) {
            return;
        }

        setThemeBase(option.value);
    }

    if (!styles) {
        return <></>;
    }

    return (
        <Modal animationMs={100} isOpen={props.isOpen} onClose={props.onClose} title="Theme Editor">
            <div className="ext-theme-modal-inputs">
                <div className="ext-theme-modal-header">
                    <TextInput onChange={onNameChange} placeholder="Theme Name" value={name} />
                    <Select
                        onSelect={onBaseChange}
                        options={themeBaseOptions}
                        value={themeBaseOptions[0]}
                    />
                </div>
                <div className="ext-theme-modal-style-select">
                    <Select
                        onSelect={value => setSelectedStyle(value?.value)}
                        options={stylesSelectOpts}
                        value={stylesSelectOpts[0]}
                    />
                </div>
            </div>

            {selectedStyle && (
                <div className="ext-theme-modal-variables">
                    {selectedStyle.variables.map(variable => (
                        <div className="ext-theme-modal-variable">
                            <Text as="span" variant="bodyMediumBold">
                                {variable.readableName}:
                            </Text>
                            <input type="color" value={variable.value} />
                        </div>
                    ))}
                </div>
            )}

            <ModalFooter
                disabled={!validInput}
                onCancel={props.onClose}
                onConfirm={props.onClose}
            />
        </Modal>
    );
}
