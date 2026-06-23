{
  symlinkJoin,
  spotify,
  stdenv,
  makeWrapper,
  self,
  lib,
}: let
  exe =
    if stdenv.isDarwin
    then "Applications/Spotify.app/MacOS/Spotify"
    else "bin/spotify";
  preloadVar =
    if stdenv.isDarwin
    then "DYLD_INSERT_LIBRARIES"
    else "LD_PRELOAD";
in
  symlinkJoin {
    name = "spotify-extendify";
    inherit (spotify) version;

    paths = [
      spotify
      self.packages.${stdenv.hostPlatform.system}.extendify-native
    ];

    buildInputs = [makeWrapper];

    postBuild = ''
      wrapProgram $out/${exe} \
        --set ${preloadVar} $out/lib/libextendify_native.so
    '';

    meta = {
      mainProgram = "spotify";
      description = spotify.meta.description + "(patched with Extendify)";
      homepage = "https://github.com/extendify-mod/extendify";
      # wtf is the license
      # license = lib.licenses.gpl3;
      maintainers = [lib.maintainers.fazzi];
      platforms = [
        "x86_64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
    };
  }
