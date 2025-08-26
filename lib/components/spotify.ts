import { exportFilters } from "@webpack/module";
import { findModuleComponent } from "@webpack/module";

import type { ComponentProps, ElementType, PropsWithChildren, ReactElement, Ref } from "react";

export type SemanticColor =
    | "textBase"
    | "textSubdued"
    | "textBrightAccent"
    | "textNegative"
    | "textWarning"
    | "textPositive"
    | "textAnnouncement";
export type ColorSet = "brightAccent" | "invertedLight" | "overMedia";

export type TextVariant =
    | "bodySmall"
    | "bodyMedium"
    | "bodySmallBold"
    | "bodyMediumBold"
    | "titleSmall"
    | "titleMedium"
    | "titleLarge"
    | "marginal"
    | "marginalBold"
    | "headlineMedium"
    | "headlineLarge";
export const Text = findModuleComponent<
    ComponentProps<"span"> &
        PropsWithChildren<{
            semanticColor?: SemanticColor;
            variant?: TextVariant;
            paddingBottom?: number;
            as?: ElementType;
        }>
>(exportFilters.byEncoreName("Text"));

type EncoreButton = ComponentProps<"button"> &
    PropsWithChildren<{
        as?: ElementType;
        buttonSize?: "sm" | "md" | "lg";
        /** @default "medium" */
        size?: "small" | "medium";
        semanticColor?: SemanticColor;
        iconLeading?: ReactElement;
        iconTrailing?: ReactElement;
        iconOnly?: ReactElement;
        fullWidth?: boolean;
    }>;
export const PrimaryButton = findModuleComponent<EncoreButton>(
    exportFilters.byEncoreName("ButtonPrimary")
);

export const Chip = findModuleComponent<
    ComponentProps<"button"> &
        PropsWithChildren<{
            selected?: boolean;
            selectedColorSet?: ColorSet;
        }>
>(exportFilters.byEncoreName("Chip"));

export const SearchBar = findModuleComponent<{
    alwaysExpanded?: boolean;
    placeholder?: string;
    filterBoxApiRef?: Ref<unknown>;
    outerRef?: Ref<unknown>;
    clearOnEscapeInElementRef?: Ref<unknown>;
    debounceFilterChangeTimeout?: number;
    expandDirection?: "right" | "left";
    fullWidth?: boolean;
    onFilter?: (input: string) => void;
    onClear?: () => void;
    onActivate?: () => void;
}>(
    exportFilters.byCode({
        matches: ["alwaysExpanded", "filterBoxApiRef", "clearOnEscapeInElementRef"],
        mode: "all"
    })
);
export const FilterProvider = findModuleComponent<PropsWithChildren<{ uri?: string }>>(
    exportFilters.byCode({
        matches: ["lastFilterState", "lastFilteredUri"],
        mode: "all"
    })
);

export const Route = findModuleComponent<{
    key?: string;
    path: string;
    element: ReactElement;
}>(exportFilters.byCode(/^function [\w$]+\([\w$]+\)\{\(0,[\w$]+\.[\w$]+\)\(\!1\)\}$/));
