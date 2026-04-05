import { registerEventListener } from "@api/context/event";
import { registerPlugin } from "@api/context/plugin";
import { isPluginEnabled } from "@api/context/settings";
import {
    productStateService,
    registerInterceptor,
    settingsService,
    slotsService
} from "@api/esperanto";
import { platform } from "@api/platform";
import type {
    Platform,
    ProductStateRaw,
    SettingsService,
    SlotsService
} from "@shared/types/spotify";

import type { Store } from "redux";

const MAX_UINT64 = 2n ** 64n - 1n;

const platformPromise = Promise.withResolvers<Platform>();
const reduxPromise = Promise.withResolvers<Store>();
const callbacks: { cancel: () => void }[] = [];

const { plugin } = registerPlugin({
    authors: ["7elia", "davri"],
    description: "Block ads on Spotify",
    name: "AdBlock",
    platforms: ["desktop", "browser"],
    async start() {
        await platformPromise.promise.then(configureAdManagers);
        await reduxPromise.promise.then(configureReduxState);
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

registerEventListener(plugin, "platformLoaded", () =>
    platformPromise.resolve(platform as Platform)
);
registerEventListener(plugin, "reduxLoaded", store => reduxPromise.resolve(store));

registerInterceptor(productStateService, "GetValues", {
    onResponse: ({ message }) => modifyProductStateRaw(message)
});
registerInterceptor(productStateService, "SubValues", {
    onResponse: ({ message }) => modifyProductStateRaw(message)
});

function modifyProductStateRaw(data: ProductStateRaw) {
    if (!isPluginEnabled(plugin)) return;
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
