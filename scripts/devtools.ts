import { getCachePath } from "@scripts/utils";
import { DEVTOOLS_TARGET } from "@shared/constants";

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exit } from "node:process";

const cachePath = await getCachePath();
if (!cachePath) {
    exit();
}
const bnkPath = join(cachePath, "offline.bnk");

const content = await readFile(bnkPath, "binary");
const buffer = Buffer.from(content, "binary");

let location = content.indexOf(DEVTOOLS_TARGET);
if (location) {
    buffer.write("2", location + DEVTOOLS_TARGET.length + 1);
}

location = content.lastIndexOf(DEVTOOLS_TARGET);
if (location) {
    buffer.write("2", location + DEVTOOLS_TARGET.length + 2);
}

await writeFile(bnkPath, buffer, "binary");
console.log("Enabled devtools");
