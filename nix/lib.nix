{lib}: rec {
  systems = [
    "x86_64-linux"
    "aarch64-darwin"
  ];

  meta = {
    homepage = "https://github.com/extendify-mod/extendify";
    license = lib.licenses.gpl3;
    maintainers = [lib.maintainers.fazzi];
    platforms = systems;
  };
}
