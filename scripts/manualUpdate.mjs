import { exists, getSpotifyPath, killSpotify } from "./utils.mjs";

import { execFileSync } from "child_process";
import { rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

const root = getSpotifyPath();

await killSpotify();

switch (process.platform) {
    case "win32":
        for (const subPath of ["Spotify.exe", "Apps/xpui.spa", "Apps/_xpui.spa"]) {
            const fullPath = path.join(root, subPath);
            if (await exists(fullPath)) {
                await rm(fullPath, { force: true, recursive: true });
                console.log(`Deleted file ${fullPath}`);
            }
        }

        const installerPath = path.join(tmpdir(), "SpotifyInstaller.exe");

        console.log("Downloading installer...");
        const installer = await (
            await fetch("https://download.scdn.co/SpotifySetup.exe", {
                method: "GET",
                cache: "no-cache",
                redirect: "follow"
            })
        ).bytes();
        console.log("Downloaded installer");
        await writeFile(installerPath, installer);

        console.log("Running installer");
        execFileSync(installerPath);

        break;
    default:
        // If you want to implement your platform, it should do the following:
        // - Delete the Spotify executable file
        // - Delete the 'xpui.spa' and '_xpui.spa' files (presumably in an 'Apps' folder)
        // - Download and run the latest Spotify installer, or copy official release files
        console.error(`Platform ${process.platform} isn't implemented in manual update script.`);
        break;
}
