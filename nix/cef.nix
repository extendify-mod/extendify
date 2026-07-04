{
  cef-binary,
  fetchurl,
  stdenv,
  stdenvNoCC,
}: let
  selectSystem = attrs:
    attrs.${stdenv.hostPlatform.system} or (throw "Unsupported system ${stdenv.hostPlatform.system}");

  platformString = selectSystem {
    x86_64-linux = "linux64";
    aarch64-darwin = "macosarm64";
  };

  version = "144.0.11";
  gitRevision = "e135be2";
  chromiumVersion = "144.0.7559.97";
  srcHashes = {
    x86_64-linux = "sha256-almKJ18g//Wi2CDRX1yibODvR6TF0DlUl1EnDNlIHBY=";
    aarch64-darwin = "sha256-Q94fht0yAkwAIqv29I1ZkpaS7WiYvJIcHWFcmBSvqHw=";
  };
in
  if stdenv.hostPlatform.isLinux
  then
    cef-binary.override {
      inherit version gitRevision chromiumVersion srcHashes;
    }
  else if stdenv.hostPlatform.system == "aarch64-darwin"
  then
    stdenvNoCC.mkDerivation {
      name = "darwin-cef";

      src = fetchurl {
        url = "https://cef-builds.spotifycdn.com/cef_binary_${version}+g${gitRevision}+chromium-${chromiumVersion}_${platformString}_minimal.tar.bz2";
        hash = srcHashes.${stdenv.hostPlatform.system};
      };

      dontBuild = true;
      dontConfigure = true;

      unpackPhase = ''
        tar --strip-components=1 -xjf $src
      '';

      installPhase = ''
        mkdir -p $out
        cp -r ./* $out/
      '';
    }
  else throw "Unsupported system: ${stdenv.hostPlatform.system}"
