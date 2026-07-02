{
  lib,
  stdenv,
  fetchurl,
  glib ? null,
  nss ? null,
  nspr ? null,
  atk ? null,
  at-spi2-atk ? null,
  libdrm ? null,
  expat ? null,
  libxkbcommon ? null,
  libgbm ? null,
  gtk3 ? null,
  pango ? null,
  cairo ? null,
  alsa-lib ? null,
  dbus ? null,
  at-spi2-core ? null,
  cups ? null,
  libGL ? null,
  udev ? null,
  systemdLibs ? null,
  libxrandr ? null,
  libxfixes ? null,
  libxext ? null,
  libxdamage ? null,
  libxcomposite ? null,
  libx11 ? null,
  libxshmfence ? null,
  libxcb ? null,

  version ? "144.0.11",
  gitRevision ? "e135be2",
  chromiumVersion ? "144.0.7559.97",
  buildType ? "Release",
  srcHashes ? {
    aarch64-linux = "sha256-almKJ18g//Wi2CDRX1yibODvR6TF0DlUl1EnDNlIHBY=";
    aarch64-darwin = "sha256-Q94fht0yAkwAIqv29I1ZkpaS7WiYvJIcHWFcmBSvqHw=";
    x86_64-darwin = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  },
}:

let
  isLinux = stdenv.hostPlatform.isLinux;

  selectSystem =
    attrs:
    attrs.${stdenv.hostPlatform.system} or (throw "Unsupported system ${stdenv.hostPlatform.system}");

  platformString = selectSystem {
    aarch64-linux = "linuxarm64";
    x86_64-linux = "linux64";
    aarch64-darwin = "macosarm64";
    x86_64-darwin = "macosx64";
  };

  linuxRpath = lib.optionalString isLinux (
    lib.makeLibraryPath [
      glib
      nss
      nspr
      atk
      at-spi2-atk
      libdrm
      expat
      libxkbcommon
      libgbm
      gtk3
      pango
      cairo
      alsa-lib
      dbus
      at-spi2-core
      cups
      libGL
      udev
      systemdLibs
      libxcb
      libx11
      libxcomposite
      libxdamage
      libxext
      libxfixes
      libxrandr
      libxshmfence
    ]
  );
  glRpath = lib.optionalString isLinux (lib.makeLibraryPath [ stdenv.cc.cc ]);
in

stdenv.mkDerivation {
  pname = "cef-binary";
  inherit version;

  src = fetchurl {
    url = "https://cef-builds.spotifycdn.com/cef_binary_${version}+g${gitRevision}+chromium-${chromiumVersion}_${platformString}_minimal.tar.bz2";
    hash = selectSystem srcHashes;
  };

  dontStrip = true;
  dontPatchELF = true;

  installPhase =
    if isLinux then
      ''
        runHook preInstall
        sed 's/-O0/-O2/' -i cmake/cef_variables.cmake
        patchelf --set-rpath "${linuxRpath}" --set-interpreter "${stdenv.cc.bintools.dynamicLinker}" ${buildType}/chrome-sandbox
        patchelf --add-needed libudev.so --set-rpath "${linuxRpath}" ${buildType}/libcef.so
        patchelf --set-rpath "${glRpath}" ${buildType}/libEGL.so
        patchelf --add-needed libGL.so.1 --set-rpath "${glRpath}" ${buildType}/libGLESv2.so
        patchelf --set-rpath "${glRpath}" ${buildType}/libvk_swiftshader.so
        patchelf --set-rpath "${glRpath}" ${buildType}/libvulkan.so.1
        cp --recursive . $out
        runHook postInstall
      ''
    else
      ''
        runHook preInstall
        sed 's/-O0/-O2/' -i cmake/cef_variables.cmake
        cp --recursive . $out
        runHook postInstall
      '';

  passthru.buildType = buildType;

  meta = {
    description = "Simple framework for embedding Chromium-based browsers in other applications";
    homepage = "https://cef-builds.spotifycdn.com/index.html";
    license = lib.licenses.bsd3;
    platforms = builtins.attrNames srcHashes;
    sourceProvenance = with lib.sourceTypes; [ binaryNativeCode ];
  };
}
