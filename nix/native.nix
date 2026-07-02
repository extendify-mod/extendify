{
  rustPlatform,
  clang,
  pkg-config,
  openssl,
  llvmPackages,
  lib,
  self,
  stdenv,
}:
rustPlatform.buildRustPackage {
  pname = "extendify-native";
  version = (lib.importTOML ../crates/extendify-native/Cargo.toml).package.version;

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../crates
      ../Cargo.lock
      ../Cargo.toml
    ];
  };

  cargoLock = {
    lockFile = ../Cargo.lock;
    allowBuiltinFetchGit = true;
  };

  nativeBuildInputs = [
    clang
    pkg-config
  ];

  buildInputs = [
    openssl
  ];

  env = {
    LIBCLANG_PATH = "${llvmPackages.libclang.lib}/lib";
    CEF_PATH = self.packages.${stdenv.hostPlatform.system}.cef;
  };

  meta = {
    homepage = "https://github.com/extendify-mod/extendify";
    # wtf is the license
    # license = lib.licenses.gpl3;
    maintainers = [ lib.maintainers.fazzi ];
    platforms = [
      "x86_64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ];
  };
}
