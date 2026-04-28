import { getAppsPath } from "@scripts/utils";

import { copyFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { exit } from "node:process";

const appsPath = await getAppsPath();
if (!appsPath) {
    exit();
}
const apps = await readdir(appsPath);

// Using xpui folder
if (apps.includes("xpui")) {
    await rm(join(appsPath, "xpui"), { recursive: true });
    console.log("Deleted xpui folder");
}

if (!apps.includes("_xpui.spa")) {
    throw new Error("Spotify wasn't patched before");
}

await copyFile(join(appsPath, "_xpui.spa"), join(appsPath, "xpui.spa"));
console.log("Reverted patched xpui.spa");
