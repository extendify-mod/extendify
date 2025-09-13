import "../settingsPage.css";
import "./plugin.css";

import { useState } from "@api/react";
import { plugins } from "@api/registry";
import type { SettingsSectionProps } from "@components/settings/SettingsPage";
import Plugin from "@components/settings/plugins/Plugin";

export default function ({ searchQuery }: SettingsSectionProps) {
    const [needRestart, _] = useState<string[]>([]);

    function onRestartNeeded(plugin: string) {
        needRestart.push(plugin);
    }

    const filteredPlugins = plugins
        .values()
        .filter(
            (plugin) =>
                !searchQuery?.length ||
                plugin.name.toLowerCase().includes(searchQuery) ||
                plugin.description.toLowerCase().includes(searchQuery)
        );

    return (
        <>
            {needRestart.length > 0 && (
                // TODO
                <div className="ext-settings-section-layout">{...needRestart}</div>
            )}

            <div className="ext-settings-section-layout">
                <div className="ext-settings-grid">
                    {filteredPlugins.map((plugin) => (
                        <Plugin onRestartNeeded={onRestartNeeded} plugin={plugin} />
                    ))}
                </div>
            </div>
        </>
    );
}
