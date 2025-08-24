import { createLazyComponent } from "@shared/lazy";
import { exportFilters } from "@webpack/module";

import type {
    ComponentProps,
    ComponentType,
    ElementType,
    PropsWithChildren,
    ReactElement
} from "react";

export type SemanticColor =
    | "textBase"
    | "textSubdued"
    | "textBrightAccent"
    | "textNegative"
    | "textWarning"
    | "textPositive"
    | "textAnnouncement";

type EncoreButton = ComponentType<
    ComponentProps<"button"> &
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
        }>
>;
export const PrimaryButton = createLazyComponent(exportFilters.byEncoreName("ButtonPrimary"));
