import "../extendifyPage.css";

import { themes } from "@api/registry";
import type { ExtendifyTabProps } from "@components/settings";

export default function ({ searchQuery }: ExtendifyTabProps) {
    const filteredThemes = Array.from(themes.values()).filter(
        (theme) =>
            !searchQuery?.length ||
            theme.name.toLowerCase().includes(searchQuery) ||
            theme.description.toLowerCase().includes(searchQuery)
    );

    return (
        <>
            <div className="ext-settings-section-layout">
                <div className="ext-settings-grid">
                    {filteredThemes.map((theme) => (
                        <></>
                    ))}
                </div>
            </div>
        </>
    );
}
