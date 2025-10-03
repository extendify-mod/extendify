import "./extendifyPage.css";

import { useRef, useState } from "@api/react";
import { DebugPage } from "@components/settings";
import { PluginsPage } from "@components/settings/plugins";
import { Chip, FilterProvider, SearchBar, Text } from "@components/spotify";

import { ExperimentsPage } from "./experiments";

import type { ReactElement, RefObject } from "react";

export interface SettingsSectionProps {
    searchQuery?: string;
}

function SettingsHeaderChip(props: { label: string; selected: boolean; onClick: () => void }) {
    return (
        <div role="presentation">
            <Chip
                aria-label={props.label}
                selectedColorSet="invertedLight"
                selected={props.selected}
                onClick={props.onClick}
            >
                {props.label}
            </Chip>
        </div>
    );
}

export default function () {
    const [searchQuery, setSearchQuery] = useState("");
    const outerRef: RefObject<any> = useRef(null);

    const pages: Record<string, ReactElement> = {
        Plugins: <PluginsPage searchQuery={searchQuery} />,
        Experiments: <ExperimentsPage searchQuery={searchQuery} />
    };

    if (DEVELOPMENT) {
        pages["Debug"] = <DebugPage />;
    }

    const [activePage, setActivePage] = useState(Object.keys(pages)[0]);

    return (
        <>
            <div className="ext-settings-section-layout">
                <div className="ext-settings-header-chips">
                    {Object.keys(pages).map((key) => (
                        <SettingsHeaderChip
                            label={key}
                            selected={key === activePage}
                            onClick={() => setActivePage(key)}
                        />
                    ))}
                </div>
                <div className="ext-settings-header-title" ref={outerRef}>
                    <Text as="h1" variant="titleMedium" semanticColor="textBase">
                        {activePage}
                    </Text>
                    <FilterProvider>
                        <SearchBar
                            placeholder={`Search ${activePage}...`}
                            alwaysExpanded={false}
                            debounceFilterChangeTimeout={0}
                            onFilter={(query) => setSearchQuery(query.toLowerCase())}
                            onClear={() => setSearchQuery("")}
                            clearOnEscapeInElementRef={outerRef}
                        />
                    </FilterProvider>
                </div>
            </div>
            {activePage && pages[activePage]}
        </>
    );
}
