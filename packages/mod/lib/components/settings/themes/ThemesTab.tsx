import { useState } from "@api/react";
import {
    DEFAULT_THEME,
    enableTheme,
    getEnabledTheme,
    getSavedThemes,
    type Theme as ThemeType
} from "@api/themes";
import { PlusIcon } from "@components/icons";
import type { ExtendifyTabProps } from "@components/settings";
import { Theme, ThemeModal } from "@components/settings/themes";
import { ButtonPrimary } from "@components/spotify";
import { DEFAULT_THEME_DESC, DEFAULT_THEME_NAME } from "@shared/constants";

const defaultNewTheme: ThemeType = {
    base: "dark",
    description: DEFAULT_THEME_DESC,
    name: DEFAULT_THEME_NAME,
    overrides: []
};

export default function ({ searchQuery }: ExtendifyTabProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [newTheme, setNewTheme] = useState<ThemeType>(defaultNewTheme);
    const [themes, setThemes] = useState(filterThemes());

    function filterThemes() {
        return getSavedThemes().filter(
            theme =>
                !searchQuery?.length ||
                theme.name.toLowerCase().includes(searchQuery) ||
                theme.description.toLowerCase().includes(searchQuery)
        );
    }

    function refreshThemes() {
        setThemes(filterThemes());
    }

    function onThemeDeleted() {
        refreshThemes();

        if (!getEnabledTheme()) {
            enableTheme(DEFAULT_THEME);
        }

        refreshThemes();
    }

    return (
        <>
            <ThemeModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    refreshThemes();
                }}
                theme={newTheme}
            />

            <div className="ext-settings-section-layout">
                <div className="ext-settings-grid">
                    {themes.map(theme => (
                        <Theme
                            key={`${theme.name} ${theme.description}`}
                            onDeleted={onThemeDeleted}
                            onSave={refreshThemes}
                            theme={theme}
                        />
                    ))}
                </div>

                <ButtonPrimary
                    className="ext-theme-new-button"
                    iconLeading={() => <PlusIcon />}
                    onClick={() => {
                        setNewTheme(defaultNewTheme);
                        setModalOpen(true);
                    }}
                >
                    New Theme
                </ButtonPrimary>
            </div>
        </>
    );
}
