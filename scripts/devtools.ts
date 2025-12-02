import { getCachePath } from "@scripts/utils";

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
const target = "app-developer";

let location = content.indexOf(target);
if (location) {
    buffer.write("2", location + target.length + 1);
}

location = content.lastIndexOf(target);
if (location) {
    buffer.write("2", location + target.length + 2);
}

await writeFile(bnkPath, buffer, "binary");
console.log("Enabled devtools");
