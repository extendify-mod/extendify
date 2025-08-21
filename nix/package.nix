{
  mkBunDerivation,
  spotify,
}: let
  extendify = mkBunDerivation {
    packageJson = ../package.json;
    src = ../.;
    bunNix = ../bun.nix;

    buildPhase = ''
      cp -r ${spotify} $out
      chmod -R u+w $out

      bun run build-dev
      bun run patch --spotifyPath=$out/share/spotify
    '';

    installPhase = "";
  };
in
  spotify.overrideAttrs (old: {
    postInstall =
      (old.postInstall or "")
      + ''
        # replace xpui.spa with patched version
        cp ${extendify}/share/spotify/Apps/xpui.spa $out/share/spotify/Apps
      '';
  })
