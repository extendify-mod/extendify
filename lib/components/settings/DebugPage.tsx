import "./debugPage.css";
import "./settingsPage.css";

import type { Icon } from "@components/icons";
import { exportFilters, findAllModuleExports } from "@webpack/module";

import type { ComponentType } from "react";

export default function () {
    const icons: ComponentType<Icon>[] = [
        ...Array.from(new Set(findAllModuleExports(exportFilters.byCode("svgContent:"))).values())
    ];

    return (
        <div className="ext-settings-section-layout">
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
