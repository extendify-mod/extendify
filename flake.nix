{
  description = "Native Spotify client modification";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    crane.url = "github:ipetkov/crane";
  };

  outputs = {
    self,
    nixpkgs,
    crane,
  }: let
    systems = [
      "x86_64-linux"
      "aarch64-darwin"
    ];
    forEachSystem = nixpkgs.lib.genAttrs systems;
    pkgsForSystem = system:
      import nixpkgs {
        inherit system;
        config.allowUnfree = true;
      };
  in {
    devShells = forEachSystem (system: {
      default = (pkgsForSystem system).callPackage ./nix/shell.nix {
        inherit self;
      };
    });

    packages = forEachSystem (
      system: let
        pkgs = pkgsForSystem system;
        craneLib = crane.mkLib pkgs;
      in {
        cef = pkgs.callPackage ./nix/cef.nix {};
        extendify-native = pkgs.callPackage ./nix/native.nix {
          inherit self craneLib;
        };
        spotify-extendify = pkgs.callPackage ./nix/spotify-extendify.nix {
          inherit self;
        };
        default = self.packages.${system}.spotify-extendify;
      }
    );

    formatter = forEachSystem (
      system: let
        pkgs = pkgsForSystem system;
      in
        pkgs.callPackage ./nix/fmt.nix {}
    );
  };
}
