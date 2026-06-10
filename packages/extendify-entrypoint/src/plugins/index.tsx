import { registerContext } from "@extendify/api/context";
import { redirectTo, registerPage } from "@extendify/api/router";
import { registerTopbarElement } from "@extendify/api/topbar";
import { ExtendifyPage } from "@extendify/components/settings";
import { ButtonPrimary } from "@extendify/components/spotify";

const { context } = registerContext({
    name: "Core",
    platforms: ["desktop", "browser"]
});

registerTopbarElement(context, () => (
    <ButtonPrimary onClick={() => redirectTo("/extendify")} size="small">
        Extendify
    </ButtonPrimary>
));

registerPage(context, {
    component() {
        return <ExtendifyPage />;
    },
    route: "/extendify"
});
