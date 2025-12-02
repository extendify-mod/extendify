import "./extendifyPage.css";

import { useRef, useState } from "@api/react";
import { DebugTab } from "@components/settings/debug";
import { ExperimentsTab } from "@components/settings/experiments";
import { PluginsTab } from "@components/settings/plugins";
import { ThemesTab } from "@components/settings/themes";
import { Chip, FilterProvider, SearchBar, Text } from "@components/spotify";

import type { ReactElement, RefObject } from "react";

export interface ExtendifyTabProps {
    searchQuery?: string;
}

interface Tab {
    name: string;
    component: ReactElement;
    canSearch: boolean;
}

function SettingsHeaderChip(props: { label: string; selected: boolean; onClick: () => void }) {
    return (
        <div role="presentation">
            <Chip
                aria-label={props.label}
                onClick={props.onClick}
                selected={props.selected}
                selectedColorSet="invertedLight"
            >
                {props.label}
            </Chip>
        </div>
    );
}

export default function () {
    const [searchQuery, setSearchQuery] = useState("");
    const outerRef: RefObject<any> = useRef(null);

    const tabs: Tab[] = [
        {
            canSearch: true,
            component: <PluginsTab searchQuery={searchQuery} />,
            name: "Plugins"
        },
        {
            canSearch: true,
            component: <ThemesTab searchQuery={searchQuery} />,
            name: "Themes"
        },
        {
            canSearch: true,
            component: <ExperimentsTab searchQuery={searchQuery} />,
            name: "Experiments"
        }
    ];

    if (DEVELOPMENT) {
        tabs.push({
            canSearch: false,
            component: <DebugTab />,
            name: "Debug"
        });
    }

    const [activeTab, setActiveTab] = useState<Tab>(
        tabs[0] ?? {
            canSearch: false,
            component: <></>,
            name: "Error"
        }
    );

    return (
        <>
            <div className="ext-settings-section-layout">
                <div className="ext-settings-header-chips">
                    {tabs.map(tab => (
                        <SettingsHeaderChip
                            label={tab.name}
                            onClick={() => setActiveTab(tab)}
                            selected={tab.name === activeTab.name}
                        />
                    ))}
                </div>
                <div className="ext-settings-header-title" ref={outerRef}>
                    <Text as="h1" semanticColor="textBase" variant="titleMedium">
                        {activeTab.name}
                    </Text>
                    {activeTab.canSearch && (
                        <FilterProvider>
                            <SearchBar
                                alwaysExpanded={false}
                                clearOnEscapeInElementRef={outerRef}
                                debounceFilterChangeTimeout={0}
                                onClear={() => setSearchQuery("")}
                                onFilter={query => setSearchQuery(query.toLowerCase())}
                                placeholder={`Search ${activeTab.name}...`}
                            />
                        </FilterProvider>
                    )}
                </div>
            </div>
            {activeTab.component ?? <></>}
        </>
    );
}
