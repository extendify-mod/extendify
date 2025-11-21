import "./extendifyPage.css";

import { useRef, useState } from "@api/react";
import { DebugTab } from "@components/settings/debug";
import { ExperimentsTab } from "@components/settings/experiments";
import { PluginsTab } from "@components/settings/plugins";
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

    const tabs: Tab[] = [
        {
            name: "Plugins",
            component: <PluginsTab searchQuery={searchQuery} />,
            canSearch: true
        },
        {
            name: "Experiments",
            component: <ExperimentsTab searchQuery={searchQuery} />,
            canSearch: true
        }
    ];

    if (DEVELOPMENT) {
        tabs.push({
            name: "Debug",
            component: <DebugTab />,
            canSearch: false
        });
    }

    const [activeTab, setActiveTab] = useState(tabs[0]!);

    return (
        <>
            <div className="ext-settings-section-layout">
                <div className="ext-settings-header-chips">
                    {tabs.map((tab) => (
                        <SettingsHeaderChip
                            label={tab.name}
                            selected={tab.name === activeTab.name}
                            onClick={() => setActiveTab(tab)}
                        />
                    ))}
                </div>
                <div className="ext-settings-header-title" ref={outerRef}>
                    <Text as="h1" variant="titleMedium" semanticColor="textBase">
                        {activeTab.name}
                    </Text>
                    {activeTab.canSearch && (
                        <FilterProvider>
                            <SearchBar
                                placeholder={`Search ${activeTab}...`}
                                alwaysExpanded={false}
                                debounceFilterChangeTimeout={0}
                                onFilter={(query) => setSearchQuery(query.toLowerCase())}
                                onClear={() => setSearchQuery("")}
                                clearOnEscapeInElementRef={outerRef}
                            />
                        </FilterProvider>
                    )}
                </div>
            </div>
            {tabs.find((tab) => tab.name === activeTab.name)?.component ?? <></>}
        </>
    );
}
