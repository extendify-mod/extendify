import "../extendifyPage.css";
import "./debugTab.css";
import "highlight.js/styles/github-dark.css";

import { resolveApi } from "@api/platform";
import { React, useEffect, useState } from "@api/react";
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, type Icon } from "@components/icons";
import { ButtonPrimary, ButtonTertiary, Text } from "@components/spotify";
import { exportFilters, findAllModuleExports, findModuleExport } from "@webpack/module";

import hljs from "highlight.js";
import type { ComponentType } from "react";

async function copyLogPath() {
    const path: string = await (resolveApi("DesktopLogsAPI") as any).getLogFolder();
    navigator.clipboard.writeText(path);
}

export default function () {
    const [icons, setIcons] = useState<ComponentType<Icon>[]>([]);
    const [pkg, setPkg] = useState<string | undefined>();
    const [pkgHidden, setPkgHidden] = useState(false);

    useEffect(() => {
        setIcons(
            Array.from(new Set(findAllModuleExports(exportFilters.byCode("svgContent:"))).values())
        );
    }, []);

    useEffect(() => {
        findModuleExport<any>(exportFilters.byProps("name", "description", "version")).then(
            (pkg) => {
                setPkg(
                    hljs.highlight(pkgHidden ? "{ ... }" : JSON.stringify(pkg, null, 4), {
                        language: "json"
                    }).value
                );
            }
        );
    }, [pkgHidden]);

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
            <div className="ext-dbg-codeblock">
                {pkg ? (
                    <>
                        <div className="ext-dbg-codeblock-actions">
                            <ButtonTertiary
                                iconOnly={() => <CopyIcon />}
                                onClick={() => navigator.clipboard.writeText(pkg)}
                            />
                            <ButtonTertiary
                                iconOnly={() => (pkgHidden ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                onClick={() => setPkgHidden(!pkgHidden)}
                            />
                        </div>
                        <pre>
                            <code
                                className="hljs language-json"
                                dangerouslySetInnerHTML={{ __html: pkg }}
                            />
                        </pre>
                    </>
                ) : (
                    <Text as="span" variant="bodyMediumBold">
                        Loading...
                    </Text>
                )}
            </div>
            <Text as="span" variant="titleSmall">
                Icons
            </Text>
            <div className="ext-dbg-icons-container">
                {icons.map((Icon) => (
                    <div className="ext-dbg-icon-container">
                        <Icon />
                    </div>
                ))}
            </div>
        </div>
    );
}
