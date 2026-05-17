{
  cef-binary,
  stdenv,
}:
cef-binary.override {
  version = "144.0.11";
  gitRevision = "e135be2";
  chromiumVersion = "144.0.7559.97";
  srcHashes.${stdenv.hostPlatform.system} = "sha256-almKJ18g//Wi2CDRX1yibODvR6TF0DlUl1EnDNlIHBY=";
}
