{
  writeShellApplication,
  alejandra,
  deadnix,
  statix,
  fd,
}:
writeShellApplication {
  name = "nix-formatter";
  runtimeInputs = [
    alejandra
    deadnix
    statix
    fd
  ];
  text = ''
    fd "$@" -t f -e nix -x statix fix -- '{}'
    fd "$@" -t f -e nix -X deadnix -e -- '{}' \; -X alejandra -q '{}'
  '';
}
