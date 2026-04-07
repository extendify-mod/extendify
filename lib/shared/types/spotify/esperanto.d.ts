type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

// Contravariance hack, makes type extraction less annoying
declare const __key: unique symbol;

interface ProtoCodec<T> {
    fromPartial(object: DeepPartial<T>): T;
    encode(message: T): { finish(): Uint8Array };
    decode(reader: unknown, length?: number): T;
}

interface Payload<T, TMethod extends string = string, TStream extends boolean = boolean> {
    type: TStream extends false ? "single" : "stream";
    service: string;
    method: TMethod;
    message: T;
    messageType: ProtoCodec<T>;
}

type Method<TRequest, TResponse> = (
    request?: DeepPartial<TRequest>,
    options?: { signal?: AbortSignal }
) => Promise<TResponse>;

type StreamMethod<TRequest, TResponse> = (
    request: DeepPartial<TRequest>,
    onData: (response: TResponse) => void
) => { cancel: () => void };

type CallableProps<T extends object> = {
    [K in Extract<keyof T, string>]: T[K] extends (...args: any[]) => unknown ? K : never;
}[Extract<keyof T, string>];

// For some reason spotify is super inconsistent when it comes to capitalization
type EsperantoMethodName<T extends string = string> = Capitalize<T> | Uncapitalize<T>;
export type EsperantoMethods<T extends object> = EsperantoMethodName<CallableProps<T>>;

export interface Interceptor<
    TReq = unknown,
    TRes = unknown,
    TMethod extends string = string & {},
    TStream extends boolean = boolean
> {
    onRequest?(payload: Payload<TReq, TMethod, TStream>): void;
    onResponse?(payload: Payload<TRes, TMethod, TStream>): void;
}

export type ExtractInterceptor<
    T extends EsperantoService,
    TMethod extends EsperantoMethods<T>
> = Omit<Extract<T["options"], { [__key]: EsperantoMethodName<TMethod> }>, typeof __key>;

type MethodInterceptor<
    T extends Record<string, unknown> = Record<string, unknown>,
    TMethod extends CallableProps<T> = CallableProps<T>
> = InferMethodTypes<T[TMethod]> extends [infer Req, infer Res, infer Stream extends boolean]
    ? Interceptor<Req, Res, TMethod, Stream> & { [__key]: EsperantoMethodName<TMethod> }
    : never;

type InferMethodTypes<T> = T extends (req: infer Request) => infer Response
    ? [Request, Response, false]
    : T extends (req: infer Request, cb: (res?: infer Response) => unknown) => unknown
      ? [Request, Response, true]
      : [];

export type EsperantoService<T extends Record<string, unknown> = Record<string, unknown>> = {
    constructor: EsperantoServiceClass<T>;
    options: { [K in CallableProps<T>]: MethodInterceptor<T, K> }[CallableProps<T>] | Interceptor;
} & {
    [K in keyof T]: InferMethodTypes<T[K]> extends [infer Req, infer Res, infer Stream]
        ? Stream extends false
            ? Method<Req, Res>
            : StreamMethod<Req, Res>
        : T[K];
};

interface EsperantoServiceClass<T extends Record<string, unknown> = Record<string, unknown>> {
    SERVICE_ID: string;
    METHODS: {
        [K in CallableProps<T>]: InferMethodTypes<T[K]> extends [infer Req, infer Res, infer Stream]
            ? { isStreaming: Stream; requestType: ProtoCodec<Req>; responseType: ProtoCodec<Res> }
            : never;
    };
    DECODERS: {
        [K in CallableProps<T> as EsperantoMethodName<K>]: InferMethodTypes<T[K]> extends [
            infer Req,
            infer Res,
            boolean
        ]
            ? { request: ProtoCodec<Req>["decode"]; response: ProtoCodec<Res>["decode"] }
            : never;
    };
}
