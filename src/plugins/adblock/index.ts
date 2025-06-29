/**
Implementation of rxri's adblock plugin.
@link https://github.com/rxri/spicetify-extensions/blob/main/adblock/adblock.ts
*/
import "./index.css";

import { Devs } from "@utils/constants";
import { StartAt, definePlugin } from "@utils/types";
import { cosmos, findService, platform } from "@webpack/common";
import { ProductStateAPI } from "@webpack/types";

interface SettingsClient {
    updateAdServerEndpoint(params: { slotIds: string[]; url: string }): Promise<void>;
    updateDisplayTimeInterval(params: { slotId: string; timeInterval: string }): Promise<void>;
    updateSlotEnabled(params: { slotId: string; enabled: boolean }): Promise<void>;
    updateStreamTimeInterval(params: { slotId: string; timeInterval: string }): Promise<void>;
}

interface SlotsClient {
    clearAllAds(params: { slotId: string }): Promise<void>;
}

export default definePlugin({
    name: "Adblock",
    description: "Block ads on Spotify",
    authors: [Devs.elia],
    startAt: StartAt.ApisLoaded,
    hidden: true,
    start: async () => {
        const productState = platform
            .getRegistry()
            .resolve<ProductStateAPI>(Symbol.for("ProductStateAPI")).productStateApi;
        await productState.putOverridesValues({
            pairs: {
                ads: "0",
                catalogue: "premium",
                product: "premium",
                type: "premium"
            }
        });

        await cosmos.post("sp://ads/v1/testing/playtime", { value: -100000000000 });

        const adManagers = platform.getAdManagers();
        await adManagers.audio.disable();
        await adManagers.billboard.disable();
        await adManagers.leaderboard.disableLeaderboard();
        await adManagers.sponsoredPlaylist.disable();
        await adManagers.inStreamApi.disable();
        await adManagers.vto.manager.disable();

        const slots = await cosmos.get<any>("sp://ads/v1/slots");
        const slotsClient: SlotsClient = findService("spotify.ads.esperanto.proto.Slots");
        const settingsClient: SettingsClient = findService("spotify.ads.esperanto.proto.Settings");

        for (const slot of slots) {
            adManagers.audio.inStreamApi.adsCoreConnector.subscribeToSlot(
                slot.slot_id,
                (data: { adSlotEvent: { slotId: string } }) => {
                    const slotId = data.adSlotEvent.slotId;

                    const adsCoreConnector = adManagers.audio.inStreamApi.adsCoreConnector;

                    setTimeout(async () => {
                        if (typeof adsCoreConnector.clearSlot === "function") {
                            adsCoreConnector.clearSlot(slotId);
                        }

                        slotsClient.clearAllAds({ slotId });

                        await settingsClient.updateAdServerEndpoint({
                            slotIds: [slotId],
                            url: "http://localhost/"
                        });
                        await settingsClient.updateStreamTimeInterval({ slotId, timeInterval: "0" });
                        await settingsClient.updateSlotEnabled({ slotId, enabled: false });
                        await settingsClient.updateDisplayTimeInterval({ slotId, timeInterval: "0" });
                    }, 50);
                }
            );
        }
    }
});
