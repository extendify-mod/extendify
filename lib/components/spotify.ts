import { createLazyComponent } from "@shared/lazy";
import { exportFilters } from "@webpack/module";

import type { ComponentProps, ElementType, PropsWithChildren, ReactElement } from "react";

export type SemanticColor =
    | "textBase"
    | "textSubdued"
    | "textBrightAccent"
    | "textNegative"
    | "textWarning"
    | "textPositive"
    | "textAnnouncement";

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
export const PrimaryButton = createLazyComponent<EncoreButton>(
    exportFilters.byEncoreName("ButtonPrimary")
);

export const Route = createLazyComponent<{
    key: string;
    path: string;
    element: ReactElement;
}>(exportFilters.byCode(/^function [\w$]+\([\w$]+\)\{\(0,[\w$]+\.[\w$]+\)\(\!1\)\}$/));
