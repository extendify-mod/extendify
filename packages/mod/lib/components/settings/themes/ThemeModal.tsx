import "./themeModal.css";

import { useEffect, useState } from "@api/react";
import {
    enableTheme,
    findTheme,
    getSavedThemes,
    removeTheme,
    saveTheme,
    type Theme,
    type ThemeBase
} from "@api/themes";
import {
    parseBaseStyleSheet,
    type StyleSheet,
    type StyleSheetOverride,
    type StyleSheetVariable
} from "@api/themes/styles";
import { Select, type SelectOption, TextInput } from "@components/input";
import { Modal, ModalFooter } from "@components/modal";
import { Text } from "@components/spotify";
import { DEFAULT_THEME_DESC, DEFAULT_THEME_NAME } from "@shared/constants";

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
    const [description, setDescription] = useState(props.theme.description);
    const [themeBase, setThemeBase] = useState<ThemeBase>(props.theme.base);

    const [validInput, setValidInput] = useState(false);
    const [invalidInputReason, setInvalidInputReason] = useState<string>();

    const [styles, setStyles] = useState<StyleSheet[]>();
    const [selectedStyle, setSelectedStyle] = useState<StyleSheet>();
    const [stylesSelectOpts, setStylesSelectOpts] = useState<SelectOption<StyleSheet>[]>([]);

    useEffect(onMetadataChange, []);

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

    function onMetadataChange() {
        setInvalidInputReason(undefined);
        let valid = true;

        if (name === DEFAULT_THEME_NAME || description === DEFAULT_THEME_DESC) {
            setInvalidInputReason("Theme metadata cannot be default");
            valid = false;
        }

        if (!name.length || !description.length) {
            setInvalidInputReason("Theme metadata cannot be empty");
            valid = false;
        }

        if (
            name !== props.theme.name &&
            getSavedThemes().find(theme => theme.name.toLowerCase() === name.toLowerCase())
        ) {
            setInvalidInputReason(`Theme ${name} already exists`);
            valid = false;
        }

        setValidInput(valid);
    }

    async function onThemeSave() {
        const overrides: StyleSheetOverride[] = [];
        const defaultStyles = (await parseBaseStyleSheet(themeBase)) ?? [];

        for (const style of styles ?? []) {
            const defaultStyle = defaultStyles.find(s => s.selector === style.selector);

            if (!defaultStyle) {
                continue;
            }

            const changedVars: StyleSheetVariable[] = [];

            for (const variable of style.variables) {
                const defaultVar = defaultStyle.variables.find(v => v.key === variable.key);

                if (!defaultVar) {
                    continue;
                }

                if (variable.value !== defaultVar.value) {
                    changedVars.push(variable);
                }
            }

            if (changedVars.length > 0) {
                overrides.push({
                    selector: style.selector,
                    variables: changedVars
                });
            }
        }

        if (findTheme(props.theme.name)) {
            removeTheme(props.theme);
        }

        const theme = {
            base: themeBase,
            builtIn: false,
            description,
            name,
            overrides
        };
        saveTheme(theme);
        enableTheme(theme);

        props.onClose();
    }

    if (!styles) {
        return <></>;
    }

    return (
        <Modal animationMs={100} isOpen={props.isOpen} onClose={props.onClose} title="Theme Editor">
            <div className="ext-theme-modal-inputs">
                <div className="ext-theme-modal-header">
                    <TextInput
                        onChange={value => {
                            setName(value);
                            onMetadataChange();
                        }}
                        placeholder="Theme Name"
                        value={name}
                    />
                    <Select
                        onSelect={option => option && setThemeBase(option.value)}
                        options={themeBaseOptions}
                        value={themeBaseOptions[0]}
                    />
                </div>
                <TextInput
                    onChange={value => {
                        setDescription(value);
                        onMetadataChange();
                    }}
                    placeholder="Theme Description"
                    value={description}
                />
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
                confirmTooltip={invalidInputReason}
                disabled={!validInput}
                onCancel={props.onClose}
                onConfirm={onThemeSave}
            />
        </Modal>
    );
}
