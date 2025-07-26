import { registerPlugin } from "@api/plugin";

registerPlugin({
    name: "Lpdeck",
    description: "Spotify integration with Lpdeck",
    authors: ["7elia"],
    start() {
        console.log("Started");
    }
});
