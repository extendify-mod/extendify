import { registerContext } from "@api/context";
import { redirectTo, registerPage } from "@api/page";
import { registerTopbarElement } from "@api/topbar";
import { ExtendifyPage } from "@components/settings/SettingsPage";
import { PrimaryButton } from "@components/spotify";

const { context } = registerContext({
    name: "Core",
    platforms: ["desktop"]
});

registerTopbarElement(context, () => (
    <PrimaryButton size="small" onClick={() => redirectTo("/extendify")}>
        Extendify
    </PrimaryButton>
));

registerPage(context, {
    route: "/extendify",
    component: () => <ExtendifyPage />
});
