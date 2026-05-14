import type { Query } from "@api/gql";
import { resolveApi } from "@api/platform";
import { React, ReactDOM, useEffect, useState } from "@api/react";
import { moduleCache } from "@api/registry";
import type { Icon } from "@components/icons";
import { TextInput } from "@components/input";
import { ButtonPrimary, ButtonSecondary, Text } from "@components/spotify";
import { exportFilters, findAllModuleExports } from "@webpack/module";

import type { ComponentType } from "react";

async function copyLogPath() {
    const path: string = await (resolveApi("DesktopLogsAPI") as any).getLogFolder();
    navigator.clipboard.writeText(path);
}

export default function () {
    const [moduleId, setModuleId] = useState<number>();
    const [exportName, setExportName] = useState<string>();
    const [fakeProps, setFakeProps] = useState<string>("{}");

    const [icons, setIcons] = useState<ComponentType<Icon>[]>([]);
    const [queries, setQueries] = useState<Query[]>([]);

    useEffect(() => {
        setIcons(Array.from(new Set(findAllModuleExports(exportFilters.byCode("svgContent:")))));

        setQueries(
            Array.from(
                new Set(
                    findAllModuleExports(
                        exportFilters.byProps("name", "operation", "sha256Hash", "value")
                    )
                )
            )
        );
    }, []);

    return (
        <div className="ext-settings-section-layout">
            <Text as="span" variant="titleSmall">
                Actions
            </Text>
            <div>
                <ButtonPrimary onClick={copyLogPath}>Copy Log Path</ButtonPrimary>
            </div>

            <Text as="span" variant="titleSmall">
                Create Component
            </Text>
            <div>
                <TextInput
                    onChange={value => setModuleId(Number(value))}
                    placeholder="Module ID"
                    type="number"
                    value={moduleId}
                />
                <TextInput
                    onChange={value => setExportName(value)}
                    placeholder="Export name"
                    value={exportName}
                />
                <TextInput
                    onChange={value => setFakeProps(value)}
                    placeholder="Props"
                    value={fakeProps}
                />

                <ButtonPrimary
                    onClick={() => {
                        if (!moduleId || !exportName || !fakeProps) {
                            return;
                        }

                        const container = document.getElementById("create-element-result");
                        if (!container) {
                            return;
                        }
                        container.innerHTML = "";
                        const root = ReactDOM.createRoot(container);

                        const element = React.createElement(
                            (moduleCache[moduleId] as any)?.exports[exportName] ??
                                "Module not found",
                            JSON.parse(fakeProps)
                        );
                        root.render(element);
                    }}
                >
                    Create
                </ButtonPrimary>
                <ButtonSecondary
                    onClick={() => {
                        const container = document.getElementById("create-element-result");
                        if (container) {
                            container.innerHTML = "";
                        }
                    }}
                >
                    Remove
                </ButtonSecondary>
            </div>
            <div id="create-element-result"></div>

            <Text as="span" variant="titleSmall">
                GraphQL
            </Text>
            <div className="ext-dbg-queries-container">
                <div className="ext-settings-container">
                    <Text variant="titleSmall">Query</Text>
                    {queries
                        .filter(v => v.operation === "query")
                        .map(v => (
                            <Text>{v.name}</Text>
                        ))}
                </div>

                <div className="ext-settings-container">
                    <Text variant="titleSmall">Mutation</Text>
                    {queries
                        .filter(v => v.operation === "mutation")
                        .map(v => (
                            <Text>{v.name}</Text>
                        ))}
                </div>
            </div>

            <Text as="span" variant="titleSmall">
                Icons
            </Text>
            <div className="ext-dbg-icons-container">
                {icons.map(Icon => (
                    <div className="ext-dbg-icon-container">
                        <Icon />
                    </div>
                ))}
            </div>
        </div>
    );
}
