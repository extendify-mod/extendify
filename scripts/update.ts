import { exists, getSpotifyPath, killSpotify } from "./utils";

import { spawnSync } from "bun";
import { writeFile } from "fs/promises";
import { rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

await killSpotify();

const root = await getSpotifyPath();

switch (process.platform) {
    case "win32":
        for (const subPath of ["Spotify.exe", "Apps"]) {
            const fullPath = path.join(root, subPath);

            if (await exists(fullPath)) {
                await rm(fullPath, { force: true, recursive: true });
                console.log(`Deleted ${fullPath}`);
            }
        }

        const downloadStart = performance.now();
        console.log("Downloading installer...");

        const installer = await (
            await fetch("https://download.scdn.co/SpotifySetup.exe", {
                method: "GET",
                cache: "no-cache",
                redirect: "follow"
            })
        ).bytes();

        const downloadTime = ((performance.now() - downloadStart) / 1000).toFixed(2);
        console.log(`Downloaded installer (${downloadTime} second(s))`);

        const installerPath = path.join(tmpdir(), "SpotifyInstaller.exe");
        await writeFile(installerPath, installer);

        console.log("Running installer");
        spawnSync({ cmd: [installerPath] });

        break;
    default:
        // If you want to implement your platform, it should do the following:
        // - Delete the Spotify executable file
        // - Delete the 'Apps' folder (has *.spa files)
        // - Download and run the latest Spotify installer, or copy official release files
        console.error(`Platform ${process.platform} isn't implemented in update script`);
        break;
}
