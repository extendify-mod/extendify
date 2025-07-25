import { exists, getAppsPath } from "./utils";

import JSZip from "jszip";
import { copyFile, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

if (!(await exists("dist"))) {
    throw new Error("Extendify has not been built yet");
}

const appsPath = getAppsPath();
const apps = await readdir(appsPath);

// Using xpui folder instead of archive (Likely from Spicetify installation)
if (apps.includes("xpui")) {
    await rm(join(appsPath, "xpui"), { recursive: true });
    console.log("Deleted xpui folder");
}

if (!apps.includes("xpui.spa")) {
    throw new Error("No xpui.spa archive found, please update Spotify");
}

if (!apps.includes("_xpui.spa")) {
    // TODO: compare versions between xpui.spa and _xpui.spa
    await copyFile(join(appsPath, "xpui.spa"), join(appsPath, "_xpui.spa"));
    console.log("Created backup & patch reference");
}

const archive = await JSZip.loadAsync(await readFile(join(appsPath, "_xpui.spa"), "binary"));
const dist = await readdir("dist");
for (const fileName of dist) {
    archive.file(fileName, await readFile(join("dist", fileName)));
    console.log(`Copied ${fileName}`);
}

const buffer = await archive.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 9 }
});

await writeFile(join(appsPath, "xpui.spa"), buffer);
console.log("Wrote new archive");
