import { registerInterval } from "@api/context";
import { exportFunction, registerPatch } from "@api/context/patch";
import { registerPlugin } from "@api/context/plugin";
import { platform, productState, registerApiOverride } from "@api/platform";
import { globalStore } from "@api/redux";
import type { ProductStateAPI } from "@shared/types/spotify";
import type { SlotSettingsClient, SlotsClient } from "@shared/types/spotify/ads";
import { exportFilters, findModuleExportLazy } from "@webpack/module";

const slotsClient = findModuleExportLazy<SlotsClient>(
    exportFilters.byProps("clearAllAds", "getSlots")
);
const settingsClient = findModuleExportLazy<SlotSettingsClient>(
    exportFilters.byProps("updateAdServerEndpoint")
);

const { plugin, logger } = registerPlugin({
    authors: ["7elia"],
    description: "Block ads on Spotify",
    name: "AdBlock",
    platforms: ["desktop", "browser"]
});

registerInterval(plugin, configure, 10_000);
registerInterval(plugin, configureReduxState, 1000);

registerPatch(plugin, {
    find: 'type:"PLAY_AT_FIRST_TAP_HAD_DEFERRED_ACTIONS"',
    replacement: {
        match: /(\.\.\.\i,productState:)(\i\.data)/,
        replace: "$1$exp.modifyProductStateRaw($2)"
    }
});

registerPatch(plugin, {
    find: '"xpui"',
    replacement: {
        match: /(initialProductState:)(\i),/,
        replace: "$1$exp.modifyProductStateRaw($2),"
    }
});

function modifyProductStateRaw(values: any) {
    return {
        ...values,
        ads: "0",
        catalogue: "premium",
        type: "premium"
    };
}

exportFunction(plugin, modifyProductStateRaw);

registerApiOverride(plugin, "ProductStateAPI", async function getValues(this: ProductStateAPI) {
    const values = await (this as any).getValues_orig();
    return modifyProductStateRaw(values);
});

registerApiOverride(
    plugin,
    "ProductStateAPI",
    async function getCachedValues(this: ProductStateAPI) {
        const values = await (this as any).getCachedValues_orig();
        return modifyProductStateRaw(values);
    }
);

async function configure() {
    try {
        await configureSlotsClient();
    } catch {
        logger.warn("Blocking slotted ads might be patched");
    }
    await configureAdManagers();
    configureProductState();
}

/** I'm pretty sure this is patched */
async function configureSlotsClient() {
    if (!platform || !slotsClient) {
        return;
    }

    const { audio } = platform.getAdManagers();

    const slots = await slotsClient.getSlots();
    for (const slot of slots.adSlots) {
        const slotId = slot.slotId ?? slot.slot_id;
        if (!slotId) {
            continue;
        }

        async function clearSlot() {
            slotsClient.clearAllAds({ slotId });

            await settingsClient.updateAdServerEndpoint({
                slotIds: [slotId],
                url: "https://poop.com"
            });
            await settingsClient.updateSlotEnabled({ enabled: false, slotId });
            await settingsClient.updateStreamTimeInterval({ slotId, timeInterval: BigInt(0) });
            await settingsClient.updateDisplayTimeInterval({ slotId, timeInterval: BigInt(0) });
        }

        await clearSlot();

        audio.inStreamApi.adsCoreConnector.subscribeToSlot(slotId, async () => {
            audio.inStreamApi.adsCoreConnector.clearSlot(slotId);

            await clearSlot();
        });
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

    productState.productStateApi.subValues({ keys: ["ads", "catalogue", "type"] }, () => {
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
