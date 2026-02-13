import { registerInterval } from "@api/context";
import { registerPlugin } from "@api/context/plugin";
import { platform, productState } from "@api/platform";
import { globalStore } from "@api/redux";
import type { SlotSettingsClient, SlotsClient } from "@shared/types/spotify/ads";
import { exportFilters, findModuleExportLazy } from "@webpack/module";

const slotsClient = findModuleExportLazy<SlotsClient>(
    exportFilters.byProps("clearAllAds", "getSlots")
);
const settingsClient = findModuleExportLazy<SlotSettingsClient>(
    exportFilters.byProps("updateAdServerEndpoint")
);

const { plugin } = registerPlugin({
    authors: ["7elia"],
    description: "Block ads on Spotify",
    name: "AdBlock",
    platforms: ["desktop", "browser"]
});

registerInterval(plugin, configure, 10_000);
registerInterval(plugin, configureReduxState, 1000);

async function configure() {
    await configureSlotsClient();
    await configureAdManagers();
    configureProductState();
}

async function configureSlotsClient() {
    if (!platform) {
        return;
    }

    const { audio } = platform.getAdManagers();

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
                await settingsClient.updateStreamTimeInterval({ slotId, timeInterval: BigInt(0) });
                await settingsClient.updateDisplayTimeInterval({ slotId, timeInterval: BigInt(0) });
            }
        );
    }
}

// TODO: (await resolveApi("ProductStateAPI").productStateApi.getValues()).pairs["financial-product"]
function configureProductState() {
    const overrides = {
        pairs: {
            ads: "0",
            catalogue: "premium",
            type: "premium"
        }
    };

    productState.productStateApi.subValues({ keys: ["ads", "catalogue", "premium"] }, () => {
        productState.productStateApi.putOverridesValues(overrides);
    });

    productState.productStateApi.putOverridesValues(overrides);
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

function configureReduxState() {
    if (!globalStore) {
        return;
    }

    const { root } = globalStore.getState().ads;
    if (!root.adsEnabled && root.isHptoHidden && root.isPremium) {
        return;
    }

    globalStore.dispatch({ type: "ADS_DISABLED" });
    globalStore.dispatch({ isPremium: true, type: "ADS_PREMIUM" });
    globalStore.dispatch({ isHptoHidden: true, type: "ADS_HPTO_HIDDEN" });
    globalStore.dispatch({ type: "ADS_POST_HIDE_HPTO" });
}
