import { registerPlugin } from "@api/plugin";
import { DEVS } from "@shared/constants";

const plugin = registerPlugin({
    name: "Lpdeck",
    description: "Spotify integration with Lpdeck",
    authors: [DEVS.elia]
});
