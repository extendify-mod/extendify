import { Renderable } from "@utils/types";
import { filters, waitFor, waitForComponent } from "@webpack";

import { ComponentProps, ComponentType, ElementType, PropsWithChildren, ReactElement, Ref } from "react";

export type SemanticColor =
    | "textBase"
    | "textSubdued"
    | "textBrightAccent"
    | "textNegative"
    | "textWarning"
    | "textPositive"
    | "textAnnouncement";

export type Icon = ComponentType<{
    semanticColor: SemanticColor;
    size: "small" | "medium";
}>;

export const waitForCardComponent = (name: string) => {
    return waitForComponent(
        `${name}Card`,
        filters.componentByCode(`featureIdentifier:\"${name.toLowerCase()}\"`, "headerText")
    );
};

export let Toggle:
    | ComponentType<
          Omit<ComponentProps<"input">, "value"> & {
              /** @default false */
              condensed?: boolean;
              inputRef?: React.Ref<unknown>;
              value: boolean;
              onSelected?: (value: boolean) => void;
          }
      >
    | undefined;
waitFor(filters.componentByCode('type:"checkbox"', "onChange"), (v) => (Toggle = v));

export const ConfirmDialog = waitForComponent(
    "ConfirmDialog",
    filters.componentByCode("isOpen", "shouldCloseOnEsc", "shouldFocusAfterRender", "onClose")
);

export const Menu = waitForComponent("Menu", filters.componentByCode("getInitialFocusElement", "children"));
export const MenuItem = waitForComponent<
    ComponentType<
        PropsWithChildren<{
            disabled?: boolean;
            divider?: "before" | "after";
            leadingIcon?: ReactElement;
            trailingIcon?: ReactElement;
            elementRef?: Ref<ComponentType<any>>;
            /** @default true */
            autoClose?: boolean;
            semanticColor?: SemanticColor;
            /** @default true */
            implicitType?: boolean;
            onClick?(): void;
        }>
    >
>("MenuItem", filters.componentByCode("handleMouseEnter", "onClick", "leadingIcon"));

export const RemoteConfigProvider = waitForComponent(
    "RemoteConfigProvider",
    filters.componentByCode("resolveSuspense", "configuration")
);
export const TooltipWrapper = waitForComponent<
    ComponentType<
        PropsWithChildren<{
            label?: string;
            renderInline?: boolean;
            showDelay?: number;
            disabled?: boolean;
            placement?: "top" | "bottom" | "left" | "right";
            labelClassName?: string;
        }>
    >
>("TooltipWrapper", filters.componentByCode("renderInline", "showDelay"));

type ButtonType = ComponentType<
    ComponentProps<"button"> &
        PropsWithChildren<{
            as?: ElementType;
            buttonSize?: "sm" | "md" | "lg";
            /** @default "medium" */
            size?: "small" | "medium";
            semanticColor?: SemanticColor;
            iconLeading?: Renderable;
            iconTrailing?: Renderable;
            iconOnly?: Renderable;
            fullWidth?: boolean;
        }>
>;
export const ButtonPrimary = waitForComponent<ButtonType>("ButtonPrimary", filters.componentByName("ButtonPrimary"));
export const ButtonSecondary = waitForComponent<ButtonType>(
    "ButtonSecondary",
    filters.componentByName("ButtonSecondary")
);
export const ButtonTertiary = waitForComponent<ButtonType>("ButtonTertiary", filters.componentByName("ButtonTertiary"));

export const Text = waitForComponent<
    ComponentType<
        PropsWithChildren<{
            color?: string;
            semanticColor?: SemanticColor;
            paddingBottom?: number;
            /** @default "bodyMedium" */
            variant?:
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
            className?: string;
            /** @default <span> */
            as?: ElementType;
            style?: string;
        }>
    >
>("Text", filters.componentByCode("bodyMedium", /"data-encore-id":.\..\.Text,/));
export const Slider = waitForComponent<
    ComponentType<
        Omit<Omit<ComponentProps<"input">, "onDragStart">, "onDragEnd"> & {
            value?: number;
            max?: number;
            step?: number;
            labelText?: string;
            /** @default true */
            isInteractive?: boolean;
            /** @default false */
            forceActiveStyles?: boolean;
            saberConfig?: any;
            /** @default false */
            isPlayingStrangerThings?: boolean;
            isAttackOnTitanEasterEggActive?: boolean;
            direction?: "horizontal";
            enableAnimation?: boolean;
            updateFrequency?: number;
            offFrequencyUpdate?: unknown;
            /** @default false */
            showValueAsTimeOverHandle?: boolean;
            onDragStart?: (v: number) => void;
            onDragMove?: (v: number) => void;
            onDragEnd?: (v: number) => void;
        }
    >
