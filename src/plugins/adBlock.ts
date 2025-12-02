import { registerPlugin } from "@api/context/plugin";
import { platform, productState } from "@api/platform";
import type { AdsTestingClient, SlotSettingsClient, SlotsClient } from "@shared/types/spotify/ads";
import { exportFilters, findModuleExport } from "@webpack/module";

registerPlugin({
    authors: ["7elia"],
    description: "Block ads on Spotify",
    name: "AdBlock",
    platforms: ["desktop", "browser"],
    async start() {
        await configureSlotsClient();
        await configureAdManagers();
        await configureProductState();
        await configureTestingClient();
    }
});

async function configureSlotsClient() {
    if (!platform) {
        return;
    }

    const { audio } = platform.getAdManagers();
    const slotsClient = await findModuleExport<SlotsClient>(
        exportFilters.byProps("clearAllAds", "getSlots")
    );
    const settingsClient = await findModuleExport<SlotSettingsClient>(
        exportFilters.byProps("updateAdServerEndpoint")
    );

    const slots = await slotsClient.getSlots();
    for (const slot of slots.adSlots) {
        audio.inStreamApi.adsCoreConnector.subscribeToSlot(
            slot.slotId ?? slot.slot_id,
            async data => {
                const slotId = data?.adSlotEvent?.slotId;
                if (!slotId) {
                    return;
                }

                audio.inStreamApi.adsCoreConnector.clearSlot(slotId);
                slotsClient.clearAllAds({ slotId });

                await settingsClient.updateAdServerEndpoint({
                    slotIds: [slotId],
                    url: "https://poop.com"
                });
                await settingsClient.updateSlotEnabled({ enabled: false, slotId });
                await settingsClient.updateStreamTimeInterval({ slotId, timeInterval: "0" });
                await settingsClient.updateDisplayTimeInterval({ slotId, timeInterval: "0" });
            }
        );
    }
}

// TODO: (await resolveApi("ProductStateAPI").productStateApi.getValues()).pairs["financial-product"]
async function configureProductState() {
    productState.productStateApi.subValues({ keys: ["ads", "catalogue", "premium"] }, () => {
        productState.productStateApi.putOverridesValues({
            pairs: {
                ads: "0",
                catalogue: "premium",
                type: "premium"
            }
        });
    });
}

async function configureTestingClient() {
    const testingClient = await findModuleExport<AdsTestingClient>(
        exportFilters.byProps("addPlaytime")
    );

    testingClient.addPlaytime({ seconds: -1000000000000000 });
}

async function configureAdManagers() {
    if (!platform) {
        return;
    }

    const { audio, billboard, inStreamApi, leaderboard, sponsoredPlaylist, vto } =
        platform.getAdManagers();

    audio.disable();
    await billboard.disable();
    inStreamApi.disable();
    leaderboard.disableLeaderboard();
    sponsoredPlaylist.disable();
    vto.manager.disable();
}
