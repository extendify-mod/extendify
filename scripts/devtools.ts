import { getCachePath } from "./utils";

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const bnkPath = join(getCachePath(), "offline.bnk");

const content = await readFile(bnkPath, "binary");
const buffer = Buffer.from(content, "binary");
const target = "app-developer";

let location;
if ((location = content.indexOf(target))) {
    buffer.write("2", location + target.length + 1);
}
if ((location = content.lastIndexOf(target))) {
    buffer.write("2", location + target.length + 2);
}

await writeFile(bnkPath, buffer, "binary");
console.log("Enabled devtools");
