import { exists, getSpotifyPath, wrapSpotifyProcess } from "../utils.mjs";

import { copyFile, readFile, readdir, rm, writeFile } from "fs/promises";
import JSZip from "jszip";
import { join } from "path";

const appsPath = join(getSpotifyPath(), "Apps");

const createXpuiPatch = async () => {
    const dir = await readdir(appsPath);
    if (dir.includes("xpui")) {
        await rm(join(appsPath, "xpui"), { recursive: true });
        console.log("Deleted xpui folder (might need to run Spotify updater)");
    }

    if (dir.includes("xpui.spa")) {
        if (!(await exists(join(appsPath, "_xpui.spa")))) {
            await copyFile(join(appsPath, "xpui.spa"), join(appsPath, "_xpui.spa"));
            console.log("Created backup");
        }

        const archive = await JSZip.loadAsync(await readFile(join(appsPath, "_xpui.spa"), "binary"));
        const dist = await readdir("dist");
        for (const fileName of dist) {
            archive.file(fileName, await readFile(join("dist", fileName)));
            console.log(`Copied ${fileName}`);
        }

        const buffer = await archive.generateAsync({ type: "uint8array" });
        await writeFile(join(appsPath, "xpui.spa"), buffer);
        console.log("Wrote new archive");
    }
};

wrapSpotifyProcess(createXpuiPatch);
