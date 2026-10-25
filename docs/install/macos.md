## Install: MacOS

MacOS injection works through the `DYLD_INSERT_LIBRARIES` environment variable.
This variable loads specified `.dylib` (dynamic library) files into the process,
which Extendify uses to inject into the web contents.

You can download our `.dylib` file depending on your architecture:
- [ARM](https://github.com/extendify-mod/extendify/releases/download/native/macos_arm64.dylib)
- [Intel](https://github.com/extendify-mod/extendify/releases/download/native/macos_intel.dylib)

In order to relax constraints on `.dylib` loading to allow `DYLD_INSERT_LIBRARIES` to function,
the Spotify binary has to be modified to disable the [Hardened Runtime](https://developer.apple.com/documentation/security/hardened-runtime).
The following command ad-hoc signs and removes the runtime restriction flag on the Spotify binary.

```bash
codesign --force --sign - --preserve-metadata=identifier,entitlements,requirements,launch-constraints,library-constraints /Applications/Spotify.app/Contents/MacOS/Spotify
```

Whenever you run the Spotify app (specifically, the binary at `Spotify.app/Contents/MacOS/Spotify`),
prefix your command with `DYLD_INSERT_LIBRARIES=path/to/macos_<arch>.dylib`,
or provide it in some other way. For example, it can be used with the `open` command:

```bash
open --env DYLD_INSERT_LIBRARIES=path/to/macos_<arch>.dylib /Applications/Spotify.app
```
