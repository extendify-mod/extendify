import { execSync } from "child_process";

try {
    execSync("bun2nix -o bun.nix", {
        stdio: "ignore"
    });
} catch {}
