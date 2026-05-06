import { useState } from "@api/react";
import {
    DEFAULT_THEME,
    enableTheme,
    getEnabledTheme,
    getSavedThemes,
    saveTheme,
    type Theme as ThemeType
} from "@api/themes";
import { BookshelfIcon, PlusIcon } from "@components/icons";
import type { ExtendifyTabProps } from "@components/settings";
import { Theme, ThemeModal } from "@components/settings/themes";
import { ButtonPrimary, ButtonSecondary } from "@components/spotify";
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
        if (!getEnabledTheme()) {
            enableTheme(DEFAULT_THEME);
        }

        refreshThemes();
    }

    async function importFromClipboard() {
        const content = await navigator.clipboard.readText();
        if (!content) {
            return;
        }

        try {
            const parsed: ThemeType = JSON.parse(atob(content));
            if (!parsed?.name || !parsed.description || !parsed.base || parsed.builtIn) {
                return;
            }

            saveTheme(parsed);
            enableTheme(parsed);

            refreshThemes();
        } catch {}
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

                <div className="ext-theme-button-row">
                    <ButtonPrimary
                        iconLeading={() => <PlusIcon />}
                        onClick={() => {
                            setNewTheme(defaultNewTheme);
                            setModalOpen(true);
                        }}
                    >
                        New Theme
                    </ButtonPrimary>
                    <ButtonSecondary
                        iconLeading={() => <BookshelfIcon />}
                        onClick={importFromClipboard}
                    >
                        Import Theme
                    </ButtonSecondary>
                </div>
            </div>
        </>
    );
}
