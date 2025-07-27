import type { platform } from "@api/platform";
import type { wreq } from "@webpack";

declare global {
    interface Window {
        wreq: typeof wreq;
        platform: typeof platform;
    }
}

export {};
