export type TargetPlatform = "desktop" | "browser";

export type AnyFn = ((...args: any[]) => any) & { name: string };
