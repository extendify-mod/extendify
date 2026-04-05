import { registerPlugin } from "@api/context/plugin";
import {
    productStateService,
    registerInterceptor,
    settingsService,
    slotsService
} from "@api/esperanto";
import { platformPromise, productState } from "@api/platform";
import { globalStorePromise } from "@api/redux";
import type {
    Platform,
    ProductStateRaw,
    SettingsService,
    SlotsService
} from "@shared/types/spotify";

import type { Store } from "redux";

const MAX_UINT64 = 2n ** 64n - 1n;

const callbacks: { cancel: () => void }[] = [];

const { plugin } = registerPlugin({
    authors: ["7elia", "davri"],
    description: "Block ads on Spotify",
    name: "AdBlock",
    platforms: ["desktop", "browser"],
    async start() {
        if ("cache" in productState) productState.cache.clear();

        await platformPromise.then(configureAdManagers);
        await globalStorePromise.then(configureReduxState);
        await Promise.all([slotsService, settingsService])
            .then(args => configureServices(...args))
            .then(cbs => callbacks.push(...cbs));
    },
    stop() {
        // remove existing callbacks to prevent memory leaks
        callbacks.forEach(cb => void cb.cancel());
        callbacks.length = 0;
    }
});

registerInterceptor(plugin, productStateService, "GetValues", {
    onResponse: ({ message }) => modifyProductStateRaw(message)
});
registerInterceptor(plugin, productStateService, "SubValues", {
    onResponse: ({ message }) => modifyProductStateRaw(message)
});

function modifyProductStateRaw(data: ProductStateRaw) {
    Object.assign(data.pairs, {
        ads: "0",
        catalogue: "premium",
        type: "premium"
    });
}

async function configureServices(slotsService: SlotsService, settingsService: SettingsService) {
    const slots = await slotsService.getSlots();
    return slots.adSlots.map(({ slotId }) => {
        async function clearSlot() {
            await slotsService.clearAllAds({ slotId });

            await settingsService.updateAdServerEndpoint({
                slotIds: [slotId],
                url: "https://poop.com"
            });
            await settingsService.updateSlotEnabled({ enabled: false, slotId });
            await settingsService.updateStreamTimeInterval({ slotId, timeInterval: MAX_UINT64 });
            await settingsService.updateDisplayTimeInterval({ slotId, timeInterval: MAX_UINT64 });
            await settingsService.updateExpiryTimeInterval({ slotId, timeInterval: MAX_UINT64 });
        }

        clearSlot();

        return slotsService.subSlot({ slotId }, clearSlot);
    });
}

async function configureAdManagers(platform: Platform) {
    const { audio, billboard, inStreamApi, leaderboard, sponsoredPlaylist, vto } =
        platform.getAdManagers();

    audio.disable();
    await billboard.disable();
    inStreamApi.disable();
    leaderboard.disableLeaderboard();
    sponsoredPlaylist.disable();
    vto.manager.disable();
}

function configureReduxState(globalStore: Store) {
    const { root } = globalStore.getState().ads;
    if (!root.adsEnabled && root.isHptoHidden && root.isPremium) {
        return;
    }

    globalStore.dispatch({ type: "ADS_DISABLED" });
    globalStore.dispatch({ isPremium: true, type: "ADS_PREMIUM" });
    globalStore.dispatch({ isHptoHidden: true, type: "ADS_HPTO_HIDDEN" });
    globalStore.dispatch({ type: "ADS_POST_HIDE_HPTO" });
}
