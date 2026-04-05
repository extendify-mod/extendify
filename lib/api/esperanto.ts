import { registerContext } from "@api/context";
import { exportFunction, registerPatch } from "@api/context/patch";
import { createLazy } from "@shared/lazy";
import type { ProductStateService, SettingsService, SlotsService } from "@shared/types/spotify";
import type {
    EsperantoMethods,
    EsperantoService,
    ExtractInterceptor,
    Interceptor
} from "@shared/types/spotify/esperanto";

const services = new Map<string, EsperantoService>();
const serviceOptions = new Map<string, ServiceOptions>();

export const slotsService = resolveService<SlotsService>("spotify.ads.esperanto.proto.Slots");
export const settingsService = resolveService<SettingsService>(
    "spotify.ads.esperanto.proto.Settings"
);
export const productStateService = resolveService<ProductStateService>(
    "spotify.product_state.esperanto.proto.ProductState"
);

interface ServiceOptions {
    subscriptions: Set<(service: EsperantoService) => void>;
    interceptors: Map<string, Set<Interceptor>>;
}

const { context, logger } = registerContext({
    name: "Esperanto",
    platforms: ["desktop", "browser"]
});

registerPatch(context, {
    all: true,
    find: "static SERVICE_ID",
    replacement: {
        match: /constructor\(\i,\i=\{\}\)\{this\.transport=\i,this\.options=\i/g,
        replace: "$&;$exp.register(this);"
    }
});

export function getServiceOptions(id: string): ServiceOptions {
    let options = serviceOptions.get(id);
    if (!options) {
        options = { interceptors: new Map(), subscriptions: new Set() };
        serviceOptions.set(id, options);
    }

    return options;
}

exportFunction(context, function register(service: EsperantoService): void {
    const SERVICE_ID = service.constructor.SERVICE_ID;
    const { interceptors, subscriptions } = getServiceOptions(SERVICE_ID);

    const { onRequest, onResponse } = service.options;
    service.options = {
        onRequest: data => {
            onRequest?.(data);
            for (const { onRequest: req } of interceptors.get(data.method) ?? []) {
                req?.(data);
            }
        },
        onResponse: data => {
            onResponse?.(data);
            for (const { onResponse: res } of interceptors.get(data.method) ?? []) {
                res?.(data);
            }
        }
    };

    // The same service can be initialized multiple times (for example to be used in the debug window).
    // Each instance uses the same underlying transport layer, which means we only need to store it once
    if (services.has(SERVICE_ID)) return;
    services.set(SERVICE_ID, service);

    for (const callback of subscriptions) {
        callback(service);
    }
});

export function resolveService<T extends EsperantoService>(id: string): Promise<T> {
    return new Promise(resolve => {
        const { subscriptions } = getServiceOptions(id);

        subscriptions.add(service => resolve(service as T));
    });
}

export function resolveServiceLazy<T extends EsperantoService>(id: string): T {
    return createLazy(() => services.get(id)) as T;
}

export async function registerInterceptor<
    T extends EsperantoService,
    TMethod extends EsperantoMethods<T>
>(
    service: T | Promise<T>,
    method: TMethod,
    options: ExtractInterceptor<T, TMethod>
): Promise<void> {
    const instance = await service;
    if (!instance) return;

    const { interceptors } = getServiceOptions(instance.constructor.SERVICE_ID);

    if (!(method in instance.constructor.DECODERS)) {
        logger.error(
            `"${method}" is not a valid method name for ${instance.constructor.SERVICE_ID}. ` +
                `Try using a different capitalization.`
        );
        return;
    }

    let methodInterceptors = interceptors.get(method);
    if (!methodInterceptors) {
        methodInterceptors = new Set();
        interceptors.set(method, methodInterceptors);
    }

    methodInterceptors.add(options);
}
