{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    bun2nix.url = "github:baileyluTCD/bun2nix";
    bun2nix.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = {
    self,
    nixpkgs,
    bun2nix,
  }: let
    systems = ["x86_64-linux"];
    forEachSystem = nixpkgs.lib.genAttrs systems;
  in {
    packages = forEachSystem (system: let
      pkgs = import nixpkgs {
        inherit system;
        config.allowUnfreePredicate = pkg: pkgs.lib.getName pkg == "spotify";
      };
    in {
      default = pkgs.callPackage ./nix/package.nix {
        inherit (bun2nix.lib.${system}) mkBunDerivation;
      };
    });

    devShells = forEachSystem (system: let
      pkgs = import nixpkgs {
        inherit system;
        config.allowUnfreePredicate = pkg: pkgs.lib.getName pkg == "spotify";
      };
    in {
      default = pkgs.callPackage ./nix/shell.nix {
        bun2nixPkg = bun2nix.packages.${system}.default;
      };
    });

    hydraJobs = self.packages;
  };
}
