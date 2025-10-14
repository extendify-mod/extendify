export type TargetPlatform = "desktop" | "webos" | "browser";

export type AnyFn = ((...args: any[]) => any) & { name: string };
