import { getCachePath } from "./utils.mjs";

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const bnkPath = join(getCachePath(), "offline.bnk");

export async function enableDevtools() {
    const content = await readFile(bnkPath, "binary");

    const length = "app-developer".length;

    const firstLocation = content.indexOf("app-developer");
    const firstPatchLocation = firstLocation !== -1 ? firstLocation + length + 1 : -1;
    const secondLocation = content.lastIndexOf("app-developer");
    const secondPatchLocation = secondLocation !== -1 ? secondLocation + length + 2 : -1;

    const buffer = Buffer.from(content, "binary");
    if (firstPatchLocation !== -1) {
        buffer.write("2", firstPatchLocation, "binary");
    }
    if (secondPatchLocation !== -1) {
        buffer.write("2", secondPatchLocation, "binary");
    }

    await writeFile(bnkPath, buffer, "binary");
    console.log("Enabled devtools");
}
