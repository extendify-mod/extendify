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
      # Spotify only ships on this so it's fine
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        config.allowUnfree = true;
      };
    in
    {
      devShells.${system} = {
        default = pkgs.callPackage ./nix/shell.nix { inherit self; };
      };

      packages.${system} = {
        cef = pkgs.callPackage ./nix/cef.nix { };
        extendify-native = pkgs.callPackage ./nix/native.nix { inherit self; };
        spotify-extendify = pkgs.callPackage ./nix/spotify-extendify.nix { inherit self; };
        default = self.packages.${system}.spotify-extendify;
      };
    };
}
