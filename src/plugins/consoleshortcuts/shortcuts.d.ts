import { findTranslation } from "@utils/spotify";
import { wreq } from "@webpack";
import { platform } from "@webpack/common";

declare global {
    interface Window {
        wreq: typeof wreq;
        registry: Record<string, any>;
        platform: typeof platform;

        findTranslation: typeof findTranslation;
    }
}
