import { registerPlugin } from "@api/plugin";
import { wreq } from "@webpack";

registerPlugin({
    name: "ConsoleShortcuts",
    description: "Expose internal APIs to the window object",
    authors: ["7elia"],
    required: DEVELOPMENT,
    start() {
        Object.defineProperty(window, "wreq", {
            get() {
                return wreq;
            }
        });
    }
});
