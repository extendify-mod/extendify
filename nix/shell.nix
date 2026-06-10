{
  bun,
  cargo,
  rustc,
  rustfmt,
  rust-analyzer,
  clang,
  spotify,
  llvmPackages,
  pkg-config,
  openssl,
  python3,
  python3Packages,
  self,
  mkShell,
  stdenv,
}:
mkShell {
  packages = [
    bun

    cargo
    rustc
    rustfmt
    rust-analyzer

    clang
    llvmPackages.libclang

    pkg-config
    openssl

    spotify

    python3
    python3Packages.requests
  ];

  env = {
    LIBCLANG_PATH = "${llvmPackages.libclang.lib}/lib";
    CEF_PATH = self.packages.${stdenv.hostPlatform.system}.cef;
  };
}
