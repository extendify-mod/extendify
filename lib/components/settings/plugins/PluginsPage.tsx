import "../extendifyPage.css";
import "./plugin.css";

import { useState } from "@api/react";
import { plugins } from "@api/registry";
import type { SettingsSectionProps } from "@components/settings";
import { Plugin } from "@components/settings/plugins";
import { ButtonSecondary, Text } from "@components/spotify";

export default function ({ searchQuery }: SettingsSectionProps) {
    const [needRestart, setNeedRestart] = useState<string[]>([]);

    function onRestartNeeded(plugin: string) {
        setNeedRestart((prev) => {
            return !prev.includes(plugin)
                ? [...prev, plugin]
                : prev.filter((name) => name !== plugin);
        });
    }

    const filteredPlugins = Array.from(plugins.values()).filter(
        (plugin) =>
            !searchQuery?.length ||
            plugin.name.toLowerCase().includes(searchQuery) ||
            plugin.description.toLowerCase().includes(searchQuery)
    );

    return (
        <>
            <div className="ext-settings-section-layout">
                {needRestart.length > 0 && (
                    <div className="ext-settings-container ext-restart-container">
                        <Text as="span" semanticColor="textBase" variant="titleSmall">
                            The following plugins require you to restart Spotify:
                        </Text>
                        {needRestart.join(", ")}
                        <div className="ext-restart-button-container">
                            <ButtonSecondary onClick={() => window.location.reload()}>
                                Restart
                            </ButtonSecondary>
                        </div>
                    </div>
                )}

                <div className="ext-settings-grid">
                    {filteredPlugins.map((plugin) => (
                        <Plugin onRestartNeeded={onRestartNeeded} plugin={plugin} />
                    ))}
                </div>
            </div>
        </>
    );
}
