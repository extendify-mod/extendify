import type { Patch, PatchDef } from "@shared/types/patch";
import type { Plugin } from "@shared/types/plugin";

export const patches: Patch[] = [];

export function registerPatch(owner: Plugin, patch: PatchDef) {
    patches.push({ owner, ...patch });
}
