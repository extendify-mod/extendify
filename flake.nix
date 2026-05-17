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

      # Generate these with `python ./packages/native/scripts/find_cef_pin.py`
      cefPinned = pkgs.cef-binary.override {
        version = "144.0.11";
        gitRevision = "e135be2";
        chromiumVersion = "144.0.7559.97";
        srcHashes.${system} = "sha256-almKJ18g//Wi2CDRX1yibODvR6TF0DlUl1EnDNlIHBY=";
      };
    in
    {
      devShells.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          bun

          cargo
          rustc
          rustfmt
          rust-analyzer

          clang
          llvmPackages.libclang

          python3
          python3Packages.requests

          cefPinned
        ];
      };

      defaultPackage.${system} = pkgs.rustPlatform.buildRustPackage {
        pname = "extendify";
        version = "0.0.0";

        src = ./.;

        cargoLock.lockFile = ./Cargo.lock;

        nativeBuildInputs = with pkgs; [
          clang
          llvmPackages.libclang
          pkg-config
          makeWrapper
          cefPinned
        ];

        buildInputs = with pkgs; [
          spotify
        ];

        env = {
          CEF_PATH = cefPinned;
          LIBCLANG_PATH = "${pkgs.llvmPackages.libclang.lib}/lib";
        };

        postInstall = ''
          wrapProgram ${pkgs.spotify}/bin/spotify \
            --set LD_PRELOAD "${self}/lib/libextendify_native.so"
        '';
      };
    };
}
