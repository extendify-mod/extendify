import { type Context, isContextEnabled, registerContext } from "@api/context";
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
const serviceIds = new WeakMap<EsperantoService | Promise<EsperantoService>, string>();
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
    interceptors: Map<string, Set<{ interceptor: Interceptor; enabled: () => boolean }>>;
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

            const options = interceptors.get(data.method) ?? [];
            for (const { enabled, interceptor } of options) {
                if (enabled()) interceptor.onRequest?.(data);
            }
        },
        onResponse: data => {
            onResponse?.(data);

            const options = interceptors.get(data.method) ?? [];
            for (const { enabled, interceptor } of options) {
                if (enabled()) interceptor.onResponse?.(data);
            }
        }
    };

    // The same service can be initialized multiple times (for example to be used in the debug window).
    // Each instance uses the same underlying transport layer, which means we only need to store it once
    if (services.has(SERVICE_ID)) {
        return;
    }

    services.set(SERVICE_ID, service);
    serviceIds.set(service, SERVICE_ID);

    logger.debug(`Service ${SERVICE_ID} was registered.`);

    for (const callback of subscriptions) {
        callback(service);
    }

    subscriptions.clear();
});

export function resolveService<T extends EsperantoService>(id: string): Promise<T> {
    const cache = services.get(id);

    let promise: Promise<T>;
    if (cache) {
        promise = Promise.resolve(cache as T);
    } else {
        const { subscriptions } = getServiceOptions(id);
        promise = new Promise<T>(resolve => {
            subscriptions.add(service => resolve(service as T));
        });
    }

    serviceIds.set(promise, id);

    return promise;
}

export function resolveServiceLazy<T extends EsperantoService>(id: string): T {
    const cache = services.get(id);

    const proxy = createLazy(cache ? () => cache as T : resolveService<T>(id));
    serviceIds.set(proxy, id);

    return proxy;
}

async function validateEsperantoMethod(id: string, method: string) {
    const service = await resolveService(id).catch(() => null);
    if (!service) {
        logger.error(`Couldn't find service with id ${id}`);
        return;
    }

    if (!(method in service.constructor.DECODERS)) {
        logger.error(
            `"${method}" is not a valid method name for ${id}. Try using a different capitalization.`
        );
        return;
    }
}

export function registerInterceptor<
    T extends EsperantoService,
    TMethod extends EsperantoMethods<T>
>(
    context: Context,
    service: T | Promise<T>,
    method: TMethod,
    interceptor: ExtractInterceptor<T, TMethod>
): () => void {
    // Using an inverse lookup map to avoid having to interact with the proxy directly
    const SERVICE_ID = serviceIds.get(service);
    if (!SERVICE_ID) {
        return () => {};
    }

    validateEsperantoMethod(SERVICE_ID, method);

    const { interceptors } = getServiceOptions(SERVICE_ID);

    let methodInterceptors = interceptors.get(method);
    if (!methodInterceptors) {
        methodInterceptors = new Set();
        interceptors.set(method, methodInterceptors);
    }

    const options = { enabled: () => isContextEnabled(context), interceptor };
    methodInterceptors.add(options);

    logger.debug(`Registered interceptor for "${method}" on ${SERVICE_ID}`);

    return () => methodInterceptors.delete(options);
}
