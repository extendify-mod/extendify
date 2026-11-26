{
  symlinkJoin,
  spotify,
  stdenv,
  makeWrapper,
  self,
  extendifyLib,
}: let
  exe =
    if stdenv.isDarwin
    then "Applications/Spotify.app/Contents/MacOS/Spotify"
    else "bin/spotify";
  preloadVar =
    if stdenv.isDarwin
    then "DYLD_INSERT_LIBRARIES"
    else "LD_PRELOAD";
  libName =
    if stdenv.isDarwin
    then "libextendify_native.dylib"
    else "libextendify_native.so";
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
        --set ${preloadVar} $out/lib/${libName}
    '';

    meta =
      extendifyLib.meta
      // {
        mainProgram = "../" + exe;
        description = spotify.meta.description + "(patched with Extendify)";
      };
  }
