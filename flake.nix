{
  description = "Native Spotify client modification";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    {
      self,
      nixpkgs,
    }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];
      forEachSystem = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forEachSystem (
        system:
        let
          pkgs = import nixpkgs {
            inherit system;
            config.allowUnfree = true;
          };
        in
        {

          default = pkgs.callPackage ./nix/shell.nix { inherit self; };
        }
      );

      packages = forEachSystem (
        system:
        let
          pkgs = import nixpkgs {
            inherit system;
            config.allowUnfree = true;
          };
        in
        {
          cef = pkgs.callPackage ./nix/cef.nix { };
          extendify-native = pkgs.callPackage ./nix/native.nix { inherit self; };
          spotify-extendify = pkgs.callPackage ./nix/spotify-extendify.nix { inherit self; };
          default = self.packages.${system}.spotify-extendify;
        }
      );

      formatter = forEachSystem (
        system:
        let
          pkgs = import nixpkgs {
            inherit system;
            config.allowUnfree = true;
          };
        in
        pkgs.callPackage ./nix/fmt.nix { }
      );
    };
}
