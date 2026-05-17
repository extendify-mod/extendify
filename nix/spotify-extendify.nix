{
  symlinkJoin,
  spotify,
  stdenv,
  makeWrapper,
  self,
  lib,
}:
symlinkJoin {
  name = "spotify-extendify";
  inherit (spotify) version;

  paths = [
    spotify
    self.packages.${stdenv.hostPlatform.system}.extendify-native
  ];

  buildInputs = [makeWrapper];

  postBuild = ''
    wrapProgram $out/bin/spotify \
      --set LD_PRELOAD $out/lib/libextendify_native.so
  '';

  meta = {
    mainProgram = "spotify";
    description = spotify.meta.description + "(patched with Extendify)";
    homepage = "https://github.com/extendify-mod/extendify";
    # wtf is the license
    # license = lib.licenses.gpl3;
    maintainers = [lib.maintainers.fazzi];
    platforms = ["x86_64-linux"];
  };
}
