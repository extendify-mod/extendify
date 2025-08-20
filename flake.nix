{
    description = "Extendify dev flake";

    inputs = {
        nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    };

    outputs = { nixpkgs, ... }:
        let
            pkgs = import nixpkgs {
                system = "x86_64-linux";
                config.allowUnfree = true;
            };
        in
        {
            devShells.${pkgs.system}.default = pkgs.mkShell {
                nativeBuildInputs = with pkgs; [ bun ];
                packages = with pkgs; [
                    bun
                    spotify.overrideAttrs (old: {
                        patchPhase = ''
                            ${old.patchPhase or ""}
                            bun run build-dev
                            bun run kill-proc
                            bun run patch --spotifyPath="${pkgs.spotify}"
                            bun run devtools
                            bun run start-proc
                        '';
                    })
                ];
            };
        };
}
