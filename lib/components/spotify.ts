import type { Icon } from "@components/icons";
import type { ArtistUnion } from "@shared/types/spotify/player";
import { exportFilters } from "@webpack/module";
import { findModuleComponent } from "@webpack/module";

import type {
    ComponentProps,
    ComponentType,
    ElementType,
    PropsWithChildren,
    ReactElement,
    Ref
} from "react";

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

// Separated this 'cause vscode couldn't parse it
type ToggleProps = Omit<ComponentProps<"input">, "value"> & {
    condensed?: boolean;
    inputRef?: Ref<unknown>;
    value: boolean;
    onSelected?(value: boolean): void;
};
export const Toggle = findModuleComponent<ToggleProps>(
    exportFilters.byCode({
        matches: ['type:"checkbox"', "onChange", "condensed"],
        mode: "all"
    })
);

type SliderProps = Omit<ComponentProps<"input">, "onDragStart" | "onDragEnd" | "value"> & {
    value?: number;
    max?: number;
    step?: number;
    labelText?: string;
    /** @default true */
    isInteractive?: boolean;
    forceActiveStyles?: boolean;
    saberConfig?: any;
    isPlayingStrangerThings?: boolean;
    isAttackOnTitanEasterEggActive?: boolean;
    direction?: "horizontal";
    enableAnimation?: boolean;
    updateFrequency?: number;
    offFrequencyUpdate?: unknown;
    showValueAsTimeOverHandle?: boolean;
    onDragStart?(progress: number): void;
    onDragMove?(progress: number): void;
    onDragEnd?(progress: number): void;
};
export const Slider = findModuleComponent<SliderProps>(
    exportFilters.byEncoreName("progress-bar-saber-overlay")
);

type EncoreButton = ComponentProps<"button"> &
    PropsWithChildren<{
        as?: ElementType;
        buttonSize?: "sm" | "md" | "lg";
        /** @default "medium" */
        size?: "small" | "medium";
        semanticColor?: SemanticColor;
        iconLeading?: ComponentType<Icon>;
        iconTrailing?: ComponentType<Icon>;
        iconOnly?: ComponentType<Icon>;
        fullWidth?: boolean;
    }>;
export const ButtonPrimary = findModuleComponent<EncoreButton>(
    exportFilters.byEncoreName("ButtonPrimary")
);
export const ButtonSecondary = findModuleComponent<EncoreButton>(
    exportFilters.byEncoreName("ButtonSecondary")
);
export const ButtonTertiary = findModuleComponent<EncoreButton>(
    exportFilters.byEncoreName("ButtonTertiary")
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

export const Tooltip = findModuleComponent<
    PropsWithChildren<{
        label?: string;
        renderInline?: boolean;
        showDelay?: number;
        disabled?: boolean;
        placement?: "top" | "bottom" | "left" | "right";
        labelClassName?: string;
    }>
>(
    exportFilters.byCode({
        matches: ["renderInline", "showDelay"],
        mode: "all"
    })
);

export const Link = findModuleComponent<
    PropsWithChildren<{
        to?: string;
        pageId?: string;
        draggable?: boolean;
        state?: any;
        search?: any;
        pathname?: string;
        tabIndex?: number;
        stopPropagation?: boolean;
        onClick?(event: MouseEvent): void;
    }>
>(
    exportFilters.byCode({
        matches: ["pageId", "_blank"],
        mode: "all"
    })
);

export const Route = findModuleComponent<{
    key?: string;
    path: string;
    element: ReactElement;
}>(exportFilters.byCode(/^function [\w$]+\([\w$]+\)\{\(0,[\w$]+\.[\w$]+\)\(\!1\)\}$/));

export const ModalWrapper = findModuleComponent<
    ComponentProps<"div"> &
        PropsWithChildren<{
            isOpen?: boolean;
            contentLabel?: string;
            overlayClassName?: string;
            animated?: boolean;
            animation?: {
                closeTimeoutMs?: number;
            };
            shouldFocusAfterRender?: boolean;
        }>
>(exportFilters.byCode("modal?."));

export const ArtistAbout = findModuleComponent<{
    artistUri: string;
    artist: ArtistUnion["profile"];
    stats: ArtistUnion["stats"];
    visuals: ArtistUnion["visuals"];
    externalLinks: ArtistUnion["profile"]["externalLinks"];
}>(exportFilters.byEncoreName("profiler(NPVArtistAboutV2)"));
