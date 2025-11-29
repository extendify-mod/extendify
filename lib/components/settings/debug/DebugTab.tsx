import "../extendifyPage.css";
import "./debugTab.css";

import { resolveApi } from "@api/platform";
import { useEffect, useState } from "@api/react";
import { CodeBlock } from "@components/codeBlock";
import type { Icon } from "@components/icons";
import { ButtonPrimary, Text } from "@components/spotify";
import { exportFilters, findAllModuleExports, findModuleExport } from "@webpack/module";

import type { ComponentType } from "react";

async function copyLogPath() {
    const path: string = await (resolveApi("DesktopLogsAPI") as any).getLogFolder();
    navigator.clipboard.writeText(path);
}

export default function () {
    const [icons, setIcons] = useState<ComponentType<Icon>[]>([]);
    const [pkg, setPkg] = useState<string>();

    useEffect(() => {
        setIcons(Array.from(new Set(findAllModuleExports(exportFilters.byCode("svgContent:")))));

        findModuleExport(exportFilters.byProps("name", "description", "version")).then(pkg => {
            setPkg(JSON.stringify(pkg, null, 4));
        });
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
                Internal
            </Text>
            <CodeBlock code={pkg} language="json" />
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
