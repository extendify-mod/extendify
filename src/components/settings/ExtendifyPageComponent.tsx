import "./settingsSection.css";

import { ExperimentsSectionComponent } from "@components/settings/experiments";
import { PluginsSectionComponent } from "@components/settings/plugins";

import { Chip, FilterProvider, React, SearchBar, Text, useRef, useState } from "@webpack/common";

import { ReactElement } from "react";

export default () => {
    const [searchQuery, setSearchQuery] = React.useState("");
    const outerRef: React.RefObject<HTMLDivElement | null> = useRef(null);

    const pages: Record<string, ReactElement> = {
        Plugins: <PluginsSectionComponent searchQuery={searchQuery} />,
        Experiments: <ExperimentsSectionComponent searchQuery={searchQuery} />
    };
    const [activePage, setActivePage] = useState<string>(Object.keys(pages)[0]);

    return (
        <>
            <div className="ext-settings-section-layout">
                <div className="ext-settings-header-chips">
                    {Object.keys(pages).map((key) => (
                        <div role="presentation">
                            <Chip
                                aria-label={key}
                                selectedColorSet="invertedLight"
                                selected={key === activePage}
                                onClick={() => setActivePage(key)}
                            >
                                {key}
                            </Chip>
                        </div>
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
                            onFilter={(v) => setSearchQuery(v.toLowerCase())}
                            onClear={() => setSearchQuery("")}
                            clearOnEscapeInElementRef={outerRef}
                        />
                    </FilterProvider>
                </div>
            </div>
            {pages[activePage]}
        </>
    );
};
