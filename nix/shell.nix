{
  mkShell,
  bun,
  bun2nixPkg,
}:
mkShell {
  name = "bun";

  packages = [
    bun
    bun2nixPkg
  ];
}
