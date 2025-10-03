import { exists, getAppsPath } from "./utils";

import { lstat } from "fs/promises";
import { copyFile, readFile, readdir, rm, writeFile } from "fs/promises";
import JSZip from "jszip";
import { join } from "path";

if (!(await exists("dist"))) {
    throw new Error("Extendify has not been built yet");
}

const appsPath = await getAppsPath();
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

const dist = await readdir("dist", { recursive: true });
for (const relativePath of dist) {
    const fullPath = join("dist", relativePath);

    if ((await lstat(fullPath)).isDirectory()) {
        continue;
    }

    const fileName = fullPath
        .substring(fullPath.lastIndexOf("\\") + 1)
        .substring(fullPath.lastIndexOf("/") + 1);

    archive.file(fileName, await readFile(fullPath));
    console.log(`Copied ${fileName}`);
}

const buffer = await archive.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 9 }
});

await writeFile(join(appsPath, "xpui.spa"), buffer);
console.log("Wrote new archive");
