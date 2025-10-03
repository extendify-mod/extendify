import type { SemanticColor } from "@components/spotify";
import { type LazyComponent, exportFilters, findModuleComponent } from "@webpack/module";

export interface Icon {
    iconSize?: number;
    semanticColor?: SemanticColor;
}

function findIcon(code: string): LazyComponent<Icon> {
    return findModuleComponent<Icon>(exportFilters.byCode(code));
}

export const InfoIcon = findIcon("M8 14.5a6.5");
export const EditIcon = findIcon("M11.838.714a2.438");
export const CloseIcon = findIcon("M2.47 2.47a");
export const GearIcon = findIcon("m15.51 7.484");
export const GarbageIcon = findIcon("M5.25 3v-");
