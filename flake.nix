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
    extendifyLib = import ./nix/lib.nix {inherit (nixpkgs) lib;};
    forEachSystem = nixpkgs.lib.genAttrs extendifyLib.systems;
    pkgsForSystem = system:
      import nixpkgs {
        inherit system;
        config.allowUnfree = true;
        # expose nix/lib.nix as `extendifyLib` to every callPackage'd file
        overlays = [(_: _: {inherit extendifyLib;})];
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
