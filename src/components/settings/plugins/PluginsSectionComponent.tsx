import "../settingsSection.css";
import "./plugins.css";

import { RestartWarningComponent } from "@components/settings";
import { PluginComponent } from "@components/settings/plugins";

import { React, Text } from "@webpack/common";

import { plugins } from "plugins";

export default (props: { searchQuery?: string }) => {
    const { searchQuery } = props;

    const [needRestart, _] = React.useState([] as string[]);

    const onRestartNeeded = (plugin: string) => {
        needRestart.push(plugin);
    };

    return (
        <>
            {needRestart.length > 0 && (
                <div className="ext-settings-section-layout">
                    <RestartWarningComponent needRestart={needRestart} />
                </div>
            )}

            <div className="ext-settings-section-layout">
                <Text as="span" variant="bodyMediumBold" semanticColor="textSubdued">
                    Plugins
                </Text>
                <div className="ext-settings-grid">
                    {Object.values(plugins)
                        .filter(
                            (v) =>
                                !searchQuery?.length ||
                                v.name.toLowerCase().includes(searchQuery) ||
                                v.description.toLowerCase().includes(searchQuery)
                        )
                        .filter((v) => !v.required && !v.hidden)
                        .map((v) => (
                            <PluginComponent onRestartNeeded={onRestartNeeded} plugin={v} />
                        ))}
                </div>

                <Text as="span" variant="bodyMediumBold" semanticColor="textSubdued">
                    Required
                </Text>
                <div className="ext-settings-grid">
                    {Object.values(plugins)
                        .filter(
                            (v) =>
                                !searchQuery?.length ||
                                v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                v.description.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .filter((v) => v.required && !v.hidden)
                        .map((v) => (
                            <PluginComponent onRestartNeeded={onRestartNeeded} plugin={v} />
                        ))}
                </div>
            </div>
        </>
    );
};
