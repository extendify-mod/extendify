import { registerContext } from "@api/context";
import { redirectTo, registerPage } from "@api/router";
import { registerTopbarElement } from "@api/topbar";
import { ExtendifyPage } from "@components/settings";
import { ButtonPrimary } from "@components/spotify";

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
