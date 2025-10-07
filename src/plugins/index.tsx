import { registerContext } from "@api/context";
import { redirectTo, registerPage } from "@api/page";
import { registerTopbarElement } from "@api/topbar";
import { ExtendifyPage } from "@components/settings";
import { ButtonPrimary } from "@components/spotify";

const { context } = registerContext({
    name: "Core",
    platforms: ["desktop", "browser"]
});

registerTopbarElement(context, () => (
    <ButtonPrimary size="small" onClick={() => redirectTo("/extendify")}>
        Extendify
    </ButtonPrimary>
));

registerPage(context, {
    route: "/extendify",
    component() {
        return <ExtendifyPage />;
    }
});
