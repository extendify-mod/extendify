import "../extendifyPage.css";
import "./theme.css";

import { useState } from "@api/react";
import { getSavedThemes } from "@api/themes";
import { PlusIcon } from "@components/icons";
import type { ExtendifyTabProps } from "@components/settings";
import { Theme, ThemeModal } from "@components/settings/themes";
import { ButtonPrimary } from "@components/spotify";

export default function ({ searchQuery }: ExtendifyTabProps) {
    const [modalOpen, setModalOpen] = useState(false);

    const filteredThemes = getSavedThemes().filter(
        (theme) =>
            !searchQuery?.length ||
            theme.name.toLowerCase().includes(searchQuery) ||
            theme.description.toLowerCase().includes(searchQuery)
    );

    return (
        <>
            <ThemeModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                theme={{
                    name: "New Theme",
                    description: "My awesome theme",
                    base: "dark",
                    overrides: []
                }}
            />
            <div className="ext-settings-section-layout">
                <div className="ext-settings-grid">
                    {filteredThemes.map((theme) => (
                        <Theme theme={theme} />
                    ))}
                </div>
                <ButtonPrimary
                    className="ext-theme-new-button"
                    iconLeading={() => <PlusIcon />}
                    onClick={() => setModalOpen(true)}
                >
                    New Theme
                </ButtonPrimary>
            </div>
        </>
    );
}
