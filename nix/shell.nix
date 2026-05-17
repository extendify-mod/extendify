{
  mkShell,
  bun,
  cargo,
  rustc,
  rustfmt,
  rust-analyzer,
  clang,
  spotify,
  llvmPackages,
  self,
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

    spotify
  ];

  env = {
    LIBCLANG_PATH = "${llvmPackages.libclang.lib}/lib";
    CEF_PATH = self.packages.${stdenv.hostPlatform.system}.cef;
  };
}