>("Slider", filters.componentByCode("progressBarRef"));
export const Chip = waitForComponent("Chip", filters.componentByName("Chip"));

export const Card = waitForComponent("Card", filters.componentByName("Card"));
export const AlbumCard = waitForCardComponent("Album");
export const ArtistCard = waitForCardComponent("Artist");
export const AudiobookCard = waitForCardComponent("Audiobook");
export const EpisodeCard = waitForCardComponent("Episode");
export const PlaylistCard = waitForCardComponent("Playlist");
export const ProfileCard = waitForCardComponent("Profile");
export const ShowCard = waitForCardComponent("Show");
export const TrackCard = waitForCardComponent("Track");
export const FeatureCard = waitForComponent(
    "FeatureCard",
    filters.componentByCode("?highlight", "headerText", "imageContainer")
);
export const HeroCard = waitForComponent("HeroCard", filters.componentByCode('"herocard-click-handler"'));
export const CardImage = waitForComponent(
    "CardImage",
    filters.componentByCode("isHero", /withWaves|isCircular/, "imageWrapper")
);

export const Router = waitForComponent("Router", filters.componentByCode("navigationType", "static"));
export const Routes = waitForComponent(
    "Routes",
    filters.componentByCode(/\([\w$]+\)\{let\{children:[\w$]+,location:[\w$]+\}=[\w$]+/)
);
export const Route = waitForComponent(
    "Route",
    filters.componentByCode(/^function [\w$]+\([\w$]+\)\{\(0,[\w$]+\.[\w$]+\)\(\!1\)\}$/)
);
export const Link = waitForComponent<
    ComponentType<
        PropsWithChildren<{
            to?: string;
            pageId?: string;
            /** @default false */
            draggable?: boolean;
            state?: any;
            search?: any;
            pathname?: string;
            tabIndex?: number;
            /** @default false */
            stopPropagation?: boolean;
            onClick?: (e: MouseEvent) => void;
        }>
    >
>("Link", filters.componentByCode("pageId", "_blank"));
export const Navigation = waitForComponent(
    "Navigation",
    filters.componentByCode("onClick", "referrer", "navigationalRoot")
);

export const StoreProvider = waitForComponent(
    "StoreProvider",
    filters.componentByCode("notifyNestedSubs", "serverState")
);
export const ScrollableContainer = waitForComponent(
    "ScrollableContainer",
    filters.componentByCode("scrollLeft", "showButtons")
);

export const HomeHeader = waitForComponent("HomeHeader", filters.componentByCode(/}\),style:{backgroundColor:.}}\)/));
export const SearchBar = waitForComponent<
    ComponentType<{
        alwaysExpanded?: boolean;
        placeholder?: string;
        filterBoxApiRef?: Ref<unknown>;
        outerRef?: Ref<unknown>;
        clearOnEscapeInElementRef?: Ref<unknown>;
        /** @default 300 */
        debounceFilterChangeTimeout?: number;
        /** @default "left" */
        expandDirection?: "right" | "left";
        /** @default false */
        fullWidth?: boolean;
        onFilter?: (input: string) => void;
        onClear?: () => void;
        onActivate?: () => void;
    }>
>("SearchBar", filters.componentByCode("alwaysExpanded", "filterBoxApiRef", "clearOnEscapeInElementRef"));
export const FilterProvider = waitForComponent(
    "FilterProvider",
    filters.componentByCode("lastFilterState", "lastFilteredUri")
);

export const ModalWrapper = waitForComponent<
    ComponentType<
        ComponentProps<"div"> &
            PropsWithChildren<{
                isOpen?: boolean;
                contentLabel?: string;
                className?: string;
                id?: string;
                overlayClassName?: string;
                animated?: boolean;
                animation?: {
                    closeTimeoutMs?: number;
                    modal?: {
                        base: unknown;
                        afterOpen: unknown;
                        beforeClose: unknown;
                    };
                };
                /** @default true */
                shouldFocusAfterRender?: boolean;
            }>
    >
>("Modal", filters.componentByCode("modal?."));
