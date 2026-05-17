{
  rustPlatform,
  clang,
  llvmPackages,
  lib,
  self,
  stdenv,
}:
rustPlatform.buildRustPackage {
  pname = "extendify-native";
  version =
    (lib.importTOML ../packages/native/Cargo.toml).package.version;

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../packages/native
      ../Cargo.lock
      ../Cargo.toml
    ];
  };

  cargoLock.lockFile = ../Cargo.lock;

  nativeBuildInputs = [
    clang
  ];

  env = {
    LIBCLANG_PATH = "${llvmPackages.libclang.lib}/lib";
    CEF_PATH = self.packages.${stdenv.hostPlatform.system}.cef;
  };

  meta = {
    homepage = "https://github.com/extendify-mod/extendify";
    # wtf is the license
    # license = lib.licenses.gpl3;
    maintainers = [lib.maintainers.fazzi];
    platforms = ["x86_64-linux"];
  };
}
